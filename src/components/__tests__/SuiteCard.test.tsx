import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuiteCard } from '../SuiteCard';
import { SUITES } from '../../data/suites';

const suite = SUITES[1];

describe('SuiteCard', () => {
  it('shows name, rate and occupancy', () => {
    render(<SuiteCard suite={suite} unavailable={false} onSelect={() => {}} />);
    expect(screen.getByText(suite.name)).toBeInTheDocument();
    expect(screen.getByText(/\$850/)).toBeInTheDocument();
    expect(screen.getByText(/2 guests/i)).toBeInTheDocument();
  });

  it('calls onSelect when activated', () => {
    const onSelect = vi.fn();
    render(<SuiteCard suite={suite} unavailable={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(suite.name, 'i') }));
    expect(onSelect).toHaveBeenCalledWith(suite.id);
  });

  it('is not selectable and states the reason when unavailable', () => {
    const onSelect = vi.fn();
    render(<SuiteCard suite={suite} unavailable onSelect={onSelect} />);
    const btn = screen.getByRole('button', { name: new RegExp(suite.name, 'i') });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/unavailable for these dates/i)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
