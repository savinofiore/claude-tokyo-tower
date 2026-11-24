import type { PluginOptions, ThemeStyle } from 'claude-code'

import { buildScene as buildCinematic } from './cinematic/scene'
import { buildScene as buildPixel } from './pixel/scene'

// The look picked at install (the `style` field of plugin.json's userConfig).
export type SceneStyle = {
  name: 'cinematic' | 'pixel'
  buildScene: (level: number) => string
  // How the alt text names the picture.
  picture: string
  chat: ThemeStyle
  // Whether the GPU film pass plays over the scene (cinematic only).
  hasFilm: boolean
}

const CINEMATIC: Omit<SceneStyle, 'hasFilm'> = {
  name: 'cinematic',
  buildScene: buildCinematic,
  picture: 'Tokyo at night',
  // Softly rounded bubbles that float over the city on a diffuse shadow.
  chat: {
    UserMessage: { radius: 12, backgroundColor: '#1c1f4a', borderColor: '#ff7a2f', borderWidth: 2, shadow: { x: 0, y: 6, blur: 18, color: '#05061a' } },
    ToolUse: { radius: 10, backgroundColor: '#11143a' },
  },
}

const PIXEL: Omit<SceneStyle, 'hasFilm'> = {
  name: 'pixel',
  buildScene: buildPixel,
  picture: 'Pixel-art Tokyo at night',
  // Square bubbles with a hard pixel shadow.
  chat: {
    UserMessage: { radius: 0, backgroundColor: '#1c1f4a', borderColor: '#ff7a2f', borderWidth: 2, shadow: { x: 3, y: 3, blur: 0, color: '#05061a' } },
    ToolUse: { radius: 0, backgroundColor: '#11143a' },
  },
}

export const styleFrom = (options: PluginOptions): SceneStyle =>
  options.style === 'pixel' ? { ...PIXEL, hasFilm: false } : { ...CINEMATIC, hasFilm: options.film !== false }
