import { Circle } from 'lucide-react'

export function ShadCircularProgress({ value, max = 100, size = 125 }) {
  const percent = Math.round((value / max) * 100);

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth="8"
          r={(size - 16) / 2}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeWidth="8"
          r={(size - 16) / 2}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={`${(percent / 100) * 2 * Math.PI * ((size - 16) / 2)} ${2 * Math.PI * ((size - 16) / 2)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontWeight: "bold"
      }}>
        {percent}%
      </div>
    </div>
  );
}
