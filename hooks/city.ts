import { between, makeRng, MAX_LEVEL, path, pick, run } from './pixels'
import { TOWER_X } from './tower'

type Building = { x: number; w: number; top: number }

// Each window draws its rng value whatever the level, so a higher level
// lights a superset of the windows of a lower one.
export const farCity = (level: number) => {
  const rng = makeRng(21)
  const share = 0.05 + (0.5 * level) / MAX_LEVEL
  let body = ''
  let lit = ''
  for (let x = -2; x < 322; ) {
    const w = between(rng, 5, 13)
    const top = 160 - between(rng, 12, 40)
    body += run(x, top, w, 180 - top)
    if (rng() < 0.25) body += run(x + Math.floor(w / 2), top - 5, 1, 5)
    for (let wy = top + 2; wy < 158; wy += 3) {
      for (let wx = x + 1; wx < x + w - 1; wx += 2) if (rng() < share) lit += run(wx, wy, 1)
    }
    x += w + between(rng, 0, 1)
  }

  return path(body, '#11122f') + path(lit, '#f2bf63', ' opacity=".55"')
}

const TINTS = ['#ffd27a', '#ffd27a', '#ffd27a', '#9fe3ff', '#ffa868'] as const

export const nearCity = (level: number) => {
  const rng = makeRng(99)
  const share = 0.1 + (0.8 * level) / MAX_LEVEL
  const lit: Record<string, string> = {}
  const tall: Building[] = []
  let body = ''
  let roofs = ''
  let dark = ''
  let flicker = ''
  for (let x = -3; x < 323; ) {
    const w = between(rng, 9, 22)
    const isNearTower = Math.abs(x + w / 2 - TOWER_X) < 30
    const h = isNearTower ? between(rng, 8, 16) : between(rng, 16, 52)
    const top = 176 - h
    body += run(x, top, w, h + 4)
    roofs += run(x, top, w, 1)
    if (h >= 30) tall.push({ x, w, top })
    for (let wy = top + 3; wy < 172; wy += 4) {
      for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        const rank = rng()
        const tint = pick(rng, TINTS)
        const isFlicker = rng() < 0.05
        const cell = run(wx, wy, 2, 2)
        if (rank >= share) dark += cell
        else if (isFlicker) flicker += cell
        else lit[tint] = (lit[tint] ?? '') + cell
      }
    }
    x += w + between(rng, 0, 2)
  }
  const windows = Object.entries(lit).map(([tint, d]) => path(d, tint)).join('')
  const svg =
    path(body, '#090a1e') +
    path(roofs, '#17183c') +
    path(dark, '#15163a') +
    windows +
    path(flicker, '#ffd27a', ' class="fl"') +
    path(tall.filter(b => b.top <= 136).map(b => run(b.x + Math.floor(b.w / 2), b.top - 1, 1)).join(''), '#ff3b3b', ' class="bk2"')

  return { svg, tall }
}

const NEON = ['#ff4fa3', '#3ff0ff', '#ffe14f', '#b67dff', '#ff5a5a', '#4fff9a'] as const

const towerDistance = (b: Building) => Math.abs(b.x + b.w / 2 - TOWER_X)

// A sign switches on at each level from 2 up, spreading out from the tower.
export const neon = (level: number, tall: Building[]) =>
  [...tall]
    .sort((a, b) => towerDistance(a) - towerDistance(b))
    .slice(0, NEON.length)
    .map((b, i) => {
      if (level < 2 + i) return ''
      const rng = makeRng(300 + i)
      const x = b.x + b.w - 2
      const y = b.top + 4
      const h = between(rng, 10, 16)
      const color = NEON[i] ?? NEON[0]
      const frame = run(x, y, 4, 1) + run(x, y + h - 1, 4, 1) + run(x, y, 1, h) + run(x + 3, y, 1, h)
      let glyph = ''
      for (let gy = y + 2; gy < y + h - 2; gy += 2) if (rng() < 0.7) glyph += run(x + 1, gy, rng() < 0.5 ? 2 : 1)
      const halo = `<rect x="${x - 2}" y="${y - 2}" width="8" height="${h + 4}" fill="${color}" opacity=".16"/>`

      return `<g class="nb${i % 2}">${halo}${path(run(x, y, 4, h), '#1a0b22')}${path(frame + glyph, color)}</g>`
    })
    .join('')

const train = () => {
  const y = 156
  let body = ''
  let roof = ''
  let stripe = ''
  let windows = ''
  for (let car = 0; car < 4; car++) {
    const x = 40 + car * 18
    body += run(x, y + 1, 17, 6)
    roof += run(x + 1, y, 15, 1)
    stripe += run(x, y + 5, 17, 1)
    for (let wx = x + 2; wx < x + 15; wx += 4) windows += run(wx, y + 2, 2, 2)
  }

  return path(body, '#c3ccd6') + path(roof, '#8f99a6') + path(stripe, '#7ccf3f') + path(windows, '#fff0b0') + path(run(111, y + 4, 1), '#fffbe0')
}

// The elevated line; at rest (reduced motion) the train stays in view.
export const railway = () => {
  let pillars = ''
  for (let x = 4; x < 320; x += 26) pillars += run(x, 166, 2, 10)

  return path(pillars + run(0, 163, 320, 3), '#13142e') + `<g class="tr">${train()}</g>`
}
