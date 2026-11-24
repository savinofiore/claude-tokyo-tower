import { glowOf } from '../level'
import { between, makeRng, pick } from '../rng'
import { blur, num, path, rect, vGradient } from './svg'
import { TOWER_X } from './tower'

type Building = { x: number; w: number; top: number }

const NEAR_BASE = 720
const FAR_BASE = 650

export const CITY_DEFS =
  vGradient('farBody', 480, FAR_BASE, [[0, '#121334'], [1, '#1c1a3e']]) +
  vGradient('nearBody', 480, NEAR_BASE, [[0, '#0c0d24'], [1, '#05060f']]) +
  vGradient('shade', 480, NEAR_BASE, [[0, '#000000', 0.25], [1, '#000000', 0.55]]) +
  vGradient('street', 600, NEAR_BASE, [[0, '#ff8a4a', 0], [1, '#ff9a5a', 0.45]]) +
  blur('neonGlow', 6) +
  blur('windowGlow', 1.2)

// Each window draws its rng value whatever the level, so a higher level
// lights a superset of the windows of a lower one.
export const farCity = (level: number) => {
  const rng = makeRng(21)
  const share = 0.05 + 0.5 * glowOf(level)
  let body = ''
  let lit = ''
  for (let x = -8; x < 1288; ) {
    const w = between(rng, 20, 52)
    const top = FAR_BASE - between(rng, 40, 150)
    body += rect(x, top, w, NEAR_BASE - top)
    if (rng() < 0.25) body += rect(x + w / 2, top - 18, 1.5, 18)
    for (let wy = top + 6; wy < FAR_BASE - 6; wy += 7) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) if (rng() < share) lit += rect(wx, wy, 2, 2.5)
    }
    x += w + between(rng, 0, 4)
  }

  return path(body, 'url(#farBody)') + path(lit, '#f2bf63', ' opacity=".35"')
}

const TINTS = ['#ffd890', '#ffcf7a', '#ffe7b8', '#dff1ff', '#ffb27a'] as const

type Windows = { lit: Record<string, string>; dark: string; flicker: string }

// Each building gets its own window module: office strips, a fine grid or tall panes.
type WindowStyle = { w: number; h: number; dx: number; dy: number }

const STYLES: readonly [WindowStyle, ...WindowStyle[]] = [
  { w: 4, h: 5, dx: 7, dy: 9 },
  { w: 9, h: 4, dx: 10, dy: 8 },
  { w: 3, h: 7, dx: 5, dy: 11 },
]

const addWindows = (rng: () => number, b: Building, share: number, out: Windows) => {
  const style = pick(rng, STYLES)
  const floorShare = share * (0.6 + rng() * 0.8)
  for (let wy = b.top + 8; wy < NEAR_BASE - 10; wy += style.dy) {
    const isFloorOn = rng() < 0.85
    for (let wx = b.x + 4; wx <= b.x + b.w - 4 - style.w; wx += style.dx) {
      const rank = rng()
      const tint = pick(rng, TINTS)
      const isFlicker = rng() < 0.02
      const cell = rect(wx, wy, style.w, style.h)
      if (!isFloorOn || rank >= floorShare) out.dark += cell
      else if (isFlicker) out.flicker += cell
      else out.lit[tint] = (out.lit[tint] ?? '') + cell
    }
  }
}

const rooftop = (rng: () => number, b: Building) => {
  if (rng() < 0.5) return rect(b.x + b.w * 0.2, b.top - 10, b.w * 0.25, 10)
  if (rng() < 0.5) return rect(b.x + b.w * 0.6, b.top - 26, 2, 26)

  return ''
}

const layoutNear = (rng: () => number) => {
  const list: Building[] = []
  for (let x = -12; x < 1292; ) {
    const w = between(rng, 36, 88)
    const isNearTower = Math.abs(x + w / 2 - TOWER_X) < 120
    const h = isNearTower ? between(rng, 32, 64) : between(rng, 64, 208)
    list.push({ x, w, top: NEAR_BASE - 16 - h })
    x += w + between(rng, 0, 8)
  }

  return list
}

export const nearCity = (level: number) => {
  const rng = makeRng(99)
  const share = 0.1 + 0.8 * glowOf(level)
  const buildings = layoutNear(rng)
  const windows: Windows = { lit: {}, dark: '', flicker: '' }
  let body = ''
  let edges = ''
  let shade = ''
  for (const b of buildings) {
    body += rect(b.x, b.top, b.w, NEAR_BASE - b.top) + rooftop(rng, b)
    edges += rect(b.x, b.top, b.w, 1.2)
    shade += rect(b.x + b.w * 0.78, b.top, b.w * 0.22, NEAR_BASE - b.top)
    addWindows(rng, b, share, windows)
  }
  const lit = Object.entries(windows.lit).map(([tint, d]) => path(d, tint)).join('')
  const tall = buildings.filter(b => NEAR_BASE - b.top >= 136)
  const beacons = tall.filter(b => b.top <= 560).map(b => `<circle cx="${num(b.x + b.w / 2)}" cy="${num(b.top - 4)}" r="2.2"/>`).join('')
  const svg =
    path(body, 'url(#nearBody)') +
    path(edges, '#2a2c5c', ' opacity=".7"') +
    path(windows.dark, '#13152f') +
    `<g opacity=".85">${lit}${path(windows.flicker, '#ffd890', ' class="fl"')}</g>` +
    path(shade, 'url(#shade)') +
    `<g class="bk2" fill="#ff3b3b">${beacons}</g>` +
    `<rect y="600" width="1280" height="120" fill="url(#street)" opacity="${num(0.3 + 0.7 * glowOf(level))}"/>`

  return { svg, tall }
}

const NEON = ['#ff4fa3', '#3ff0ff', '#ffe14f', '#b67dff', '#ff5a5a', '#4fff9a'] as const

const towerDistance = (b: Building) => Math.abs(b.x + b.w / 2 - TOWER_X)

const sign = (b: Building, i: number) => {
  const rng = makeRng(300 + i)
  const [x, y, h] = [b.x + b.w - 14, b.top + 16, between(rng, 44, 66)]
  const color = NEON[i] ?? NEON[0]
  let glyphs = ''
  for (let gy = y + 7; gy < y + h - 8; gy += 9) if (rng() < 0.75) glyphs += rect(x + 3, gy, rng() < 0.5 ? 8 : 5, 2.5)
  const frame = `<rect x="${num(x)}" y="${num(y)}" width="14" height="${h}" rx="2" fill="#1a0b22" stroke="${color}" stroke-width="1.6"/>`
  const glow = `<rect x="${num(x - 4)}" y="${num(y - 4)}" width="22" height="${h + 8}" rx="4" fill="${color}" opacity=".35" filter="url(#neonGlow)"/>`

  return `<g class="nb${i % 2}">${glow}${frame}${path(glyphs, color)}</g>`
}

// A sign switches on at each level from 2 up, spreading out from the tower.
export const neon = (level: number, tall: Building[]) =>
  [...tall]
    .sort((a, b) => towerDistance(a) - towerDistance(b))
    .slice(0, NEON.length)
    .map((b, i) => (level < 2 + i ? '' : sign(b, i)))
    .join('')
