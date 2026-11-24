// The cinematic pass over the Svg scene, played on the GPU by the desktop app:
// bloom around every light, a slow city-lit haze, lens fringes, vignette and a fixed film grain.
// Nothing here pulses fast: the grain never moves and the haze drifts over minutes.
import {
  buffer,
  dot,
  fract,
  length,
  mix,
  picture,
  scene,
  shader,
  sin,
  smoothstep,
  time,
  values,
  vec2,
  vec3,
  vec4,
} from 'claude-code/shader'
import type { Pixel } from 'claude-code/shader'

const v = values({ glow: [0, 1] })

// Only what is bright feeds the bloom.
const lights = buffer({ scale: 0.5, filter: 'mipmap' }, p => {
  const c = scene.sample(p.uv)
  const luma = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722))

  return vec4(c.rgb * smoothstep(0.32, 0.85, luma), 1)
})

const hash = (q: vec2) => fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453)

const bloom = (uv: vec2) =>
  vec3(lights.sample(uv, 1).rgb * 0.45 + lights.sample(uv, 3).rgb * 0.4 + lights.sample(uv, 5).rgb * 0.35)

// The light the city throws up into the air, broken by slow moving bands of haze.
const haze = (uv: vec2) => {
  const drift = sin(uv.x * 5 + time * 0.03) * 0.5 + sin(uv.x * 11 - time * 0.02 + uv.y * 3) * 0.5

  return vec3(lights.sample(uv, 7).rgb * (0.6 + 0.25 * drift))
}

// Red and blue part slightly toward the corners, as through a real lens.
const lens = (uv: vec2) => {
  const off = vec2((uv - 0.5) * 0.0025)

  return vec3(scene.sample(uv + off).r, scene.sample(uv).g, scene.sample(uv - off).b)
}

const vignette = (uv: vec2) => 1 - 0.38 * smoothstep(0.35, 0.95, length(vec2((uv - 0.5) * vec2(1, 1.25))))

// A soft filmic curve: highlights roll off instead of clipping.
const tone = (c: vec3) => vec3(c / (c * 0.55 + 0.62))

const frameColor = (p: Pixel) => {
  const strength = 0.35 + 0.85 * v.glow
  const base = lens(p.uv)
  const lit = vec3(base + bloom(p.uv) * strength + haze(p.uv) * strength * 0.5)
  const graded = vec3(mix(lit, lit * vec3(1.04, 0.98, 1.06), 0.5) * vignette(p.uv))
  const grain = (hash(p.pixel) - 0.5) * 0.035

  return vec4(tone(graded) + grain, 1)
}

export default shader({ fps: 30, passes: [lights, picture(frameColor)] })
