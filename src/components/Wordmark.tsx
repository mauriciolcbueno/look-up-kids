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

export default function Wordmark({
  size = "md",
  variant = "light",
  className = "",
  pill = false,
}: Props) {
  const lensColor = variant === "dark" ? "#FFC83D" : "#FF6A4D";
  const textColor = variant === "dark" ? "text-ink" : "text-ink";
  const pillBg = variant === "dark" ? "bg-sun text-ink" : "bg-coral text-cream";

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div
        className={`relative font-black leading-none ${TEXT_SIZE[size]} ${textColor}`}
        style={{ letterSpacing: "-0.04em" }}
        aria-label="LookUp"
      >
        <span aria-hidden="true">Lo</span>
        {/* Position wrapper: takes the width of one "o", lens sits absolutely over it. */}
        <span className="relative inline-block align-baseline" aria-hidden="true">
          <span style={{ visibility: "hidden" }}>o</span>
          <svg
            className="absolute pointer-events-none"
            style={{
              top: "-10%",
              left: "-12%",
              width: "124%",
              height: "124%",
            }}
            viewBox="0 0 60 60"
          >
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke={lensColor}
              strokeWidth="6"
            />
            <rect
              x="42"
              y="36"
              width="7"
              height="22"
              rx="3.5"
              ry="3.5"
              fill={lensColor}
              transform="rotate(-40 45 47)"
            />
            <circle cx="19" cy="19" r="4" fill="#FFFFFF" fillOpacity="0.55" />
          </svg>
        </span>
        <span aria-hidden="true">kUp</span>
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
