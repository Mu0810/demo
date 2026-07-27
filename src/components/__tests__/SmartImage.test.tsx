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

  it('loads eagerly when asked, for above-the-fold photography', () => {
    render(<SmartImage src="https://images.unsplash.com/photo-x" alt="A suite" eager />);
    expect(screen.getByAltText('A suite')).toHaveAttribute('loading', 'eager');
  });

  it('recovers when the src changes after a failure', () => {
    // A bare `failed` boolean would leave the fallback in place forever, so a
    // gallery reusing one instance loses the slot to a single transient error.
    const { rerender } = render(
      <SmartImage src="https://images.unsplash.com/broken" alt="A suite" />
    );
    fireEvent.error(screen.getByAltText('A suite'));
    expect(screen.queryByAltText('A suite')).not.toBeInTheDocument();

    rerender(<SmartImage src="https://images.unsplash.com/working" alt="A suite" />);
    expect(screen.getByAltText('A suite')).toBeInTheDocument();
  });

  it('forwards className and style to both the image and the fallback', () => {
    const { rerender } = render(
      <SmartImage
        src="https://images.unsplash.com/photo-x"
        alt="A suite"
        className="hero"
        style={{ opacity: 0.5 }}
      />
    );
    expect(screen.getByAltText('A suite')).toHaveClass('smart-image', 'hero');

    fireEvent.error(screen.getByAltText('A suite'));
    const fallback = screen.getByRole('img', { name: 'A suite' });
    expect(fallback).toHaveClass('smart-image-fallback', 'hero');
    expect(fallback).toHaveStyle({ opacity: '0.5' });

    rerender(
      <SmartImage src="https://images.unsplash.com/photo-x" alt="A suite" />
    );
  });

  it('hides a decorative image from assistive tech when it fails', () => {
    // An img role with an empty accessible name is worse than <img alt="">.
    render(<SmartImage src="https://images.unsplash.com/broken" alt="" />);
    fireEvent.error(screen.getByRole('presentation', { hidden: true }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
