// Small SVG writers. Coordinates keep one decimal, so a scene stays well under the Svg size limit.
export const num = (value: number) => String(Math.round(value * 10) / 10)

export const rect = (x: number, y: number, w: number, h: number) =>
  `M${num(x)} ${num(y)}h${num(w)}v${num(h)}h${num(-w)}z`

export const path = (d: string, fill: string, extra = '') =>
  d === '' ? '' : `<path d="${d}" fill="${fill}"${extra}/>`

export const stroke = (d: string, color: string, width: number, extra = '') =>
  d === '' ? '' : `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${extra}/>`

export const polyline = (points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${num(x)} ${num(y)}`).join('')

type Stop = readonly [offset: number, color: string, opacity?: number]

const stops = (list: readonly Stop[]) =>
  list.map(([at, color, opacity = 1]) => `<stop offset="${at}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('')

// Vertical gradient in scene units, from y1 down to y2.
export const vGradient = (id: string, y1: number, y2: number, list: readonly Stop[]) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">${stops(list)}</linearGradient>`

export const radial = (id: string, list: readonly Stop[]) => `<radialGradient id="${id}">${stops(list)}</radialGradient>`

export const blur = (id: string, deviation: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${deviation}"/></filter>`
