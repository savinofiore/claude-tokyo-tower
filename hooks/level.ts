export const MAX_LEVEL = 10

// Fully lit on an empty context, dark at 80%: auto-compaction usually fires before 100%.
export const levelFromPercent = (percent: number | undefined) =>
  MAX_LEVEL - Math.min(MAX_LEVEL, Math.max(0, Math.floor((percent ?? 0) / 8)))

// 0 (dark) to 1 (fully lit).
export const glowOf = (level: number) => level / MAX_LEVEL
