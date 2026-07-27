import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';

const TODAY = '2026-08-10'; // a Monday

function setup(overrides: Partial<Parameters<typeof Calendar>[0]> = {}) {
  const onPickDate = vi.fn();
  render(
    <Calendar
      suiteId="aurelia"
      checkIn={null}
      checkOut={null}
      onPickDate={onPickDate}
      today={TODAY}
      {...overrides}
    />
  );
  return { onPickDate };
}

describe('Calendar', () => {
  it('renders as a grid with a caption naming the month', () => {
    setup();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText(/August 2026/i)).toBeInTheDocument();
  });

  it('disables dates before today', () => {
    setup();
    const past = screen.getByRole('gridcell', { name: /^5 / });
    expect(past).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects a date on click', () => {
    const { onPickDate } = setup();
    fireEvent.click(screen.getByRole('gridcell', { name: /^17 / }));
    expect(onPickDate).toHaveBeenCalledWith('2026-08-17');
  });

  it('does not select an unavailable date', () => {
    // The penthouse is closed every Sunday; 2026-08-16 is a Sunday.
    const { onPickDate } = setup({ suiteId: 'celeste' });
    fireEvent.click(screen.getByRole('gridcell', { name: /^16 / }));
    expect(onPickDate).not.toHaveBeenCalled();
  });

  it('marks the selected range with aria-selected', () => {
    setup({ checkIn: '2026-08-17', checkOut: '2026-08-20' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('gridcell', { name: /^18 / })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('gridcell', { name: /^25 / })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('moves focus with the right arrow key', () => {
    setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    day17.focus();
    fireEvent.keyDown(day17, { key: 'ArrowRight' });
    expect(screen.getByRole('gridcell', { name: /^18 / })).toHaveFocus();
  });

  it('moves focus by a week with the down arrow key', () => {
    setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    day17.focus();
    fireEvent.keyDown(day17, { key: 'ArrowDown' });
    expect(screen.getByRole('gridcell', { name: /^24 / })).toHaveFocus();
  });

  it('selects with Enter', () => {
    const { onPickDate } = setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    day17.focus();
    fireEvent.keyDown(day17, { key: 'Enter' });
    expect(onPickDate).toHaveBeenCalledWith('2026-08-17');
  });

  it('changes month with the next button', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
  });

  it('announces the selected range in a live region', () => {
    setup({ checkIn: '2026-08-17', checkOut: '2026-08-20' });
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/17/);
    expect(status.textContent).toMatch(/20/);
  });

  it('keeps exactly one day in the tab order', () => {
    setup();
    const tabbable = screen
      .getAllByRole('gridcell')
      .filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('conveys unavailability with text, not colour alone', () => {
    setup({ suiteId: 'celeste' });
    const sunday = screen.getByRole('gridcell', { name: /^16 / });
    expect(sunday.getAttribute('aria-label')).toMatch(/unavailable/i);
  });

  it('keeps exactly one tab stop after navigating months by button', () => {
    // The roving tabindex is `iso === focusDate`. If month navigation moves the
    // cursor but leaves focusDate behind, NO rendered cell matches and the grid
    // has zero tab stops — a keyboard guest cannot reach any date at all.
    setup();
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    const tabbable = screen
      .getAllByRole('gridcell')
      .filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('exposes rows, as role=grid requires', () => {
    // grid -> row -> gridcell. Without rows, columnheader has no valid context.
    setup();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('moves focus back a week with the up arrow', () => {
    setup();
    const day24 = screen.getByRole('gridcell', { name: /^24 / });
    day24.focus();
    fireEvent.keyDown(day24, { key: 'ArrowUp' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveFocus();
  });

  it('moves to the week bounds with Home and End', () => {
    setup();
    // 2026-08-19 is a Wednesday; the Monday-first week runs 17..23.
    const day19 = screen.getByRole('gridcell', { name: /^19 / });
    day19.focus();
    fireEvent.keyDown(day19, { key: 'Home' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveFocus();

    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    fireEvent.keyDown(day17, { key: 'End' });
    expect(screen.getByRole('gridcell', { name: /^23 / })).toHaveFocus();
  });

  it('PageDown moves a whole month and clamps to the month length', () => {
    // Day arithmetic would add 31 and land on 1 October, skipping September.
    setup({ checkIn: '2026-08-31' });
    const day31 = screen.getByRole('gridcell', { name: /^31 August/ });
    day31.focus();
    fireEvent.keyDown(day31, { key: 'PageDown' });

    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /^30 September/ })).toHaveFocus();
  });

  it('PageUp moves a whole month even from a long month', () => {
    // Subtracting February's 28 days from 30 March lands on 2 March — still in
    // March, so the key looks broken.
    setup({ checkIn: '2027-03-30' });
    const day30 = screen.getByRole('gridcell', { name: /^30 March/ });
    day30.focus();
    fireEvent.keyDown(day30, { key: 'PageUp' });

    expect(screen.getByText(/February 2027/i)).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /^28 February/ })).toHaveFocus();
  });

  it('refuses to select an unavailable date by keyboard as well as by click', () => {
    // The click path was covered; Enter and Space were not.
    const { onPickDate } = setup({ suiteId: 'celeste' });
    const sunday = screen.getByRole('gridcell', { name: /^16 / });
    sunday.focus();

    fireEvent.keyDown(sunday, { key: 'Enter' });
    fireEvent.keyDown(sunday, { key: ' ' });
    expect(onPickDate).not.toHaveBeenCalled();
  });

  it('marks today with aria-current', () => {
    setup();
    expect(screen.getByRole('gridcell', { name: /^10 August/ })).toHaveAttribute(
      'aria-current',
      'date'
    );
  });
});
