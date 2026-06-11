import { findClaiming, findPointing } from './intersections';
import { findHiddenPair, findNakedPair } from './pairs';
import { findHiddenSingle, findNakedSingle } from './singles';
import { type TechniqueFinder, type TechniqueId } from './types';

/**
 * Techniques dans l'ordre pédagogique d'essai, avec leur rang de difficulté
 * (cf. ARCHITECTURE.md : easy = singles, medium = + pairs, hard = + intersections).
 */
export const TECHNIQUES: readonly {
  readonly id: TechniqueId;
  readonly rank: 1 | 2 | 3;
  readonly find: TechniqueFinder;
}[] = [
  { id: 'nakedSingle', rank: 1, find: findNakedSingle },
  { id: 'hiddenSingle', rank: 1, find: findHiddenSingle },
  { id: 'nakedPair', rank: 2, find: findNakedPair },
  { id: 'hiddenPair', rank: 2, find: findHiddenPair },
  { id: 'pointing', rank: 3, find: findPointing },
  { id: 'claiming', rank: 3, find: findClaiming },
];

export { findClaiming, findPointing } from './intersections';
export { findHiddenPair, findNakedPair } from './pairs';
export { findHiddenSingle, findNakedSingle } from './singles';
export {
  type Elimination,
  type Placement,
  type TechniqueFinder,
  type TechniqueHint,
  type TechniqueId,
} from './types';
