import { describe, it, expect } from 'vitest';
import { SUITES, getSuite } from '../suites';

describe('SUITES', () => {
  it('contains exactly 6 suites', () => {
    expect(SUITES).toHaveLength(6);
  });

  it('has unique ids', () => {
    const ids = SUITES.map((s) => s.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('gives every suite a hero and exactly 3 gallery images', () => {
    // The host check must cover the gallery too, not just the hero — otherwise
    // 18 of the 24 URLs are unguarded against the https/unsplash constraint.
    const UNSPLASH = /^https:\/\/images\.unsplash\.com\/photo-/;
    for (const s of SUITES) {
      expect(s.hero).toMatch(UNSPLASH);
      expect(s.gallery).toHaveLength(3);
      for (const g of s.gallery) {
        expect(g).toMatch(UNSPLASH);
      }
    }
  });

  it('uses no image URL twice across the whole dataset', () => {
    const all = SUITES.flatMap((s) => [s.hero, ...s.gallery]);
    expect(all).toHaveLength(24);
    expect(new Set(all).size).toBe(24);
  });

  it('has plausible rates and occupancy', () => {
    for (const s of SUITES) {
      expect(s.rate).toBeGreaterThan(0);
      expect(Number.isInteger(s.rate)).toBe(true);
      expect(s.maxGuests).toBeGreaterThanOrEqual(2);
      expect(s.maxGuests).toBeLessThanOrEqual(4);
    }
  });

  it('finds a suite by id and returns undefined for unknown ids', () => {
    expect(getSuite('aurelia')?.name).toBe('Aurelia Suite');
    expect(getSuite('does-not-exist')).toBeUndefined();
  });
});
