import type { DateRange } from '../types';

/**
 * All dates are anchored to 12:00 UTC. Using midnight risks a timezone offset
 * pushing a date onto the previous or next day, which silently corrupts night counts.
 */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function todayISO(): string {
  return toISO(new Date());
}

/** The nights actually slept: check-in inclusive, check-out exclusive. */
export function nightsIn(range: DateRange): string[] {
  const out: string[] = [];
  let cursor = range.checkIn;
  while (cursor < range.checkOut) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function nightCount(range: DateRange): number {
  return nightsIn(range).length;
}

/** A night belongs to the day it begins. Friday and Saturday nights carry the uplift. */
export function isWeekendNight(iso: string): boolean {
  const day = fromISO(iso).getUTCDay(); // 0 Sun .. 6 Sat
  return day === 5 || day === 6;
}

/** Whole months from a to b; partial months do not count. */
export function monthsBetween(a: string, b: string): number {
  const from = fromISO(a);
  const to = fromISO(b);
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return months;
}
