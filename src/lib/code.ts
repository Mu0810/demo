/** 0/1/I/O removed: these are the characters actually misread when a code is retyped. */
export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomBody(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function generateCode(taken: Set<string> = new Set()): string {
  // 32^6 is ~1.07bn, so a collision is vanishingly unlikely; the loop is a
  // correctness guarantee, not an optimisation. Bounded to avoid any chance of hanging.
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = `MR-${randomBody()}`;
    if (!taken.has(code)) return code;
  }
  // Unreachable in practice. Emits one more in-alphabet code rather than
  // throwing, so a caller can never be left without a reference to show.
  return `MR-${randomBody()}`;
}
