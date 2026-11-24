#!/usr/bin/env bash
# Fails if the plugin source uses APIs a theme must never need (see SECURITY.md).
set -euo pipefail
cd "$(dirname "$0")/.."

files=$(git ls-files 'hooks/*.ts' 'hooks/*.tsx' 'hooks/*.js' 'types/*.ts')

perl -ne '
  BEGIN { $bad = 0 }
  my @rules = (
    qr/\bfetch\s*\(/, qr/XMLHttpRequest/, qr/WebSocket/, qr/EventSource/, qr/sendBeacon/,
    qr/\beval\s*\(/, qr/\bnew\s+Function\s*\(/, qr/\bimport\s*\(/,
    qr/set(?:Timeout|Interval)\s*\(\s*["\x27`]/,
    qr{https?://(?!www\.w3\.org/2000/svg")}, qr/\bprocess\.env/, qr/\brequire\s*\(/,
    qr/child_process/, qr/["\x27]node:/,
  );
  for my $r (@rules) { if ($_ =~ $r) { print "$ARGV:$.: $_"; $bad = 1; last } }
  # Imports stay inside hooks/: the engine, its shader language, and the plugin own files
  # (./file, ./style/file, or ../file from a style folder).
  if (/\bfrom\s+["\x27]([^"\x27]+)["\x27]/ && $1 !~ m{^(claude-code(/shader)?|\./([\w-]+/)?[\w-]+(\.js)?|\.\./[\w-]+)$}) {
    print "$ARGV:$.: import not allowed: $_"; $bad = 1;
  }
  close ARGV if eof;
  END { exit $bad }
' $files || { echo "check-sandbox: forbidden API found above (see SECURITY.md)." >&2; exit 1; }

echo "check-sandbox: ok"
