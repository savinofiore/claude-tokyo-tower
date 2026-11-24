import { expect, test } from 'claude-code/testing'

import { buildScene as buildCinematic } from '../hooks/cinematic/scene'
import { TOWER_LIT } from '../hooks/cinematic/tower'
import { levelFromPercent, MAX_LEVEL } from '../hooks/level'
import { buildScene as buildPixel } from '../hooks/pixel/scene'

const BACKDROP = {
  plugin: 'tokyo-tower',
  component: 'Backdrop',
  surface: 'desktop',
  props: { scene: 'tokyo-night', plugin: 'tokyo-tower', glass: false },
} as const

const STYLES = ['cinematic', 'pixel'] as const

const fill = (percent: number | undefined) => ({
  context: { window: 200_000, percent, tokens: percent === undefined ? undefined : percent * 2_000 },
  rateLimits: [],
  changed: ['context' as const],
})

test('the glow fades as the context fills, dark at 80%', async () => {
  expect(levelFromPercent(undefined)).toBe(MAX_LEVEL)
  expect(levelFromPercent(7)).toBe(MAX_LEVEL)
  expect(levelFromPercent(40)).toBe(5)
  expect(levelFromPercent(80)).toBe(0)
  expect(levelFromPercent(100)).toBe(0)
})

test('every scene of both styles fits the Svg limit and holds no refused markup', async () => {
  for (const build of [buildCinematic, buildPixel]) {
    for (let level = 0; level <= MAX_LEVEL; level++) {
      const svg = build(level)
      expect(svg.length < 131_072).toBe(true)
      expect(/<image|href|<!--|CDATA/.test(svg)).toBe(false)
    }
  }
})

for (const style of STYLES) {
  test(`${style}: the tower goes dark as the context fills and relights after a compaction`, { options: { style } }, async ($, on) => {
    on('session.measure', (_, e) => ({ changed: e.changed }))
    const towerIsLit = async () => {
      const ui = await $.ui.mount(BACKDROP)
      const svg = await ui.find({ type: 'Svg' })
      await ui.unmount()

      return String(svg?.props.source).includes(TOWER_LIT)
    }

    expect(await towerIsLit()).toBe(true)
    await $.session.measure(fill(80))
    expect(await towerIsLit()).toBe(false)
    await $.session.measure(fill(undefined))
    expect(await towerIsLit()).toBe(true)
  })
}

test('cinematic, the default, plays under the film shader fed the glow', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  await $.session.measure(fill(40))
  const ui = await $.ui.mount(BACKDROP)
  const shader = await ui.find({ type: 'Shader' })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  expect(shader?.props.module).toBe('hooks/cinematic/cinema.ts')
  expect(shader?.props.values).toEqual({ glow: 0.5 })
  expect(String(svg?.props.source).includes('crispEdges')).toBe(false)
})

test('pixel draws the pixel-art scene alone, with no shader', { options: { style: 'pixel' } }, async $ => {
  const ui = await $.ui.mount(BACKDROP)
  const shader = await ui.find({ type: 'Shader' })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  expect(shader === undefined).toBe(true)
  expect(String(svg?.props.source).includes('crispEdges')).toBe(true)
  expect(String(svg?.props.alt)).toContain('Pixel-art')
})

test('cinematic with the film effect off draws the vector scene alone', { options: { style: 'cinematic', film: false } }, async $ => {
  const ui = await $.ui.mount(BACKDROP)
  const shader = await ui.find({ type: 'Shader' })
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  expect(shader === undefined).toBe(true)
  expect(String(svg?.props.source).includes('crispEdges')).toBe(false)
})

test('a level the earlier, non-inverted version stored is declined', async ($, on) => {
  on('state.get', () => ({ value: { value: 1, version: 1 } }))
  const ui = await $.ui.mount(BACKDROP)
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  expect(String(svg?.props.alt)).toContain('100%')
})
