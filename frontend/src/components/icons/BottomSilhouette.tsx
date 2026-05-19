/* ─── Inline SVG: Volt León Logo ─── */
const VoltLeonLogo = () => (
  <div className="flex items-center gap-3">
    <div className="relative w-[72px] h-[72px]">
      <svg
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle
          cx="36"
          cy="36"
          r="35"
          stroke="#1a7a6d"
          strokeWidth="2"
          fill="none"
        />
        {/* Heart */}
        <path
          d="M36 18 C33 14, 27 14, 27 19 C27 24, 36 28, 36 28 C36 28, 45 24, 45 19 C45 14, 39 14, 36 18Z"
          fill="#1a7a6d"
        />
        {/* Bike body */}
        <circle
          cx="26"
          cy="44"
          r="8"
          stroke="#1a7a6d"
          strokeWidth="1.8"
          fill="none"
        />
        <circle
          cx="46"
          cy="44"
          r="8"
          stroke="#1a7a6d"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M26 44 L33 34 L43 34 L46 44 M33 34 L36 44 L43 34"
          stroke="#1a7a6d"
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Handlebar */}
        <path
          d="M43 34 L47 30"
          stroke="#1a7a6d"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Waves */}
        <path
          d="M24 56 Q30 52, 36 56 Q42 60, 48 56"
          stroke="#1a7a6d"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <div>
      <h1 className="text-xl font-extrabold text-[#1a3c34] tracking-wide leading-tight">
        VOLT LEÓN
      </h1>
      <p className="text-[11px] font-bold text-[#1a7a6d] tracking-[0.15em] leading-tight">
        ELECTRIC MOBILITY
      </p>
      <p className="text-[9px] text-[#5a8a7a] tracking-[0.12em] mt-0.5">
        EXPLORA. CONECTA. DISFRUTA.
      </p>
    </div>
  </div>
);

/* ─── Bottom Silhouette (palm trees + cathedral) ─── */
const BottomSilhouette = () => (
  <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none opacity-[0.12]">
    <svg
      viewBox="0 0 600 80"
      preserveAspectRatio="xMidYMax slice"
      className="w-full h-full"
      fill="#1a3c34"
    >
      {/* Palm tree left */}
      <path d="M50 80 L52 40 Q40 20 30 25 Q45 18 52 35 Q48 10 38 8 Q52 12 54 30 Q55 5 60 0 Q58 15 55 30 Q62 12 70 8 Q60 18 55 35 Q65 18 75 25 Q62 28 52 40Z" />
      {/* Cathedral center */}
      <path d="M260 80 L260 45 L265 45 L265 30 L270 30 L270 25 L275 18 L280 25 L280 30 L285 30 L285 45 L290 45 L290 35 L295 28 L300 35 L300 80Z M268 50 L268 60 L282 60 L282 50 Q275 44 268 50Z" />
      {/* Palm tree right */}
      <path d="M500 80 L502 45 Q490 25 480 30 Q495 23 502 40 Q498 15 488 13 Q502 17 504 35 Q505 10 510 5 Q508 20 505 35 Q512 17 520 13 Q510 23 505 40 Q515 23 525 30 Q512 33 502 45Z" />
    </svg>
  </div>
);

export default BottomSilhouette;