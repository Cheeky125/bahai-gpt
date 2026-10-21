// The Phoenix fire mark (option D from the design canvas).
export default function Logo({ size = 34, glow = false, id = "p" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={glow ? undefined : "img"} aria-hidden={glow ? "true" : undefined} aria-label={glow ? undefined : "Phoenix"}>
      <defs>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#F3701E" style={{ stopOpacity: "var(--glow)" }} />
          <stop offset="1" stopColor="#F3701E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#FFC93C" /><stop offset="0.45" stopColor="#F3701E" /><stop offset="1" stopColor="#B5170F" />
        </linearGradient>
        <linearGradient id={`${id}i`} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0" stopColor="#FFE08A" /><stop offset="1" stopColor="#F79A1E" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#FFF1C2" /><stop offset="0.6" stopColor="#FFB627" /><stop offset="1" stopColor="#E4531A" />
        </linearGradient>
      </defs>
      {glow && <circle cx="50" cy="52" r="48" fill={`url(#${id}g)`} />}
      <path d="M50 58C38 54 22 46 8 22C16 28 22 30 26 30C20 24 18 16 20 8C26 20 34 26 40 30C38 22 40 14 44 8C46 22 48 34 50 44Z" fill={`url(#${id}w)`} />
      <path d="M50 58C62 54 78 46 92 22C84 28 78 30 74 30C80 24 82 16 80 8C74 20 66 26 60 30C62 22 60 14 56 8C54 22 52 34 50 44Z" fill={`url(#${id}w)`} />
      <path d="M50 58C40 54 28 46 20 32C28 38 34 40 38 40C34 34 34 28 36 22C40 32 46 38 50 46Z" fill={`url(#${id}i)`} />
      <path d="M50 58C60 54 72 46 80 32C72 38 66 40 62 40C66 34 66 28 64 22C60 32 54 38 50 46Z" fill={`url(#${id}i)`} />
      <path d="M50 72C44 80 40 86 34 96C42 90 46 88 50 84C54 88 58 90 66 96C60 86 56 80 50 72Z" fill={`url(#${id}w)`} />
      <path d="M50 76C48 84 49 90 50 98C51 90 52 84 50 76Z" fill="#FFC93C" />
      <path d="M50 30C56 38 57 50 54 62C53 68 51 72 50 76C49 72 47 68 46 62C43 50 44 38 50 30Z" fill={`url(#${id}b)`} />
      <path d="M50 22C48 16 50 10 54 6C53 12 54 16 52 22Z" fill="#F3701E" />
      <path d="M50 22C53 22 55 25 54 28C53 30 51 31 50 31C49 31 47 30 46 28C45 25 47 22 50 22Z" fill="#F79A1E" />
    </svg>
  );
}
