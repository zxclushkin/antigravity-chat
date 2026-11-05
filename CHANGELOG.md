# Changelog

## 0.1.0

- Standalone repository for the VS Code extension; the shared Antigravity transport is vendored
  into `src/core` with `upstream.json` provenance and `npm run check-core` in CI.
- `antigravity` language model chat provider: streaming text, tool calls with
  `thoughtSignature` replay, image input, image-model output.
- Account model catalogue (17 chat + 1 image model on the reference account), cached with a
  manual refresh command.
- Actionable translations for auth, quota, rate-limit and empty-response failures.
- Commands: show account status, refresh model list, show log. Settings for request shaping,
  thinking visibility, host override and log level.
- 22 offline checks, 4 live checks, and an extension-host smoke test that lists the account's
  18 models inside a real VS Code.
- Releases are built by CI from a `v*` tag and attached as `antigravity-chat.vsix`.
