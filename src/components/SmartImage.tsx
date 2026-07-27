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
  const [failed, setFailed] = useState(false);

  if (failed) {
    // role="img" with aria-label keeps the alternative text available to
    // assistive tech even though there is no longer an <img> element.
    return (
      <div
        role="img"
        aria-label={alt}
        className={`smart-image-fallback ${className ?? ''}`}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={`smart-image ${className ?? ''}`}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
