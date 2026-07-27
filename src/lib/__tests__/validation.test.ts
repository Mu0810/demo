import { describe, it, expect } from 'vitest';
import { validateBooking, ERROR_MESSAGES } from '../validation';
import type { Suite } from '../../types';

const suite: Suite = {
  id: 'aurelia',
  name: 'Aurelia Suite',
  rate: 850,
  maxGuests: 2,
  size: 55,
  description: 'x',
  amenities: [],
  hero: 'https://images.unsplash.com/photo-x',
  gallery: [],
};

const TODAY = '2026-07-26';

describe('validateBooking', () => {
  it('accepts a valid booking', () => {
    // Pick a range known to be available for aurelia.
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('PAST_CHECKIN');
    expect(errors).not.toContain('TOO_MANY_GUESTS');
  });

  it('rejects a check-in in the past', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-07-01', checkOut: '2026-07-03' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
  });

  it('rejects checkout equal to check-in', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-17' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('rejects checkout before check-in', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-19', checkOut: '2026-08-17' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('accepts exactly 14 nights but rejects 15', () => {
    const ok = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-31' },
      guests: 2,
      today: TODAY,
    });
    expect(ok).not.toContain('TOO_MANY_NIGHTS');

    const tooLong = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-09-01' },
      guests: 2,
      today: TODAY,
    });
    expect(tooLong).toContain('TOO_MANY_NIGHTS');
  });

  it('rejects a check-in more than 12 months ahead', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2027-09-01', checkOut: '2027-09-03' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('TOO_FAR_AHEAD');
  });

  it('rejects more guests than the suite allows', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
      guests: 3,
      today: TODAY,
    });
    expect(errors).toContain('TOO_MANY_GUESTS');
  });

  it('rejects a range where the suite is unavailable', () => {
    // The penthouse is always closed on Sundays; 2026-09-06 is a Sunday.
    const penthouse: Suite = { ...suite, id: 'celeste', maxGuests: 4 };
    const errors = validateBooking({
      suite: penthouse,
      range: { checkIn: '2026-09-05', checkOut: '2026-09-08' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('SUITE_UNAVAILABLE');
  });

  it('reports every applicable error, not just the first', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-07-01', checkOut: '2026-07-01' },
      guests: 9,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
    expect(errors).toContain('TOO_MANY_GUESTS');
  });

  it('accepts a check-in today', () => {
    // Same-day arrival is the most common booking. Without this, tightening the
    // comparison to `<=` would reject it and no test would notice.
    const errors = validateBooking({
      suite,
      range: { checkIn: TODAY, checkOut: '2026-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('PAST_CHECKIN');
  });

  it('does not blame availability when no dates have been chosen', () => {
    // isSuiteAvailable returns false for an empty range as well as a blocked
    // one, so without the `nights >= 1` guard a guest who has picked nothing is
    // told the suite is unavailable.
    const errors = validateBooking({
      suite,
      range: { checkIn: '', checkOut: '' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('SUITE_UNAVAILABLE');
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('pins the twelve-month boundary on both sides', () => {
    // Exactly 12 months out is rejected; one day under is accepted. This holds
    // the `>=`, the threshold value, and the direction all in place.
    const atLimit = validateBooking({
      suite,
      range: { checkIn: '2027-07-26', checkOut: '2027-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(atLimit).toContain('TOO_FAR_AHEAD');

    const justUnder = validateBooking({
      suite,
      range: { checkIn: '2027-07-25', checkOut: '2027-07-27' },
      guests: 2,
      today: TODAY,
    });
    expect(justUnder).not.toContain('TOO_FAR_AHEAD');
  });

  it('never reports TOO_FAR_AHEAD for a check-in in the past', () => {
    // monthsBetween returns a negative number here. Wrapping it in Math.abs
    // would turn a year-old date into a "too far ahead" error.
    const errors = validateBooking({
      suite,
      range: { checkIn: '2025-07-26', checkOut: '2025-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
    expect(errors).not.toContain('TOO_FAR_AHEAD');
  });

  it('has a human message for every error code', () => {
    const codes = [
      'PAST_CHECKIN',
      'CHECKOUT_NOT_AFTER_CHECKIN',
      'TOO_MANY_NIGHTS',
      'TOO_FAR_AHEAD',
      'TOO_MANY_GUESTS',
      'SUITE_UNAVAILABLE',
    ] as const;
    for (const c of codes) {
      expect(ERROR_MESSAGES[c]).toBeTruthy();
    }
  });
});
