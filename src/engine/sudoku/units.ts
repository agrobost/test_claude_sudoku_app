import { GRID_SIZE, type CellRef } from './types';

export type UnitKind = 'row' | 'col' | 'box';

export type Unit = {
  readonly kind: UnitKind;
  readonly index: number;
  readonly cells: readonly CellRef[];
};

export function rowOf(cell: CellRef): number {
  return Math.floor(cell / 9);
}

export function colOf(cell: CellRef): number {
  return cell % 9;
}

export function boxOf(cell: CellRef): number {
  return Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);
}

export function cellAt(row: number, col: number): CellRef {
  return row * 9 + col;
}

function buildUnits(): readonly Unit[] {
  const units: Unit[] = [];
  for (let r = 0; r < 9; r++) {
    units.push({ kind: 'row', index: r, cells: range9((c) => cellAt(r, c)) });
  }
  for (let c = 0; c < 9; c++) {
    units.push({ kind: 'col', index: c, cells: range9((r) => cellAt(r, c)) });
  }
  for (let b = 0; b < 9; b++) {
    const top = Math.floor(b / 3) * 3;
    const left = (b % 3) * 3;
    units.push({
      kind: 'box',
      index: b,
      cells: range9((i) => cellAt(top + Math.floor(i / 3), left + (i % 3))),
    });
  }
  return units;
}

function range9(make: (i: number) => CellRef): readonly CellRef[] {
  return Array.from({ length: 9 }, (_, i) => make(i));
}

/** Les 27 unités : 9 lignes, 9 colonnes, 9 boîtes. */
export const UNITS: readonly Unit[] = buildUnits();

function buildPeers(): readonly (readonly CellRef[])[] {
  const peers: CellRef[][] = Array.from({ length: GRID_SIZE }, () => []);
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    const seen = new Set<CellRef>();
    for (const unit of UNITS) {
      if (!unit.cells.includes(cell)) continue;
      for (const other of unit.cells) {
        if (other !== cell) seen.add(other);
      }
    }
    peers[cell] = [...seen].sort((a, b) => a - b);
  }
  return peers;
}

/** Pour chaque case, les 20 cases qui partagent une unité avec elle. */
export const PEERS: readonly (readonly CellRef[])[] = buildPeers();
