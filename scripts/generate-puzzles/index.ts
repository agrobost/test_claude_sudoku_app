/**
 * Génère le pool de grilles : supabase/seed.sql (pool + défis quotidiens)
 * et assets/puzzles/pack.json (pack embarqué pour l'offline).
 *
 * Usage : npm run seed:puzzles -- [--seed 20260611] [--per-difficulty 150]
 *         [--dailies 90] [--pack 60] [--start-date 2026-06-11]
 *
 * Reproductible à seed égal pour les GRILLES ; les ids UUID changent à chaque run.
 * À relancer avant la mise en prod pour recaler la fenêtre des dailies.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';

import {
  gradePuzzle,
  serializeGrid,
  type Difficulty,
  type MaxTechnique,
} from '../../src/engine';

import { digPuzzle, fillRandomSolution } from './generate';
import { mulberry32, randomInt } from './rng';

type GeneratedPuzzle = {
  readonly id: string;
  readonly givens: string;
  readonly solution: string;
  readonly difficulty: Difficulty;
  readonly maxTechnique: MaxTechnique;
};

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/** Plages de creusage (nombre d'indices visé) calibrées empiriquement :
 * easy sort à ~90 % d'un creusage léger ; medium/hard/expert sortent des
 * creusages profonds (hard est le plus rare, ~1-3 % des tirages). */
const EASY_TARGET: readonly [number, number] = [32, 37];
const DEEP_TARGET: readonly [number, number] = [23, 28];

function parseCliArgs(): {
  perDifficulty: number;
  dailies: number;
  pack: number;
  seed: number;
  startDate: string;
} {
  const { values } = parseArgs({
    options: {
      'per-difficulty': { type: 'string', default: '150' },
      dailies: { type: 'string', default: '90' },
      pack: { type: 'string', default: '60' },
      seed: { type: 'string', default: '20260611' },
      'start-date': { type: 'string', default: new Date().toISOString().slice(0, 10) },
    },
  });
  const perDifficulty = Number(values['per-difficulty']);
  const dailies = Number(values.dailies);
  const pack = Number(values.pack);
  const seed = Number(values.seed);
  const startDate = values['start-date'] ?? '';
  if (!Number.isInteger(perDifficulty) || perDifficulty < 1) {
    throw new Error('--per-difficulty doit être un entier >= 1');
  }
  if (!Number.isInteger(dailies) || dailies < 1) {
    throw new Error('--dailies doit être un entier >= 1');
  }
  if (!Number.isInteger(pack) || pack < 0 || pack > perDifficulty) {
    throw new Error('--pack doit être un entier entre 0 et --per-difficulty');
  }
  if (!Number.isInteger(seed)) {
    throw new Error('--seed doit être un entier');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error('--start-date doit être au format YYYY-MM-DD');
  }
  return { perDifficulty, dailies, pack, seed, startDate };
}

