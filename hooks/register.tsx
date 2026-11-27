import { atom, read, update } from 'claude-code'
import type { Register, StateDollar, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { glowOf, levelFromPercent, MAX_LEVEL } from './level'
import { styleFrom } from './styles'

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
  // A light, sky-tinted glass: the chat column melts into the night instead of standing out as a dark strip.
  backdrop: { scene: SCENE, glass: { blur: 14, tint: '#13163e', opacity: 0.4 } },
}

const scenes = new Map<number, string>()

const sceneFor = (buildScene: (level: number) => string, level: number) => {
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

// A change of style in the config menu reloads the module, so the scene cache holds one style.
export const register: Register = (on, options) => {
  const look = styleFrom(options)

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) $.ui.toast(unpainted)
    // Only the desktop and mobile apps draw a theme; the terminal stays as it is, with no warning.
    await $.theme.set({ ...LOOK, style: look.chat }).catch(error => {
      $.ui.log(String(error))

      return $.theme.set(LOOK)
    })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) await syncGlow($, e.context.percent)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== SCENE) return next(e)
    const { Shader, Svg } = $.ui.resolve(e)
    const level = await read($, glow)
    const alt = `${look.picture}, Tokyo Tower lit at ${Math.round(glowOf(level) * 100)}%`
    const scene = <Svg source={sceneFor(look.buildScene, level)} alt={alt} isInteractive />
    if (!look.hasFilm) return scene

    // The Svg is the whole scene on its own; the shader adds the film look where the app plays it.
    return (
      <Shader module="./cinematic/cinema.ts" values={{ glow: glowOf(level) }}>
        {scene}
      </Shader>
    )
  })
}
