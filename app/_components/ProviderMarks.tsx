/* Small provider brand glyphs — used wherever a provider is referenced. */

export function ClaudeMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#D97757" aria-hidden="true">
      <path d="M12 1.5 13.05 8.4 18.6 4.2 15.1 10.05 22 9 16.2 12 22 15 15.1 13.95 18.6 19.8 13.05 15.6 12 22.5 10.95 15.6 5.4 19.8 8.9 13.95 2 15 7.8 12 2 9 8.9 10.05 5.4 4.2 10.95 8.4 12 1.5Z" />
    </svg>
  );
}

export function GeminiMark({ size = 16 }: { size?: number }) {
  const id = `gem-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285F4" />
          <stop offset=".5" stopColor="#9b72cb" />
          <stop offset="1" stopColor="#d96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 2c.45 5.2 4.8 9.55 10 10-5.2.45-9.55 4.8-10 10-.45-5.2-4.8-9.55-10-10C7.2 11.55 11.55 7.2 12 2Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
