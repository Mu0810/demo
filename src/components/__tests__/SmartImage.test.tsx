import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartImage } from '../SmartImage';

describe('SmartImage', () => {
  it('renders an accessible image', () => {
    render(<SmartImage src="https://images.unsplash.com/photo-x" alt="A suite" />);
    expect(screen.getByAltText('A suite')).toBeInTheDocument();
  });

  it('replaces the image with a labelled fallback when loading fails', () => {
    render(<SmartImage src="https://images.unsplash.com/broken" alt="A suite" />);
    fireEvent.error(screen.getByAltText('A suite'));
    expect(screen.queryByAltText('A suite')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A suite' })).toBeInTheDocument();
  });

  it('marks images as lazy and async-decoding by default', () => {
    render(<SmartImage src="https://images.unsplash.com/photo-x" alt="A suite" />);
    const img = screen.getByAltText('A suite');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
