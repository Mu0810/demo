import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';
import { morphTransition, staggerParent } from '../tokens';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe('useReducedMotion', () => {
  it('is false when the user has no preference', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('is true when reduced motion is preferred', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe('motion tokens', () => {
  it('collapses the morph to zero duration when reduced', () => {
    expect(morphTransition(true).duration).toBe(0);
    expect(morphTransition(false).duration).toBeGreaterThan(0);
  });

  it('removes stagger when reduced', () => {
    expect(staggerParent(true).animate.transition.staggerChildren).toBe(0);
    expect(staggerParent(false).animate.transition.staggerChildren).toBeGreaterThan(0);
  });
});
