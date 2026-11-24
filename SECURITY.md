# Security policy

## Supported versions

Only the latest release on `main` gets security fixes.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Report it privately through GitHub: open the repository's **Security** tab and click
**Report a vulnerability** (private vulnerability reporting). Include what you found, how
to reproduce it, and the version (`.claude-plugin/plugin.json`) you tested.

You can expect a first answer within 7 days. Once a fix is released the advisory is
published and you are credited, unless you prefer to stay anonymous.

## What this plugin is allowed to do

Tokyo Tower is a theme. Its hooks only set colors and draw an SVG backdrop from the
context fill level. It must never:

- make network requests (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, ...);
- run code built from strings (`eval`, `new Function`, string `setTimeout`);
- read or send conversation content, files, environment variables or credentials;
- load scripts, images or fonts from outside the repository.

CI enforces these rules (`scripts/check-sandbox.sh`). A change that breaks them is treated
as a security issue, even if it looks harmless.
