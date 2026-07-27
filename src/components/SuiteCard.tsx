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
