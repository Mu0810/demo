import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveReservation, loadReservations, findReservation, isPersistent } from '../reservations';
import type { Reservation } from '../../types';

const sample: Reservation = {
  code: 'MR-ABC234',
  suiteId: 'aurelia',
  range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
  guests: 2,
  guestName: 'A Guest',
  guestEmail: 'guest@example.com',
  total: 1904,
  createdAt: '2026-07-26T10:00:00.000Z',
};

describe('reservation storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves and loads a reservation', () => {
    saveReservation(sample);
    expect(loadReservations()).toHaveLength(1);
    expect(findReservation('MR-ABC234')?.guestName).toBe('A Guest');
  });

  it('returns undefined for an unknown code', () => {
    expect(findReservation('MR-NOPE22')).toBeUndefined();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadReservations()).toEqual([]);
  });

  it('discards corrupt JSON instead of throwing', () => {
    window.localStorage.setItem('meridian.reservations', '{not json at all');
    expect(loadReservations()).toEqual([]);
  });

  it('discards stored data that is not an array', () => {
    window.localStorage.setItem('meridian.reservations', '{"a":1}');
    expect(loadReservations()).toEqual([]);
  });

  it('drops entries missing required fields', () => {
    window.localStorage.setItem(
      'meridian.reservations',
      JSON.stringify([sample, { code: 'MR-BAD222' }])
    );
    expect(loadReservations()).toHaveLength(1);
  });

  it('survives localStorage throwing on write, as in Safari private mode', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveReservation(sample)).not.toThrow();
    // Still readable this session via the in-memory fallback.
    expect(findReservation('MR-ABC234')?.code).toBe('MR-ABC234');
    expect(isPersistent()).toBe(false);
  });
});
