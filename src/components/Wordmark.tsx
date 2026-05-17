interface Props {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
  pill?: boolean;
}

const TEXT_SIZE = {
  sm: "text-3xl md:text-4xl",
  md: "text-5xl md:text-6xl",
  lg: "text-6xl md:text-7xl",
};
const LENS_SIZE = {
  sm: 22,
  md: 38,
  lg: 48,
};
const LENS_OFFSET = {
  sm: "-translate-x-[2px] -translate-y-[6px]",
  md: "-translate-x-[3px] -translate-y-[10px]",
  lg: "-translate-x-[4px] -translate-y-[14px]",
};

export default function Wordmark({ size = "md", variant = "light", className = "", pill = false }: Props) {
  const lensColor = variant === "dark" ? "#FFC83D" : "#FF6A4D";
  const textColor = variant === "dark" ? "text-cream" : "text-ink";
  const pillBg = variant === "dark" ? "bg-sun text-ink" : "bg-coral text-cream";
  const lensPx = LENS_SIZE[size];

  // Split LookUp -> "Lo" + lens (replaces 1st o-shape) + "kUp"
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className={`flex items-center font-black tracking-tighter leading-none ${TEXT_SIZE[size]} ${textColor}`}
        style={{ letterSpacing: "-0.05em" }}
        aria-label="LookUp kids"
      >
        <span>L</span>
        <span className={`relative inline-block ${LENS_OFFSET[size]}`} aria-hidden="true">
          <svg width={lensPx} height={lensPx} viewBox="0 0 60 60">
            <rect
              x="42"
              y="36"
              width="6"
              height="22"
              rx="3"
              ry="3"
              fill={lensColor}
              transform="rotate(-40 45 47)"
            />
            <circle cx="26" cy="26" r="22" fill="none" stroke={lensColor} strokeWidth="6" />
            <circle cx="19" cy="19" r="4" fill="#FFFFFF" fillOpacity="0.55" />
          </svg>
        </span>
        <span>okUp</span>
      </div>
      {pill && (
        <div
          className={`mt-2 rounded-full font-extrabold text-[10px] md:text-xs px-3 py-1 uppercase ${pillBg}`}
          style={{ letterSpacing: "0.16em" }}
        >
Kids
        </div>
      )}
    </div>
  );
}
