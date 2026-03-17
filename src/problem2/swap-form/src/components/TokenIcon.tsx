import { useState } from "react";
import styles from "./TokenIcon.module.css";

interface TokenIconProps {
  /** Token symbol — used for icon URL and fallback initials */
  symbol: string;
  /** Icon dimension in pixels (default: 32) */
  size?: number;
}

const ICON_BASE_URL =
  "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

// Derive a deterministic HSL color from a string (used for fallback circles)
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

/**
 * Renders a token icon from the Switcheo CDN.
 * Falls back to a colored circle with 2-letter initials on 404.
 */
export function TokenIcon({ symbol, size = 32 }: TokenIconProps) {
  // State to handle error when token icon is not found
  const [hasError, setHasError] = useState(false);

  // Get initials of the token symbol
  const initials = symbol.slice(0, 2).toUpperCase();

  // If token icon is not found, display initials with hash color
  if (hasError) {
    return (
      <div
        className={styles.fallback}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          backgroundColor: hashColor(symbol),
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      className={styles.icon}
      src={`${ICON_BASE_URL}/${symbol}.svg`}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setHasError(true)}
    />
  );
}
