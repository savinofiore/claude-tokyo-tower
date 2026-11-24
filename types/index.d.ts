// 10 (tower fully lit, empty context) down to 0 (dark, context full).
export type GlowLevel = number

declare module 'claude-code' {
  interface PluginState {
    'tokyo-tower': { glow: Shaped<GlowLevel> }
  }
}
