import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BookingProvider, useBooking } from '../BookingProvider';

function Probe() {
  const { state, dispatch, range } = useBooking();
  return (
    <div>
      <span data-testid="view">{state.view.name}</span>
      <span data-testid="range">{range ? `${range.checkIn}..${range.checkOut}` : 'none'}</span>
      <span data-testid="guests">{state.guests}</span>
      <button onClick={() => dispatch({ type: 'PICK_DATE', date: '2026-08-17' })}>in</button>
      <button onClick={() => dispatch({ type: 'PICK_DATE', date: '2026-08-20' })}>out</button>
    </div>
  );
}

describe('BookingProvider', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('seeds the view from the current URL', () => {
    window.history.replaceState({}, '', '/suites/aurelia');
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('view')).toHaveTextContent('suite');
  });

  it('falls back to landing for an unrecognised URL without throwing', () => {
    window.history.replaceState({}, '', '/utter/nonsense');
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('view')).toHaveTextContent('landing');
  });

  it('exposes range as none until both ends are chosen, in the right order', () => {
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('range')).toHaveTextContent('none');

    act(() => {
      screen.getByRole('button', { name: 'in' }).click();
    });
    expect(screen.getByTestId('range')).toHaveTextContent('none');

    act(() => {
      screen.getByRole('button', { name: 'out' }).click();
    });
    // Order matters: a swapped range object would read '2026-08-20..2026-08-17'
    // and invert every stay in the app.
    expect(screen.getByTestId('range')).toHaveTextContent('2026-08-17..2026-08-20');
  });

  it('throws a clear error when used outside the provider', () => {
    // Without the throw this is an undefined deref deep inside a view.
    expect(() => render(<Probe />)).toThrow(/must be used inside BookingProvider/);
  });
});
