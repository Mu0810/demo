import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Landing } from '../Landing';
import { BookingProvider } from '../../state/BookingProvider';

/**
 * jsdom implements neither observer API, and both are real dependencies of this
 * view rather than test conveniences: Motion's `whileInView` constructs an
 * IntersectionObserver, and Lenis constructs a ResizeObserver. Stubbing them is
 * the only way to test the view without deleting the animation it exists to run.
 *
 * Both are deliberately inert. Firing the intersection callback from `observe`
 * would push a Motion state update outside `act()`, and an act warning is worse
 * noise than an unexercised stagger — the assertions below are about what is in
 * the document, not about opacity.
 *
 * Scoped to this file, not the shared setup: vitest gives each test file its own
 * jsdom, so nothing here leaks into the other suites.
 */
class InertObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver = InertObserver as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver = InertObserver as unknown as typeof ResizeObserver;

function renderLanding() {
  render(
    <BookingProvider>
      <Landing />
    </BookingProvider>
  );
}

describe('Landing', () => {
  it('shows the hotel name and all six suites by default', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Meridian Reserve/i);
    expect(screen.getByText('Aurelia Suite')).toBeInTheDocument();
    expect(screen.getByText('Celeste Penthouse')).toBeInTheDocument();
  });

  it('removes suites that cannot hold the party size', async () => {
    renderLanding();
    // Raise to 3 guests: the two-guest suites must disappear.
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    // Awaited, not synchronous. The removal is specified to animate out, so
    // AnimatePresence holds the exiting card until its exit finishes (~120ms
    // here). Asserting absence on the same tick would only pass if the card
    // vanished instantly, i.e. if the specified exit animation were deleted.
    // Awaiting is the stronger assertion anyway: it proves the node is really
    // unmounted rather than that it happened to be gone at one instant.
    await waitFor(() =>
      expect(screen.queryByText('Aurelia Suite')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Garden Pavilion')).toBeInTheDocument();
  });

  it('renders a story section', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /the house/i })).toBeInTheDocument();
  });
});
