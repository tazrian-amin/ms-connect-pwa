import { ScalePalette } from "./constants";

interface GoalGaugeProps {
  percent: number;
  size?: number;
  variant?: "default" | "onDark";
}

export function GoalGauge({ percent, size = 64, variant = "default" }: GoalGaugeProps) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference * (1 - clampedPercent / 100);
  const center = size / 2;
  const isOnDark = variant === "onDark";
  const trackColor = isOnDark ? "rgba(255,255,255,0.25)" : ScalePalette.goalTrack;
  const progressColor = isOnDark ? "#f87171" : ScalePalette.goalProgress;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold"
        style={{ color: isOnDark ? ScalePalette.textLight : ScalePalette.text }}
      >
        {clampedPercent.toFixed(1)}%
      </span>
    </div>
  );
}
