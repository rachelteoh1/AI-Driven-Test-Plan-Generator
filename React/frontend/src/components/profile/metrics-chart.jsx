export function MetricsChart() {
  const months = ["SEP", "OCT", "NOV", "DEC", "JAN", "FEB"]

  return (
    <div className="h-32 flex items-end justify-between gap-2">
      <svg width="100%" height="100%" viewBox="0 0 300 120" className="overflow-visible">
        {/* Primary line (purple) */}
        <path
          d="M 20 80 Q 70 60 120 70 Q 170 40 220 50 Q 270 30 280 25"
          stroke="#8b5cf6"
          strokeWidth="3"
          fill="none"
          className="drop-shadow-sm"
        />

        {/* Secondary line (blue) */}
        <path
          d="M 20 90 Q 70 85 120 80 Q 170 75 220 70 Q 270 65 280 60"
          stroke="#3b82f6"
          strokeWidth="3"
          fill="none"
          className="drop-shadow-sm"
        />

        {/* Month labels */}
        {months.map((month, index) => (
          <text key={month} x={20 + index * 52} y={110} textAnchor="middle" className="text-xs fill-gray-400">
            {month}
          </text>
        ))}
      </svg>
    </div>
  )
}
