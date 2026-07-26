import { describe, it, expect } from 'vitest';
import { bookingReducer, initialBookingState } from '../bookingReducer';

const base = initialBookingState({ name: 'landing' });

describe('bookingReducer', () => {
  it('starts with no dates and one guest', () => {
    expect(base.checkIn).toBeNull();
    expect(base.checkOut).toBeNull();
    expect(base.guests).toBe(1);
  });

  it('sets check-in on the first date click', () => {
    const s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBeNull();
  });

  it('sets check-out on the second, later date click', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-20' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBe('2026-08-20');
  });

  it('restarts the range when the second click is earlier than check-in', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-20' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBeNull();
  });

  it('restarts the range when a complete range already exists', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-20' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-09-01' });
    expect(s.checkIn).toBe('2026-09-01');
    expect(s.checkOut).toBeNull();
  });

  it('never allows check-out equal to check-in', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkOut).toBeNull();
  });

  it('clamps guests to at least 1', () => {
    const s = bookingReducer(base, { type: 'SET_GUESTS', guests: 0 });
    expect(s.guests).toBe(1);
  });

  it('clamps guests to at most 4, the largest suite capacity', () => {
    const s = bookingReducer(base, { type: 'SET_GUESTS', guests: 99 });
    expect(s.guests).toBe(4);
  });

  it('navigates and records the view', () => {
    const s = bookingReducer(base, {
      type: 'NAVIGATE',
      view: { name: 'suite', suiteId: 'aurelia' },
    });
    expect(s.view).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });

  it('stores guest details', () => {
    let s = bookingReducer(base, { type: 'SET_GUEST_NAME', value: 'A Guest' });
    s = bookingReducer(s, { type: 'SET_GUEST_EMAIL', value: 'a@example.com' });
    expect(s.guestName).toBe('A Guest');
    expect(s.guestEmail).toBe('a@example.com');
  });

  it('records the confirmed code and moves to confirmation', () => {
    const s = bookingReducer(base, { type: 'CONFIRM', code: 'MR-ABC234' });
    expect(s.lastCode).toBe('MR-ABC234');
    expect(s.view).toEqual({ name: 'confirmation', code: 'MR-ABC234' });
  });

  it('clears dates', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'CLEAR_DATES' });
    expect(s.checkIn).toBeNull();
    expect(s.checkOut).toBeNull();
  });
});
