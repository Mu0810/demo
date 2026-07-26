import { describe, it, expect } from 'vitest';
import { isNightAvailable, isSuiteAvailable, unavailableNights } from '../availability';
import { nightsIn } from '../dates';

describe('availability', () => {
  it('is deterministic — same inputs always give the same answer', () => {
    const a = isNightAvailable('aurelia', '2026-09-10');
    for (let i = 0; i < 50; i++) {
      expect(isNightAvailable('aurelia', '2026-09-10')).toBe(a);
    }
  });

  it('differs between suites for at least some dates', () => {
    const nights = nightsIn({ checkIn: '2026-09-01', checkOut: '2026-10-01' });
    const aurelia = nights.map((n) => isNightAvailable('aurelia', n));
    const meridian = nights.map((n) => isNightAvailable('meridian', n));
    expect(aurelia).not.toEqual(meridian);
  });

  it('blocks roughly one night in seven over a long window', () => {
    const nights = nightsIn({ checkIn: '2026-09-01', checkOut: '2027-09-01' });
    const blocked = nights.filter((n) => !isNightAvailable('aurelia', n)).length;
    const ratio = blocked / nights.length;
    expect(ratio).toBeGreaterThan(0.05);
    expect(ratio).toBeLessThan(0.25);
  });

  it('closes the penthouse every Sunday', () => {
    // 2026-09-06 is a Sunday.
    expect(isNightAvailable('celeste', '2026-09-06')).toBe(false);
    expect(isNightAvailable('celeste', '2026-09-13')).toBe(false);
  });

  it('does not close other suites on Sundays as a rule', () => {
    const sundays = ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27'];
    const open = sundays.filter((d) => isNightAvailable('aurelia', d));
    expect(open.length).toBeGreaterThan(0);
  });

  it('reports a range unavailable if any single night is blocked', () => {
    const range = { checkIn: '2026-09-05', checkOut: '2026-09-08' };
    expect(isSuiteAvailable('celeste', range)).toBe(false);
    expect(unavailableNights('celeste', range)).toContain('2026-09-06');
  });

  it('treats a zero-night range as unavailable', () => {
    expect(isSuiteAvailable('aurelia', { checkIn: '2026-09-05', checkOut: '2026-09-05' })).toBe(
      false
    );
  });
});
