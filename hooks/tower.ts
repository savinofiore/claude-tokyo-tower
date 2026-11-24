import { makeRng, MAX_LEVEL, path, run } from './pixels'

export const TOWER_X = 276
export const DECK_Y = 122
export const TOWER_LIT = '#ff7a2f'
const BASE_Y = 176
const HEIGHT = 120
const TIP_Y = BASE_Y - HEIGHT
const COLOR = { dark: '#2a2346', darkWhite: '#352d55', lit: TOWER_LIT, litWhite: '#ffe7c2' }

// (height fraction, half width): wide legs, two decks, thin antenna.
const PROFILE: readonly [number, number][] = [
  [0, 22], [0.08, 16], [0.18, 11], [0.3, 8], [0.45, 6], [0.58, 4],
  [0.7, 3], [0.76, 2.5], [0.86, 1.2], [1, 0.5],
]

const halfWidth = (t: number) => {
  const i = Math.max(1, PROFILE.findIndex(([at]) => at >= t))
  const [t0, w0] = PROFILE[i - 1] ?? [0, 0]
  const [t1, w1] = PROFILE[i] ?? [1, 0.5]

  return w0 + ((t - t0) / (t1 - t0)) * (w1 - w0)
}

const mod = (n: number, m: number) => ((n % m) + m) % m

const isSteel = (x: number, row: number, half: number) => {
  const t = row / HEIGHT
  const dx = x - TOWER_X
  if (half <= 1.5 || Math.abs(dx) >= half - (t < 0.3 ? 2 : 1)) return true
  if (t < 0.12 && Math.abs(dx) < half * 0.62 * Math.sqrt(1 - (t / 0.12) ** 2)) return false

  return row % 7 === 0 || mod(dx + row, 7) === 0 || mod(row - dx, 7) === 0
}

const isWhiteBand = (row: number) => row > HEIGHT * 0.3 && Math.floor((row / HEIGHT) * 14) % 2 === 1

type Runs = Record<string, string>

const addRow = (runs: Runs, row: number, isLit: boolean) => {
  const half = halfWidth(row / HEIGHT)
  const left = Math.round(TOWER_X - half)
  const right = Math.round(TOWER_X + half)
  const key = isWhiteBand(row) ? (isLit ? 'litWhite' : 'darkWhite') : isLit ? 'lit' : 'dark'
  let start = -1
  for (let x = left; x <= right + 1; x++) {
    const isOn = x <= right && isSteel(x, row, half)
    if (isOn && start < 0) start = x
    if (isOn || start < 0) continue
    runs[key] = (runs[key] ?? '') + run(start, BASE_Y - row, x - start)
    start = -1
  }
}

const deck = (row: number, rows: number, extra: number, isLit: boolean) => {
  const half = Math.round(halfWidth(row / HEIGHT)) + extra
  const top = BASE_Y - row - Math.floor(rows / 2)
  const body = run(TOWER_X - half, top, half * 2 + 1, rows)
  let windows = ''
  for (let x = TOWER_X - half + 1; x < TOWER_X + half; x += 2) windows += run(x, top + Math.floor(rows / 2), 1)

  return path(body, isLit ? '#fff1d6' : '#2f2950') + path(windows, isLit ? '#ffb347' : '#40386a')
}

const halo = (litRows: number, strength: number) =>
  ([[9, 0.08], [5, 0.13], [2, 0.2]] as const)
    .map(([reach, opacity]) => {
      let d = ''
      for (let row = 0; row < Math.min(HEIGHT, litRows + 4); row++) {
        const half = halfWidth(row / HEIGHT) + reach
        d += run(Math.round(TOWER_X - half), BASE_Y - row, Math.round(half * 2) + 1)
      }

      return path(d, '#ff8a3d', ` opacity="${(opacity * strength).toFixed(3)}"`)
    })
    .join('')

const beams = (level: number) => {
  if (level < 7) return ''
  const points = `${TOWER_X - 1},${DECK_Y} ${TOWER_X + 1},${DECK_Y} ${TOWER_X + 26},-40 ${TOWER_X - 26},-40`
  const opacity = (0.035 + 0.015 * (level - 7)).toFixed(3)

  return ['bm', 'bm bm2']
    .map(cls => `<polygon class="${cls}" points="${points}" fill="#ffe2b0" opacity="${opacity}"/>`)
    .join('')
}

const sparkles = (level: number) => {
  if (level < MAX_LEVEL) return ''
  const rng = makeRng(5)
  const groups = ['', '', '']
  for (let i = 0; i < 24; i++) {
    const row = Math.floor(rng() * HEIGHT * 0.9)
    const half = Math.round(halfWidth(row / HEIGHT))
    groups[i % 3] += run(TOWER_X + (rng() < 0.5 ? -half : half), BASE_Y - row, 1)
  }

  return groups.map((d, i) => path(d, '#ffffff', ` class="sp${i + 1}"`)).join('')
}

export const tower = (level: number) => {
  const litRows = Math.round((HEIGHT * level) / MAX_LEVEL)
  const runs: Runs = {}
  for (let row = 0; row <= HEIGHT; row++) addRow(runs, row, row < litRows)
  const steel = (Object.keys(COLOR) as (keyof typeof COLOR)[]).map(key => path(runs[key] ?? '', COLOR[key])).join('')
  const beacon = path(run(TOWER_X, TIP_Y - 2, 2, 2), '#ff3b3b', ' class="bk"')

  return (
    beams(level) +
    (level > 0 ? halo(litRows, level / MAX_LEVEL) : '') +
    steel +
    deck(54, 5, 3, litRows > 54) +
    deck(90, 3, 2, litRows > 90) +
    beacon +
    sparkles(level)
  )
}
