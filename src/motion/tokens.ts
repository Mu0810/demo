/** Seconds. Motion takes durations in seconds, not ms. */
export const DURATION = {
  fast: 0.4,
  base: 0.7,
  slow: 0.9,
  hero: 1.4,
} as const;

/** Cubic beziers as Motion tuples. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_MORPH = [0.22, 1, 0.36, 1] as const;

export function morphTransition(reduced: boolean) {
  return reduced
    ? { duration: 0 }
    : { duration: 0.8, ease: EASE_MORPH as unknown as number[] };
}

export function fade(reduced: boolean, duration = DURATION.base) {
  return reduced
    ? { duration: 0 }
    : { duration, ease: EASE_OUT as unknown as number[] };
}

export function staggerParent(reduced: boolean, each = 0.09) {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : each,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };
}

/** Child variant used with staggerParent. */
export const riseIn = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};
