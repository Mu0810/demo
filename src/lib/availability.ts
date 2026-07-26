import type { DateRange } from '../types';
import { fromISO, nightsIn } from './dates';

/**
 * FNV-1a. Chosen because it is short, has no dependencies, and — critically —
 * is stable across runs and platforms. Availability must never change between
 * reloads or the demo contradicts itself.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function isNightAvailable(suiteId: string, iso: string): boolean {
  // The penthouse closes every Sunday for maintenance.
  if (suiteId === 'celeste' && fromISO(iso).getUTCDay() === 0) return false;
  return hash(`${suiteId}:${iso}`) % 7 !== 0;
}

export function unavailableNights(suiteId: string, range: DateRange): string[] {
  return nightsIn(range).filter((n) => !isNightAvailable(suiteId, n));
}

export function isSuiteAvailable(suiteId: string, range: DateRange): boolean {
  const nights = nightsIn(range);
  if (nights.length === 0) return false;
  return nights.every((n) => isNightAvailable(suiteId, n));
}
