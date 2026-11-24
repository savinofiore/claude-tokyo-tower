import { glowOf } from '../level'
import { between, makeRng } from '../rng'
import { blur, num, path, radial, vGradient } from './svg'

export const SKY_DEFS =
  vGradient('sky', 0, 640, [
    [0, '#03040f'],
    [0.35, '#080b24'],
    [0.62, '#141638'],
    [0.82, '#2a2150'],
    [1, '#4a2c5a'],
  ]) +
  vGradient('cityGlow', 380, 720, [
    [0, '#ff6b4a', 0],
    [0.6, '#ff7a45', 0.55],
    [1, '#ffb070', 0.9],
  ]) +
  vGradient('fuji', 440, 650, [
    [0, '#2f3166'],
    [1, '#15163a'],
  ]) +
  radial('moon', [
    [0, '#fffaf0'],
    [0.7, '#f4e6c0'],
    [1, '#d9c592'],
  ]) +
  radial('moonHalo', [
    [0, '#f6e7c4', 0.35],
    [0.4, '#f6e7c4', 0.08],
    [1, '#f6e7c4', 0],
  ]) +
  blur('soft', 2) +
  blur('cloud', 14)

// The city glow rises with the light level: light pollution over the horizon.
export const sky = (level: number) =>
  '<rect width="1280" height="720" fill="url(#sky)"/>' +
  `<rect y="380" width="1280" height="340" fill="url(#cityGlow)" opacity="${num(0.15 + 0.6 * glowOf(level))}"/>`

// The brighter the city, the fainter the stars.
export const stars = (level: number) => {
  const rng = makeRng(7)
  const groups = ['', '', '']
  for (let i = 0; i < 150; i++) {
    const x = between(rng, 0, 1279)
    const y = between(rng, 0, 420)
    const r = rng() < 0.12 ? 1.3 : 0.4 + rng() * 0.5
    groups[i % 3] += `<circle cx="${x}" cy="${y}" r="${num(r)}"/>`
  }
  const opacity = num(0.9 - glowOf(level) * 0.55)

  return `<g fill="#eef0ff" opacity="${opacity}">${groups.map((dots, i) => `<g class="tw${i + 1}">${dots}</g>`).join('')}</g>`
}

const MARIA: readonly (readonly [number, number, number, number])[] = [
  [-8, -7, 9, 5], [7, 1, 5, 8], [-4, 10, 6, 3],
]

export const moon = () => {
  const [cx, cy, r] = [216, 104, 26]
  const maria = MARIA.map(([dx, dy, rx, ry]) => `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${rx}" ry="${ry}"/>`).join('')

  return (
    `<circle cx="${cx}" cy="${cy}" r="${r * 6}" fill="url(#moonHalo)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moon)"/>` +
    `<g fill="#c4b088" opacity=".22" filter="url(#soft)">${maria}</g>`
  )
}

// Long, low clouds, lit from below by the city.
export const clouds = (level: number) => {
  const rng = makeRng(13)
  let shapes = ''
  for (let i = 0; i < 9; i++) {
    const cx = between(rng, -100, 1380)
    const cy = between(rng, 150, 400)
    shapes += `<ellipse cx="${cx}" cy="${cy}" rx="${between(rng, 140, 320)}" ry="${between(rng, 10, 26)}"/>`
  }
  const tint = level > 4 ? '#5a3a6a' : '#2a2a55'

  return `<g class="cl" fill="${tint}" opacity="${num(0.35 + 0.25 * glowOf(level))}" filter="url(#cloud)">${shapes}</g>`
}

// Mount Fuji on the horizon, concave flanks and a ragged snow cap, softened by haze.
export const fuji = () => {
  const body = 'M120 650C210 600 290 520 318 462Q336 452 354 462C382 520 462 600 552 650Z'
  const snow =
    'M318 462Q336 452 354 462C362 478 370 492 378 504L368 498L360 510L350 496L340 512L330 494L320 506L310 496L296 504C304 492 312 478 318 462Z'

  return path(body, 'url(#fuji)') + path(snow, '#c9cef2', ' opacity=".55"') + path(body, '#4a3a6a', ' opacity=".25"')
}
