import { Fragment, useMemo, useRef } from 'react';
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
              <Fragment key={line}>
                {/* A word separator in the TEXT layer, which the visual line
                    split does not provide. Each line is its own block, so
                    without this the h1's textContent — and therefore its
                    accessible name, in-page search and copy-paste — reads
                    "MeridianReserve". Whitespace between block boxes renders
                    nothing, so the two-line composition is unchanged. */}
                {i > 0 && ' '}
                <span className="hero-line">
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
              </Fragment>
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
