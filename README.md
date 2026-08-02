# Meridian Reserve

A luxury hotel suite booking flow: browse six suites, pick dates and guests, get a priced quote, and
receive a confirmation code you can retrieve later.

React 19 + TypeScript on Vite, with no backend, no router, and no UI library. Roughly 3,000 lines of
source covered by **17 test files / ~1,500 lines of tests**, because most of the difficulty here is
arithmetic and date handling, which is exactly the kind of thing that breaks quietly.

---

## Contents

- [Running it](#running-it)
- [Architecture](#architecture)
- [Decisions worth explaining](#decisions-worth-explaining)
- [Booking rules](#booking-rules)
- [Tech stack](#tech-stack)
- [Testing](#testing)
- [Known limitations](#known-limitations)

---

## Running it

```bash
npm install
npm run dev        # Vite dev server
npm test           # vitest --run
npm run build      # tsc --noEmit && vite build
```

No environment variables, no database, no API keys. Reservations persist to `localStorage`.

---

## Architecture

```
src/
├── lib/                    pure logic — no React, no I/O, individually unit-tested
│   ├── pricing.ts          integer-cent money maths and quote breakdown
│   ├── dates.ts            UTC-anchored date handling and night counting
│   ├── availability.ts     deterministic availability via a stable hash
│   ├── validation.ts       booking rules as a typed error union
│   └── code.ts             confirmation-code generation
├── state/
│   ├── bookingReducer.ts   the booking state machine
│   ├── BookingProvider.tsx context wiring
│   └── history.ts          URL <-> view mapping (there is no router)
├── storage/
│   └── reservations.ts     localStorage with an in-memory fallback
├── motion/
│   ├── useReducedMotion.ts single source of truth for "should we animate"
│   ├── useLenis.ts         smooth scrolling
│   └── tokens.ts           shared durations and easings
├── components/             Calendar, GuestPicker, SuiteCard, SmartImage
├── data/suites.ts          the six suites
└── styles/                 design tokens and global CSS
```

The shape is deliberate: everything that can be a pure function is one, in `lib/`. That is what makes
the pricing and date logic testable without rendering anything.

---

## Decisions worth explaining

**Money is integer cents, not floats.** `rate * 1.15` is not exact in binary:
`850 * 1.15 === 977.4999999999999`, which `Math.round` takes *down* to 977 — undercharging by a
dollar. 850 is the Aurelia Suite's actual nightly rate, so this is a real bug, not a hypothetical.
Rates are whole dollars, so `rate * 115` is exact.

**Rate multipliers are derived, never written twice.** `WEEKEND_MULTIPLIER` and `TAX_RATE` are
computed from the same integer constants used to charge (`115/100`, `12/100` — both exact in
IEEE-754). The UI therefore cannot advertise a rate different from the one applied.

**The breakdown always adds up.** `total` is derived as `subtotal + tax` rather than recomputed from
cents, so the figures a guest reads sum to the figure they are charged. Order is fixed: per-night
uplift, then subtotal, then tax on the uplifted subtotal — taxing first would understate the total.

**Dates are anchored to 12:00 UTC.** Using midnight lets a timezone offset push a date onto the
previous or next day, which silently corrupts night counts. Noon UTC is far from either boundary.

**Availability is a stable hash, not a random roll.** `availability.ts` uses FNV-1a: short,
dependency-free, and identical across runs and platforms. Randomness would let a suite be available,
then unavailable after a reload, and the app would contradict itself.

**Confirmation codes omit `0`, `1`, `I`, and `O`.** Those are the characters people actually misread
when retyping a code. The remaining 32-character alphabet gives about 1.07 billion six-character
codes; the collision-retry loop is a correctness guarantee rather than an optimisation, and is bounded
so it cannot hang.

**Storage degrades instead of lying.** If `localStorage` is unusable, reservations are kept in memory
so the session still works. That fallback holds *only* the records that failed to persist — it is
deliberately not a mirror of everything saved, because a mirror outlives the store it shadows and
would keep reporting reservations the guest can no longer retrieve.

**URL parsing never throws.** With no router, a stale or hand-edited URL has nothing to catch it, so
`history.ts` degrades to the landing page instead of blanking the app.

**One source of truth for motion.** Every animated component reads `useReducedMotion()` rather than
querying the media query itself, so `prefers-reduced-motion` cannot be honoured inconsistently.

---

## Booking rules

Validation returns a typed union (`BookingError`) rather than strings, so a caller cannot mishandle a
case the compiler knows about:

| Error | Meaning |
| --- | --- |
| `PAST_CHECKIN` | check-in is before today |
| `CHECKOUT_NOT_AFTER_CHECKIN` | zero-or-negative-length stay |
| `TOO_MANY_NIGHTS` | more than 14 nights |
| `TOO_FAR_AHEAD` | more than 12 months out |
| `TOO_MANY_GUESTS` | exceeds the suite's capacity |
| `SUITE_UNAVAILABLE` | unavailable for that range |

Weekend nights are charged at a 1.15× uplift; tax is 12%.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript, plain CSS with design tokens |
| Build | Vite 8 |
| Animation | Motion, Lenis for smooth scroll |
| Routing | none — a hand-rolled `history.ts` view mapping |
| Persistence | `localStorage`, with an in-memory fallback |
| Tests | Vitest, Testing Library, jsdom |

No component library. The calendar, guest picker, and cards are all hand-built.

---

## Testing

```bash
npm test
```

17 suites. The pure modules in `lib/` carry the heaviest coverage — pricing, dates, availability,
validation, and code generation — alongside the reducer, view history, storage, the reduced-motion
hook, and each component.

The split exists so money and date behaviour can be asserted directly, without mounting a tree or
simulating clicks.

---

## Known limitations

1. **No backend.** Everything is client-side; reservations live in `localStorage` and are not shared
   across devices or browsers.
2. **Availability is synthetic.** It is a deterministic hash of suite and date, not real inventory.
   Stable and plausible, but not authoritative.
3. **No payment.** The quote is calculated and displayed; nothing is charged.
4. **Confirmation codes are only unique locally.** Collision checks run against codes in this
   browser's storage, which is sufficient without a server but would not be with one.
5. **`docs/` reflects the original spec and plan** and may drift from the implementation.
