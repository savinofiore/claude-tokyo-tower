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
