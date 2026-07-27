# Meridian Reserve Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a richly animated luxury hotel booking flow — cinematic landing page that morphs into a working date/suite/reserve/confirm sequence, persisted in the browser.

**Architecture:** Single React component tree (no router) so Motion's `layoutId` shared-element morph stays inside one `LayoutGroup`. A thin History API layer supplies deep links and back/forward. All business logic lives in pure, unit-tested functions; views are thin.

**Tech Stack:** Vite 8, React 19, TypeScript 7, Motion 12, Lenis 1.3, Vitest 4, Testing Library.

## Global Constraints

- Project root: `/Users/hello/skills/meridian-reserve` — never write outside it
- Exact pinned versions, no ranges: `react@19.2.8`, `react-dom@19.2.8`, `motion@12.42.2`, `lenis@1.3.25`, `vite@8.1.5`, `@vitejs/plugin-react@6.0.4`, `typescript@7.0.2`, `vitest@4.1.10`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@7.0.0`, `@types/react@19.2.8`, `@types/react-dom@19.2.3`
- **Corrected during Task 1:** `@types/react-dom` is pinned to `19.2.3`, not `19.2.8`. That version was never published — the `19.2.x` line ends at `19.2.3`. The two `@types` packages version independently and do not track each other. Do not "align" them.
- **`src/vite-env.d.ts` exists and must not be deleted.** Added during Task 2. It contains only `/// <reference types="vite/client" />`, which is what makes CSS side-effect imports type-check. Without it every `import './x.css'` fails with TS2882 — at build time only, never in `npm run dev`. The Task 1 scaffold omitted it; `tsconfig.json`'s `"types": ["vitest/globals"]` blocks automatic `vite/client` pickup.
- **`noUnusedLocals` and `noUnusedParameters` are on.** An unused import is a build failure (TS6133) that `npm test` will NOT catch, because Vitest transpiles without type-checking. Always run `npm run build` before declaring a task done, and import only what you use.
- **Node 20 is supported.** `@testing-library/jest-dom@7.0.0` declares `node>=22` and npm emits an EBADENGINE warning on Node 20.20.2. This was tested empirically against every matcher the plan uses (`toBeInTheDocument`, `toHaveAttribute`, `toHaveTextContent`, `toHaveFocus`, `toBeDisabled`, `not.toBeInTheDocument`) and all pass. Ignore the warning; do not downgrade jest-dom.
- Palette, exact values: bg `#0A0A0B`, panel `#16161A`, gold `#C9A227`, primary text `#F2EFE9`, body `#CFCBC4`, caption `#9C978F`
- Display type stack: `'Didot', 'Bodoni 72', 'Bodoni MT', Garamond, 'Times New Roman', serif`
- UI type stack: `'Helvetica Neue', Inter, -apple-system, sans-serif`
- Currency USD via `Intl.NumberFormat('en-US')`, zero decimal places
- Pricing order is fixed: weekend uplift ×1.15 (Fri/Sat) → subtotal → 12% tax → round to whole dollar
- A night belongs to the day it **begins**
- Reservation code: `MR-` + 6 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`
- Booking rules: 1–14 nights, no past check-in, max 12 months ahead, guests ≤ suite max
- `borderRadius` always set via `style` prop, never a CSS class (Motion scale correction requires it)
- Every animation must have a static equivalent under `prefers-reduced-motion`
- Hotel name is **Meridian Reserve** throughout; suite names exactly as listed in Task 3
- No backend, no auth, no payment, no network calls except Unsplash images

---

## File Structure

| File | Responsibility |
|---|---|
| `src/types.ts` | `Suite`, `DateRange`, `Reservation`, `BookingState` |
| `src/data/suites.ts` | 6 static suites with verified image URLs |
| `src/lib/dates.ts` | ISO date helpers: parse, add days, night list, weekend test |
| `src/lib/availability.ts` | Pure `isSuiteAvailable(suiteId, range)` |
| `src/lib/pricing.ts` | Pure `quote(suite, range)` → subtotal/tax/total |
| `src/lib/validation.ts` | Pure `validateBooking(...)` → error list |
| `src/lib/code.ts` | Reservation code generation |
| `src/state/bookingReducer.ts` | Reducer + action types |
| `src/state/BookingProvider.tsx` | Context provider + `useBooking` hook |
| `src/state/history.ts` | URL ↔ view state serialise/parse |
| `src/storage/reservations.ts` | `localStorage` wrapper, guarded |
| `src/motion/tokens.ts` | Durations, easings, variants |
| `src/motion/useReducedMotion.ts` | Single motion kill-switch |
| `src/components/Calendar.tsx` | Accessible date-range grid |
| `src/components/SuiteCard.tsx` | Grid card, morph source |
| `src/components/GuestPicker.tsx` | Guest count stepper |
| `src/components/PriceSummary.tsx` | Animated price breakdown |
| `src/components/SmartImage.tsx` | Image with `onError` gradient fallback |
| `src/views/Landing.tsx` | Hero, suite grid, story section |
| `src/views/SuiteDetail.tsx` | Morph target, gallery, specs |
| `src/views/Reserve.tsx` | Guest form + summary |
| `src/views/Confirmation.tsx` | Code reveal |
| `src/App.tsx` | Single tree, `LayoutGroup`, `AnimatePresence`, focus management |
| `src/styles/tokens.css` | CSS custom properties |
| `src/styles/global.css` | Reset, base type, focus rings |

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/vitest.setup.ts`
- Test: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `npm test` and `npm run dev`; `App` default export

- [ ] **Step 1: Create `package.json` with exact pins**

```json
{
  "name": "meridian-reserve",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest --run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "motion": "12.42.2",
    "lenis": "1.3.25"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "7.0.0",
    "@testing-library/react": "16.3.2",
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.8",
    "@vitejs/plugin-react": "6.0.4",
    "jsdom": "29.1.1",
    "typescript": "7.0.2",
    "vite": "8.1.5",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
// Import from 'vitest/config', not 'vite'. Vite's own `defineConfig` types
// reject the `test` key (TS2769), and the error is invisible while tsconfig
// uses include: ["src"] — it surfaces the moment the root is type-checked.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    // A `spy.mockRestore()` at the end of a test body is skipped when an
    // assertion throws, leaving the stub installed for later tests in the file.
    // This makes restoration structural rather than positional — it matters most
    // for the component suites, which stub far more than Math.random.
    restoreMocks: true,
  },
});
```

