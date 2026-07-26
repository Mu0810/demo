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

// No cast on the easings. The `as const` tuples ARE Motion's BezierDefinition
// (readonly [number, number, number, number]); casting them to number[] makes
// the return value unassignable to `transition` (TS2322) at every call site.
export function morphTransition(reduced: boolean) {
  return reduced ? { duration: 0 } : { duration: 0.8, ease: EASE_MORPH };
}

// `duration: number` must be annotated explicitly. DURATION is `as const`, so
// an inferred default would type the parameter as the literal `0.7` and reject
// every other value — including DURATION.fast and DURATION.hero.
export function fade(reduced: boolean, duration: number = DURATION.base) {
  return reduced ? { duration: 0 } : { duration, ease: EASE_OUT };
}

/**
 * Variant MAP for a staggering parent — used as
 * `variants={staggerParent(reduced)} initial="hidden" animate="visible"`.
 *
 * Motion only runs stagger orchestration when the animate definition is a
 * variant LABEL and the element is a variant node (i.e. it has a `variants`
 * prop). Passing `{ initial: {...}, animate: {...} }` as inline objects
 * type-checks but silently never staggers.
 */
export function staggerParent(reduced: boolean, each = 0.09) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : each,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };
}

/**
 * Child variant map. Pair with staggerParent, matching label names.
 * Takes `reduced` so the reduced path is genuinely static: without this the
 * child still animates y even when the parent's stagger is zeroed.
 */
export function riseIn(reduced: boolean) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 24 },
    visible: { opacity: 1, y: 0 },
  };
}
