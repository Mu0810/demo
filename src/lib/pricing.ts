import type { DateRange, Suite } from '../types';
import { isWeekendNight, nightsIn } from './dates';

export const WEEKEND_MULTIPLIER = 1.15;
export const TAX_RATE = 0.12;

export type Quote = {
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
};

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatUSD(n: number): string {
  return usd.format(n);
}

/**
 * Order is fixed by spec: per-night uplift, then subtotal, then tax on the
 * uplifted subtotal. Taxing before the uplift would understate the total.
 */
export function quote(suite: Suite, range: DateRange): Quote {
  const nights = nightsIn(range);
  if (nights.length === 0) {
    return { nights: 0, subtotal: 0, tax: 0, total: 0 };
  }

  const subtotal = Math.round(
    nights.reduce(
      (sum, night) => sum + suite.rate * (isWeekendNight(night) ? WEEKEND_MULTIPLIER : 1),
      0
    )
  );
  const tax = Math.round(subtotal * TAX_RATE);

  return { nights: nights.length, subtotal, tax, total: subtotal + tax };
}
