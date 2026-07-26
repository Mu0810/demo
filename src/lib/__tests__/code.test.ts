import { describe, it, expect } from 'vitest';
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
});
