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
