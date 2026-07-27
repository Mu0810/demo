import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestPicker } from '../GuestPicker';

describe('GuestPicker', () => {
  it('shows the current count', () => {
    render(<GuestPicker guests={2} max={4} onChange={() => {}} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('increments and decrements', () => {
    const onChange = vi.fn();
    render(<GuestPicker guests={2} max={4} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: /remove a guest/i }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables increment at the maximum', () => {
    render(<GuestPicker guests={4} max={4} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /add a guest/i })).toBeDisabled();
  });

  it('disables decrement at one guest', () => {
    render(<GuestPicker guests={1} max={4} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /remove a guest/i })).toBeDisabled();
  });
});
