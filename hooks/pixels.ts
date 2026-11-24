export type Rng = () => number

// mulberry32: same seed, same city on every redraw.
export const makeRng = (seed: number): Rng => {
  let state = seed

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = <T>(rng: Rng, list: readonly [T, ...T[]]): T => list[Math.floor(rng() * list.length)] ?? list[0]

export const between = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))

export const run = (x: number, y: number, w: number, h = 1) => `M${x} ${y}h${w}v${h}h${-w}z`

export const path = (d: string, fill: string, extra = '') =>
  d === '' ? '' : `<path d="${d}" fill="${fill}"${extra}/>`

export const MAX_LEVEL = 10

// Fully lit on an empty context, dark at 80%: auto-compaction usually fires before 100%.
export const levelFromPercent = (percent: number | undefined) =>
  MAX_LEVEL - Math.min(MAX_LEVEL, Math.max(0, Math.floor((percent ?? 0) / 8)))
