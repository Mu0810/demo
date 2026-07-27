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
});
