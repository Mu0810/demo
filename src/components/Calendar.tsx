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
