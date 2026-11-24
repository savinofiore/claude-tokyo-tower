#!/usr/bin/env bash
# Claude Code status line that dims the Tokyo Tower Warp theme as the context fills up.
# It reads the status line JSON on stdin, picks a light level (10 = empty context, 0 = 160k tokens)
# and points ~/.warp/themes/tokyo_tower.yaml at that level's image.
# Warp reloads the theme on its own when the file changes. Needs jq.
set -euo pipefail

THEME_DIR="${TOKYO_TOWER_WARP_THEMES:-$HOME/.warp/themes}"
THEME_FILE="$THEME_DIR/tokyo_tower.yaml"
MAX_LEVEL=10

input=$(cat)

# Lights follow the tokens in use against a 200k scale: with a 1M window the percentage would
# barely move, so the city goes dark at 160k tokens whatever the model.
SCALE_TOKENS=200000
tokens=$(printf '%s' "$input" | jq -r '
  .context_window.current_usage as $u
  | ($u.input_tokens // 0) + ($u.cache_creation_input_tokens // 0) + ($u.cache_read_input_tokens // 0)
  | floor' 2>/dev/null || echo 0)
percent=$((tokens * 100 / SCALE_TOKENS))

level=$((MAX_LEVEL - percent / 8))
((level < 0)) && level=0
((level > MAX_LEVEL)) && level=$MAX_LEVEL

# Only the Warp session drives the Warp theme; other terminals just get the status text.
if [[ "${TERM_PROGRAM:-}" == "WarpTerminal" && -f "$THEME_FILE" ]]; then
  current=$(grep -m1 '^  path: ' "$THEME_FILE" || true)
  wanted=$(printf '%s' "$current" | sed -E "s/_[0-9]+\.png$/_${level}.png/")
  if [[ -n "$current" && "$current" != "$wanted" ]]; then
    tmp=$(mktemp "$THEME_DIR/.tokyo_tower.XXXXXX")
    sed "s|^  path: .*$|$wanted|" "$THEME_FILE" >"$tmp"
    mv "$tmp" "$THEME_FILE"
  fi
fi

bar=""
for ((i = 1; i <= MAX_LEVEL; i++)); do
  if ((i <= level)); then bar+="▮"; else bar+="▯"; fi
done
printf '\033[38;2;255;122;47m東京タワー\033[0m %s %sk tokens\n' "$bar" "$((tokens / 1000))"
