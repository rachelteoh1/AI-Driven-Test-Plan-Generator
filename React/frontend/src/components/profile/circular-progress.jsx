export function CircularProgress({ value, max, size = 125 }) {
  const percentage = (value / max) * 100
  const circumference = 2 * Math.PI * 40
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Background circle */}
        <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="6" fill="none" />

        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="#60a5fa"
          strokeWidth="6"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
    </div>
  )
}
