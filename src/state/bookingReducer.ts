import type { View } from './history';

export const MAX_SUITE_CAPACITY = 4;

export type BookingState = {
  view: View;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  guestName: string;
  guestEmail: string;
  lastCode: string | null;
};

export type BookingAction =
  | { type: 'NAVIGATE'; view: View }
  | { type: 'PICK_DATE'; date: string }
  | { type: 'CLEAR_DATES' }
  | { type: 'SET_GUESTS'; guests: number }
  | { type: 'SET_GUEST_NAME'; value: string }
  | { type: 'SET_GUEST_EMAIL'; value: string }
  | { type: 'CONFIRM'; code: string };

export function initialBookingState(view: View): BookingState {
  return {
    view,
    checkIn: null,
    checkOut: null,
    guests: 1,
    guestName: '',
    guestEmail: '',
    lastCode: null,
  };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, view: action.view };

    case 'PICK_DATE': {
      const { date } = action;
      const hasCompleteRange = state.checkIn !== null && state.checkOut !== null;

      // Any of these three cases means "start a new range", which keeps the
      // range always well-ordered and removes the need for inverted-range handling.
      if (hasCompleteRange || state.checkIn === null || date <= state.checkIn) {
        return { ...state, checkIn: date, checkOut: null };
      }
      return { ...state, checkOut: date };
    }

    case 'CLEAR_DATES':
      return { ...state, checkIn: null, checkOut: null };

    case 'SET_GUESTS': {
      // NaN must be rejected before clamping: Math.min(4, Math.max(1, NaN)) is
      // NaN, and NaN survives downstream unnoticed — `NaN > maxGuests` is false
      // so validation raises nothing, and JSON.stringify turns it into null.
      // Reachable the moment a UI does Number(input.value) on a cleared field.
      if (!Number.isFinite(action.guests)) return { ...state, guests: 1 };
      return {
        ...state,
        guests: Math.min(MAX_SUITE_CAPACITY, Math.max(1, Math.floor(action.guests))),
      };
    }

    case 'SET_GUEST_NAME':
      return { ...state, guestName: action.value };

    case 'SET_GUEST_EMAIL':
      return { ...state, guestEmail: action.value };

    case 'CONFIRM':
      return {
        ...state,
        lastCode: action.code,
        view: { name: 'confirmation', code: action.code },
      };
  }
}
