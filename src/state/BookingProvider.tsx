import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { DateRange } from '../types';
import {
  bookingReducer,
  initialBookingState,
  type BookingAction,
  type BookingState,
} from './bookingReducer';
import { parsePath } from './history';

type BookingContextValue = {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  /** Non-null only when both ends of the range are chosen. */
  range: DateRange | null;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    bookingReducer,
    parsePath(window.location.pathname),
    initialBookingState
  );

  const value = useMemo<BookingContextValue>(() => {
    const range =
      state.checkIn && state.checkOut
        ? { checkIn: state.checkIn, checkOut: state.checkOut }
        : null;
    return { state, dispatch, range };
  }, [state]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
