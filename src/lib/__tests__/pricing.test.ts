import { describe, it, expect } from 'vitest';
import { quote, formatUSD, WEEKEND_MULTIPLIER, TAX_RATE } from '../pricing';
import { addDays } from '../dates';
import type { Suite } from '../../types';

const suite: Suite = {
  id: 'test',
  name: 'Test Suite',
  rate: 1000,
  maxGuests: 2,
  size: 50,
  description: 'x',
  amenities: [],
  hero: 'https://images.unsplash.com/photo-x',
  gallery: [],
};

describe('quote', () => {
  it('charges the flat rate for a midweek night', () => {
    // 2026-08-17 is a Monday.
    const q = quote(suite, { checkIn: '2026-08-17', checkOut: '2026-08-18' });
    expect(q.nights).toBe(1);
    expect(q.subtotal).toBe(1000);
    expect(q.tax).toBe(120);
    expect(q.total).toBe(1120);
  });

  it('applies the weekend uplift to a Friday night', () => {
    // 2026-08-14 is a Friday.
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(q.subtotal).toBe(1150);
  });

  it('does not charge uplift for a Saturday checkout', () => {
    // Thursday night only; checkout Friday adds no night.
    const q = quote(suite, { checkIn: '2026-08-13', checkOut: '2026-08-14' });
    expect(q.subtotal).toBe(1000);
  });

  it('mixes weekend and midweek nights correctly', () => {
    // Fri 14 (1150) + Sat 15 (1150) + Sun 16 (1000) = 3300
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-17' });
    expect(q.nights).toBe(3);
    expect(q.subtotal).toBe(3300);
    expect(q.tax).toBe(396);
    expect(q.total).toBe(3696);
  });

  it('applies tax after the uplift, not before', () => {
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    // 1150 * 0.12 = 138, not 1000 * 0.12 = 120
    expect(q.tax).toBe(138);
  });

  it('returns zeroes for an empty range', () => {
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-14' });
    expect(q).toEqual({ nights: 0, subtotal: 0, tax: 0, total: 0 });
  });

  it('rounds to whole dollars', () => {
    // A Friday night, so the uplift produces a genuinely fractional amount:
    // 333 * 1.15 = 382.95. A midweek night would be an integer already and
    // this assertion would pass even with the rounding removed.
    const odd: Suite = { ...suite, rate: 333 };
    const q = quote(odd, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(Number.isInteger(q.subtotal)).toBe(true);
    expect(Number.isInteger(q.tax)).toBe(true);
    expect(Number.isInteger(q.total)).toBe(true);
    expect(q.subtotal).toBe(383);
  });

  it('computes the weekend uplift exactly for rates that are inexact in binary', () => {
    // 850 is Aurelia's real rate. 850 * 1.15 evaluates to 977.4999999999999 in
    // floating point, which rounds DOWN to 977 and undercharges by a dollar.
    // Integer-cents arithmetic must give 978.
    const aurelia: Suite = { ...suite, rate: 850 };
    const q = quote(aurelia, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(q.subtotal).toBe(978);
    expect(q.tax).toBe(117);
    expect(q.total).toBe(1095);
  });

  it('always presents a breakdown that adds up', () => {
    // The guest must never see subtotal + tax disagree with total.
    for (const rate of [333, 760, 850, 980, 1150, 1850, 2400]) {
      for (const nights of [1, 2, 3, 7, 14]) {
        const s: Suite = { ...suite, rate };
        const q = quote(s, { checkIn: '2026-08-14', checkOut: addDays('2026-08-14', nights) });
        expect(q.subtotal + q.tax).toBe(q.total);
        expect(q.nights).toBe(nights);
      }
    }
  });
});

describe('formatUSD', () => {
  it('formats with no decimals and a thousands separator', () => {
    expect(formatUSD(3696)).toBe('$3,696');
  });
});

describe('advertised rates match charged rates', () => {
  it('derives the display constants from the integer arithmetic', () => {
    // If these were hand-written they could drift from WEEKEND_CENTS/TAX_PERCENT,
    // and the UI would advertise a rate the guest is not actually charged.
    expect(WEEKEND_MULTIPLIER).toBe(1.15);
    expect(TAX_RATE).toBe(0.12);

    // Prove they describe the real arithmetic rather than sitting beside it.
    const oneFriday = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(oneFriday.subtotal).toBe(Math.round(suite.rate * WEEKEND_MULTIPLIER));
    expect(oneFriday.tax).toBe(Math.round(oneFriday.subtotal * TAX_RATE));
  });
});
