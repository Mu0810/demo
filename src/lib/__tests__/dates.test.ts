import { describe, it, expect } from 'vitest';
import {
  addDays,
  nightsIn,
  nightCount,
  isWeekendNight,
  monthsBetween,
  fromISO,
  toISO,
} from '../dates';

describe('date helpers', () => {
  it('round-trips ISO strings', () => {
    expect(toISO(fromISO('2026-08-14'))).toBe('2026-08-14');
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('adds days across a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('lists nights excluding the checkout day', () => {
    expect(nightsIn({ checkIn: '2026-08-14', checkOut: '2026-08-17' })).toEqual([
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
  });

  it('counts nights', () => {
    expect(nightCount({ checkIn: '2026-08-14', checkOut: '2026-08-17' })).toBe(3);
    expect(nightCount({ checkIn: '2026-08-14', checkOut: '2026-08-14' })).toBe(0);
  });

  it('treats Friday and Saturday as weekend nights', () => {
    // 2026-08-14 is a Friday, 15th Saturday, 16th Sunday.
    expect(isWeekendNight('2026-08-14')).toBe(true);
    expect(isWeekendNight('2026-08-15')).toBe(true);
    expect(isWeekendNight('2026-08-16')).toBe(false);
  });

  it('measures whole months between dates', () => {
    expect(monthsBetween('2026-07-26', '2027-07-26')).toBe(12);
    expect(monthsBetween('2026-07-26', '2026-08-25')).toBe(0);
  });
});
