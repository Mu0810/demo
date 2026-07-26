import { describe, it, expect } from 'vitest';
import { quote, formatUSD } from '../pricing';
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
    const odd: Suite = { ...suite, rate: 333 };
    const q = quote(odd, { checkIn: '2026-08-17', checkOut: '2026-08-18' });
    expect(Number.isInteger(q.subtotal)).toBe(true);
    expect(Number.isInteger(q.tax)).toBe(true);
    expect(Number.isInteger(q.total)).toBe(true);
  });
});

describe('formatUSD', () => {
  it('formats with no decimals and a thousands separator', () => {
    expect(formatUSD(3696)).toBe('$3,696');
  });
});