- [ ] **Step 4: Create `src/vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';

/**
 * jsdom's `localStorage` is a proxy-backed platform object with a named-property
 * setter, so `Object.defineProperty(localStorage, 'setItem', ...)` is routed to
 * that setter: it stores an ITEM under the key "setItem" and leaves the real
 * method untouched. `vi.spyOn(window.localStorage, 'setItem')` therefore reports
 * success while doing nothing, and a test cannot simulate the write failure
 * Safari private browsing produces — the exact case the storage fallback exists
 * for. Swapping in a plain object of the same shape lets spies attach normally.
 *
 * Verified against the installed jsdom: after defineProperty "succeeds", the own
 * descriptor is still undefined, `setItem` does not throw, and the mock function
 * is retrievable via `getItem('setItem')`.
 */
const localStorageBacking = new Map<string, string>();
const localStorageShim = {
  get length(): number {
    return localStorageBacking.size;
  },
  key(index: number): string | null {
    return Array.from(localStorageBacking.keys())[index] ?? null;
  },
  getItem(key: string): string | null {
    const k = String(key);
    return localStorageBacking.has(k) ? (localStorageBacking.get(k) as string) : null;
  },
  setItem(key: string, value: string): void {
    localStorageBacking.set(String(key), String(value));
  },
  removeItem(key: string): void {
    localStorageBacking.delete(String(key));
  },
  clear(): void {
    localStorageBacking.clear();
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageShim as unknown as Storage,
  configurable: true,
  writable: true,
});

// jsdom does not implement matchMedia; Motion and useReducedMotion both need it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meridian Reserve</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create minimal `src/App.tsx` and `src/main.tsx`**

```tsx
// src/App.tsx
export default function App() {
  return <h1>Meridian Reserve</h1>;
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Write the smoke test**

```ts
// src/lib/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Install and verify**

Run: `npm install && npm test`
Expected: install completes, 1 test passes.

Run: `npm run build`
Expected: type-check and build succeed with no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: scaffold Vite + React + TS project with Vitest"
```

---

### Task 2: Design tokens and the reduced-motion switch

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/motion/tokens.ts`, `src/motion/useReducedMotion.ts`
- Modify: `src/main.tsx` (import styles)
- Test: `src/motion/__tests__/useReducedMotion.test.tsx`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `useReducedMotion(): boolean`; `DURATION` (`{ fast: 0.4, base: 0.7, slow: 0.9, hero: 1.4 }` seconds), `EASE_OUT`, `EASE_MORPH` readonly tuples, `morphTransition(reduced: boolean)`, `fade(reduced: boolean, duration?: number)`, `staggerParent(reduced: boolean, each?: number)` → variant map `{ hidden, visible }`, `riseIn(reduced: boolean)` → variant map `{ hidden, visible }`
- **`staggerParent` and `riseIn` are functions returning variant MAPS keyed `hidden`/`visible`.** Consumers pass them to the `variants` prop and drive them with the string labels `initial="hidden"` and `animate="visible"` (or `whileInView="visible"`). They are not spread as `{ initial, animate }` objects.

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  --bg: #0a0a0b;
  --panel: #16161a;
  --gold: #c9a227;
  --text: #f2efe9;
  --body: #cfcbc4;
  --caption: #9c978f;

  --font-display: 'Didot', 'Bodoni 72', 'Bodoni MT', Garamond, 'Times New Roman', serif;
  --font-ui: 'Helvetica Neue', Inter, -apple-system, sans-serif;

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2.5rem;
  --space-5: 4rem;
  --space-6: 6rem;

  --max-w: 1240px;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  /* Prevents layout animations firing when a scrollbar appears. */
  scrollbar-gutter: stable;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--body);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  color: var(--text);
  font-weight: 400;
  letter-spacing: -0.01em;
  margin: 0;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}

.label {
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gold);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Write the failing test for the motion switch**

```tsx
// src/motion/__tests__/useReducedMotion.test.tsx
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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- useReducedMotion`
Expected: FAIL — cannot resolve `../useReducedMotion`.

- [ ] **Step 5: Implement `src/motion/useReducedMotion.ts`**

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Single source of truth for whether the app animates.
 * Every animated component reads this rather than checking the media query itself.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 6: Implement `src/motion/tokens.ts`**

```ts
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
```

**Label names are part of the contract.** Parent and child must both use
`hidden`/`visible`. A mismatch produces no error and no animation.

- [ ] **Step 7: Import styles in `src/main.tsx`**

Add above the `App` import:

```tsx
import './styles/tokens.css';
import './styles/global.css';
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: PASS — 5 tests total.

- [ ] **Step 9: Commit**

```bash
git add src/styles src/motion src/main.tsx
git commit -m "feat: add design tokens and reduced-motion switch"
```

---

### Task 3: Types and suite data

**Files:**
- Create: `src/types.ts`, `src/data/suites.ts`
- Test: `src/data/__tests__/suites.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: types `Suite`, `DateRange`, `Reservation`; `SUITES: readonly Suite[]`, `getSuite(id: string): Suite | undefined`

All image IDs below were verified to return HTTP 200 from `images.unsplash.com`.

- [ ] **Step 1: Write the failing test**

```ts
// src/data/__tests__/suites.test.ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- suites`
Expected: FAIL — cannot resolve `../suites`.

- [ ] **Step 3: Create `src/types.ts`**

```ts
export type Suite = {
  id: string;
  name: string;
  rate: number;
  maxGuests: number;
  size: number;
  description: string;
  amenities: string[];
  hero: string;
  gallery: string[];
};

export type DateRange = {
  checkIn: string;  // ISO YYYY-MM-DD
  checkOut: string; // ISO YYYY-MM-DD
};

export type Reservation = {
  code: string;
  suiteId: string;
  range: DateRange;
  guests: number;
  guestName: string;
  guestEmail: string;
  total: number;
  createdAt: string;
};
```

- [ ] **Step 4: Create `src/data/suites.ts`**

```ts
import type { Suite } from '../types';

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const SUITES: readonly Suite[] = [
  {
    id: 'atrium-loft',
    name: 'Atrium Loft',
    rate: 760,
    maxGuests: 2,
    size: 48,
    description:
      'A double-height loft above the central atrium, where morning light crosses the room twice before it settles.',
    amenities: ['Atrium view', 'Rain shower', 'Nespresso bar', 'Writing desk'],
    hero: img('photo-1566073771259-6a8506099945'),
    gallery: [
      img('photo-1571003123894-1f0594d2b5d9'),
      img('photo-1582719508461-905c673771fd'),
      img('photo-1618773928121-c32242e63f39'),
    ],
  },
  {
    id: 'aurelia',
    name: 'Aurelia Suite',
    rate: 850,
    maxGuests: 2,
    size: 55,
    description:
      'Warm brass, deep walnut, and a bathtub set against the window. Quiet on every side.',
    amenities: ['Freestanding bath', 'Turndown service', 'Silk robes', 'Record player'],
    hero: img('photo-1590490360182-c33d57733427'),
    gallery: [
      img('photo-1445019980597-93fa8acb246c'),
      img('photo-1551882547-ff40c63fe5fa'),
      img('photo-1631049307264-da0ec9d70304'),
    ],
  },
  {
    id: 'garden-pavilion',
    name: 'Garden Pavilion',
    rate: 980,
    maxGuests: 3,
    size: 68,
    description:
      'A ground-floor pavilion opening onto its own walled garden, planted for evening scent.',
    amenities: ['Private garden', 'Outdoor shower', 'Daybed', 'Breakfast terrace'],
    hero: img('photo-1611892440504-42a792e24d32'),
    gallery: [
      img('photo-1595576508898-0ad5c879a061'),
      img('photo-1560448204-e02f11c3d0e2'),
      img('photo-1522708323590-d24dbb6b0267'),
    ],
  },
  {
    id: 'meridian',
    name: 'The Meridian',
    rate: 1150,
    maxGuests: 2,
    size: 72,
    description:
      'The corner suite the hotel is named for, with windows on the long axis of the building.',
    amenities: ['Corner aspect', 'Library alcove', 'Butler service', 'Marble bath'],
    hero: img('photo-1616594039964-ae9021a400a0'),
    gallery: [
      img('photo-1600210492486-724fe5c67fb0'),
      img('photo-1600607687939-ce8a6c25118c'),
      img('photo-1600566753086-00f18fb6b3ea'),
    ],
  },
  {
    id: 'observatory',
    name: 'The Observatory',
    rate: 1850,
    maxGuests: 4,
    size: 96,
    description:
      'Top-floor rooms under a glazed roof, with a brass telescope kept trained on the harbour.',
    amenities: ['Glazed roof', 'Telescope', 'Dining for six', 'Private lift'],
    hero: img('photo-1584132967334-10e028bd69f7'),
    gallery: [
      img('photo-1540518614846-7eded433c457'),
      img('photo-1505693416388-ac5ce068fe85'),
      img('photo-1522771739844-6a9f6d5f14af'),
    ],
  },
  {
    id: 'celeste',
    name: 'Celeste Penthouse',
    rate: 2400,
    maxGuests: 4,
    size: 145,
    description:
      'The whole of the ninth floor, wrapped in terrace. Closed on Sundays for maintenance.',
    amenities: ['Wraparound terrace', 'Private chef', 'Steam room', 'Grand piano'],
    hero: img('photo-1578683010236-d716f9a3f461'),
    gallery: [
      img('photo-1512918728675-ed5a9ecdebfd'),
      img('photo-1613490493576-7fde63acd811'),
      img('photo-1590073242678-70ee3fc28e8e'),
    ],
  },
];

export function getSuite(id: string): Suite | undefined {
  return SUITES.find((s) => s.id === id);
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- suites`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data
git commit -m "feat: add suite data model and six suites"
```

---

### Task 4: Date helpers

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/__tests__/dates.test.ts`

**Interfaces:**
- Consumes: `DateRange` from `src/types`
- Produces: `toISO(d: Date): string`, `fromISO(s: string): Date`, `addDays(iso: string, n: number): string`, `isValidISO(iso: string): boolean`, `nightsIn(range: DateRange): string[]`, `nightCount(range: DateRange): number`, `isWeekendNight(iso: string): boolean`, `todayISO(): string`, `monthsBetween(a: string, b: string): number`
- `todayISO()` reads **local** calendar fields (a wall-clock question); everything else is UTC-anchored.
- `nightsIn` compares timestamps, not strings, and returns `[]` for invalid input.

All dates are handled as UTC-noon `Date` objects internally so daylight-saving shifts can never move a date across a boundary.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/dates.test.ts
import { describe, it, expect } from 'vitest';
import {
  addDays,
  nightsIn,
  nightCount,
  isWeekendNight,
  isValidISO,
  monthsBetween,
  fromISO,
  toISO,
  todayISO,
} from '../dates';

describe('date helpers', () => {
  it('round-trips ISO strings', () => {
    expect(toISO(fromISO('2026-08-14'))).toBe('2026-08-14');
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('adds days across a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('lists nights excluding the checkout day', () => {
    expect(nightsIn({ checkIn: '2026-08-14', checkOut: '2026-08-17' })).toEqual([
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
  });

  it('counts nights', () => {
    expect(nightCount({ checkIn: '2026-08-14', checkOut: '2026-08-17' })).toBe(3);
    expect(nightCount({ checkIn: '2026-08-14', checkOut: '2026-08-14' })).toBe(0);
  });

  it('treats Friday and Saturday as weekend nights', () => {
    // 2026-08-14 is a Friday, 15th Saturday, 16th Sunday.
    expect(isWeekendNight('2026-08-14')).toBe(true);
    expect(isWeekendNight('2026-08-15')).toBe(true);
    expect(isWeekendNight('2026-08-16')).toBe(false);
  });

  it('measures whole months between dates', () => {
    expect(monthsBetween('2026-07-26', '2027-07-26')).toBe(12);
    expect(monthsBetween('2026-07-26', '2026-08-25')).toBe(0);
  });

  it('validates strict zero-padded ISO dates', () => {
    expect(isValidISO('2026-08-14')).toBe(true);
    expect(isValidISO('2026-8-4')).toBe(false);   // unpadded
    expect(isValidISO('2026-02-30')).toBe(false); // not a real day
    expect(isValidISO('2026-13-01')).toBe(false); // month rollover
    expect(isValidISO('')).toBe(false);
    expect(isValidISO('unset')).toBe(false);
    expect(isValidISO('2026-08-14T00:00:00Z')).toBe(false);
  });

  it('returns no nights for invalid input instead of looping forever', () => {
    // A string comparison would never terminate here: 'unset' sorts above every
    // digit-leading date addDays can produce, so the loop would allocate to OOM.
    expect(nightsIn({ checkIn: '2026-08-14', checkOut: 'unset' })).toEqual([]);
    expect(nightsIn({ checkIn: 'junk', checkOut: '2026-08-20' })).toEqual([]);
    expect(nightCount({ checkIn: '2026-08-14', checkOut: 'TBD' })).toBe(0);
  });

  it('counts nights correctly for unpadded-looking boundaries', () => {
    // Unpadded input is rejected rather than silently yielding zero nights on a
    // real stay, which a raw string comparison would have done.
    expect(nightsIn({ checkIn: '2026-8-4', checkOut: '2026-08-14' })).toEqual([]);
  });

  it('reports today in the local calendar, not UTC', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    expect(todayISO()).toBe(expected);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- dates`
Expected: FAIL — cannot resolve `../dates`.

- [ ] **Step 3: Implement `src/lib/dates.ts`**

```ts
import type { DateRange } from '../types';

/**
 * All dates are anchored to 12:00 UTC. Using midnight risks a timezone offset
 * pushing a date onto the previous or next day, which silently corrupts night counts.
 */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function toISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

/**
 * Today in the USER'S LOCAL calendar, not UTC.
 *
 * `toISO(new Date())` would read UTC fields, so for anyone west of UTC during
 * their afternoon/evening it returns tomorrow's date — which would disable the
 * guest's actual today in the calendar. Local fields are correct here precisely
 * because "today" is a wall-clock question, unlike the stored range values.
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Strict zero-padded ISO calendar date, and a real day (rejects 2026-02-30). */
export function isValidISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISO(fromISO(iso)) === iso;
}

/**
 * The nights actually slept: check-in inclusive, check-out exclusive.
 *
 * Compares timestamps rather than strings. A string comparison here can never
 * terminate when `checkOut` is a non-date whose first character sorts above
 * '9' (`'unset'`, `'TBD'`, `'Invalid Date'`), because `addDays` always returns
 * a digit-leading string — the loop then allocates until the heap dies. Invalid
 * input returns an empty list instead.
 */
export function nightsIn(range: DateRange): string[] {
  if (!isValidISO(range.checkIn) || !isValidISO(range.checkOut)) return [];

  const end = fromISO(range.checkOut).getTime();
  const out: string[] = [];
  let cursor = range.checkIn;
  while (fromISO(cursor).getTime() < end) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function nightCount(range: DateRange): number {
  return nightsIn(range).length;
}

/** A night belongs to the day it begins. Friday and Saturday nights carry the uplift. */
export function isWeekendNight(iso: string): boolean {
  const day = fromISO(iso).getUTCDay(); // 0 Sun .. 6 Sat
  return day === 5 || day === 6;
}

/** Whole months from a to b; partial months do not count. */
export function monthsBetween(a: string, b: string): number {
  const from = fromISO(a);
  const to = fromISO(b);
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  return months;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- dates`
Expected: PASS — 12 tests (8 original plus the 4 validation/local-today tests added after review).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/__tests__/dates.test.ts
git commit -m "feat: add UTC-anchored date helpers"
```

---

### Task 5: Availability

**Files:**
- Create: `src/lib/availability.ts`
- Test: `src/lib/__tests__/availability.test.ts`

**Interfaces:**
- Consumes: `nightsIn`, `fromISO` from `src/lib/dates`
- Produces: `isNightAvailable(suiteId: string, iso: string): boolean`, `isSuiteAvailable(suiteId: string, range: DateRange): boolean`, `unavailableNights(suiteId: string, range: DateRange): string[]`

Rules: a stable string hash of `suiteId + date` blocks a night when `hash % 7 === 0`. Additionally, `celeste` is closed every Sunday.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/availability.test.ts
import { describe, it, expect } from 'vitest';
import { isNightAvailable, isSuiteAvailable, unavailableNights } from '../availability';
import { nightsIn } from '../dates';

describe('availability', () => {
  it('is deterministic — same inputs always give the same answer', () => {
    const a = isNightAvailable('aurelia', '2026-09-10');
    for (let i = 0; i < 50; i++) {
      expect(isNightAvailable('aurelia', '2026-09-10')).toBe(a);
    }
  });

  it('differs between suites for at least some dates', () => {
    const nights = nightsIn({ checkIn: '2026-09-01', checkOut: '2026-10-01' });
    const aurelia = nights.map((n) => isNightAvailable('aurelia', n));
    const meridian = nights.map((n) => isNightAvailable('meridian', n));
    expect(aurelia).not.toEqual(meridian);
  });

  it('blocks roughly one night in seven over a long window', () => {
    const nights = nightsIn({ checkIn: '2026-09-01', checkOut: '2027-09-01' });
    const blocked = nights.filter((n) => !isNightAvailable('aurelia', n)).length;
    const ratio = blocked / nights.length;
    expect(ratio).toBeGreaterThan(0.05);
    expect(ratio).toBeLessThan(0.25);
  });

  it('closes the penthouse every Sunday', () => {
    // 2026-09-06 is a Sunday.
    expect(isNightAvailable('celeste', '2026-09-06')).toBe(false);
    expect(isNightAvailable('celeste', '2026-09-13')).toBe(false);
  });

  it('applies the Sunday rule ON TOP OF the hash, not instead of it', () => {
    // If the Sunday closure replaced the hash, celeste would be open on every
    // non-Sunday. These are non-Sundays that the hash blocks.
    expect(isNightAvailable('celeste', '2026-09-04')).toBe(false);
    expect(isNightAvailable('celeste', '2026-09-10')).toBe(false);
    expect(isNightAvailable('celeste', '2026-09-23')).toBe(false);
  });

  it('matches known golden values, pinning the hash and the modulus', () => {
    // These lock the exact rule: FNV-1a offset basis 0x811c9dc5, prime
    // 0x01000193, key `${suiteId}:${iso}`, and `% 7`. Changing the modulus to 5
    // or 8, altering the prime, or reformatting the key all move these dates.
    // Availability must be identical on every machine and every run.
    expect(isNightAvailable('aurelia', '2026-09-14')).toBe(false);
    expect(isNightAvailable('aurelia', '2026-09-26')).toBe(false);
    expect(isNightAvailable('aurelia', '2026-09-01')).toBe(true);
    expect(isNightAvailable('meridian', '2026-09-03')).toBe(false);
    expect(isNightAvailable('meridian', '2026-09-16')).toBe(false);
    expect(isNightAvailable('meridian', '2026-09-01')).toBe(true);
    expect(isNightAvailable('atrium-loft', '2026-09-24')).toBe(false);
    expect(isNightAvailable('atrium-loft', '2026-09-30')).toBe(false);
    expect(isNightAvailable('atrium-loft', '2026-09-01')).toBe(true);
  });

  it('does not close other suites on Sundays as a rule', () => {
    const sundays = ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27'];
    const open = sundays.filter((d) => isNightAvailable('aurelia', d));
    expect(open.length).toBeGreaterThan(0);
  });

  it('reports a range unavailable if any single night is blocked', () => {
    const range = { checkIn: '2026-09-05', checkOut: '2026-09-08' };
    expect(isSuiteAvailable('celeste', range)).toBe(false);
    expect(unavailableNights('celeste', range)).toContain('2026-09-06');
  });

  it('treats a zero-night range as unavailable', () => {
    expect(isSuiteAvailable('aurelia', { checkIn: '2026-09-05', checkOut: '2026-09-05' })).toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- availability`
Expected: FAIL — cannot resolve `../availability`.

- [ ] **Step 3: Implement `src/lib/availability.ts`**

```ts
import type { DateRange } from '../types';
import { fromISO, nightsIn } from './dates';

/**
 * FNV-1a. Chosen because it is short, has no dependencies, and — critically —
 * is stable across runs and platforms. Availability must never change between
 * reloads or the demo contradicts itself.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function isNightAvailable(suiteId: string, iso: string): boolean {
  // The penthouse closes every Sunday for maintenance.
  if (suiteId === 'celeste' && fromISO(iso).getUTCDay() === 0) return false;
  return hash(`${suiteId}:${iso}`) % 7 !== 0;
}

export function unavailableNights(suiteId: string, range: DateRange): string[] {
  return nightsIn(range).filter((n) => !isNightAvailable(suiteId, n));
}

export function isSuiteAvailable(suiteId: string, range: DateRange): boolean {
  const nights = nightsIn(range);
  if (nights.length === 0) return false;
  return nights.every((n) => isNightAvailable(suiteId, n));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- availability`
Expected: PASS — 9 tests (7 original plus the Sunday-composition and golden-vector tests added after review).

- [ ] **Step 5: Commit**

```bash
git add src/lib/availability.ts src/lib/__tests__/availability.test.ts
git commit -m "feat: add deterministic availability rules"
```

---

### Task 6: Pricing

**Files:**
- Create: `src/lib/pricing.ts`
- Test: `src/lib/__tests__/pricing.test.ts`

**Interfaces:**
- Consumes: `nightsIn`, `isWeekendNight` from `src/lib/dates`; `Suite`, `DateRange` from `src/types`
- Produces: `type Quote = { nights: number; subtotal: number; tax: number; total: number }`, `quote(suite: Suite, range: DateRange): Quote`, `formatUSD(n: number): string`, constants `WEEKEND_MULTIPLIER = 1.15`, `TAX_RATE = 0.12`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { quote, formatUSD, WEEKEND_MULTIPLIER, TAX_RATE } from '../pricing';
import { addDays } from '../dates';
import type { Suite } from '../../types';

const suite: Suite = {
  id: 'test',
  name: 'Test Suite',
  rate: 1000,
  maxGuests: 2,
  size: 50,
  description: 'x',
  amenities: [],
  hero: 'https://images.unsplash.com/photo-x',
  gallery: [],
};

describe('quote', () => {
  it('charges the flat rate for a midweek night', () => {
    // 2026-08-17 is a Monday.
    const q = quote(suite, { checkIn: '2026-08-17', checkOut: '2026-08-18' });
    expect(q.nights).toBe(1);
    expect(q.subtotal).toBe(1000);
    expect(q.tax).toBe(120);
    expect(q.total).toBe(1120);
  });

  it('applies the weekend uplift to a Friday night', () => {
    // 2026-08-14 is a Friday.
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(q.subtotal).toBe(1150);
  });

  it('does not charge uplift for a Saturday checkout', () => {
    // Thursday night only; checkout Friday adds no night.
    const q = quote(suite, { checkIn: '2026-08-13', checkOut: '2026-08-14' });
    expect(q.subtotal).toBe(1000);
  });

  it('mixes weekend and midweek nights correctly', () => {
    // Fri 14 (1150) + Sat 15 (1150) + Sun 16 (1000) = 3300
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-17' });
    expect(q.nights).toBe(3);
    expect(q.subtotal).toBe(3300);
    expect(q.tax).toBe(396);
    expect(q.total).toBe(3696);
  });

  it('applies tax after the uplift, not before', () => {
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    // 1150 * 0.12 = 138, not 1000 * 0.12 = 120
    expect(q.tax).toBe(138);
  });

  it('returns zeroes for an empty range', () => {
    const q = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-14' });
    expect(q).toEqual({ nights: 0, subtotal: 0, tax: 0, total: 0 });
  });

  it('rounds to whole dollars', () => {
    // A Friday night, so the uplift produces a genuinely fractional amount:
    // 333 * 1.15 = 382.95. A midweek night would be an integer already and
    // this assertion would pass even with the rounding removed.
    const odd: Suite = { ...suite, rate: 333 };
    const q = quote(odd, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(Number.isInteger(q.subtotal)).toBe(true);
    expect(Number.isInteger(q.tax)).toBe(true);
    expect(Number.isInteger(q.total)).toBe(true);
    expect(q.subtotal).toBe(383);
  });

  it('computes the weekend uplift exactly for rates that are inexact in binary', () => {
    // 850 is Aurelia's real rate. 850 * 1.15 evaluates to 977.4999999999999 in
    // floating point, which rounds DOWN to 977 and undercharges by a dollar.
    // Integer-cents arithmetic must give 978.
    const aurelia: Suite = { ...suite, rate: 850 };
    const q = quote(aurelia, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(q.subtotal).toBe(978);
    expect(q.tax).toBe(117);
    expect(q.total).toBe(1095);
  });

  it('always presents a breakdown that adds up', () => {
    // The guest must never see subtotal + tax disagree with total.
    for (const rate of [333, 760, 850, 980, 1150, 1850, 2400]) {
      for (const nights of [1, 2, 3, 7, 14]) {
        const s: Suite = { ...suite, rate };
        const q = quote(s, { checkIn: '2026-08-14', checkOut: addDays('2026-08-14', nights) });
        expect(q.subtotal + q.tax).toBe(q.total);
        expect(q.nights).toBe(nights);
      }
    }
  });
});

describe('formatUSD', () => {
  it('formats with no decimals and a thousands separator', () => {
    expect(formatUSD(3696)).toBe('$3,696');
  });
});

describe('advertised rates match charged rates', () => {
  it('derives the display constants from the integer arithmetic', () => {
    // If these were hand-written they could drift from WEEKEND_CENTS/TAX_PERCENT,
    // and the UI would advertise a rate the guest is not actually charged.
    expect(WEEKEND_MULTIPLIER).toBe(1.15);
    expect(TAX_RATE).toBe(0.12);

    // Prove they describe the real arithmetic rather than sitting beside it.
    const oneFriday = quote(suite, { checkIn: '2026-08-14', checkOut: '2026-08-15' });
    expect(oneFriday.subtotal).toBe(Math.round(suite.rate * WEEKEND_MULTIPLIER));
    expect(oneFriday.tax).toBe(Math.round(oneFriday.subtotal * TAX_RATE));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- pricing`
Expected: FAIL — cannot resolve `../pricing`.

- [ ] **Step 3: Implement `src/lib/pricing.ts`**

```ts
import type { DateRange, Suite } from '../types';
import { isWeekendNight, nightsIn } from './dates';

/**
 * Integer cents, used for the actual money maths.
 *
 * `rate * 1.15` is not exact in binary: `850 * 1.15 === 977.4999999999999`,
 * which `Math.round` takes DOWN to 977 and silently undercharges by a dollar.
 * 850 is a real suite rate (Aurelia), so this is not hypothetical. Rates are
 * whole dollars, so `rate * 115` is exact integer cents.
 */
const WEEKEND_CENTS = 115;
const MIDWEEK_CENTS = 100;
const TAX_PERCENT = 12;

/**
 * Derived from the integer constants above, never hand-written, so UI copy can
 * never advertise a different rate from the one actually charged. Both
 * divisions are exact in IEEE-754 (115/100 === 1.15, 12/100 === 0.12).
 */
export const WEEKEND_MULTIPLIER = WEEKEND_CENTS / MIDWEEK_CENTS;
export const TAX_RATE = TAX_PERCENT / 100;

export type Quote = {
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
};

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatUSD(n: number): string {
  return usd.format(n);
}

/**
 * Order is fixed by spec: per-night uplift, then subtotal, then tax on the
 * uplifted subtotal. Taxing before the uplift would understate the total.
 *
 * All arithmetic runs in integer cents so no float tie can lose a dollar.
 * `total` is derived as `subtotal + tax` rather than recomputed from cents, so
 * the breakdown the guest sees always adds up to the figure they are charged.
 */
export function quote(suite: Suite, range: DateRange): Quote {
  const nights = nightsIn(range);
  if (nights.length === 0) {
    return { nights: 0, subtotal: 0, tax: 0, total: 0 };
  }

  const subtotalCents = nights.reduce(
    (sum, night) => sum + suite.rate * (isWeekendNight(night) ? WEEKEND_CENTS : MIDWEEK_CENTS),
    0
  );
  const taxCents = Math.round((subtotalCents * TAX_PERCENT) / 100);

  const subtotal = Math.round(subtotalCents / 100);
  const tax = Math.round(taxCents / 100);

  return { nights: nights.length, subtotal, tax, total: subtotal + tax };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- pricing`
Expected: PASS — 10 tests (6 original plus the integer-cents, breakdown-sums and Friday-rounding tests added after review).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing.ts src/lib/__tests__/pricing.test.ts
git commit -m "feat: add pricing with weekend uplift and tax"
```

---

### Task 7: Booking validation

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/lib/__tests__/validation.test.ts`

**Interfaces:**
- Consumes: `nightCount`, `todayISO`, `monthsBetween` from `src/lib/dates`; `isSuiteAvailable` from `src/lib/availability`; `Suite`, `DateRange` from `src/types`
- Produces: `type BookingError = 'PAST_CHECKIN' | 'CHECKOUT_NOT_AFTER_CHECKIN' | 'TOO_MANY_NIGHTS' | 'TOO_FAR_AHEAD' | 'TOO_MANY_GUESTS' | 'SUITE_UNAVAILABLE'`, `validateBooking(input: { suite: Suite; range: DateRange; guests: number; today?: string }): BookingError[]`, `ERROR_MESSAGES: Record<BookingError, string>`, `MAX_NIGHTS = 14`, `MAX_MONTHS_AHEAD = 12`

`today` is injectable so tests never depend on the real clock.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateBooking, ERROR_MESSAGES } from '../validation';
import type { Suite } from '../../types';

const suite: Suite = {
  id: 'aurelia',
  name: 'Aurelia Suite',
  rate: 850,
  maxGuests: 2,
  size: 55,
  description: 'x',
  amenities: [],
  hero: 'https://images.unsplash.com/photo-x',
  gallery: [],
};

const TODAY = '2026-07-26';

describe('validateBooking', () => {
  it('accepts a valid booking', () => {
    // Pick a range known to be available for aurelia.
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('PAST_CHECKIN');
    expect(errors).not.toContain('TOO_MANY_GUESTS');
  });

  it('rejects a check-in in the past', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-07-01', checkOut: '2026-07-03' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
  });

  it('rejects checkout equal to check-in', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-17' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('rejects checkout before check-in', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-19', checkOut: '2026-08-17' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('accepts exactly 14 nights but rejects 15', () => {
    const ok = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-31' },
      guests: 2,
      today: TODAY,
    });
    expect(ok).not.toContain('TOO_MANY_NIGHTS');

    const tooLong = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-09-01' },
      guests: 2,
      today: TODAY,
    });
    expect(tooLong).toContain('TOO_MANY_NIGHTS');
  });

  it('rejects a check-in more than 12 months ahead', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2027-09-01', checkOut: '2027-09-03' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('TOO_FAR_AHEAD');
  });

  it('rejects more guests than the suite allows', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
      guests: 3,
      today: TODAY,
    });
    expect(errors).toContain('TOO_MANY_GUESTS');
  });

  it('rejects a range where the suite is unavailable', () => {
    // The penthouse is always closed on Sundays; 2026-09-06 is a Sunday.
    const penthouse: Suite = { ...suite, id: 'celeste', maxGuests: 4 };
    const errors = validateBooking({
      suite: penthouse,
      range: { checkIn: '2026-09-05', checkOut: '2026-09-08' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('SUITE_UNAVAILABLE');
  });

  it('reports every applicable error, not just the first', () => {
    const errors = validateBooking({
      suite,
      range: { checkIn: '2026-07-01', checkOut: '2026-07-01' },
      guests: 9,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
    expect(errors).toContain('TOO_MANY_GUESTS');
  });

  it('accepts a check-in today', () => {
    // Same-day arrival is the most common booking. Without this, tightening the
    // comparison to `<=` would reject it and no test would notice.
    const errors = validateBooking({
      suite,
      range: { checkIn: TODAY, checkOut: '2026-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('PAST_CHECKIN');
  });

  it('does not blame availability when no dates have been chosen', () => {
    // isSuiteAvailable returns false for an empty range as well as a blocked
    // one, so without the `nights >= 1` guard a guest who has picked nothing is
    // told the suite is unavailable.
    const errors = validateBooking({
      suite,
      range: { checkIn: '', checkOut: '' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).not.toContain('SUITE_UNAVAILABLE');
    expect(errors).toContain('CHECKOUT_NOT_AFTER_CHECKIN');
  });

  it('pins the twelve-month boundary on both sides', () => {
    // Exactly 12 months out is rejected; one day under is accepted. This holds
    // the `>=`, the threshold value, and the direction all in place.
    const atLimit = validateBooking({
      suite,
      range: { checkIn: '2027-07-26', checkOut: '2027-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(atLimit).toContain('TOO_FAR_AHEAD');

    const justUnder = validateBooking({
      suite,
      range: { checkIn: '2027-07-25', checkOut: '2027-07-27' },
      guests: 2,
      today: TODAY,
    });
    expect(justUnder).not.toContain('TOO_FAR_AHEAD');
  });

  it('never reports TOO_FAR_AHEAD for a check-in in the past', () => {
    // monthsBetween returns a negative number here. Wrapping it in Math.abs
    // would turn a year-old date into a "too far ahead" error.
    const errors = validateBooking({
      suite,
      range: { checkIn: '2025-07-26', checkOut: '2025-07-28' },
      guests: 2,
      today: TODAY,
    });
    expect(errors).toContain('PAST_CHECKIN');
    expect(errors).not.toContain('TOO_FAR_AHEAD');
  });

  it('has a human message for every error code', () => {
    const codes = [
      'PAST_CHECKIN',
      'CHECKOUT_NOT_AFTER_CHECKIN',
      'TOO_MANY_NIGHTS',
      'TOO_FAR_AHEAD',
      'TOO_MANY_GUESTS',
      'SUITE_UNAVAILABLE',
    ] as const;
    for (const c of codes) {
      expect(ERROR_MESSAGES[c]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- validation`
Expected: FAIL — cannot resolve `../validation`.

- [ ] **Step 3: Implement `src/lib/validation.ts`**

```ts
import type { DateRange, Suite } from '../types';
import { monthsBetween, nightCount, todayISO } from './dates';
import { isSuiteAvailable } from './availability';

export const MAX_NIGHTS = 14;
export const MAX_MONTHS_AHEAD = 12;

export type BookingError =
  | 'PAST_CHECKIN'
  | 'CHECKOUT_NOT_AFTER_CHECKIN'
  | 'TOO_MANY_NIGHTS'
  | 'TOO_FAR_AHEAD'
  | 'TOO_MANY_GUESTS'
  | 'SUITE_UNAVAILABLE';

export const ERROR_MESSAGES: Record<BookingError, string> = {
  PAST_CHECKIN: 'Arrival cannot be in the past.',
  CHECKOUT_NOT_AFTER_CHECKIN: 'Departure must be at least one night after arrival.',
  TOO_MANY_NIGHTS: `Stays are limited to ${MAX_NIGHTS} nights.`,
  TOO_FAR_AHEAD: `We accept reservations up to ${MAX_MONTHS_AHEAD} months ahead.`,
  TOO_MANY_GUESTS: 'This suite cannot accommodate that many guests.',
  SUITE_UNAVAILABLE: 'This suite is not available for the dates selected.',
};

/**
 * Returns every applicable error rather than short-circuiting, so the UI can
 * show a complete picture instead of making the guest fix one problem at a time.
 */
export function validateBooking(input: {
  suite: Suite;
  range: DateRange;
  guests: number;
  today?: string;
}): BookingError[] {
  const { suite, range, guests } = input;
  const today = input.today ?? todayISO();
  const errors: BookingError[] = [];

  if (range.checkIn < today) errors.push('PAST_CHECKIN');

  const nights = nightCount(range);
  if (nights < 1) errors.push('CHECKOUT_NOT_AFTER_CHECKIN');
  if (nights > MAX_NIGHTS) errors.push('TOO_MANY_NIGHTS');

  if (monthsBetween(today, range.checkIn) >= MAX_MONTHS_AHEAD) errors.push('TOO_FAR_AHEAD');

  if (guests > suite.maxGuests) errors.push('TOO_MANY_GUESTS');

  // Only meaningful once the range itself is coherent.
  if (nights >= 1 && !isSuiteAvailable(suite.id, range)) errors.push('SUITE_UNAVAILABLE');

  return errors;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- validation`
Expected: PASS — 10 tests. If `TOO_FAR_AHEAD` fires unexpectedly on the 12-month boundary case, confirm `monthsBetween` uses `>=` semantics consistently with the test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/__tests__/validation.test.ts
git commit -m "feat: add booking validation rules"
```

---

### Task 8: Reservation codes and storage

**Files:**
- Create: `src/lib/code.ts`, `src/storage/reservations.ts`
- Test: `src/lib/__tests__/code.test.ts`, `src/storage/__tests__/reservations.test.ts`

**Interfaces:**
- Consumes: `Reservation` from `src/types`
- Produces: `CODE_ALPHABET`, `generateCode(taken?: Set<string>): string`; `saveReservation(r: Reservation): void`, `loadReservations(): Reservation[]`, `findReservation(code: string): Reservation | undefined`, `isPersistent(): boolean`

- [ ] **Step 1: Write the failing test for codes**

```ts
// src/lib/__tests__/code.test.ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- code`
Expected: FAIL — cannot resolve `../code`.

- [ ] **Step 3: Implement `src/lib/code.ts`**

```ts
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
```

- [ ] **Step 4: Write the failing test for storage**

```ts
// src/storage/__tests__/reservations.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveReservation, loadReservations, findReservation, isPersistent } from '../reservations';
import type { Reservation } from '../../types';

const sample: Reservation = {
  code: 'MR-ABC234',
  suiteId: 'aurelia',
  range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
  guests: 2,
  guestName: 'A Guest',
  guestEmail: 'guest@example.com',
  total: 1904,
  createdAt: '2026-07-26T10:00:00.000Z',
};

describe('reservation storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves and loads a reservation', () => {
    saveReservation(sample);
    expect(loadReservations()).toHaveLength(1);
    expect(findReservation('MR-ABC234')?.guestName).toBe('A Guest');
  });

  it('returns undefined for an unknown code', () => {
    expect(findReservation('MR-NOPE22')).toBeUndefined();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadReservations()).toEqual([]);
  });

  it('discards corrupt JSON instead of throwing', () => {
    window.localStorage.setItem('meridian.reservations', '{not json at all');
    expect(loadReservations()).toEqual([]);
  });

  it('discards stored data that is not an array', () => {
    window.localStorage.setItem('meridian.reservations', '{"a":1}');
    expect(loadReservations()).toEqual([]);
  });

  it('drops entries missing required fields', () => {
    window.localStorage.setItem(
      'meridian.reservations',
      JSON.stringify([sample, { code: 'MR-BAD222' }])
    );
    expect(loadReservations()).toHaveLength(1);
  });

  it('keeps earlier reservations when another is saved', () => {
    // Without this, replacing the merge with `[reservation]` — wiping every
    // prior booking on each save — passes the whole suite. Silent data loss.
    saveReservation(sample);
    saveReservation({ ...sample, code: 'MR-DEF345', guestName: 'B Guest' });

    const all = loadReservations();
    expect(all).toHaveLength(2);
    expect(findReservation('MR-ABC234')?.guestName).toBe('A Guest');
    expect(findReservation('MR-DEF345')?.guestName).toBe('B Guest');
  });

  it('overwrites in place when the same code is saved twice', () => {
    saveReservation(sample);
    saveReservation({ ...sample, guestName: 'Renamed' });

    expect(loadReservations()).toHaveLength(1);
    expect(findReservation('MR-ABC234')?.guestName).toBe('Renamed');
  });

  it('reports storage as persistent after a successful write', () => {
    // Pins the true case; otherwise a hardcoded `return false` passes.
    saveReservation(sample);
    expect(isPersistent()).toBe(true);
  });

  it('survives localStorage throwing on write, as in Safari private mode', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveReservation(sample)).not.toThrow();
    // Still readable this session via the in-memory fallback.
    expect(findReservation('MR-ABC234')?.code).toBe('MR-ABC234');
    expect(isPersistent()).toBe(false);
  });
});
```

- [ ] **Step 5: Run to verify failure**

Run: `npm test -- reservations`
Expected: FAIL — cannot resolve `../reservations`.

- [ ] **Step 6: Implement `src/storage/reservations.ts`**

```ts
import type { Reservation } from '../types';

const KEY = 'meridian.reservations';

/**
 * Holds ONLY the reservations that could not be written to localStorage, so the
 * session still works when storage is unusable. Deliberately not a mirror of
 * everything saved: a mirror is a second source of truth that outlives the
 * store it shadows, so a cleared or corrupt localStorage would still report
 * reservations the guest can no longer actually retrieve.
 */
let memory: Reservation[] = [];
let persistent = true;

export function isPersistent(): boolean {
  return persistent;
}

function isReservation(value: unknown): value is Reservation {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.code === 'string' &&
    typeof r.suiteId === 'string' &&
    typeof r.guests === 'number' &&
    typeof r.guestName === 'string' &&
    typeof r.guestEmail === 'string' &&
    typeof r.total === 'number' &&
    typeof r.createdAt === 'string' &&
    typeof r.range === 'object' &&
    r.range !== null &&
    typeof (r.range as Record<string, unknown>).checkIn === 'string' &&
    typeof (r.range as Record<string, unknown>).checkOut === 'string'
  );
}

export function loadReservations(): Reservation[] {
  let stored: Reservation[] = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed.filter(isReservation);
      }
    }
  } catch {
    // Corrupt JSON or storage unavailable. Treat as empty rather than crashing on load.
    stored = [];
  }

  // Merge the in-memory fallback so a session with unwritable storage still works.
  const seen = new Set(stored.map((r) => r.code));
  return [...stored, ...memory.filter((r) => !seen.has(r.code))];
}

export function saveReservation(reservation: Reservation): void {
  try {
    const persisted = (() => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isReservation) : [];
      } catch {
        return [];
      }
    })();
    const next = [...persisted.filter((r) => r.code !== reservation.code), reservation];
    window.localStorage.setItem(KEY, JSON.stringify(next));
    persistent = true;
    // Durably stored now, so drop any earlier unpersisted copy of the same code
    // rather than letting it surface again as a duplicate on the next read.
    memory = memory.filter((r) => r.code !== reservation.code);
  } catch {
    // Safari private browsing throws on setItem. Keep it for this session only.
    memory = [...memory.filter((r) => r.code !== reservation.code), reservation];
    persistent = false;
  }
}

export function findReservation(code: string): Reservation | undefined {
  return loadReservations().find((r) => r.code === code);
}
```

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: PASS — all suites green.

- [ ] **Step 8: Commit**

```bash
git add src/lib/code.ts src/storage
git commit -m "feat: add reservation codes and guarded storage"
```

---

### Task 9: URL history sync

**Files:**
- Create: `src/state/history.ts`
- Test: `src/state/__tests__/history.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `type View = { name: 'landing' } | { name: 'suite'; suiteId: string } | { name: 'reserve'; suiteId: string } | { name: 'confirmation'; code: string }`, `parsePath(path: string): View`, `viewToPath(view: View): string`, `pushView(view: View): void`, `replaceView(view: View): void`, `onPopState(cb: (view: View) => void): () => void`

Unknown paths resolve to `{ name: 'landing' }` rather than throwing, which is what makes a hand-edited URL safe.

- [ ] **Step 1: Write the failing test**

```ts
// src/state/__tests__/history.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePath,
  viewToPath,
  pushView,
  replaceView,
  onPopState,
  type View,
} from '../history';

describe('parsePath', () => {
  it('parses the landing page', () => {
    expect(parsePath('/')).toEqual({ name: 'landing' });
  });

  it('parses a suite path', () => {
    expect(parsePath('/suites/aurelia')).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });

  it('parses a reserve path', () => {
    expect(parsePath('/suites/aurelia/reserve')).toEqual({
      name: 'reserve',
      suiteId: 'aurelia',
    });
  });

  it('parses a confirmation path and upper-cases the code', () => {
    expect(parsePath('/reservation/mr-abc234')).toEqual({
      name: 'confirmation',
      code: 'MR-ABC234',
    });
  });

  it('falls back to landing for unknown paths', () => {
    expect(parsePath('/nonsense/deep/path')).toEqual({ name: 'landing' });
    expect(parsePath('/suites')).toEqual({ name: 'landing' });
    expect(parsePath('')).toEqual({ name: 'landing' });
  });

  it('tolerates a trailing slash', () => {
    expect(parsePath('/suites/aurelia/')).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });
});

describe('viewToPath', () => {
  it('round-trips every view shape', () => {
    const views = [
      { name: 'landing' },
      { name: 'suite', suiteId: 'aurelia' },
      { name: 'reserve', suiteId: 'celeste' },
      { name: 'confirmation', code: 'MR-ABC234' },
    ] as const;

    for (const v of views) {
      expect(parsePath(viewToPath(v))).toEqual(v);
    }
  });

  it('maps landing to exactly the root path', () => {
    // The round-trip test cannot pin this: any unrecognised path also parses
    // back to landing, so '/home' would round-trip just as happily.
    expect(viewToPath({ name: 'landing' })).toBe('/');
  });

  it('only treats a literal /reserve segment as the reserve view', () => {
    expect(parsePath('/suites/aurelia/anything-else')).toEqual({ name: 'landing' });
    expect(parsePath('/suites/aurelia/reserve')).toEqual({
      name: 'reserve',
      suiteId: 'aurelia',
    });
  });
});

describe('browser history integration', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('pushView adds a history entry and changes the path', () => {
    const before = window.history.length;
    pushView({ name: 'suite', suiteId: 'aurelia' });

    expect(window.location.pathname).toBe('/suites/aurelia');
    expect(window.history.length).toBeGreaterThan(before);
  });

  it('replaceView changes the path without adding an entry', () => {
    const before = window.history.length;
    replaceView({ name: 'suite', suiteId: 'celeste' });

    expect(window.location.pathname).toBe('/suites/celeste');
    expect(window.history.length).toBe(before);
  });

  it('onPopState reports the view parsed from the current path', () => {
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));

    window.history.replaceState({}, '', '/suites/meridian');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual([{ name: 'suite', suiteId: 'meridian' }]);
    unsubscribe();
  });

  it('onPopState stops reporting after unsubscribe', () => {
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));
    unsubscribe();

    window.history.replaceState({}, '', '/suites/aurelia');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual([]);
  });

  it('parses the pathname only, never the full href', () => {
    // Reading location.href here would split the origin into segments and every
    // back/forward would land on the landing view.
    window.history.replaceState({}, '', '/reservation/mr-abc234');
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));
    window.dispatchEvent(new PopStateEvent('popstate'));
    unsubscribe();

    expect(seen).toEqual([{ name: 'confirmation', code: 'MR-ABC234' }]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- history`
Expected: FAIL — cannot resolve `../history`.

- [ ] **Step 3: Implement `src/state/history.ts`**

```ts
export type View =
  | { name: 'landing' }
  | { name: 'suite'; suiteId: string }
  | { name: 'reserve'; suiteId: string }
  | { name: 'confirmation'; code: string };

const LANDING: View = { name: 'landing' };

/**
 * Never throws. A hand-edited or stale URL must degrade to the landing page
 * rather than break the app, since there is no router to catch it.
 */
export function parsePath(path: string): View {
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return LANDING;

  if (parts[0] === 'suites' && parts.length === 2) {
    return { name: 'suite', suiteId: parts[1] };
  }
  if (parts[0] === 'suites' && parts.length === 3 && parts[2] === 'reserve') {
    return { name: 'reserve', suiteId: parts[1] };
  }
  if (parts[0] === 'reservation' && parts.length === 2) {
    return { name: 'confirmation', code: parts[1].toUpperCase() };
  }
  return LANDING;
}

export function viewToPath(view: View): string {
  switch (view.name) {
    case 'landing':
      return '/';
    case 'suite':
      return `/suites/${view.suiteId}`;
    case 'reserve':
      return `/suites/${view.suiteId}/reserve`;
    case 'confirmation':
      return `/reservation/${view.code}`;
  }
}

export function pushView(view: View): void {
  window.history.pushState({ view }, '', viewToPath(view));
}

export function replaceView(view: View): void {
  window.history.replaceState({ view }, '', viewToPath(view));
}

export function onPopState(cb: (view: View) => void): () => void {
  const handler = () => cb(parsePath(window.location.pathname));
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- history`
Expected: PASS — 14 tests (7 parse/round-trip plus the browser-history integration block added after review).

- [ ] **Step 5: Add dev-server history fallback**

Deep links like `/suites/aurelia` must serve `index.html`. Vite's dev server does this for SPAs by default; confirm by running `npm run dev` and loading `http://localhost:5173/suites/aurelia` directly. It should render the app, not a 404.

- [ ] **Step 6: Commit**

```bash
git add src/state/history.ts src/state/__tests__/history.test.ts
git commit -m "feat: add URL history sync without a router"
```

---

### Task 10: Booking state reducer and provider

**Files:**
- Create: `src/state/bookingReducer.ts`, `src/state/BookingProvider.tsx`
- Test: `src/state/__tests__/bookingReducer.test.ts`

**Interfaces:**
- Consumes: `View` from `src/state/history`; `DateRange` from `src/types`; `addDays`, `todayISO` from `src/lib/dates`
- Produces:
  - `type BookingState = { view: View; checkIn: string | null; checkOut: string | null; guests: number; guestName: string; guestEmail: string; lastCode: string | null }`
  - `type BookingAction` — see implementation for the exact union
  - `initialBookingState(view: View): BookingState`
  - `bookingReducer(state: BookingState, action: BookingAction): BookingState`
  - `useBooking(): { state: BookingState; dispatch: React.Dispatch<BookingAction>; range: DateRange | null }`
  - `BookingProvider` component

Date selection uses one rule that removes a whole class of bugs: clicking a date when a complete range already exists starts a new range. Clicking a date before the current check-in also restarts rather than producing an inverted range.

- [ ] **Step 1: Write the failing test**

```ts
// src/state/__tests__/bookingReducer.test.ts
import { describe, it, expect } from 'vitest';
import { bookingReducer, initialBookingState } from '../bookingReducer';

const base = initialBookingState({ name: 'landing' });

describe('bookingReducer', () => {
  it('starts with no dates and one guest', () => {
    expect(base.checkIn).toBeNull();
    expect(base.checkOut).toBeNull();
    expect(base.guests).toBe(1);
  });

  it('sets check-in on the first date click', () => {
    const s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBeNull();
  });

  it('sets check-out on the second, later date click', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-20' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBe('2026-08-20');
  });

  it('restarts the range when the second click is earlier than check-in', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-20' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBeNull();
  });

  it('restarts the range when a complete range already exists', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-20' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-09-01' });
    expect(s.checkIn).toBe('2026-09-01');
    expect(s.checkOut).toBeNull();
  });

  it('never allows check-out equal to check-in', () => {
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-17' });
    expect(s.checkOut).toBeNull();
  });

  it('clamps guests to at least 1', () => {
    const s = bookingReducer(base, { type: 'SET_GUESTS', guests: 0 });
    expect(s.guests).toBe(1);
  });

  it('clamps guests to at most 4, the largest suite capacity', () => {
    const s = bookingReducer(base, { type: 'SET_GUESTS', guests: 99 });
    expect(s.guests).toBe(4);
  });

  it('navigates and records the view', () => {
    const s = bookingReducer(base, {
      type: 'NAVIGATE',
      view: { name: 'suite', suiteId: 'aurelia' },
    });
    expect(s.view).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });

  it('stores guest details', () => {
    let s = bookingReducer(base, { type: 'SET_GUEST_NAME', value: 'A Guest' });
    s = bookingReducer(s, { type: 'SET_GUEST_EMAIL', value: 'a@example.com' });
    expect(s.guestName).toBe('A Guest');
    expect(s.guestEmail).toBe('a@example.com');
  });

  it('records the confirmed code and moves to confirmation', () => {
    const s = bookingReducer(base, { type: 'CONFIRM', code: 'MR-ABC234' });
    expect(s.lastCode).toBe('MR-ABC234');
    expect(s.view).toEqual({ name: 'confirmation', code: 'MR-ABC234' });
  });

  it('clears dates', () => {
    // Both ends must be set first. With only a check-in, checkOut is already
    // null and the second assertion proves nothing — a CLEAR_DATES that forgot
    // to clear checkOut would pass.
    let s = bookingReducer(base, { type: 'PICK_DATE', date: '2026-08-17' });
    s = bookingReducer(s, { type: 'PICK_DATE', date: '2026-08-20' });
    expect(s.checkIn).toBe('2026-08-17');
    expect(s.checkOut).toBe('2026-08-20');

    s = bookingReducer(s, { type: 'CLEAR_DATES' });
    expect(s.checkIn).toBeNull();
    expect(s.checkOut).toBeNull();
  });

  it('rejects a non-finite guest count instead of storing NaN', () => {
    // NaN would pass validation silently (NaN > maxGuests is false) and become
    // null in storage.
    expect(bookingReducer(base, { type: 'SET_GUESTS', guests: NaN }).guests).toBe(1);
    expect(bookingReducer(base, { type: 'SET_GUESTS', guests: Infinity }).guests).toBe(1);
  });

  it('floors a fractional guest count', () => {
    expect(bookingReducer(base, { type: 'SET_GUESTS', guests: 2.9 }).guests).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- bookingReducer`
Expected: FAIL — cannot resolve `../bookingReducer`.

- [ ] **Step 3: Implement `src/state/bookingReducer.ts`**

```ts
import type { View } from './history';

export const MAX_SUITE_CAPACITY = 4;

export type BookingState = {
  view: View;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  guestName: string;
  guestEmail: string;
  lastCode: string | null;
};

export type BookingAction =
  | { type: 'NAVIGATE'; view: View }
  | { type: 'PICK_DATE'; date: string }
  | { type: 'CLEAR_DATES' }
  | { type: 'SET_GUESTS'; guests: number }
  | { type: 'SET_GUEST_NAME'; value: string }
  | { type: 'SET_GUEST_EMAIL'; value: string }
  | { type: 'CONFIRM'; code: string };

export function initialBookingState(view: View): BookingState {
  return {
    view,
    checkIn: null,
    checkOut: null,
    guests: 1,
    guestName: '',
    guestEmail: '',
    lastCode: null,
  };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, view: action.view };

    case 'PICK_DATE': {
      const { date } = action;
      const hasCompleteRange = state.checkIn !== null && state.checkOut !== null;

      // Any of these three cases means "start a new range", which keeps the
      // range always well-ordered and removes the need for inverted-range handling.
      if (hasCompleteRange || state.checkIn === null || date <= state.checkIn) {
        return { ...state, checkIn: date, checkOut: null };
      }
      return { ...state, checkOut: date };
    }

    case 'CLEAR_DATES':
      return { ...state, checkIn: null, checkOut: null };

    case 'SET_GUESTS': {
      // NaN must be rejected before clamping: Math.min(4, Math.max(1, NaN)) is
      // NaN, and NaN survives downstream unnoticed — `NaN > maxGuests` is false
      // so validation raises nothing, and JSON.stringify turns it into null.
      // Reachable the moment a UI does Number(input.value) on a cleared field.
      if (!Number.isFinite(action.guests)) return { ...state, guests: 1 };
      return {
        ...state,
        guests: Math.min(MAX_SUITE_CAPACITY, Math.max(1, Math.floor(action.guests))),
      };
    }

    case 'SET_GUEST_NAME':
      return { ...state, guestName: action.value };

    case 'SET_GUEST_EMAIL':
      return { ...state, guestEmail: action.value };

    case 'CONFIRM':
      return {
        ...state,
        lastCode: action.code,
        view: { name: 'confirmation', code: action.code },
      };
  }
}
```

- [ ] **Step 4: Implement `src/state/BookingProvider.tsx`**

```tsx
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { DateRange } from '../types';
import { bookingReducer, initialBookingState, type BookingAction, type BookingState } from './bookingReducer';
import { parsePath } from './history';

type BookingContextValue = {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  /** Non-null only when both ends of the range are chosen. */
  range: DateRange | null;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    bookingReducer,
    parsePath(window.location.pathname),
    initialBookingState
  );

  const value = useMemo<BookingContextValue>(() => {
    const range =
      state.checkIn && state.checkOut
        ? { checkIn: state.checkIn, checkOut: state.checkOut }
        : null;
    return { state, dispatch, range };
  }, [state]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
```

- [ ] **Step 5: Write the provider test**

`BookingProvider` has behaviour that neither `tsc` nor the reducer tests can
reach. Two mutations are invisible to both: swapping `checkIn`/`checkOut` when
building `range` — which would invert every date range in the app — and
`useBooking` silently returning `undefined` instead of throwing.

```tsx
// src/state/__tests__/BookingProvider.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BookingProvider, useBooking } from '../BookingProvider';

function Probe() {
  const { state, dispatch, range } = useBooking();
  return (
    <div>
      <span data-testid="view">{state.view.name}</span>
      <span data-testid="range">{range ? `${range.checkIn}..${range.checkOut}` : 'none'}</span>
      <span data-testid="guests">{state.guests}</span>
      <button onClick={() => dispatch({ type: 'PICK_DATE', date: '2026-08-17' })}>in</button>
      <button onClick={() => dispatch({ type: 'PICK_DATE', date: '2026-08-20' })}>out</button>
    </div>
  );
}

describe('BookingProvider', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('seeds the view from the current URL', () => {
    window.history.replaceState({}, '', '/suites/aurelia');
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('view')).toHaveTextContent('suite');
  });

  it('falls back to landing for an unrecognised URL without throwing', () => {
    window.history.replaceState({}, '', '/utter/nonsense');
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('view')).toHaveTextContent('landing');
  });

  it('exposes range as none until both ends are chosen, in the right order', () => {
    render(
      <BookingProvider>
        <Probe />
      </BookingProvider>
    );
    expect(screen.getByTestId('range')).toHaveTextContent('none');

    act(() => {
      screen.getByRole('button', { name: 'in' }).click();
    });
    expect(screen.getByTestId('range')).toHaveTextContent('none');

    act(() => {
      screen.getByRole('button', { name: 'out' }).click();
    });
    // Order matters: a swapped range object would read '2026-08-20..2026-08-17'
    // and invert every stay in the app.
    expect(screen.getByTestId('range')).toHaveTextContent('2026-08-17..2026-08-20');
  });

  it('throws a clear error when used outside the provider', () => {
    // Without the throw this is an undefined deref deep inside a view.
    expect(() => render(<Probe />)).toThrow(/must be used inside BookingProvider/);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test -- bookingReducer BookingProvider`
Expected: PASS — 14 reducer tests and 4 provider tests.

- [ ] **Step 6: Commit**

```bash
git add src/state
git commit -m "feat: add booking reducer and provider"
```

---

### Task 11: SmartImage with failure fallback

**Files:**
- Create: `src/components/SmartImage.tsx`, `src/components/SmartImage.css`
- Test: `src/components/__tests__/SmartImage.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `SmartImage` accepting `{ src: string; alt: string; className?: string; style?: React.CSSProperties; sizes?: string; eager?: boolean }`
- `eager` defaults to `false` (so images are `loading="lazy"`). Pass `eager` for above-the-fold hero photography, or the LCP image is needlessly deferred. Tasks 14 and 15 both need it.

Photography carries the whole visual design, so a failed load must degrade to something intentional rather than a broken-image icon.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/SmartImage.test.tsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- SmartImage`
Expected: FAIL — cannot resolve `../SmartImage`.

- [ ] **Step 3: Implement `src/components/SmartImage.css`**

```css
.smart-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.smart-image-fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(120% 90% at 20% 10%, rgba(201, 162, 39, 0.22), transparent 60%),
    linear-gradient(160deg, #16161a 0%, #0a0a0b 100%);
}
```

- [ ] **Step 4: Implement `src/components/SmartImage.tsx`**

```tsx
import { useState, type CSSProperties } from 'react';
import './SmartImage.css';

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  eager?: boolean;
};

export function SmartImage({ src, alt, className, style, sizes, eager = false }: Props) {
  // Keyed to the src, not a bare boolean. A plain `failed` flag never resets, so
  // one transient error would leave the fallback in place forever even after the
  // caller swaps in a working URL — which is exactly what a gallery does.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  const cls = (base: string) => (className ? `${base} ${className}` : base);

  if (failed) {
    // role="img" with aria-label keeps the alternative text available to
    // assistive tech even though there is no longer an <img> element. A
    // decorative image (alt="") must instead leave the tree entirely: an img
    // role with an empty name is worse than the <img alt=""> it replaced.
    return (
      <div
        {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
        className={cls('smart-image-fallback')}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={cls('smart-image')}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- SmartImage`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/SmartImage.tsx src/components/SmartImage.css src/components/__tests__/SmartImage.test.tsx
git commit -m "feat: add SmartImage with gradient fallback"
```

---

### Task 12: Accessible calendar

**Files:**
- Create: `src/components/Calendar.tsx`, `src/components/Calendar.css`
- Test: `src/components/__tests__/Calendar.test.tsx`

**Interfaces:**
- Consumes: `addDays`, `fromISO`, `toISO`, `todayISO` from `src/lib/dates`; `isNightAvailable` from `src/lib/availability`; `useReducedMotion` from `src/motion/useReducedMotion`
- Produces: `Calendar` accepting `{ suiteId: string; checkIn: string | null; checkOut: string | null; onPickDate: (iso: string) => void; today?: string }`

Keyboard model: arrow keys move focus by day and week, `Home`/`End` jump to week bounds, `PageUp`/`PageDown` change month, `Enter`/`Space` select. Only one day is in the tab order at a time (roving tabindex), which is what makes a 42-cell grid usable by keyboard.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/Calendar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Calendar } from '../Calendar';

// A raw element.focus() fires the cell's onFocus, which calls setFocusDate — a
// React state update. Outside act() that produces an "update was not wrapped in
// act(...)" warning, which is noise that hides real problems in later suites.
const focus = (el: HTMLElement) => act(() => el.focus());

const TODAY = '2026-08-10'; // a Monday

function setup(overrides: Partial<Parameters<typeof Calendar>[0]> = {}) {
  const onPickDate = vi.fn();
  render(
    <Calendar
      suiteId="aurelia"
      checkIn={null}
      checkOut={null}
      onPickDate={onPickDate}
      today={TODAY}
      {...overrides}
    />
  );
  return { onPickDate };
}

describe('Calendar', () => {
  it('renders as a grid with a caption naming the month', () => {
    setup();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText(/August 2026/i)).toBeInTheDocument();
  });

  it('disables dates before today', () => {
    setup();
    const past = screen.getByRole('gridcell', { name: /^5 / });
    expect(past).toHaveAttribute('aria-disabled', 'true');
  });

  it('selects a date on click', () => {
    const { onPickDate } = setup();
    fireEvent.click(screen.getByRole('gridcell', { name: /^17 / }));
    expect(onPickDate).toHaveBeenCalledWith('2026-08-17');
  });

  it('does not select an unavailable date', () => {
    // The penthouse is closed every Sunday; 2026-08-16 is a Sunday.
    const { onPickDate } = setup({ suiteId: 'celeste' });
    fireEvent.click(screen.getByRole('gridcell', { name: /^16 / }));
    expect(onPickDate).not.toHaveBeenCalled();
  });

  it('marks the selected range with aria-selected', () => {
    setup({ checkIn: '2026-08-17', checkOut: '2026-08-20' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('gridcell', { name: /^18 / })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('gridcell', { name: /^25 / })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('moves focus with the right arrow key', () => {
    setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    focus(day17);
    fireEvent.keyDown(day17, { key: 'ArrowRight' });
    expect(screen.getByRole('gridcell', { name: /^18 / })).toHaveFocus();
  });

  it('moves focus by a week with the down arrow key', () => {
    setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    focus(day17);
    fireEvent.keyDown(day17, { key: 'ArrowDown' });
    expect(screen.getByRole('gridcell', { name: /^24 / })).toHaveFocus();
  });

  it('selects with Enter', () => {
    const { onPickDate } = setup();
    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    focus(day17);
    fireEvent.keyDown(day17, { key: 'Enter' });
    expect(onPickDate).toHaveBeenCalledWith('2026-08-17');
  });

  it('changes month with the next button', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
  });

  it('announces the selected range in a live region', () => {
    setup({ checkIn: '2026-08-17', checkOut: '2026-08-20' });
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/17/);
    expect(status.textContent).toMatch(/20/);
  });

  it('keeps exactly one day in the tab order', () => {
    setup();
    const tabbable = screen
      .getAllByRole('gridcell')
      .filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('conveys unavailability with text, not colour alone', () => {
    setup({ suiteId: 'celeste' });
    const sunday = screen.getByRole('gridcell', { name: /^16 / });
    expect(sunday.getAttribute('aria-label')).toMatch(/unavailable/i);
  });

  it('keeps exactly one tab stop after navigating months by button', () => {
    // The roving tabindex is `iso === focusDate`. If month navigation moves the
    // cursor but leaves focusDate behind, NO rendered cell matches and the grid
    // has zero tab stops — a keyboard guest cannot reach any date at all.
    setup();
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    const tabbable = screen
      .getAllByRole('gridcell')
      .filter((c) => c.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('exposes rows, as role=grid requires', () => {
    // grid -> row -> gridcell. Without rows, columnheader has no valid context.
    setup();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('moves focus back a week with the up arrow', () => {
    setup();
    const day24 = screen.getByRole('gridcell', { name: /^24 / });
    focus(day24);
    fireEvent.keyDown(day24, { key: 'ArrowUp' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveFocus();
  });

  it('moves to the week bounds with Home and End', () => {
    setup();
    // 2026-08-19 is a Wednesday; the Monday-first week runs 17..23.
    const day19 = screen.getByRole('gridcell', { name: /^19 / });
    focus(day19);
    fireEvent.keyDown(day19, { key: 'Home' });
    expect(screen.getByRole('gridcell', { name: /^17 / })).toHaveFocus();

    const day17 = screen.getByRole('gridcell', { name: /^17 / });
    fireEvent.keyDown(day17, { key: 'End' });
    expect(screen.getByRole('gridcell', { name: /^23 / })).toHaveFocus();
  });

  it('PageDown moves a whole month and clamps to the month length', () => {
    // Day arithmetic would add 31 and land on 1 October, skipping September.
    setup({ checkIn: '2026-08-31' });
    const day31 = screen.getByRole('gridcell', { name: /^31 August/ });
    focus(day31);
    fireEvent.keyDown(day31, { key: 'PageDown' });

    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /^30 September/ })).toHaveFocus();
  });

  it('PageUp moves a whole month even from a long month', () => {
    // Subtracting February's 28 days from 30 March lands on 2 March — still in
    // March, so the key looks broken.
    setup({ checkIn: '2027-03-30' });
    const day30 = screen.getByRole('gridcell', { name: /^30 March/ });
    focus(day30);
    fireEvent.keyDown(day30, { key: 'PageUp' });

    expect(screen.getByText(/February 2027/i)).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /^28 February/ })).toHaveFocus();
  });

  it('refuses to select an unavailable date by keyboard as well as by click', () => {
    // The click path was covered; Enter and Space were not.
    const { onPickDate } = setup({ suiteId: 'celeste' });
    const sunday = screen.getByRole('gridcell', { name: /^16 / });
    focus(sunday);

    fireEvent.keyDown(sunday, { key: 'Enter' });
    fireEvent.keyDown(sunday, { key: ' ' });
    expect(onPickDate).not.toHaveBeenCalled();
  });

  it('marks today with aria-current', () => {
    setup();
    expect(screen.getByRole('gridcell', { name: /^10 August/ })).toHaveAttribute(
      'aria-current',
      'date'
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- Calendar`
Expected: FAIL — cannot resolve `../Calendar`.

- [ ] **Step 3: Implement `src/components/Calendar.css`**

```css
.calendar {
  background: var(--panel);
  border: 1px solid rgba(201, 162, 39, 0.22);
  padding: var(--space-3);
  max-width: 26rem;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.calendar-caption {
  font-family: var(--font-display);
  color: var(--text);
  font-size: 1.125rem;
}

.calendar-nav {
  color: var(--gold);
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(201, 162, 39, 0.3);
}

.calendar-nav[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}

/* The grid is a stack of rows; each row lays out its own 7 columns, because
   role="grid" requires grid -> row -> gridcell. */
.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-dow {
  font-size: 0.625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--caption);
  text-align: center;
  padding-bottom: 0.4rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--body);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
}

/* --caption is 6.22:1 on --panel, so unbookable dates still clear WCAG AA.
   The previous #55524d measured 2.32:1, and these cells stay in the
   accessibility tree and remain arrow-reachable, so the inactive-control
   exemption does not apply to them. */
.calendar-day[aria-disabled='true'] {
  color: var(--caption);
  cursor: not-allowed;
  text-decoration: line-through;
}

.calendar-day.is-today {
  box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.45);
}

.calendar-day[aria-selected='true'] {
  background: rgba(201, 162, 39, 0.9);
  color: #0a0a0b;
}

.calendar-day.is-edge {
  border-color: var(--gold);
}

.calendar-empty {
  aspect-ratio: 1;
}
```

- [ ] **Step 4: Implement `src/components/Calendar.tsx`**

```tsx
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
// Note: toISO is deliberately NOT imported — Calendar never calls it, and
// `noUnusedLocals` turns an unused import into a build failure (TS6133).
// Same for useReducedMotion: the Calendar has no animation, so there is nothing
// to gate and the "static equivalent" requirement is satisfied vacuously.
import { addDays, fromISO, todayISO } from '../lib/dates';
import { isNightAvailable } from '../lib/availability';
import './Calendar.css';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  suiteId: string;
  checkIn: string | null;
  checkOut: string | null;
  onPickDate: (iso: string) => void;
  today?: string;
};

/** Monday-first index for a given ISO date. */
function mondayIndex(iso: string): number {
  const day = fromISO(iso).getUTCDay(); // 0 Sun .. 6 Sat
  return (day + 6) % 7;
}

function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function daysInMonth(iso: string): number {
  const d = fromISO(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).getUTCDate();
}

function monthLabel(iso: string): string {
  return fromISO(iso).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Shift by whole months, clamping the day to the target month's length.
 *
 * PageUp/PageDown must NOT be day arithmetic. Adding `daysInMonth(iso)` skips
 * September entirely from 31 August, skips February from 31 January, and from
 * 30 March lands back in March — so the key appears dead for three days a year.
 */
function addMonths(iso: string, n: number): string {
  const d = fromISO(iso);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, 12));
  const ym = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}`;
  const day = Math.min(d.getUTCDate(), daysInMonth(`${ym}-01`));
  return `${ym}-${String(day).padStart(2, '0')}`;
}

export function Calendar({ suiteId, checkIn, checkOut, onPickDate, today }: Props) {
  const todayIso = today ?? todayISO();
  const [cursor, setCursor] = useState(() => startOfMonth(checkIn ?? todayIso));
  const [focusDate, setFocusDate] = useState<string>(checkIn ?? todayIso);
  const gridRef = useRef<HTMLDivElement>(null);
  // Only a keyboard move may pull DOM focus. Without this gate the calendar
  // would steal focus on mount and on every unrelated re-render.
  const pendingFocus = useRef(false);

  /**
   * Focus follows the roving tabindex, so it can only be applied once the new
   * tabIndex values are committed to the DOM.
   *
   * This MUST be a layout effect — not requestAnimationFrame, and not
   * queueMicrotask. React flushes layout effects synchronously as part of the
   * commit, so focus lands inside the same act() scope that dispatched the key
   * event. rAF waits on jsdom's ~16ms visual clock, and a microtask needs the
   * JS stack to unwind, which never happens inside fireEvent's synchronous
   * act(). Both leave focus on the previous cell — and in a real browser, one
   * frame of visible lag.
   */
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate]);

  const days = useMemo(() => {
    const total = daysInMonth(cursor);
    return Array.from({ length: total }, (_, i) => addDays(cursor, i));
  }, [cursor]);

  /**
   * Weeks of 7, padded at both ends with nulls.
   *
   * A `role="grid"` must own rows: grid -> row -> gridcell. With cells as direct
   * children there are no rows at all, and `columnheader` has no valid context.
   */
  const weeks = useMemo(() => {
    const cells: (string | null)[] = [
      ...Array.from({ length: mondayIndex(cursor) }, () => null),
      ...days,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const out: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cursor, days]);

  function isInRange(iso: string): boolean {
    if (!checkIn) return false;
    if (!checkOut) return iso === checkIn;
    return iso >= checkIn && iso <= checkOut;
  }

  function isSelectable(iso: string): boolean {
    if (iso < todayIso) return false;
    return isNightAvailable(suiteId, iso);
  }

  function moveTo(from: string, next: string) {
    // A no-op move (Home on a Monday, End on a Sunday) would leave the
    // pending-focus flag armed with no commit to consume it, so a later
    // unrelated re-render would steal focus.
    if (next === from) return;
    pendingFocus.current = true;
    setFocusDate(next);
    if (next.slice(0, 7) !== cursor.slice(0, 7)) {
      setCursor(startOfMonth(next));
    }
  }

  function move(from: string, delta: number) {
    moveTo(from, addDays(from, delta));
  }

  /**
   * Month navigation by button must also move `focusDate` into the new month.
   *
   * The roving tabindex is `iso === focusDate`, so leaving focusDate behind in
   * the old month means NO rendered cell matches and the grid has zero tab
   * stops — a keyboard guest who uses these buttons cannot reach any date at
   * all, with nothing on screen explaining why.
   *
   * Deliberately does not arm `pendingFocus`: the guest clicked a button, so
   * focus stays on that button rather than jumping into the grid.
   */
  function goToMonth(nextCursor: string) {
    setCursor(nextCursor);
    const day = Math.min(Number(focusDate.slice(8, 10)), daysInMonth(nextCursor));
    setFocusDate(`${nextCursor.slice(0, 7)}-${String(day).padStart(2, '0')}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>, iso: string) {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); move(iso, 1); break;
      case 'ArrowLeft': e.preventDefault(); move(iso, -1); break;
      case 'ArrowDown': e.preventDefault(); move(iso, 7); break;
      case 'ArrowUp': e.preventDefault(); move(iso, -7); break;
      case 'Home': e.preventDefault(); move(iso, -mondayIndex(iso)); break;
      case 'End': e.preventDefault(); move(iso, 6 - mondayIndex(iso)); break;
      case 'PageDown': e.preventDefault(); moveTo(iso, addMonths(iso, 1)); break;
      case 'PageUp': e.preventDefault(); moveTo(iso, addMonths(iso, -1)); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isSelectable(iso)) onPickDate(iso);
        break;
    }
  }

  const prevDisabled = cursor <= startOfMonth(todayIso);

  const announcement = checkIn
    ? checkOut
      ? `Arrival ${monthDay(checkIn)}, departure ${monthDay(checkOut)}.`
      : `Arrival ${monthDay(checkIn)}. Choose a departure date.`
    : 'Choose an arrival date.';

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="calendar-nav"
          aria-label="Previous month"
          disabled={prevDisabled}
          onClick={() => goToMonth(startOfMonth(addDays(cursor, -1)))}
        >
          &larr;
        </button>
        <span className="calendar-caption" id="calendar-caption">
          {monthLabel(cursor)}
        </span>
        <button
          type="button"
          className="calendar-nav"
          aria-label="Next month"
          onClick={() => goToMonth(startOfMonth(addDays(cursor, daysInMonth(cursor))))}
        >
          &rarr;
        </button>
      </div>

      <div
        className="calendar-grid"
        role="grid"
        aria-label="Choose your dates"
        aria-describedby="calendar-caption"
        ref={gridRef}
      >
        <div className="calendar-row" role="row">
          {DOW.map((d) => (
            <div key={d} className="calendar-dow" role="columnheader" aria-label={d}>
              {d.slice(0, 1)}
            </div>
          ))}
        </div>

        {weeks.map((week, w) => (
          <div className="calendar-row" role="row" key={`week-${w}`}>
            {week.map((iso, i) => {
              if (iso === null) {
                return (
                  <div
                    key={`blank-${w}-${i}`}
                    className="calendar-empty"
                    role="presentation"
                  />
                );
              }

              const selectable = isSelectable(iso);
              const selected = isInRange(iso);
              const edge = iso === checkIn || iso === checkOut;
              const dayNum = Number(iso.slice(8, 10));
              const isToday = iso === todayIso;
              const label = `${dayNum} ${monthLabel(iso)}${selectable ? '' : ' — unavailable'}`;

              return (
                <div
                  key={iso}
                  role="gridcell"
                  data-date={iso}
                  aria-label={label}
                  aria-selected={selected}
                  aria-disabled={!selectable}
                  aria-current={isToday ? 'date' : undefined}
                  tabIndex={iso === focusDate ? 0 : -1}
                  className={`calendar-day${edge ? ' is-edge' : ''}${isToday ? ' is-today' : ''}`}
                  style={{ borderRadius: 3 }}
                  onClick={() => selectable && onPickDate(iso)}
                  onFocus={() => setFocusDate(iso)}
                  onKeyDown={(e) => onKeyDown(e, iso)}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p role="status" aria-live="polite" className="visually-hidden">
        {announcement}
      </p>
    </div>
  );
}

function monthDay(iso: string): string {
  return fromISO(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- Calendar`
Expected: PASS — 12 tests. The focus call is a layout effect for the reason given in the code comment; do not move it to `requestAnimationFrame` or `queueMicrotask` — both were tried and both fail the roving-tabindex assertions, because neither runs inside `fireEvent`'s synchronous `act()` scope.

- [ ] **Step 6: Commit**

```bash
git add src/components/Calendar.tsx src/components/Calendar.css src/components/__tests__/Calendar.test.tsx
git commit -m "feat: add accessible date-range calendar"
```

---

### Task 13: Guest picker and suite card

**Files:**
- Create: `src/components/GuestPicker.tsx`, `src/components/SuiteCard.tsx`, `src/components/SuiteCard.css`
- Test: `src/components/__tests__/GuestPicker.test.tsx`, `src/components/__tests__/SuiteCard.test.tsx`

**Interfaces:**
- Consumes: `Suite` from `src/types`; `formatUSD` from `src/lib/pricing`; `SmartImage`; `useReducedMotion`; `riseIn` from `src/motion/tokens`
- Produces: `GuestPicker` accepting `{ guests: number; max: number; onChange: (n: number) => void }`; `SuiteCard` accepting `{ suite: Suite; unavailable: boolean; onSelect: (id: string) => void }`

`SuiteCard` is the morph source. Its image carries `layoutId={`suite-image-${suite.id}`}` — the same id the detail hero uses.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/__tests__/GuestPicker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestPicker } from '../GuestPicker';

describe('GuestPicker', () => {
  it('shows the current count', () => {
    render(<GuestPicker guests={2} max={4} onChange={() => {}} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('increments and decrements', () => {
    const onChange = vi.fn();
    render(<GuestPicker guests={2} max={4} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: /remove a guest/i }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables increment at the maximum', () => {
    render(<GuestPicker guests={4} max={4} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /add a guest/i })).toBeDisabled();
  });

  it('disables decrement at one guest', () => {
    render(<GuestPicker guests={1} max={4} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /remove a guest/i })).toBeDisabled();
  });
});
```

```tsx
// src/components/__tests__/SuiteCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuiteCard } from '../SuiteCard';
import { SUITES } from '../../data/suites';

const suite = SUITES[1];

describe('SuiteCard', () => {
  it('shows name, rate and occupancy', () => {
    render(<SuiteCard suite={suite} unavailable={false} onSelect={() => {}} />);
    expect(screen.getByText(suite.name)).toBeInTheDocument();
    expect(screen.getByText(/\$850/)).toBeInTheDocument();
    expect(screen.getByText(/2 guests/i)).toBeInTheDocument();
  });

  it('calls onSelect when activated', () => {
    const onSelect = vi.fn();
    render(<SuiteCard suite={suite} unavailable={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(suite.name, 'i') }));
    expect(onSelect).toHaveBeenCalledWith(suite.id);
  });

  it('is not selectable and states the reason when unavailable', () => {
    const onSelect = vi.fn();
    render(<SuiteCard suite={suite} unavailable onSelect={onSelect} />);
    const btn = screen.getByRole('button', { name: new RegExp(suite.name, 'i') });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/unavailable for these dates/i)).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- GuestPicker SuiteCard`
Expected: FAIL — modules unresolved.

- [ ] **Step 3: Implement `src/components/GuestPicker.tsx`**

```tsx
type Props = {
  guests: number;
  max: number;
  onChange: (n: number) => void;
};

export function GuestPicker({ guests, max, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        type="button"
        aria-label="Remove a guest"
        disabled={guests <= 1}
        onClick={() => onChange(guests - 1)}
        style={{
          borderRadius: 999,
          border: '1px solid rgba(201,162,39,0.4)',
          width: 34,
          height: 34,
          color: 'var(--gold)',
          opacity: guests <= 1 ? 0.35 : 1,
        }}
      >
        &minus;
      </button>

      <span aria-live="polite" style={{ minWidth: '1.5rem', textAlign: 'center' }}>
        {guests}
      </span>

      <button
        type="button"
        aria-label="Add a guest"
        disabled={guests >= max}
        onClick={() => onChange(guests + 1)}
        style={{
          borderRadius: 999,
          border: '1px solid rgba(201,162,39,0.4)',
          width: 34,
          height: 34,
          color: 'var(--gold)',
          opacity: guests >= max ? 0.35 : 1,
        }}
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement `src/components/SuiteCard.css`**

```css
.suite-card {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  padding: 0;
  background: var(--panel);
  overflow: hidden;
  border: 1px solid rgba(242, 239, 233, 0.08);
}

.suite-card:disabled {
  cursor: not-allowed;
}

.suite-card-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.suite-card.is-unavailable .suite-card-media {
  opacity: 0.32;
}

.suite-card-body {
  padding: var(--space-2) var(--space-2) var(--space-3);
}

.suite-card-name {
  font-family: var(--font-display);
  color: var(--text);
  font-size: 1.375rem;
  margin: 0 0 0.35rem;
}

.suite-card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--caption);
}

.suite-card-rate {
  color: var(--gold);
}

.suite-card-flag {
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #e0b4b4;
  margin-top: 0.6rem;
}
```

- [ ] **Step 5: Implement `src/components/SuiteCard.tsx`**

```tsx
import { motion } from 'motion/react';
import type { Suite } from '../types';
import { formatUSD } from '../lib/pricing';
import { SmartImage } from './SmartImage';
import './SuiteCard.css';

// Note: SuiteCard carries NO `variants` of its own. Its parent <motion.li> in
// Landing is the stagger child and owns the riseIn variant. Putting riseIn here
// too would animate the same properties twice on nested elements.

type Props = {
  suite: Suite;
  unavailable: boolean;
  onSelect: (id: string) => void;
};

export function SuiteCard({ suite, unavailable, onSelect }: Props) {
  return (
    <motion.button
      type="button"
      layout
      disabled={unavailable}
      onClick={() => !unavailable && onSelect(suite.id)}
      className={`suite-card${unavailable ? ' is-unavailable' : ''}`}
      style={{ borderRadius: 4 }}
      aria-label={`${suite.name}${unavailable ? ', unavailable for these dates' : ''}`}
    >
      <div className="suite-card-media">
        {/* layoutId must match the detail hero exactly for the morph to connect. */}
        <motion.div
          layoutId={`suite-image-${suite.id}`}
          layout="position"
          style={{ width: '100%', height: '100%', borderRadius: 0 }}
        >
          <SmartImage src={suite.hero} alt={suite.name} />
        </motion.div>
      </div>

      <div className="suite-card-body">
        <h3 className="suite-card-name">{suite.name}</h3>
        <div className="suite-card-meta">
          <span>
            {suite.maxGuests} guests &middot; {suite.size} m&sup2;
          </span>
          <span className="suite-card-rate">{formatUSD(suite.rate)} / night</span>
        </div>
        {unavailable && <p className="suite-card-flag">Unavailable for these dates</p>}
      </div>
    </motion.button>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- GuestPicker SuiteCard`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat: add guest picker and suite card"
```

---

### Task 14: Landing view with smooth scroll and parallax

**Files:**
- Create: `src/views/Landing.tsx`, `src/views/Landing.css`
- Create: `src/motion/useLenis.ts`
- Test: `src/views/__tests__/Landing.test.tsx`

**Interfaces:**
- Consumes: `SUITES`; `useBooking`; `Calendar`; `GuestPicker`; `SuiteCard`; `isSuiteAvailable`; `staggerParent`, `riseIn`, `fade`; `useReducedMotion`
- Produces: `Landing` (no props — reads context); `useLenis(enabled: boolean): void`

Filtering behaviour, exactly as specified: suites whose `maxGuests` is below the party size are **removed** and animate out. Suites unavailable for the chosen dates **stay** but are dimmed, labelled, and not selectable.

- [ ] **Step 1: Write the failing test**

```tsx
// src/views/__tests__/Landing.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Landing } from '../Landing';
import { BookingProvider } from '../../state/BookingProvider';

function renderLanding() {
  render(
    <BookingProvider>
      <Landing />
    </BookingProvider>
  );
}

describe('Landing', () => {
  it('shows the hotel name and all six suites by default', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Meridian Reserve/i);
    expect(screen.getByText('Aurelia Suite')).toBeInTheDocument();
    expect(screen.getByText('Celeste Penthouse')).toBeInTheDocument();
  });

  it('removes suites that cannot hold the party size', () => {
    renderLanding();
    // Raise to 3 guests: the two-guest suites must disappear.
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    fireEvent.click(screen.getByRole('button', { name: /add a guest/i }));
    expect(screen.queryByText('Aurelia Suite')).not.toBeInTheDocument();
    expect(screen.getByText('Garden Pavilion')).toBeInTheDocument();
  });

  it('renders a story section', () => {
    renderLanding();
    expect(screen.getByRole('heading', { name: /the house/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- Landing`
Expected: FAIL — cannot resolve `../Landing`.

- [ ] **Step 3: Implement `src/motion/useLenis.ts`**

```ts
import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Smooth scroll, disabled entirely when reduced motion is preferred —
 * hijacking scroll is itself a motion effect.
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);
}
```

- [ ] **Step 4: Implement `src/views/Landing.css`**

```css
.hero {
  position: relative;
  height: 100vh;
  min-height: 34rem;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.hero-media {
  position: absolute;
  inset: -10% 0 -10% 0;
}

.hero-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 10, 11, 0.25) 0%, rgba(10, 10, 11, 0.92) 100%);
}

.hero-inner {
  position: relative;
  padding: var(--space-5) var(--space-4);
  max-width: var(--max-w);
  margin: 0 auto;
  width: 100%;
}

.hero-title {
  font-size: clamp(2.75rem, 8vw, 6.5rem);
  line-height: 0.98;
  margin: var(--space-2) 0 var(--space-3);
}

.hero-line {
  display: block;
  overflow: hidden;
}

.section {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.section-title {
  font-size: clamp(1.75rem, 4vw, 3rem);
  margin-bottom: var(--space-3);
}

.booking-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-start;
}

.suite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
  list-style: none;
  padding: 0;
}

.story {
  color: var(--body);
  max-width: 44ch;
  font-size: 1.0625rem;
  line-height: 1.75;
}

@media (max-width: 720px) {
  .hero {
    height: 88vh;
  }
  .section {
    padding: var(--space-5) var(--space-2);
  }
}
```

- [ ] **Step 5: Implement `src/views/Landing.tsx`**

```tsx
import { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { SUITES } from '../data/suites';
import { useBooking } from '../state/BookingProvider';
import { Calendar } from '../components/Calendar';
import { GuestPicker } from '../components/GuestPicker';
import { SuiteCard } from '../components/SuiteCard';
import { SmartImage } from '../components/SmartImage';
import { isSuiteAvailable } from '../lib/availability';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useLenis } from '../motion/useLenis';
import { fade, riseIn, staggerParent, DURATION } from '../motion/tokens';
import { pushView } from '../state/history';
import './Landing.css';

const TITLE_LINES = ['Meridian', 'Reserve'];

export function Landing() {
  const { state, dispatch, range } = useBooking();
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  useLenis(!reduced);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  // Parallax: the image drifts slower than the page. Disabled when reduced.
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['0%', '18%']);

  const visible = useMemo(
    () => SUITES.filter((s) => s.maxGuests >= state.guests),
    [state.guests]
  );

  function select(id: string) {
    const view = { name: 'suite' as const, suiteId: id };
    pushView(view);
    dispatch({ type: 'NAVIGATE', view });
  }

  return (
    <>
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-media" style={{ y }}>
          <SmartImage src={SUITES[3].hero} alt="Meridian Reserve at night" eager />
        </motion.div>
        <div className="hero-veil" />

        <div className="hero-inner">
          <motion.p
            className="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={fade(reduced, DURATION.base)}
          >
            Est. 1926 &middot; All Suites
          </motion.p>

          <h1 className="hero-title">
            {TITLE_LINES.map((line, i) => (
              <span className="hero-line" key={line}>
                <motion.span
                  style={{ display: 'block' }}
                  initial={{ y: reduced ? 0 : '110%' }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: reduced ? 0 : DURATION.hero,
                    delay: reduced ? 0 : i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
      </section>

      <section className="section" id="reserve">
        <h2 className="section-title">Choose your dates</h2>
        <div className="booking-bar">
          <Calendar
            suiteId={visible[0]?.id ?? 'aurelia'}
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            onPickDate={(date) => dispatch({ type: 'PICK_DATE', date })}
          />
          <div>
            <p className="label" style={{ marginBottom: '0.75rem' }}>
              Guests
            </p>
            <GuestPicker
              guests={state.guests}
              max={4}
              onChange={(guests) => dispatch({ type: 'SET_GUESTS', guests })}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">The suites</h2>

        <motion.ul
          className="suite-grid"
          variants={staggerParent(reduced)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <AnimatePresence mode="popLayout">
            {visible.map((suite) => (
              <motion.li
                key={suite.id}
                variants={riseIn(reduced)}
                layout
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <SuiteCard
                  suite={suite}
                  unavailable={range ? !isSuiteAvailable(suite.id, range) : false}
                  onSelect={select}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </section>

      <section className="section">
        <h2 className="section-title">The house</h2>
        <p className="story">
          Nine floors on the harbour side, built for a shipping family and kept
          almost unchanged since. Twenty-two suites, no two alike, and a staff who
          have mostly been here longer than the lifts.
        </p>
      </section>
    </>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- Landing`
Expected: PASS — 3 tests.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`, open the printed URL. Confirm the hero title rises line by line, the image parallaxes on scroll, and raising guests to 3 animates the two-guest suites out.

- [ ] **Step 8: Commit**

```bash
git add src/views/Landing.tsx src/views/Landing.css src/motion/useLenis.ts src/views/__tests__
git commit -m "feat: add landing view with parallax hero and suite grid"
```

---

### Task 15: Suite detail and the shared-element morph

**Files:**
- Create: `src/views/SuiteDetail.tsx`, `src/views/SuiteDetail.css`
- Test: `src/views/__tests__/SuiteDetail.test.tsx`

**Interfaces:**
- Consumes: `getSuite`; `useBooking`; `SmartImage`; `formatUSD`; `quote`; `morphTransition`, `staggerParent`, `riseIn`; `useReducedMotion`; `pushView`
- Produces: `SuiteDetail` accepting `{ suiteId: string }`

The hero here uses the **same** `layoutId` as the card image and the **same** `src`. Identical `src` is what prevents a mid-morph image swap.

- [ ] **Step 1: Write the failing test**

```tsx
// src/views/__tests__/SuiteDetail.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuiteDetail } from '../SuiteDetail';
import { BookingProvider } from '../../state/BookingProvider';

function renderDetail(suiteId: string) {
  render(
    <BookingProvider>
      <SuiteDetail suiteId={suiteId} />
    </BookingProvider>
  );
}

describe('SuiteDetail', () => {
  it('shows the suite name, rate, size and amenities', () => {
    renderDetail('aurelia');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Aurelia Suite');
    expect(screen.getByText(/\$850/)).toBeInTheDocument();
    expect(screen.getByText(/55 m/)).toBeInTheDocument();
    expect(screen.getByText('Record player')).toBeInTheDocument();
  });

  it('renders the gallery', () => {
    renderDetail('aurelia');
    expect(screen.getAllByAltText(/Aurelia Suite/i).length).toBeGreaterThan(1);
  });

  it('shows a not-found state for an unknown suite instead of crashing', () => {
    renderDetail('no-such-suite');
    expect(screen.getByRole('heading', { name: /suite not found/i })).toBeInTheDocument();
  });

  it('offers a reserve action', () => {
    renderDetail('aurelia');
    expect(screen.getByRole('button', { name: /reserve this suite/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- SuiteDetail`
Expected: FAIL — cannot resolve `../SuiteDetail`.

- [ ] **Step 3: Implement `src/views/SuiteDetail.css`**

```css
.detail-hero {
  position: relative;
  height: 62vh;
  min-height: 22rem;
  overflow: hidden;
}

.detail-hero-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 10, 11, 0.2) 0%, rgba(10, 10, 11, 0.86) 100%);
  pointer-events: none;
}

.detail-body {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: var(--space-4);
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--space-5);
}

.detail-title {
  font-size: clamp(2rem, 5vw, 3.75rem);
  margin-bottom: var(--space-2);
}

.detail-desc {
  color: var(--body);
  font-size: 1.0625rem;
  line-height: 1.75;
}

.spec-list {
  list-style: none;
  padding: 0;
  margin: var(--space-3) 0 0;
}

.spec-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(242, 239, 233, 0.1);
  font-size: 0.875rem;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-1);
  max-width: var(--max-w);
  margin: 0 auto var(--space-5);
  padding: 0 var(--space-4);
}

.gallery-item {
  aspect-ratio: 3 / 4;
  overflow: hidden;
}

.cta {
  background: var(--gold);
  color: #0a0a0b;
  padding: 0.9rem 1.6rem;
  font-size: 0.8125rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: var(--space-3);
}

.back-link {
  color: var(--gold);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

@media (max-width: 860px) {
  .detail-body {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
}
```

- [ ] **Step 4: Implement `src/views/SuiteDetail.tsx`**

```tsx
import { motion } from 'motion/react';
import { getSuite } from '../data/suites';
import { useBooking } from '../state/BookingProvider';
import { SmartImage } from '../components/SmartImage';
import { formatUSD, quote } from '../lib/pricing';
import { morphTransition, riseIn, staggerParent } from '../motion/tokens';
import { useReducedMotion } from '../motion/useReducedMotion';
import { pushView } from '../state/history';
import './SuiteDetail.css';

export function SuiteDetail({ suiteId }: { suiteId: string }) {
  const suite = getSuite(suiteId);
  const { state, dispatch, range } = useBooking();
  const reduced = useReducedMotion();

  if (!suite) {
    return (
      <section className="section" style={{ paddingTop: '8rem' }}>
        <h1 className="section-title">Suite not found</h1>
        <p className="story">
          We could not find that suite. It may have been renamed.
        </p>
        <button
          type="button"
          className="back-link"
          onClick={() => {
            const view = { name: 'landing' as const };
            pushView(view);
            dispatch({ type: 'NAVIGATE', view });
          }}
        >
          &larr; Back to all suites
        </button>
      </section>
    );
  }

  const q = range ? quote(suite, range) : null;

  function goReserve() {
    const view = { name: 'reserve' as const, suiteId: suite!.id };
    pushView(view);
    dispatch({ type: 'NAVIGATE', view });
  }

  return (
    <>
      <div className="detail-hero">
        {/* Same layoutId AND same src as SuiteCard — this pairing is the morph. */}
        <motion.div
          layoutId={`suite-image-${suite.id}`}
          layout="position"
          transition={morphTransition(reduced)}
          style={{ width: '100%', height: '100%', borderRadius: 0 }}
        >
          <SmartImage src={suite.hero} alt={suite.name} eager />
        </motion.div>
        <div className="detail-hero-veil" />
      </div>

      <motion.div
        className="detail-body"
        variants={staggerParent(reduced, 0.07)}
        initial="hidden"
        animate="visible"
        transition={{ delay: reduced ? 0 : 0.25 }}
      >
        <div>
          <motion.div variants={riseIn(reduced)}>
            <p className="label">{formatUSD(suite.rate)} per night</p>
            <h1 className="detail-title">{suite.name}</h1>
            <p className="detail-desc">{suite.description}</p>
          </motion.div>

          <motion.button variants={riseIn(reduced)} type="button" className="cta" onClick={goReserve}>
            Reserve this suite
          </motion.button>
        </div>

        <motion.ul className="spec-list" variants={riseIn(reduced)}>
          <li>
            <span>Size</span>
            <span>{suite.size} m&sup2;</span>
          </li>
          <li>
            <span>Sleeps</span>
            <span>{suite.maxGuests} guests</span>
          </li>
          {suite.amenities.map((a) => (
            <li key={a}>
              <span>{a}</span>
              <span aria-hidden="true">&bull;</span>
            </li>
          ))}
          {q && (
            <li>
              <span>
                {q.nights} night{q.nights === 1 ? '' : 's'} total
              </span>
              <span style={{ color: 'var(--gold)' }}>{formatUSD(q.total)}</span>
            </li>
          )}
        </motion.ul>
      </motion.div>

      <div className="gallery">
        {suite.gallery.map((src, i) => (
          <motion.div
            className="gallery-item"
            key={src}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : i * 0.08 }}
          >
            <SmartImage src={src} alt={`${suite.name}, view ${i + 1}`} />
          </motion.div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- SuiteDetail`
Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/views/SuiteDetail.tsx src/views/SuiteDetail.css src/views/__tests__/SuiteDetail.test.tsx
git commit -m "feat: add suite detail view with shared-element morph"
```

---

### Task 16: Price summary and reserve view

**Files:**
- Create: `src/components/PriceSummary.tsx`, `src/views/Reserve.tsx`, `src/views/Reserve.css`
- Test: `src/components/__tests__/PriceSummary.test.tsx`, `src/views/__tests__/Reserve.test.tsx`

**Interfaces:**
- Consumes: `quote`, `formatUSD`; `validateBooking`, `ERROR_MESSAGES`; `getSuite`; `useBooking`; `generateCode`; `saveReservation`, `loadReservations`, `isPersistent`; `useReducedMotion`
- Produces: `PriceSummary` accepting `{ suite: Suite; range: DateRange | null }`; `Reserve` accepting `{ suiteId: string }`

Email validation is intentionally permissive — a single `@` with text either side and a dot in the domain. Stricter regexes reject valid addresses, which is worse than accepting an implausible one in a demo.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/__tests__/PriceSummary.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceSummary } from '../PriceSummary';
import { SUITES } from '../../data/suites';

const suite = SUITES[1]; // Aurelia, 850

describe('PriceSummary', () => {
  it('prompts for dates when none are chosen', () => {
    render(<PriceSummary suite={suite} range={null} />);
    expect(screen.getByText(/choose your dates/i)).toBeInTheDocument();
  });

  it('breaks down nights, subtotal, tax and total', () => {
    // Mon 17 to Wed 19 August 2026: 2 midweek nights at 850 = 1700, tax 204, total 1904.
    render(
      <PriceSummary suite={suite} range={{ checkIn: '2026-08-17', checkOut: '2026-08-19' }} />
    );
    expect(screen.getByText(/2 nights/i)).toBeInTheDocument();
    expect(screen.getByText('$1,700')).toBeInTheDocument();
    expect(screen.getByText('$204')).toBeInTheDocument();
    expect(screen.getByText('$1,904')).toBeInTheDocument();
  });
});
```

```tsx
// src/views/__tests__/Reserve.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Reserve } from '../Reserve';
import { BookingProvider } from '../../state/BookingProvider';

function renderReserve(suiteId = 'aurelia') {
  render(
    <BookingProvider>
      <Reserve suiteId={suiteId} />
    </BookingProvider>
  );
}

describe('Reserve', () => {
  it('asks for dates first when none are selected', () => {
    renderReserve();
    expect(screen.getByText(/select your dates/i)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown suite', () => {
    renderReserve('nope');
    expect(screen.getByRole('heading', { name: /suite not found/i })).toBeInTheDocument();
  });

  it('labels the name and email fields', () => {
    renderReserve();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('reports missing name and invalid email on submit', () => {
    renderReserve();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm reservation/i }));
    expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it('marks invalid fields with aria-invalid', () => {
    renderReserve();
    fireEvent.click(screen.getByRole('button', { name: /confirm reservation/i }));
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- PriceSummary Reserve`
Expected: FAIL — modules unresolved.

- [ ] **Step 3: Implement `src/components/PriceSummary.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { DateRange, Suite } from '../types';
import { formatUSD, quote } from '../lib/pricing';
import { useReducedMotion } from '../motion/useReducedMotion';

/** Counts from the previous value to the next one. Sets instantly when reduced. */
function useCountUp(value: number, reduced: boolean): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduced) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    if (from === value) return;

    const duration = 500;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return display;
}

export function PriceSummary({ suite, range }: { suite: Suite; range: DateRange | null }) {
  const reduced = useReducedMotion();
  const q = range ? quote(suite, range) : null;
  const total = useCountUp(q?.total ?? 0, reduced);

  if (!q) {
    return (
      <p className="story" style={{ fontSize: '0.9375rem' }}>
        Choose your dates to see the total.
      </p>
    );
  }

  return (
    <ul className="spec-list" aria-label="Price breakdown">
      <li>
        <span>
          {q.nights} night{q.nights === 1 ? '' : 's'}
        </span>
        <span>{formatUSD(q.subtotal)}</span>
      </li>
      <li>
        <span>Tax and service</span>
        <span>{formatUSD(q.tax)}</span>
      </li>
      <li>
        <span style={{ color: 'var(--text)' }}>Total</span>
        <span style={{ color: 'var(--gold)' }}>{formatUSD(total)}</span>
      </li>
    </ul>
  );
}
```

- [ ] **Step 4: Implement `src/views/Reserve.css`**

```css
.reserve {
  max-width: 56rem;
  margin: 0 auto;
  padding: calc(var(--space-6) + 2rem) var(--space-4) var(--space-6);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-5);
}

.field {
  display: block;
  margin-bottom: var(--space-3);
}

.field-label {
  display: block;
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--caption);
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  background: var(--panel);
  border: 1px solid rgba(242, 239, 233, 0.16);
  color: var(--text);
  padding: 0.8rem 0.9rem;
  font-size: 0.9375rem;
}

.field-input[aria-invalid='true'] {
  border-color: #c98b8b;
}

.field-error {
  color: #e0b4b4;
  font-size: 0.8125rem;
  margin: 0.45rem 0 0;
}

.notice {
  border-left: 2px solid var(--gold);
  padding-left: var(--space-2);
  color: var(--body);
  font-size: 0.875rem;
  margin-bottom: var(--space-3);
}

@media (max-width: 780px) {
  .reserve {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Implement `src/views/Reserve.tsx`**

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { getSuite } from '../data/suites';
import { useBooking } from '../state/BookingProvider';
import { PriceSummary } from '../components/PriceSummary';
import { quote } from '../lib/pricing';
import { ERROR_MESSAGES, validateBooking } from '../lib/validation';
import { generateCode } from '../lib/code';
import { isPersistent, loadReservations, saveReservation } from '../storage/reservations';
import { useReducedMotion } from '../motion/useReducedMotion';
import { fade } from '../motion/tokens';
import { pushView } from '../state/history';
import './Reserve.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Reserve({ suiteId }: { suiteId: string }) {
  const suite = getSuite(suiteId);
  const { state, dispatch, range } = useBooking();
  const reduced = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);

  if (!suite) {
    return (
      <section className="section" style={{ paddingTop: '8rem' }}>
        <h1 className="section-title">Suite not found</h1>
      </section>
    );
  }

  const nameInvalid = submitted && state.guestName.trim().length === 0;
  const emailInvalid = submitted && !EMAIL_RE.test(state.guestEmail);
  const bookingErrors = range
    ? validateBooking({ suite, range, guests: state.guests })
    : [];

  function goBackToDates() {
    const view = { name: 'suite' as const, suiteId: suite!.id };
    pushView(view);
    dispatch({ type: 'NAVIGATE', view });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    if (!range) return;
    if (state.guestName.trim().length === 0) return;
    if (!EMAIL_RE.test(state.guestEmail)) return;
    if (validateBooking({ suite: suite!, range, guests: state.guests }).length > 0) return;

    const taken = new Set(loadReservations().map((r) => r.code));
    const code = generateCode(taken);

    saveReservation({
      code,
      suiteId: suite!.id,
      range,
      guests: state.guests,
      guestName: state.guestName.trim(),
      guestEmail: state.guestEmail.trim(),
      total: quote(suite!, range).total,
      createdAt: new Date().toISOString(),
    });

    pushView({ name: 'confirmation', code });
    dispatch({ type: 'CONFIRM', code });
  }

  return (
    <motion.section
      className="reserve"
      initial={{ opacity: 0, x: reduced ? 0 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={fade(reduced)}
    >
      <div>
        <p className="label">{suite.name}</p>
        <h1 className="detail-title" style={{ fontSize: '2.25rem' }}>
          Complete your reservation
        </h1>

        {!range && (
          <p className="notice">
            Please select your dates before reserving.{' '}
            <button type="button" className="back-link" onClick={goBackToDates}>
              Choose dates
            </button>
          </p>
        )}

        {bookingErrors.length > 0 && (
          <div className="notice" role="alert">
            {bookingErrors.map((code) => (
              <p key={code} style={{ margin: '0.25rem 0' }}>
                {ERROR_MESSAGES[code]}
              </p>
            ))}
          </div>
        )}

        {!isPersistent() && (
          <p className="notice">
            Your browser is blocking storage, so this reservation will not survive a
            refresh. It will still complete for this visit.
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span className="field-label">Full name</span>
            <input
              className="field-input"
              type="text"
              value={state.guestName}
              aria-invalid={nameInvalid}
              aria-describedby={nameInvalid ? 'name-error' : undefined}
              onChange={(e) => dispatch({ type: 'SET_GUEST_NAME', value: e.target.value })}
            />
          </label>
          {nameInvalid && (
            <p className="field-error" id="name-error">
              Please enter your name.
            </p>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              value={state.guestEmail}
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? 'email-error' : undefined}
              onChange={(e) => dispatch({ type: 'SET_GUEST_EMAIL', value: e.target.value })}
            />
          </label>
          {emailInvalid && (
            <p className="field-error" id="email-error">
              Please enter a valid email address.
            </p>
          )}

          <button type="submit" className="cta">
            Confirm reservation
          </button>
        </form>
      </div>

      <aside>
        <p className="label">Summary</p>
        <PriceSummary suite={suite} range={range} />
      </aside>
    </motion.section>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- PriceSummary Reserve`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/PriceSummary.tsx src/views/Reserve.tsx src/views/Reserve.css src/components/__tests__/PriceSummary.test.tsx src/views/__tests__/Reserve.test.tsx
git commit -m "feat: add reserve form and animated price summary"
```

---

### Task 17: Confirmation view

**Files:**
- Create: `src/views/Confirmation.tsx`, `src/views/Confirmation.css`
- Test: `src/views/__tests__/Confirmation.test.tsx`

**Interfaces:**
- Consumes: `findReservation`; `getSuite`; `formatUSD`; `useReducedMotion`; `pushView`; `useBooking`
- Produces: `Confirmation` accepting `{ code: string }`

- [ ] **Step 1: Write the failing test**

```tsx
// src/views/__tests__/Confirmation.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Confirmation } from '../Confirmation';
import { BookingProvider } from '../../state/BookingProvider';
import { saveReservation } from '../../storage/reservations';

function renderConfirmation(code: string) {
  render(
    <BookingProvider>
      <Confirmation code={code} />
    </BookingProvider>
  );
}

describe('Confirmation', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows the reservation details for a known code', () => {
    saveReservation({
      code: 'MR-ABC234',
      suiteId: 'aurelia',
      range: { checkIn: '2026-08-17', checkOut: '2026-08-19' },
      guests: 2,
      guestName: 'A Guest',
      guestEmail: 'a@example.com',
      total: 1904,
      createdAt: '2026-07-26T10:00:00.000Z',
    });

    renderConfirmation('MR-ABC234');
    expect(screen.getByText('MR-ABC234')).toBeInTheDocument();
    expect(screen.getByText(/Aurelia Suite/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,904/)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown code', () => {
    renderConfirmation('MR-ZZZZZZ');
    expect(screen.getByRole('heading', { name: /couldn't find/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- Confirmation`
Expected: FAIL — cannot resolve `../Confirmation`.

- [ ] **Step 3: Implement `src/views/Confirmation.css`**

```css
.confirmation {
  max-width: 40rem;
  margin: 0 auto;
  padding: calc(var(--space-6) + 3rem) var(--space-4) var(--space-6);
  text-align: center;
}

.code {
  font-family: var(--font-display);
  font-size: clamp(2rem, 7vw, 3.5rem);
  color: var(--gold);
  letter-spacing: 0.06em;
  margin: var(--space-3) 0;
}

.rule {
  display: block;
  margin: var(--space-3) auto;
  overflow: visible;
}
```

- [ ] **Step 4: Implement `src/views/Confirmation.tsx`**

```tsx
import { motion } from 'motion/react';
import { findReservation } from '../storage/reservations';
import { getSuite } from '../data/suites';
import { formatUSD } from '../lib/pricing';
import { useBooking } from '../state/BookingProvider';
import { useReducedMotion } from '../motion/useReducedMotion';
import { pushView } from '../state/history';
import './Confirmation.css';

export function Confirmation({ code }: { code: string }) {
  const reservation = findReservation(code);
  const { dispatch } = useBooking();
  const reduced = useReducedMotion();

  function goHome() {
    const view = { name: 'landing' as const };
    pushView(view);
    dispatch({ type: 'NAVIGATE', view });
  }

  if (!reservation) {
    return (
      <section className="confirmation">
        <h1 className="section-title">We couldn&rsquo;t find that reservation</h1>
        <p className="story" style={{ margin: '0 auto' }}>
          The code {code} does not match anything saved in this browser. Reservations
          in this demo are stored locally, so they do not transfer between devices.
        </p>
        <button type="button" className="cta" onClick={goHome} style={{ marginTop: '2rem' }}>
          Back to the hotel
        </button>
      </section>
    );
  }

  const suite = getSuite(reservation.suiteId);

  return (
    <section className="confirmation">
      <p className="label">Reservation confirmed</p>

      {/* pathLength animation: layout animations do not support SVG. */}
      <svg className="rule" width="120" height="2" viewBox="0 0 120 2" aria-hidden="true">
        <motion.line
          x1="0"
          y1="1"
          x2="120"
          y2="1"
          stroke="var(--gold)"
          strokeWidth="1"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeInOut' }}
        />
      </svg>

      <motion.p
        className="code"
        initial={{ opacity: 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.35 }}
      >
        {reservation.code}
      </motion.p>

      <p className="story" style={{ margin: '0 auto' }}>
        {suite?.name} &middot; {reservation.range.checkIn} to {reservation.range.checkOut}
        <br />
        {reservation.guests} guest{reservation.guests === 1 ? '' : 's'} &middot;{' '}
        {formatUSD(reservation.total)} total
        <br />
        Held for {reservation.guestName}.
      </p>

      <button type="button" className="cta" onClick={goHome} style={{ marginTop: '2rem' }}>
        Back to the hotel
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- Confirmation`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add src/views/Confirmation.tsx src/views/Confirmation.css src/views/__tests__/Confirmation.test.tsx
git commit -m "feat: add confirmation view"
```

---

### Task 18: App wiring, focus management, final verification

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: everything above
- Produces: `App` — owns `LayoutGroup`, `AnimatePresence`, popstate subscription, and focus management

Focus management is explicit here because there is no router to do it. `AnimatePresence` must use the default `sync` mode: `mode="wait"` would unmount the card before the hero mounts and the morph would never run.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/App.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
  });

  it('renders the landing view at the root path', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Meridian Reserve/i);
  });

  it('navigates to a suite when its card is activated', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Aurelia Suite/i }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Aurelia Suite');
    expect(window.location.pathname).toBe('/suites/aurelia');
  });

  it('renders a deep-linked suite directly', () => {
    window.history.replaceState({}, '', '/suites/celeste');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Celeste Penthouse');
  });

  it('falls back to landing for a nonsense path', () => {
    window.history.replaceState({}, '', '/utter/nonsense');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Meridian Reserve/i);
  });

  it('responds to the browser back button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Aurelia Suite/i }));
    expect(window.location.pathname).toBe('/suites/aurelia');

    window.history.replaceState({}, '', '/');
    fireEvent.popState(window);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Meridian Reserve/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- App`
Expected: FAIL — App still renders the placeholder heading.

- [ ] **Step 3: Implement `src/App.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig } from 'motion/react';
import { BookingProvider, useBooking } from './state/BookingProvider';
import { onPopState, replaceView, parsePath } from './state/history';
import { Landing } from './views/Landing';
import { SuiteDetail } from './views/SuiteDetail';
import { Reserve } from './views/Reserve';
import { Confirmation } from './views/Confirmation';

function Router() {
  const { state, dispatch } = useBooking();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Keep the initial entry addressable so the first Back press behaves.
  useEffect(() => {
    replaceView(parsePath(window.location.pathname));
  }, []);

  useEffect(
    () => onPopState((view) => dispatch({ type: 'NAVIGATE', view })),
    [dispatch]
  );

  // No router means nothing moves focus for us. Move it to the new view's
  // heading on every change, but never on first paint.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [state.view]);

  const { view } = state;

  return (
    <main ref={mainRef}>
      {/*
        Default (sync) mode is required: mode="wait" unmounts the outgoing view
        before the incoming one mounts, which prevents the layoutId morph.
      */}
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {view.name === 'landing' && <Landing key="landing" />}
          {view.name === 'suite' && <SuiteDetail key={`suite-${view.suiteId}`} suiteId={view.suiteId} />}
          {view.name === 'reserve' && <Reserve key={`reserve-${view.suiteId}`} suiteId={view.suiteId} />}
          {view.name === 'confirmation' && <Confirmation key={`conf-${view.code}`} code={view.code} />}
        </AnimatePresence>
      </LayoutGroup>
    </main>
  );
}

export default function App() {
  return (
    // reducedMotion="user" is a second line of defence: it suppresses
    // transform animations app-wide when the OS preference is set, catching any
    // component that forgot to branch on useReducedMotion itself.
    <MotionConfig reducedMotion="user">
      <BookingProvider>
        <Router />
      </BookingProvider>
    </MotionConfig>
  );
}
```

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS — every suite green.

Run: `npm run build`
Expected: type-check clean, build succeeds.

- [ ] **Step 5: Manual verification checklist**

Run `npm run dev` and confirm each of these. Animation correctness cannot be asserted in jsdom, so this list is the real gate:

- [ ] Hero title rises line by line on first load
- [ ] Hero image parallaxes while scrolling
- [ ] Suite cards stagger in as the grid enters the viewport
- [ ] Clicking a suite morphs the card image into the detail hero with no flash or jump
- [ ] Pressing Back reverses the morph rather than cutting
- [ ] Deep link `/suites/celeste` loads straight into that suite
- [ ] `/utter/nonsense` shows the landing page, not an error
- [ ] Calendar is fully operable by keyboard: arrows, Home/End, PageUp/PageDown, Enter
- [ ] Unavailable dates are struck through and refuse selection
- [ ] Raising guests to 3 animates the two-guest suites out of the grid
- [ ] Choosing dates that a suite cannot honour leaves it visible but dimmed and labelled
- [ ] Price total counts up when the date range changes
- [ ] Submitting an empty form shows both field errors and moves nothing
- [ ] Confirmation draws the gold rule and reveals the code
- [ ] Reloading the confirmation URL still finds the reservation
- [ ] Enable "Reduce motion" in macOS System Settings, reload: no parallax, no morph animation, no counting, and every screen still fully usable
- [ ] Narrow the window to 380px: layout holds, nothing overflows horizontally

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat: wire views with shared layout and focus management"
```

---

## Self-Review

**Spec coverage.** Each spec requirement maps to a task:

| Spec requirement | Task |
|---|---|
| Landing: hero, 6 suites, story section | 14 |
| Date/guest selection, calendar, validation | 12, 13, 7 |
| Suite detail via morph, gallery, rate, amenities | 15 |
| Deterministic mock availability | 5 |
| Reserve step, validated name/email, live summary | 16 |
| Confirmation with code, persisted | 8, 17 |
| `prefers-reduced-motion` with static fallbacks | 2, and every animated task |
| Keyboard navigation | 12, 18 |
| Responsive desktop-first with mobile | 14, 15, 16 (media queries) |
| Pricing: weekend uplift then tax | 6 |
| Reservation code format | 8 |
| Unsuitable-suite presentation split | 13, 14 |
| Error handling: storage, corrupt JSON, deep links, images | 8, 11, 15, 16, 17, 18 |
| Focus management | 18 |
| Contrast tokens | 2 |

No spec requirement is unassigned.

**Placeholder scan.** No `TBD`, `TODO`, "add error handling", or "similar to Task N" instructions. Every code step carries real code.

**Type consistency.** Names verified across tasks: `isSuiteAvailable`/`isNightAvailable`/`unavailableNights` (5) used in 7, 13, 14. `quote`/`formatUSD`/`Quote` (6) used in 15, 16, 17. `validateBooking`/`ERROR_MESSAGES`/`BookingError` (7) used in 16. `generateCode` (8) used in 16. `saveReservation`/`loadReservations`/`findReservation`/`isPersistent` (8) used in 16, 17. `View`/`parsePath`/`viewToPath`/`pushView`/`replaceView`/`onPopState` (9) used in 10, 14, 15, 16, 17, 18. `BookingState`/`BookingAction`/`bookingReducer`/`initialBookingState` (10) used in provider and 18. `useBooking` returning `{ state, dispatch, range }` (10) consumed in 14, 15, 16, 17, 18. `SmartImage` props (11) used in 13, 14, 15. `morphTransition`/`staggerParent`/`riseIn`/`fade`/`DURATION` (2) used in 13, 14, 15, 16, 17. `layoutId` template `suite-image-${suite.id}` is byte-identical between Task 13 and Task 15 — verified, since a mismatch here silently disables the morph with no error.

**Known risk.** The `layoutId` morph and the roving-tabindex focus behaviour cannot be verified by unit tests in jsdom. Both are covered by the Task 18 manual checklist, which is a gate rather than a suggestion.
