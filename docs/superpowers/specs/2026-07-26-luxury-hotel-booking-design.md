# Meridian Reserve — Booking Flow Design

**Date:** 2026-07-26
**Status:** Approved
**Phase:** 1 of 2

## Purpose

A richly animated luxury hotel booking experience. The app is a functional
booking flow, not an animation showcase: motion serves comprehension and
feedback, and every animated state is fully usable without animation.

This is a **demo/portfolio piece**. There is no backend, no authentication, and
no payment processing. Suite data is static, availability is computed, and
reservations persist in the browser.

## Scope

### In scope

- Landing page: hero, collection of 6 suites, story/amenities section
- Date and guest selection: custom calendar, range picking, full validation
- Suite detail reached by a shared-element morph from its card
- Deterministic mock availability
- Reserve step: guest name and email with validation, live price summary
- Confirmation: reservation code, persisted to `localStorage`
- `prefers-reduced-motion` honoured throughout, with static equivalents
- Keyboard navigation
- Responsive, desktop-first with genuine mobile support

### Explicitly out of scope

| Excluded | Reason |
|---|---|
| Payments, accounts, real availability, emails | Requires the "real product" build, declined |
| Guest dashboard, room service, spa booking | Phase 2, separate spec |
| Multi-room bookings, promo codes, loyalty tiers | No payoff for a demo |

Phase 2 (guest dashboard) is deliberately **not** designed here. Designing it
now would distort Phase 1 around guesses.

## Decisions

| Decision | Choice |
|---|---|
| App type | Functional app, richly animated |
| Build type | Demo / portfolio piece |
| Stack | Vite + React + TypeScript |
| Animation | Motion (framer-motion) |
| Smooth scroll | Lenis |
| Structure | Cinematic landing that morphs into the booking flow |
| Routing | Single component tree + manual History API sync |
| Visual direction | Midnight Editorial |

### Why single-tree routing instead of a router

