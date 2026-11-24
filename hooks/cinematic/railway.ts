import { path, rect, vGradient } from './svg'

const TRACK_Y = 690
const CAR_W = 70

export const RAILWAY_DEFS =
  vGradient('car', TRACK_Y - 26, TRACK_Y - 2, [[0, '#dfe5ec'], [0.6, '#aab3bf'], [1, '#6c7480']])

const car = (x: number) => {
  const y = TRACK_Y - 26
  let windows = ''
  for (let wx = x + 7; wx < x + CAR_W - 10; wx += 13) windows += rect(wx, y + 6, 8, 8)

  return {
    body: `<rect x="${x}" y="${y}" width="${CAR_W - 2}" height="24" rx="4"/>`,
    windows,
    stripe: rect(x, y + 17, CAR_W - 2, 3),
  }
}

const train = () => {
  const cars = [0, 1, 2, 3].map(i => car(160 + i * CAR_W))
  const front = 160 + 4 * CAR_W - 2
  const beam = `<polygon points="${front},${TRACK_Y - 10} ${front + 90},${TRACK_Y - 22} ${front + 90},${TRACK_Y + 4}" fill="#fffbe0" opacity=".12"/>`

  return (
    `<g fill="url(#car)">${cars.map(c => c.body).join('')}</g>` +
    path(cars.map(c => c.stripe).join(''), '#6fc23a') +
    path(cars.map(c => c.windows).join(''), '#fff0b8') +
    beam +
    `<circle cx="${front - 2}" cy="${TRACK_Y - 10}" r="2.4" fill="#fffbe0"/>`
  )
}

// The elevated line; at rest (reduced motion) the train stays in view.
export const railway = () => {
  let pillars = ''
  for (let x = 16; x < 1280; x += 104) pillars += rect(x, TRACK_Y + 10, 8, 20)

  return path(pillars + rect(0, TRACK_Y, 1280, 10), '#11122c') + path(rect(0, TRACK_Y, 1280, 1.5), '#3a3c6a') + `<g class="tr">${train()}</g>`
}
