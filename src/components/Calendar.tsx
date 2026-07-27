import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
// Note: toISO is deliberately NOT imported — Calendar never calls it, and
// `noUnusedLocals` turns an unused import into a build failure (TS6133).
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
   * This must be a layout effect, not requestAnimationFrame or queueMicrotask.
   * React flushes layout effects synchronously as part of the commit, so focus
   * lands inside the same act() scope that dispatched the key event. rAF only
   * runs on jsdom's ~16ms visual clock and a microtask needs the stack to
   * unwind, so both leave focus on the previous cell for the remainder of a
   * synchronous test tick — and, in a real browser, for a frame of visible lag.
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

  const leadingBlanks = mondayIndex(cursor);

  function isInRange(iso: string): boolean {
    if (!checkIn) return false;
    if (!checkOut) return iso === checkIn;
    return iso >= checkIn && iso <= checkOut;
  }

  function isSelectable(iso: string): boolean {
    if (iso < todayIso) return false;
    return isNightAvailable(suiteId, iso);
  }

  function move(from: string, delta: number) {
    const next = addDays(from, delta);
    // A zero-delta move (Home on a Monday, End on a Sunday) would leave the
    // pending-focus flag armed with no commit to consume it.
    if (next === from) return;
    pendingFocus.current = true;
    setFocusDate(next);
    if (next.slice(0, 7) !== cursor.slice(0, 7)) {
      setCursor(startOfMonth(next));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>, iso: string) {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); move(iso, 1); break;
      case 'ArrowLeft': e.preventDefault(); move(iso, -1); break;
      case 'ArrowDown': e.preventDefault(); move(iso, 7); break;
      case 'ArrowUp': e.preventDefault(); move(iso, -7); break;
      case 'Home': e.preventDefault(); move(iso, -mondayIndex(iso)); break;
      case 'End': e.preventDefault(); move(iso, 6 - mondayIndex(iso)); break;
      case 'PageDown': e.preventDefault(); move(iso, daysInMonth(iso)); break;
      case 'PageUp': e.preventDefault(); move(iso, -daysInMonth(addDays(startOfMonth(iso), -1))); break;
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
          onClick={() => setCursor(startOfMonth(addDays(cursor, -1)))}
        >
          &larr;
        </button>
        <span className="calendar-caption">{monthLabel(cursor)}</span>
        <button
          type="button"
          className="calendar-nav"
          aria-label="Next month"
          onClick={() => setCursor(startOfMonth(addDays(cursor, daysInMonth(cursor))))}
        >
          &rarr;
        </button>
      </div>

      <div className="calendar-grid" role="grid" aria-label="Choose your dates" ref={gridRef}>
        {DOW.map((d) => (
          <div key={d} className="calendar-dow" role="columnheader" aria-label={d}>
            {d.slice(0, 1)}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} className="calendar-empty" role="presentation" />
        ))}

        {days.map((iso) => {
          const selectable = isSelectable(iso);
          const selected = isInRange(iso);
          const edge = iso === checkIn || iso === checkOut;
          const dayNum = Number(iso.slice(8, 10));
          const label = `${dayNum} ${monthLabel(iso)}${selectable ? '' : ' — unavailable'}`;

          return (
            <div
              key={iso}
              role="gridcell"
              data-date={iso}
              aria-label={label}
              aria-selected={selected}
              aria-disabled={!selectable}
              tabIndex={iso === focusDate ? 0 : -1}
              className={`calendar-day${edge ? ' is-edge' : ''}`}
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
