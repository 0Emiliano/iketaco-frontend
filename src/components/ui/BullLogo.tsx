interface BullLogoProps {
  size?: number
  className?: string
}

export default function BullLogo({ size = 40, className = '' }: BullLogoProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
    >
      {/* Shield border */}
      <polygon
        points="100,110 400,110 400,350 250,420 100,350"
        fill="rgba(0,0,0,0.55)"
      />
      {/* Shield inner — transparent so the header bg shows through */}
      <polygon
        points="115,125 385,125 385,340 250,402 115,340"
        fill="none"
      />

      {/* Bull neck dark shading */}
      <polygon
        points="250,220 150,380 350,380"
        fill="rgba(0,0,0,0.55)"
      />

      {/* Bull head & horns */}
      <path
        d="M 250,155 L 210,140 L 110,240 L 130,255 L 180,210 L 185,185
           L 205,195 L 195,275 L 215,320 L 235,325 L 235,340 L 250,350
           L 265,340 L 265,325 L 285,320 L 305,275 L 295,195 L 315,185
           L 320,210 L 370,255 L 390,240 L 290,140 Z"
        fill="rgba(0,0,0,0.55)"
        fillRule="evenodd"
      />

      {/* Bull face cutouts (eyes / forehead) — transparent = header bg */}
      <polygon
        points="250,175 220,195 230,265 250,275 270,265 280,195"
        fill="transparent"
      />
      {/* Nose cutout */}
      <polygon
        points="250,295 235,310 265,310"
        fill="transparent"
      />
    </svg>
  )
}
