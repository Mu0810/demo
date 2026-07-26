import type { Reservation } from '../types';

const KEY = 'meridian.reservations';

/**
 * Holds ONLY the reservations that could not be written to localStorage, so the
 * session still works when storage is unusable. Deliberately not a mirror of
 * everything saved: a mirror is a second source of truth that outlives the
 * store it shadows, so a cleared or corrupt localStorage would still report the
 * reservations the guest can no longer actually retrieve.
 */
let memory: Reservation[] = [];
let persistent = true;

export function isPersistent(): boolean {
  return persistent;
}

function isReservation(value: unknown): value is Reservation {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.code === 'string' &&
    typeof r.suiteId === 'string' &&
    typeof r.guests === 'number' &&
    typeof r.guestName === 'string' &&
    typeof r.guestEmail === 'string' &&
    typeof r.total === 'number' &&
    typeof r.createdAt === 'string' &&
    typeof r.range === 'object' &&
    r.range !== null &&
    typeof (r.range as Record<string, unknown>).checkIn === 'string' &&
    typeof (r.range as Record<string, unknown>).checkOut === 'string'
  );
}

export function loadReservations(): Reservation[] {
  let stored: Reservation[] = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed.filter(isReservation);
      }
    }
  } catch {
    // Corrupt JSON or storage unavailable. Treat as empty rather than crashing on load.
    stored = [];
  }

  // Merge the in-memory fallback so a session with unwritable storage still works.
  const seen = new Set(stored.map((r) => r.code));
  return [...stored, ...memory.filter((r) => !seen.has(r.code))];
}

export function saveReservation(reservation: Reservation): void {
  try {
    const persisted = (() => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isReservation) : [];
      } catch {
        return [];
      }
    })();
    const next = [...persisted.filter((r) => r.code !== reservation.code), reservation];
    window.localStorage.setItem(KEY, JSON.stringify(next));
    persistent = true;
    // Durably stored now, so drop any earlier unpersisted copy of the same code
    // rather than letting it surface again as a duplicate on the next read.
    memory = memory.filter((r) => r.code !== reservation.code);
  } catch {
    // Safari private browsing throws on setItem. Keep it for this session only.
    memory = [...memory.filter((r) => r.code !== reservation.code), reservation];
    persistent = false;
  }
}

export function findReservation(code: string): Reservation | undefined {
  return loadReservations().find((r) => r.code === code);
}