function isoDatePlusDays(startDate: string, days: number): string {
  const base = new Date(`${startDate}T00:00:00Z`);
  const shifted = new Date(base.getTime() + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

function generatePool(options: {
  perDifficulty: number;
  dailies: number;
  seed: number;
}): Record<Difficulty, GeneratedPuzzle[]> {
  const { perDifficulty, dailies, seed } = options;
  const rng = mulberry32(seed);
  const results: Record<Difficulty, GeneratedPuzzle[]> = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
  };
  const quota: Record<Difficulty, number> = {
    easy: perDifficulty,
    medium: perDifficulty + dailies, // les dailies sont des grilles medium (cf. PRD)
    hard: perDifficulty,
    expert: perDifficulty,
  };

  const totalNeeded = Object.values(quota).reduce((a, b) => a + b, 0);
  const maxAttempts = totalNeeded * 200;
  const startedAt = Date.now();
  let attempts = 0;

  const remaining = (d: Difficulty): number => quota[d] - results[d].length;
  const done = (): boolean => DIFFICULTIES.every((d) => remaining(d) <= 0);

  while (!done()) {
    attempts++;
    if (attempts > maxAttempts) {
      const state = DIFFICULTIES.map((d) => `${d}: ${results[d].length}/${quota[d]}`).join(', ');
      throw new Error(`Plafond de ${maxAttempts} tentatives atteint (${state})`);
    }

    // si seul easy manque, creusage léger (rendement ~90 %) ; sinon creusage profond
    const onlyEasyLeft = DIFFICULTIES.every((d) => d === 'easy' || remaining(d) <= 0);
    const [lo, hi] = onlyEasyLeft ? EASY_TARGET : DEEP_TARGET;

    const solution = fillRandomSolution(rng);
    const puzzle = digPuzzle(solution, randomInt(rng, lo, hi), rng);
    const grade = gradePuzzle(puzzle);
    if (grade === null) {
      throw new Error('digPuzzle a produit une grille sans solution unique (bug)');
    }
    if (remaining(grade.difficulty) <= 0) continue;

    results[grade.difficulty].push({
      id: randomUUID(),
      givens: serializeGrid(puzzle),
      solution: serializeGrid(solution),
      difficulty: grade.difficulty,
      maxTechnique: grade.maxTechnique,
    });

    if (attempts % 500 === 0) {
      const state = DIFFICULTIES.map((d) => `${d} ${results[d].length}/${quota[d]}`).join(' · ');
      console.log(`  ${attempts} tentatives — ${state}`);
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Pool généré : ${totalNeeded} grilles en ${attempts} tentatives (${elapsed}s)`);
  return results;
}

function sqlEscapeLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildSeedSql(options: {
  pool: readonly GeneratedPuzzle[];
  dailyAssignments: readonly { date: string; puzzleId: string }[];
  seed: number;
  startDate: string;
}): string {
  const { pool, dailyAssignments, seed, startDate } = options;
  const lines: string[] = [
    '-- Généré par scripts/generate-puzzles — NE PAS ÉDITER À LA MAIN.',
    `-- Régénérer : npm run seed:puzzles -- --seed ${seed} --start-date ${startDate}`,
    '-- Suppose une base fraîche (supabase db reset) : pas de purge préalable.',
    '',
    'insert into public.puzzles (id, givens, solution, difficulty, max_technique) values',
  ];
  const puzzleRows = pool.map(
    (p) =>
      `  (${sqlEscapeLiteral(p.id)}, ${sqlEscapeLiteral(p.givens)}, ${sqlEscapeLiteral(
        p.solution,
      )}, ${sqlEscapeLiteral(p.difficulty)}, ${sqlEscapeLiteral(p.maxTechnique)})`,
  );
  lines.push(puzzleRows.join(',\n') + ';');
  lines.push('');
  lines.push('insert into public.daily_puzzles (daily_date, puzzle_id) values');
  const dailyRows = dailyAssignments.map(
    (d) => `  (${sqlEscapeLiteral(d.date)}, ${sqlEscapeLiteral(d.puzzleId)})`,
  );
  lines.push(dailyRows.join(',\n') + ';');
  lines.push('');
  return lines.join('\n');
}

function main(): void {
  const args = parseCliArgs();
  console.log(
    `Génération : ${args.perDifficulty}/difficulté + ${args.dailies} dailies (seed ${args.seed})`,
  );

  const results = generatePool(args);

  // les mediums excédentaires deviennent les défis quotidiens
  const mediumPool = results.medium.slice(0, args.perDifficulty);
  const dailyPuzzles = results.medium.slice(args.perDifficulty);
  const pool: GeneratedPuzzle[] = [
    ...results.easy,
    ...mediumPool,
    ...results.hard,
    ...results.expert,
    ...dailyPuzzles,
  ];
  const dailyAssignments = dailyPuzzles.map((p, i) => ({
    date: isoDatePlusDays(args.startDate, i),
    puzzleId: p.id,
  }));

  // pack embarqué : les N premières de chaque difficulté, hors dailies
  const byDifficulty: Record<Difficulty, GeneratedPuzzle[]> = {
    easy: results.easy,
    medium: mediumPool,
    hard: results.hard,
    expert: results.expert,
  };
  const packPuzzles = DIFFICULTIES.flatMap((d) =>
    byDifficulty[d].slice(0, args.pack).map(({ id, givens, solution, difficulty }) => ({
      id,
      givens,
      solution,
      difficulty,
    })),
  );

  const seedSql = buildSeedSql({
    pool,
    dailyAssignments,
    seed: args.seed,
    startDate: args.startDate,
  });
  const packJson = JSON.stringify(
    { version: 1, generatedAt: new Date().toISOString(), puzzles: packPuzzles },
    null,
    2,
  );

  mkdirSync(dirname('supabase/seed.sql'), { recursive: true });
  mkdirSync(dirname('assets/puzzles/pack.json'), { recursive: true });
  writeFileSync('supabase/seed.sql', seedSql);
  writeFileSync('assets/puzzles/pack.json', packJson + '\n');

  console.log(`supabase/seed.sql : ${pool.length} grilles + ${dailyAssignments.length} dailies`);
  console.log(`assets/puzzles/pack.json : ${packPuzzles.length} grilles embarquées`);
  const firstDaily = dailyAssignments.at(0)?.date ?? '—';
  const lastDaily = dailyAssignments.at(-1)?.date ?? '—';
  console.log(`Fenêtre des dailies : ${firstDaily} → ${lastDaily}`);
}

main();
