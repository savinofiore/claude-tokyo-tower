# Contributing

Pull requests are welcome: new scene details, fixes, better tests.

## Workflow

1. Fork the repository and create a branch from `main`.
2. Make your change and run the checks locally:

   ```bash
   claude plugin validate .
   claude plugin test .
   scripts/check-sandbox.sh
   ```

3. Try it in the desktop app with `claude --plugin-dir <your clone>`.
4. Open a pull request against `main` and fill in the template. Include a screenshot if the
   scene changes.

`main` is protected: every change goes through a pull request, needs the CI checks to pass
and an approval from the maintainer.

## Rules

- No network access, no `eval` / `new Function`, no external assets. See
  [SECURITY.md](SECURITY.md).
- No new runtime dependencies: the plugin ships as plain source files.
- `hooks/make-colors.js` is generated: don't edit it by hand.
- Keep motion slow and flash-free, and respect reduced motion.
- Bump `version` in `.claude-plugin/plugin.json` when a change should reach users.

## Reporting bugs

Open an issue with the bug template. For security problems use private reporting instead
(see [SECURITY.md](SECURITY.md)).
