import { between, makeRng, MAX_LEVEL, path, run } from './pixels'

const BANDS = ['#070920', '#0a0d2a', '#0e1234', '#13163e', '#191a48', '#201e52', '#29225a', '#332661', '#3b2966']

// Stepped bands, not a gradient: the pixel look.
export const sky = (level: number) => {
  const bands = BANDS.map((color, i) => `<rect x="0" y="${i * 20}" width="320" height="20" fill="${color}"/>`)
  const strength = 0.2 + (0.8 * level) / MAX_LEVEL
  const cityGlow = [0.05, 0.09, 0.14, 0.2].map(
    (opacity, i) =>
      `<rect x="0" y="${116 + i * 8}" width="320" height="${i === 3 ? 40 : 8}" fill="#ff6b4a" opacity="${(opacity * strength).toFixed(3)}"/>`,
  )

  return bands.join('') + cityGlow.join('')
}

// Light pollution: the brighter the city, the fainter the stars.
export const stars = (level: number) => {
  const rng = makeRng(7)
  const groups = ['', '', '']
  for (let i = 0; i < 54; i++) {
    const x = between(rng, 0, 319)
    const y = between(rng, 0, 104)
    const isBright = rng() < 0.15
    groups[i % 3] += isBright ? run(x - 1, y, 3) + run(x, y - 1, 1) + run(x, y + 1, 1) : run(x, y, 1)
  }
  const opacity = (1 - level * 0.04).toFixed(2)

  return `<g opacity="${opacity}">${groups.map((d, i) => path(d, '#e9e7ff', ` class="tw${i + 1}"`)).join('')}</g>`
}

const disc = (cx: number, cy: number, r: number) => {
  let d = ''
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy))
    d += run(cx - w, cy + dy, w * 2 + 1)
  }

  return d
}

export const moon = () =>
  path(disc(54, 26, 12), '#f3e6bd', ' opacity=".03"') +
  path(disc(54, 26, 9), '#f3e6bd', ' opacity=".06"') +
  path(disc(54, 26, 6), '#f3e6bd') +
  path(run(51, 24, 2) + run(56, 28, 1, 2) + run(53, 29, 1), '#d8c690')

export const fuji = () => {
  let body = ''
  let snow = ''
  for (let r = 0; r < 46; r++) {
    const half = Math.round(1 + r * 1.6)
    const left = 84 - half
    body += run(left, 114 + r, half * 2)
    if (r < 8) snow += run(left, 114 + r, half * 2)
    if (r >= 8 && r < 11) snow += run(left, 114 + r, 2) + run(83, 114 + r, 2) + run(84 + half - 2, 114 + r, 2)
  }

  return path(body, '#1d1e4c') + path(snow, '#aeb3e2', ' opacity=".5"')
}
