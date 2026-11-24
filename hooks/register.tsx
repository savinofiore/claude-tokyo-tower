import { atom, read, update } from 'claude-code'
import type { Register, StateDollar, ThemeSetArgs, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { levelFromPercent, MAX_LEVEL } from './pixels'
import { buildScene } from './scene'

const SCENE = 'tokyo-night'
// The tag declines a level stored by the earlier version, whose scale ran the other way.
const glow = atom({ plugin: 'tokyo-tower', key: 'glow' } as const, MAX_LEVEL, { shape: 'inverted' })

const { theme, problems } = makeColors({
  label: 'Tokyo Tower',
  only: 'dark',
  roles: { accent: '#ff7a2f', danger: '#ff4d6a', success: '#5fd38a', warning: '#ffc24b', pro: '#c77dff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b0d24',
        'surface-1': '#111432',
        'surface-2': '#171a3c',
        'surface-3': '#1d2045',
        'text-primary': '#eef0ff',
        'text-secondary': '#c3c6e8',
        'text-muted': '#9a9ec9',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 10, tint: '#0b0d24', opacity: 0.55 } },
}

// Square bubbles with a hard pixel shadow.
const STYLE: ThemeStyle = {
  UserMessage: {
    radius: 0,
    backgroundColor: '#1c1f4a',
    borderColor: '#ff7a2f',
    borderWidth: 2,
    shadow: { x: 3, y: 3, blur: 0, color: '#05061a' },
  },
  ToolUse: { radius: 0, backgroundColor: '#11143a' },
}

const scenes = new Map<number, string>()

const sceneFor = (level: number) => {
  const cached = scenes.get(level)
  if (cached !== undefined) return cached
  const svg = buildScene(level)
  scenes.set(level, svg)

  return svg
}

const syncGlow = async ($: StateDollar, percent: number | undefined) => {
  const level = levelFromPercent(percent)
  if ((await read($, glow)) === level) return
  await update($, glow, () => level)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.toast(unpainted)
    const set = await $.theme.set({ ...LOOK, style: STYLE }).catch(error => {
      $.ui.log(String(error))

      return $.theme.set(LOOK)
    })
    if (!set.isDrawn) $.ui.status(set.reason)

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) await syncGlow($, e.context.percent)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== SCENE) return next(e)
    const { Svg } = $.ui.resolve(e)
    const level = await read($, glow)
    const alt = `Pixel-art Tokyo at night, Tokyo Tower lit at ${Math.round((level / MAX_LEVEL) * 100)}%`

    return <Svg source={sceneFor(level)} alt={alt} isInteractive />
  })
}
