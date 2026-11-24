import { glowOf, MAX_LEVEL } from '../level'
import { makeRng } from '../rng'
import { blur, num, path, polyline, stroke, vGradient } from './svg'

export const TOWER_X = 1104
export const DECK_Y = 488
export const TOWER_LIT = '#ff7a2f'
const BASE_Y = 704
const HEIGHT = 480
const MAST_T = 0.86
const LEVELS = 48
const LIT = { steel: TOWER_LIT, white: '#ffe7c2', deck: '#fff1d6', window: '#ffb347' }
const DARK = { steel: '#2a2346', white: '#352d55', deck: '#2f2950', window: '#40386a' }
type Paint = typeof LIT

// Concave flanks: wide legs that narrow fast, then a slim upper body.
const halfWidth = (t: number) => (t > MAST_T ? 1.6 : 3 + 75 * (1 - t) ** 3 + 10 * (1 - t))
const yAt = (t: number) => BASE_Y - t * HEIGHT
const tAt = (i: number) => MAST_T * (1 - (1 - i / LEVELS) ** 1.25)

// The upper body alternates international orange and white, as the real tower does.
const bands = (id: string, paint: Paint) => {
  const list: [number, string][] = []
  for (let band = 0; band < 14; band++) {
    const color = band % 2 === 0 ? paint.steel : paint.white
    list.push([band / 14, color], [(band + 1) / 14, color])
  }

  return vGradient(id, yAt(0.3), yAt(1), list)
}

const edges = () => {
  const ts = Array.from({ length: LEVELS + 1 }, (_, i) => tAt(i))

  return (
    polyline(ts.map(t => [TOWER_X - halfWidth(t), yAt(t)] as const)) +
    polyline(ts.map(t => [TOWER_X + halfWidth(t), yAt(t)] as const))
  )
}

// X bracing between each pair of levels, above the leg arch.
const bracing = () => {
  let d = ''
  for (let i = 0; i < LEVELS; i++) {
    const [t0, t1] = [tAt(i), tAt(i + 1)]
    if (t0 < 0.12) continue
    const [l0, r0, l1, r1] = [TOWER_X - halfWidth(t0), TOWER_X + halfWidth(t0), TOWER_X - halfWidth(t1), TOWER_X + halfWidth(t1)]
    d += polyline([[l0, yAt(t0)], [r1, yAt(t1)]]) + polyline([[r0, yAt(t0)], [l1, yAt(t1)]]) + polyline([[l0, yAt(t0)], [r0, yAt(t0)]])
  }

  return d
}

// The four legs and the arch between them.
const legs = () => {
  const [w0, w1, top] = [halfWidth(0), halfWidth(0.12), yAt(0.12)]
  const arch = `${num(TOWER_X + w0 * 0.62)} ${BASE_Y}Q${TOWER_X} ${num(top - 30)} ${num(TOWER_X - w0 * 0.62)} ${BASE_Y}Z`

  return `M${num(TOWER_X - w0)} ${BASE_Y}L${num(TOWER_X - w1)} ${num(top)}L${num(TOWER_X + w1)} ${num(top)}L${num(TOWER_X + w0)} ${BASE_Y}L${arch}`
}

const mast = () => `M${TOWER_X} ${num(yAt(MAST_T))}V${num(yAt(1))}`
const STEEL = edges() + bracing() + mast()

const deck = (t: number, extra: number, h: number, paint: Paint) => {
  const half = halfWidth(t) + extra
  const y = yAt(t) - h / 2
  const body = `<rect x="${num(TOWER_X - half)}" y="${num(y)}" width="${num(half * 2)}" height="${h}" rx="2" fill="${paint.deck}"/>`

  return body + `<rect x="${num(TOWER_X - half + 2)}" y="${num(y + h * 0.35)}" width="${num(half * 2 - 4)}" height="${num(h * 0.3)}" fill="${paint.window}"/>`
}

const frame = (id: string, paint: Paint, width = 1.4) =>
  path(legs(), `url(#${id})`, ' opacity=".85"') +
  stroke(STEEL, `url(#${id})`, width, ' stroke-linejoin="round"') +
  deck(0.45, 12, 20, paint) +
  deck(0.75, 8, 12, paint)

const beams = (level: number) => {
  if (level < 7) return ''
  const points = `${TOWER_X - 3},${DECK_Y} ${TOWER_X + 3},${DECK_Y} ${TOWER_X + 110},-160 ${TOWER_X - 110},-160`
  const opacity = num(0.12 + 0.05 * (level - 7))

  return ['bm', 'bm bm2']
    .map(cls => `<polygon class="${cls}" points="${points}" fill="url(#beam)" opacity="${opacity}" filter="url(#beamBlur)"/>`)
    .join('')
}

const sparkles = (level: number) => {
  if (level < MAX_LEVEL) return ''
  const rng = makeRng(5)
  const groups = ['', '', '']
  for (let i = 0; i < 30; i++) {
    const t = rng() * MAST_T
    const x = TOWER_X + (rng() < 0.5 ? -1 : 1) * halfWidth(t)
    groups[i % 3] += `<circle cx="${num(x)}" cy="${num(yAt(t))}" r="1.6"/>`
  }

  return groups.map((dots, i) => `<g class="sp${i + 1}" fill="#ffffff">${dots}</g>`).join('')
}

// Lit from the bottom up: as the context fills, the tower goes dark from the top down.
const litTower = (level: number) => {
  const top = BASE_Y - HEIGHT * glowOf(level) - 6
  const clip = `<clipPath id="lit"><rect x="900" y="${num(top)}" width="400" height="${num(BASE_Y - top)}"/></clipPath>`
  const halo = (deviation: string, opacity: number) =>
    `<g filter="url(#${deviation})" opacity="${num(opacity * glowOf(level))}">${stroke(STEEL, '#ff8a3d', 5)}${path(legs(), '#ff8a3d')}</g>`

  return `<defs>${clip}</defs><g clip-path="url(#lit)">${halo('haloWide', 0.55)}${halo('haloNear', 0.8)}${frame('bandsLit', LIT)}</g>`
}

export const TOWER_DEFS =
  bands('bandsDark', DARK) +
  blur('haloWide', 16) +
  blur('haloNear', 4) +
  blur('beamBlur', 6) +
  vGradient('beam', DECK_Y, -160, [[0, '#ffe2b0', 0.9], [1, '#ffe2b0', 0]])

export const tower = (level: number) => {
  const beacon = `<circle class="bk" cx="${TOWER_X}" cy="${num(yAt(1) - 3)}" r="3" fill="#ff3b3b"/>`
  const lit = level > 0 ? `<defs>${bands('bandsLit', LIT)}</defs>${litTower(level)}` : ''

  return beams(level) + frame('bandsDark', DARK) + lit + beacon + sparkles(level)
}
