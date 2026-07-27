import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';
import { fade, morphTransition, riseIn, staggerParent } from '../tokens';

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

describe('useReducedMotion subscription', () => {
  it('reacts to a change event after mount', () => {
    let handler: ((e: MediaQueryListEvent) => void) | null = null;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        handler = cb;
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(handler).not.toBeNull();

    act(() => {
      handler!({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', () => {
    let removed = false;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {
        removed = true;
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removed).toBe(true);
  });

  it('queries the prefers-reduced-motion feature specifically', () => {
    const seen: string[] = [];
    window.matchMedia = ((query: string) => {
      seen.push(query);
      return {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      };
    }) as unknown as typeof window.matchMedia;

    renderHook(() => useReducedMotion());
    expect(seen.every((q) => q === '(prefers-reduced-motion: reduce)')).toBe(true);
    expect(seen.length).toBeGreaterThan(0);
  });
});

describe('motion tokens', () => {
  it('collapses the morph to zero duration when reduced', () => {
    expect(morphTransition(true).duration).toBe(0);
    expect(morphTransition(false).duration).toBeGreaterThan(0);
  });

  it('drops the easing entirely when reduced', () => {
    expect('ease' in morphTransition(true)).toBe(false);
    expect('ease' in morphTransition(false)).toBe(true);
  });

  it('zeroes fade duration when reduced and honours a custom duration', () => {
    expect(fade(true).duration).toBe(0);
    expect(fade(false).duration).toBeGreaterThan(0);
    expect(fade(false, 1.2).duration).toBe(1.2);
  });

  it('exposes hidden and visible labels on both parent and child', () => {
    // Label names are the contract between parent and child; a mismatch
    // silently disables the animation.
    expect(Object.keys(staggerParent(false))).toEqual(['hidden', 'visible']);
    expect(Object.keys(riseIn(false))).toEqual(['hidden', 'visible']);
  });

  it('removes both stagger and child delay when reduced', () => {
    expect(staggerParent(true).visible.transition.staggerChildren).toBe(0);
    expect(staggerParent(true).visible.transition.delayChildren).toBe(0);
    expect(staggerParent(false).visible.transition.staggerChildren).toBeGreaterThan(0);
    expect(staggerParent(false).visible.transition.delayChildren).toBeGreaterThan(0);
  });

  it('honours a custom stagger interval', () => {
    expect(staggerParent(false, 0.2).visible.transition.staggerChildren).toBe(0.2);
  });

  it('makes the child rise static when reduced', () => {
    expect(riseIn(true).hidden.y).toBe(0);
    expect(riseIn(false).hidden.y).toBeGreaterThan(0);
  });
});
