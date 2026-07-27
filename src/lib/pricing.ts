import type { DateRange, Suite } from '../types';
import { isWeekendNight, nightsIn } from './dates';

/**
 * Integer cents, used for the actual money maths.
 *
 * `rate * 1.15` is not exact in binary: `850 * 1.15 === 977.4999999999999`,
 * which `Math.round` takes DOWN to 977 and silently undercharges by a dollar.
 * 850 is a real suite rate (Aurelia), so this is not hypothetical. Rates are
 * whole dollars, so `rate * 115` is exact integer cents.
 */
const WEEKEND_CENTS = 115;
const MIDWEEK_CENTS = 100;
const TAX_PERCENT = 12;

/**
 * Derived from the integer constants above, never hand-written, so UI copy can
 * never advertise a different rate from the one actually charged. Both
 * divisions are exact in IEEE-754 (115/100 === 1.15, 12/100 === 0.12).
 */
export const WEEKEND_MULTIPLIER = WEEKEND_CENTS / MIDWEEK_CENTS;
export const TAX_RATE = TAX_PERCENT / 100;

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
 *
 * All arithmetic runs in integer cents so no float tie can lose a dollar.
 * `total` is derived as `subtotal + tax` rather than recomputed from cents, so
 * the breakdown the guest sees always adds up to the figure they are charged.
 */
export function quote(suite: Suite, range: DateRange): Quote {
  const nights = nightsIn(range);
  if (nights.length === 0) {
    return { nights: 0, subtotal: 0, tax: 0, total: 0 };
  }

  const subtotalCents = nights.reduce(
    (sum, night) => sum + suite.rate * (isWeekendNight(night) ? WEEKEND_CENTS : MIDWEEK_CENTS),
    0
  );
  const taxCents = Math.round((subtotalCents * TAX_PERCENT) / 100);

  const subtotal = Math.round(subtotalCents / 100);
  const tax = Math.round(taxCents / 100);

  return { nights: nights.length, subtotal, tax, total: subtotal + tax };
}
