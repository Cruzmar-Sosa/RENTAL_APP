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

export default VoltLeonLogo;