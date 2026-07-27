import type { DateRange, Suite } from '../types';
import { monthsBetween, nightCount, todayISO } from './dates';
import { isSuiteAvailable } from './availability';

export const MAX_NIGHTS = 14;
export const MAX_MONTHS_AHEAD = 12;

export type BookingError =
  | 'PAST_CHECKIN'
  | 'CHECKOUT_NOT_AFTER_CHECKIN'
  | 'TOO_MANY_NIGHTS'
  | 'TOO_FAR_AHEAD'
  | 'TOO_MANY_GUESTS'
  | 'SUITE_UNAVAILABLE';

export const ERROR_MESSAGES: Record<BookingError, string> = {
  PAST_CHECKIN: 'Arrival cannot be in the past.',
  CHECKOUT_NOT_AFTER_CHECKIN: 'Departure must be at least one night after arrival.',
  TOO_MANY_NIGHTS: `Stays are limited to ${MAX_NIGHTS} nights.`,
  TOO_FAR_AHEAD: `We accept reservations up to ${MAX_MONTHS_AHEAD} months ahead.`,
  TOO_MANY_GUESTS: 'This suite cannot accommodate that many guests.',
  SUITE_UNAVAILABLE: 'This suite is not available for the dates selected.',
};

/**
 * Returns every applicable error rather than short-circuiting, so the UI can
 * show a complete picture instead of making the guest fix one problem at a time.
 */
export function validateBooking(input: {
  suite: Suite;
  range: DateRange;
  guests: number;
  today?: string;
}): BookingError[] {
  const { suite, range, guests } = input;
  const today = input.today ?? todayISO();
  const errors: BookingError[] = [];

  if (range.checkIn < today) errors.push('PAST_CHECKIN');

  const nights = nightCount(range);
  if (nights < 1) errors.push('CHECKOUT_NOT_AFTER_CHECKIN');
  if (nights > MAX_NIGHTS) errors.push('TOO_MANY_NIGHTS');

  if (monthsBetween(today, range.checkIn) >= MAX_MONTHS_AHEAD) errors.push('TOO_FAR_AHEAD');

  if (guests > suite.maxGuests) errors.push('TOO_MANY_GUESTS');

  // Only meaningful once the range itself is coherent.
  if (nights >= 1 && !isSuiteAvailable(suite.id, range)) errors.push('SUITE_UNAVAILABLE');

  return errors;
}
