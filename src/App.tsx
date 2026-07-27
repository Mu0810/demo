import { MotionConfig } from 'motion/react';
import { BookingProvider } from './state/BookingProvider';
import { Landing } from './views/Landing';

/**
 * EARLY PREVIEW SLICE — Task 18 replaces this.
 *
 * Mounts only the Landing view so the work so far is visible in a browser.
 * Deliberately absent until Task 18: the AnimatePresence/LayoutGroup wrapper
 * that the card-to-hero morph needs, the popstate subscription, focus
 * management, and the other three views. Selecting a suite therefore pushes a
 * URL and updates state but renders nothing new yet.
 *
 * reducedMotion="user" is here from the start: it suppresses transform
 * animations app-wide when the OS preference is set, so the preview honours it
 * even before every component has been audited individually.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BookingProvider>
        <main>
          <Landing />
        </main>
      </BookingProvider>
    </MotionConfig>
  );
}
