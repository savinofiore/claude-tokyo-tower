import { expect, test } from 'claude-code/testing'

import { levelFromPercent, MAX_LEVEL } from '../hooks/pixels'
import { buildScene } from '../hooks/scene'
import { TOWER_LIT } from '../hooks/tower'

const BACKDROP = {
  plugin: 'tokyo-tower',
  component: 'Backdrop',
  surface: 'desktop',
  props: { scene: 'tokyo-night', plugin: 'tokyo-tower', glass: false },
} as const

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

test('every scene fits the Svg limit and holds no refused markup', async () => {
  for (let level = 0; level <= MAX_LEVEL; level++) {
    const svg = buildScene(level)
    expect(svg.length < 131_072).toBe(true)
    expect(/<image|href|<!--|CDATA/.test(svg)).toBe(false)
  }
})

test('the tower goes dark as the context fills and relights after a compaction', async ($, on) => {
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

test('a level the earlier, non-inverted version stored is declined', async ($, on) => {
  on('state.get', () => ({ value: { value: 1, version: 1 } }))
  const ui = await $.ui.mount(BACKDROP)
  const svg = await ui.find({ type: 'Svg' })
  await ui.unmount()

  expect(String(svg?.props.alt)).toContain('100%')
})
