// Builds the Warp terminal theme in both styles: warp/<style>/tokyo_tower.yaml plus one PNG of the scene
// per light level (tokyo_tower_<build>_0.png dark ... _10.png fully lit). tokyo-tower-statusline.sh swaps between them.
// Each build gets a new <build> tag, because Warp caches images by file name.
// Run with: bun scripts/build-warp-theme.ts
// Needs ImageMagick's `magick` on PATH and Google Chrome, which draws the scene's gradients and blurs
// (set CHROME to its binary if it is not in /Applications).
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildScene as buildCinematic } from '../hooks/cinematic/scene'
import { MAX_LEVEL } from '../hooks/level'
import { buildScene as buildPixel } from '../hooks/pixel/scene'

const STYLES = { cinematic: buildCinematic, pixel: buildPixel } as const
const WARP_DIR = join(import.meta.dir, '..', 'warp')
const BUILD = Date.now().toString(36)
const imageName = (level: number) => `tokyo_tower_${BUILD}_${level}.png`
const IMAGE_SIZE = '3840x2160'
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
// A veil in the background colour, light on the sky and heavy at the bottom, where the prompt sits.
const VEIL = ['(', '-size', IMAGE_SIZE, 'gradient:rgba(20,20,24,0.45)-rgba(20,20,24,0.9)', ')', '-composite']

// A near-black neutral base (not pure black) so the photo-like scene, not a blue tint, sets the mood;
// orange stays the accent, the colour of the tower.
const THEME_YAML = `name: Tokyo Tower
accent: '#ff7a2f'
cursor: '#ff7a2f'
background: '#141418'
foreground: '#e8e6e3'
details: darker
background_image:
  path: ${imageName(MAX_LEVEL)}
  opacity: 60
terminal_colors:
  normal:
    black: '#2a2a30'
    red: '#e8556a'
    green: '#7fc98f'
    yellow: '#e8b85c'
    blue: '#7a9bd6'
    magenta: '#c08ad6'
    cyan: '#6cc3c9'
    white: '#c9c6c1'
  bright:
    black: '#5e5c63'
    red: '#ff7a8a'
    green: '#9de0aa'
    yellow: '#ffd27a'
    blue: '#9db8ea'
    magenta: '#dba9ee'
    cyan: '#94dde2'
    white: '#f4f2ee'
`

const screenshot = (svgPath: string, pngPath: string) => {
  const size = IMAGE_SIZE.replace('x', ',')
  const args = ['--headless=new', '--hide-scrollbars', `--window-size=${size}`, `--screenshot=${pngPath}`, `file://${svgPath}`]
  const result = spawnSync(CHROME, args, { stdio: 'ignore' })
  if (result.status !== 0) throw new Error('Chrome failed: set CHROME to its binary')
}

const renderScene = (svgPath: string, pngPath: string) => {
  screenshot(svgPath, pngPath)
  const result = spawnSync('magick', [pngPath, ...VEIL, pngPath], { stdio: 'inherit' })
  if (result.status !== 0) throw new Error('magick failed: is ImageMagick installed?')
}

const renderLevel = (outDir: string, build: (level: number) => string, level: number) => {
  const svgPath = join(outDir, `tokyo_tower_${level}.svg`)
  writeFileSync(svgPath, build(level))
  renderScene(svgPath, join(outDir, imageName(level)))
  unlinkSync(svgPath)
}

const buildStyle = (style: keyof typeof STYLES) => {
  const outDir = join(WARP_DIR, style)
  mkdirSync(outDir, { recursive: true })
  for (const old of readdirSync(outDir).filter(name => name.endsWith('.png'))) unlinkSync(join(outDir, old))
  for (let level = 0; level <= MAX_LEVEL; level++) renderLevel(outDir, STYLES[style], level)
  writeFileSync(join(outDir, 'tokyo_tower.yaml'), THEME_YAML)
  console.log(`Warp theme (${style}) written to ${outDir}`)
}

for (const style of Object.keys(STYLES) as (keyof typeof STYLES)[]) buildStyle(style)
