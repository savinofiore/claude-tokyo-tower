// Pixel-art writers: every shape is a run of whole pixels.
export { between, makeRng, pick } from '../rng'
export { MAX_LEVEL } from '../level'

export const run = (x: number, y: number, w: number, h = 1) => `M${x} ${y}h${w}v${h}h${-w}z`

export const path = (d: string, fill: string, extra = '') =>
  d === '' ? '' : `<path d="${d}" fill="${fill}"${extra}/>`
