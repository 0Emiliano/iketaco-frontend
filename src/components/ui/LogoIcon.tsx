interface LogoIconProps {
  size?: number
  className?: string
}

export default function LogoIcon({ size = 40, className = '' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer shield/book shape */}
      <path
        d="M40 4 L72 14 L72 46 Q72 66 40 76 Q8 66 8 46 L8 14 Z"
        fill="#1A1A1A"
        stroke="#F28500"
        strokeWidth="2.5"
      />
      {/* Book spine lines */}
      <line x1="36" y1="6" x2="36" y2="74" stroke="#F28500" strokeWidth="1" opacity="0.4" />
      <line x1="44" y1="6" x2="44" y2="74" stroke="#F28500" strokeWidth="1" opacity="0.4" />
      {/* Bull silhouette */}
      {/* Body */}
      <ellipse cx="40" cy="48" rx="14" ry="10" fill="#F28500" />
      {/* Head */}
      <ellipse cx="40" cy="36" rx="10" ry="9" fill="#F28500" />
      {/* Horns */}
      <path d="M30 33 Q22 22 26 18 Q30 28 32 30 Z" fill="#F28500" />
      <path d="M50 33 Q58 22 54 18 Q50 28 48 30 Z" fill="#F28500" />
      {/* Eyes */}
      <circle cx="36" cy="35" r="1.5" fill="#1A1A1A" />
      <circle cx="44" cy="35" r="1.5" fill="#1A1A1A" />
      {/* Nose */}
      <ellipse cx="40" cy="41" rx="4" ry="2.5" fill="#1A1A1A" opacity="0.6" />
      <circle cx="38" cy="41" r="1" fill="#F28500" opacity="0.8" />
      <circle cx="42" cy="41" r="1" fill="#F28500" opacity="0.8" />
      {/* Legs */}
      <rect x="29" y="56" width="5" height="8" rx="2" fill="#F28500" />
      <rect x="36" y="56" width="5" height="8" rx="2" fill="#F28500" />
      <rect x="43" y="56" width="5" height="8" rx="2" fill="#F28500" />
      {/* Bottom text band */}
      <rect x="12" y="64" width="56" height="8" rx="2" fill="#F28500" opacity="0.15" />
    </svg>
  )
}
