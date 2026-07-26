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

/**
 * Today in the USER'S LOCAL calendar, not UTC.
 *
 * `toISO(new Date())` would read UTC fields, so for anyone west of UTC during
 * their afternoon/evening it returns tomorrow's date — which would disable the
 * guest's actual today in the calendar. Local fields are correct here precisely
 * because "today" is a wall-clock question, unlike the stored range values.
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Strict zero-padded ISO calendar date, and a real day (rejects 2026-02-30). */
export function isValidISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISO(fromISO(iso)) === iso;
}

/**
 * The nights actually slept: check-in inclusive, check-out exclusive.
 *
 * Compares timestamps rather than strings. A string comparison here can never
 * terminate when `checkOut` is a non-date whose first character sorts above
 * '9' (`'unset'`, `'TBD'`, `'Invalid Date'`), because `addDays` always returns
 * a digit-leading string — the loop then allocates until the heap dies. Invalid
 * input returns an empty list instead.
 */
export function nightsIn(range: DateRange): string[] {
  if (!isValidISO(range.checkIn) || !isValidISO(range.checkOut)) return [];

  const end = fromISO(range.checkOut).getTime();
  const out: string[] = [];
  let cursor = range.checkIn;
  while (fromISO(cursor).getTime() < end) {
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
