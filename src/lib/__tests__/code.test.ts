import { describe, it, expect, vi } from 'vitest';
import { generateCode, CODE_ALPHABET } from '../code';

describe('generateCode', () => {
  it('matches the MR- plus six characters format', () => {
    expect(generateCode()).toMatch(/^MR-[23456789A-HJ-NP-Z]{6}$/);
  });

  it('never emits ambiguous characters', () => {
    for (let i = 0; i < 400; i++) {
      const body = generateCode().slice(3);
      for (const ch of body) {
        expect(CODE_ALPHABET).toContain(ch);
        expect('01IO').not.toContain(ch);
      }
    }
  });

  it('avoids codes already taken', () => {
    const first = generateCode();
    const taken = new Set([first]);
    for (let i = 0; i < 50; i++) {
      expect(generateCode(taken)).not.toBe(first);
    }
  });

  it('really consults the taken set, proven with a deterministic RNG', () => {
    // The test above cannot fail by accident: a random 32^6 draw collides with
    // the one taken code at p ~ 1e-9, so deleting the collision check survives
    // it. Pinning Math.random makes the first candidate collide for certain.
    // First 6 draws -> index 0 ('2') => MR-222222, which is taken.
    // Next 6 draws  -> index 1 ('3') => MR-333333, which is free.
    let call = 0;
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => (call++ < 6 ? 0 : 1 / 32));

    expect(generateCode(new Set(['MR-222222']))).toBe('MR-333333');

    spy.mockRestore();
  });

  it('returns the first candidate when nothing is taken', () => {
    let call = 0;
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => (call++ < 6 ? 0 : 1 / 32));

    expect(generateCode()).toBe('MR-222222');

    spy.mockRestore();
  });
});