The signature effect is a `layoutId` shared-element morph from suite card to
detail hero. Per the [Motion layout animation
docs](https://motion.dev/docs/react-layout-animations), the morph requires both
elements to be present in the same tree during the transition, which is what
`AnimatePresence` provides.

The conventional React Router transition pattern uses `AnimatePresence
mode="wait"`, which unmounts the outgoing view before mounting the incoming
one — precisely the condition under which a shared-element morph cannot occur.
Putting a router boundary through the middle of the app's defining effect was
judged the wrong risk.

A single tree keeps the morph reliable. A thin history layer supplies deep links
and back/forward support, at the cost of owning `popstate` handling directly.

## Visual direction: Midnight Editorial

| Token | Value |
|---|---|
| Background | `#0A0A0B` |
| Panel | `#16161A` |
| Accent (gold) | `#C9A227` |
| Primary text | `#F2EFE9` |
| Body text | `#CFCBC4` |
| Caption | `#9C978F` |
| Display type | Didot / Bodoni 72 / Bodoni MT / Garamond, serif |
| UI type | Helvetica Neue / Inter, sans-serif |

Character: near-black canvas, antique gold, high-contrast serif display.
Photography dominates; the interface recedes. Motion is slow and cinematic —
long dissolves, 700–900ms eases, parallax drift.

### Contrast (measured, WCAG 2.1)

| Pair | Ratio | AA normal (4.5:1) |
|---|---|---|
| Off-white on near-black | 17.24:1 | Pass |
| Body on near-black | 12.24:1 | Pass |
| Gold on near-black | 8.18:1 | Pass |
| Gold on panel | 7.46:1 | Pass |
| Caption on near-black | 6.82:1 | Pass |

All pairs pass AA for normal text. Full WCAG conformance still requires manual
assistive-technology testing and expert review; measured contrast alone does not
establish it.

## Architecture

```
src/
  data/
    suites.ts            6 suites, typed, static
    availability.ts      pure: (suiteId, range) -> boolean
  state/
    bookingReducer.ts    dates, guests, suite, guest details
    useBooking.ts        context hook
    history.ts           URL <-> view state sync
  storage/
    reservations.ts      localStorage wrapper, try/catch guarded
  motion/
    transitions.ts       shared easing/duration tokens
    useReducedMotion.ts  motion kill-switch
  views/
    Landing/  SuiteDetail/  Reserve/  Confirmation/
  components/
    Calendar/  SuiteCard/  GuestPicker/  PriceSummary/
  App.tsx                single tree, LayoutGroup + AnimatePresence
```

### Boundaries that matter

**`availability.ts`** — pure, no React, no state. The only real business logic,
isolated so it is directly testable.

**`motion/transitions.ts`** — every duration and easing as a named token. "Slow
cinematic" collapses if one transition runs at 300ms and its neighbour at 800ms.
Single file tunes the whole feel.

**`useReducedMotion.ts`** — one switch the entire app reads, rather than
scattered media queries.

**`App.tsx`** — the only owner of `LayoutGroup` and `AnimatePresence`. The morph
depends on card and hero sharing that tree; moving it lower silently breaks the
effect.

## Data model

```ts
type Suite = {
  id: string;              // 'aurelia' — also the URL slug
  name: string;
  rate: number;            // nightly, whole currency units
  maxGuests: number;
  size: number;            // m²
  description: string;
  amenities: string[];
  hero: string;
  gallery: string[];       // 3 images
};

type DateRange = { checkIn: string; checkOut: string };  // ISO YYYY-MM-DD

type Reservation = {
  code: string;            // 'MR-4K7X9Q'
  suiteId: string;
  range: DateRange;
  guests: number;
  guestName: string;
  guestEmail: string;
  total: number;
  createdAt: string;
};
```

### Suites

| Suite | Rate | Max guests |
|---|---|---|
| Atrium Loft | 760 | 2 |
| Aurelia Suite | 850 | 2 |
| Garden Pavilion | 980 | 3 |
| The Meridian | 1150 | 2 |
| The Observatory | 1850 | 4 |
| Celeste Penthouse | 2400 | 4 |

Spread across price and occupancy so the guest filter genuinely excludes options.

### Availability

Deterministic, never random. A hash of `suiteId + date` blocks roughly one night
in seven; Celeste Penthouse is additionally closed every Sunday.

Determinism is required for two reasons: the same date yields the same result on
every reload so the demo never contradicts itself, and the function is unit
testable. Random availability would look identical on screen and be untestable.

### Validation

Enforced in the reducer, not the UI:

- Check-in not in the past; check-out after check-in
- Between 1 and 14 nights
- No more than 12 months ahead
- Guests within the suite maximum
- Every night in the range available for that suite

### How unsuitable suites are presented

The two exclusion reasons behave differently on purpose, because they mean
different things to the guest:

**Too small for the party size** — the suite is *removed* from the grid and
animates out. It is not an option at any date, so leaving it visible is noise.

**Unavailable for the chosen dates** — the suite *stays* in the grid, dimmed,
labelled with the reason, and not selectable. Removing it would imply the suite
does not exist; the guest should be able to see it and shift their dates.

Both states are conveyed by text as well as opacity, never by dimming alone.

### Pricing

Currency is **USD**, formatted with `Intl.NumberFormat('en-US')`, no decimal
places (all rates are whole dollars).

Calculation order is fixed and applies in this sequence:

1. Per night: `rate`, multiplied by **1.15** if that night is a Friday or Saturday
2. Subtotal: sum of all nightly amounts
3. Tax: **12% of the subtotal**, i.e. applied *after* the weekend uplift
4. Total: subtotal + tax, rounded to the nearest whole dollar

A night is attributed to the day it *begins*. A Friday check-in for one night
carries the uplift; a Saturday check-out does not add one.

The weekend uplift is a deliberate small addition: it makes shifting dates by one
day visibly change the total, giving the animated price counter something real to
express. Without it the counter only moves when the night count changes.

### Reservation codes

Format: `MR-` followed by 6 characters drawn from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`
— digits `0`/`1` and letters `I`/`O` excluded, since those four are the pairs
actually confused when a code is read aloud or retyped. Generated client-side; collisions are checked against existing stored
reservations and regenerated on conflict.

## Views and motion

```
/                        Landing
/suites/aurelia          Suite detail   (morph target)
/suites/aurelia/reserve  Reserve
/reservation/MR-4K7X9Q   Confirmation
```

| Moment | Motion | Timing |
|---|---|---|
| First load | Hero settles from 1.08 scale; display type reveals line by line behind a mask | 1400ms, 80ms stagger |
| Scroll | Hero parallax (Lenis + `useScroll`); sections rise and fade | 700ms |
| Suite grid | Cards stagger in on viewport entry | 90ms stagger |
| Card → detail | `layoutId` morph, card image becomes full-bleed hero | 800ms, custom bezier |
| Detail settle | Spec list and gallery stagger in after morph lands | 250ms delay |
| Calendar | Month slides; day cells stagger; range fills with gold sweep | 400ms |
| Price change | Total counts up/down | 500ms |
| Confirmation | Gold rule draws; reservation code types on | 900ms |
| Back | Reverse morph, hero collapses into card | 800ms |

### Technical guards

Each addresses a documented failure mode:

1. **`layout="position"` on the morphing image.** It changes aspect ratio between
   card and hero; a full layout animation stretches content instead of recropping.
2. **`layoutScroll` on scrollable containers, `layoutRoot` on the fixed reserve
   bar.** Without these, Motion measures against the wrong offset and elements
   animate to visibly wrong positions.
3. **`borderRadius` set via `style`, never a CSS class.** Motion only corrects
   scale distortion on radius when it controls the value.
4. **Gold rules animated with `pathLength`, not layout animations.** Layout
   animations do not support SVG.

### The image-swap trap

The card and hero must resolve to the **same image URL**. If the card requests a
600px-wide image and the hero a 1600px one, the browser swaps sources mid-morph
and flashes in the middle of the signature effect.

Mitigation: preload the hero at the card's `src` on hover; cross-fade the
higher-resolution version in only after the morph completes.

### Reduced motion

Not a bolted-on downgrade. When `prefers-reduced-motion` is set:

- The morph becomes an instant view swap
- Parallax is disabled
- Staggers collapse to zero
- The price sets rather than counts

Every view must be fully usable in this mode.

## Error handling

| Failure | Behaviour |
|---|---|
| `localStorage` throws (Safari private mode) | Catch, fall back to in-memory; reservation still completes for the session |
| Corrupt stored JSON | Validated on read, discarded |
| Unknown suite slug | "Suite not found" state |
| `/reserve` without dates | Falls back to detail view |
| Reservation code not in storage | "Couldn't find it" state |
| Image load failure | Styled gradient fallback via `onError` |

No failure mode may produce a white screen. Image fallback matters
disproportionately here: photography carries the entire visual design, so a
broken-image icon is a design failure, not a cosmetic one.

## Accessibility

**Calendar** — `role="grid"`, arrow-key day navigation, Enter to select, Escape
to close, `aria-selected` on range members, live region announcing the selected
range. Unavailable dates are `aria-disabled` and distinguished by more than
colour.

**Focus management** — explicit, because no router moves focus for us. On each
view change focus moves to the new view's heading, and must never be stranded on
an element `AnimatePresence` is removing. Focus rings are gold at 8.18:1.

**Forms** — real labels, `aria-invalid`, `aria-describedby` for error text,
errors announced rather than only coloured.

## Testing

**Vitest**, over the pure logic where correctness lives:

- Availability, including the Sunday penthouse rule
- Pricing, including weekend uplift and tax
- All validation rules
- URL parse/serialise round-trips
- Storage wrapper, including the throwing-Safari path

**React Testing Library** for calendar keyboard navigation and form validation.

**Not tested:** animation timings. Such assertions are brittle and prove little.
Instead, tests assert that reduced-motion mode produces no transform-based
animation and that view state transitions correctly.

**Manual verification:** morph in both directions, deep links, back/forward,
reduced motion, mobile.

## Imagery

Full imagery requires 24 URLs (hero plus three gallery images per suite).

**Resolved:** 34 Unsplash photo IDs have been verified to return HTTP 200 at
`w=1600&q=80`, giving the 24 needed plus 10 spare. The verified set is recorded
in the implementation plan and assigned to suites there.

Images are loaded from `images.unsplash.com` at request time. This is a
deliberate trade-off for a demo: no asset pipeline, but the app depends on an
external host. The `onError` gradient fallback in the error-handling table is
what keeps that dependency from becoming a visible failure.
