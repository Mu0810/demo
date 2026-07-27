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
