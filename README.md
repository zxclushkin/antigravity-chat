# Antigravity Models for VS Code

[![ci](https://github.com/zxclushkin/antigravity-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/zxclushkin/antigravity-chat/actions/workflows/ci.yml)
[![release](https://github.com/zxclushkin/antigravity-chat/actions/workflows/release.yml/badge.svg)](https://github.com/zxclushkin/antigravity-chat/actions/workflows/release.yml)

Google **Antigravity** models — Gemini 3.8/3.5/3/2.5, Claude Opus/Sonnet 5.5, GPT-OSS 120B and
the Gemini image model — inside VS Code chat, as a native
[`LanguageModelChatProvider`](https://code.visualstudio.com/api/extension-guides/ai/language-model-chat-provider).

No API key, no proxy, no separate account: the extension reuses the session of the
**installed Antigravity app** (the OS keyring entry `gemini:antigravity`) and talks to the same
private endpoint from inside the extension host.

```
VS Code chat / Copilot agent
   │  vscode.lm.registerLanguageModelChatProvider('antigravity', …)
   ▼
antigravity-chat  ──►  POST https://daily-cloudcode-pa.googleapis.com
   │  text / tool-call / image parts                    /v1internal:streamGenerateContent
   ▼                                                     (Gemini-shaped JSON, SSE)
Gemini 3.8 / 3.5 / 3 / 2.5 · Claude Opus & Sonnet 5.5 · GPT-OSS 120B · gemini-3.1-flash-image
```

This is the VS Code front-end of the Antigravity work. The transport core (credentials, the
private `v1internal` client, Gemini translation, error classification) is shared with the DSH
plugin [`dsh-plugin-antigravity`](https://github.com/zxclushkin/dsh-plugin-antigravity) and
vendored into [`src/core`](src/core/README.md) with a hash-checked sync tool, so this
repository builds and installs on its own.

Unofficial client. Not affiliated with, endorsed by, or supported by Google or Microsoft.

> **Personal use, and a ToS risk.** This extension calls a private, undocumented Google API
> with the operator's own Antigravity session. Using it may breach Google's terms for
> Antigravity, it spends that account's plan quota, and Google can change or close the
> endpoint at any time. Supported platform: Windows with Antigravity installed and signed in.

## Status

Verified on Windows 11, VS Code **1.144.1** (bundled Copilot Chat), against a real Antigravity
installation:

| Check | Result |
|---|---|
| Offline unit checks (conversion, catalogue, streaming, provider, status, errors) | **22/22** |
| Live checks against the real endpoint (catalogue, text turn, tool call round trip, image input) | **4/4** |
| Live extras: image-model output (508 KB JPEG), tool names with dots/dashes, forced tool mode on Gemini/Claude/GPT-OSS | **works** (`AG_IMAGE=1 AG_EXTRA=1 npm run test:live`) |
| Extension host: contribution point + activation + model discovery | provider activated via `onLanguageModelChatProvider:antigravity`, 18 models (17 chat + 1 image) fetched from the account |
| Vendored core | four modules byte-identical to `dsh-plugin-antigravity` `plugin/src`, checked by `npm run check-core` in CI |

## Requirements

- VS Code **1.144** or newer with its bundled Copilot Chat (the model picker lives there).
- Antigravity installed and signed in on the same machine (Windows verified; the credential
  reader also knows macOS Keychain and Linux libsecret, best-effort and untested here).
- No API key, no `settings.json` editing.

## Install

The extension is not on the VS Code Marketplace — every
[release](https://github.com/zxclushkin/antigravity-chat/releases) carries the built VSIX, so
installing from GitHub needs no clone, no build and no account.

**From the release (recommended)**

```powershell
# GitHub CLI: replace the tag with the newest release from the Releases page
gh release download v0.1.0 --repo zxclushkin/antigravity-chat `
  --pattern antigravity-chat.vsix --dir "$env:TEMP\antigravity-chat"

code --install-extension "$env:TEMP\antigravity-chat\antigravity-chat.vsix" --force
```

Or open the [Releases page](https://github.com/zxclushkin/antigravity-chat/releases), download
`antigravity-chat.vsix`, then in VS Code: **Extensions → ⋯ → Install from VSIX…**.

**From source**

```powershell
npm install
npm run package
code --install-extension antigravity-chat.vsix --force
```

Then, in **Chat**, open the model picker → **Manage Models…** → **Antigravity** → check the
models you want. They appear in the picker under "Antigravity"; pick one and chat. Agent mode
(tools, terminal, edits) works because the provider implements the same tool protocol Copilot
uses for its own models.

Maintainers publish a release by pushing a version tag — CI builds, tests and attaches the VSIX
(`.github/workflows/release.yml`):

```powershell
git tag v0.1.1
git push origin v0.1.1
```

## What works

| Capability | State |
|---|---|
| Text streaming, multi-turn chat | works |
| Tool calling (agent mode: read/edit files, terminal, MCP tools) incl. parallel calls | works; the Gemini `thoughtSignature` is preserved inside the tool-call id and replayed exactly |
| Image input (screenshots, pasted images, attachments) | works |
| Image output — the `gemini-3.1-flash-image` model returns a rendered image part | works |
| Reasoning effort / "Thinking" block | not surfaced: VS Code has no thinking part for extension providers; enable `antigravity.showThinking` to stream the reasoning as plain text |
| Token counting | estimated at 4 characters per token (Gemini's tokenizer is not shipped) |
| Quota / auth / rate-limit failures | translated into actionable messages instead of raw JSON |
| Model list | per account: 17 chat models + 1 image model on the reference account, cached for 10 minutes |
| Grounding (`google_search`) | not exposed: the endpoint rejects search together with function declarations, which is what agent turns need |

The provider deliberately reports `toolCalling: false` for image models and `imageInput` only
when the account catalogue says so.

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `antigravity.showThinking` | `false` | Stream the model's reasoning into the answer (debug aid; it appears as plain text). |
| `antigravity.maxConcurrentRequests` | `2` | How many requests may run at once. |
| `antigravity.requestSpacingMs` | `250` | Minimum gap between requests, so traffic looks like a normal IDE session. |
| `antigravity.upstreamHost` | `""` | Override the API host (advanced; needs a window reload). |
| `antigravity.logLevel` | `info` | Output channel verbosity: `off`, `info`, `debug`. |

## Commands

| Command | What it does |
|---|---|
| `Antigravity: Show account status` | Plan, project, token state, quota per model and the model list, as a markdown document. |
| `Antigravity: Refresh model list` | Forces a catalogue reload and notifies the picker. |
| `Antigravity: Show log` | Opens the output channel. |

## How it is built

```
src/
  extension.ts   activation: provider registration, commands, settings
  provider.ts    LanguageModelChatProvider: messages in, parts out
  harness.ts     VS Code messages  -> transport message vocabulary
  generation.ts  upstream SSE events -> text / thinking / toolCall / image
  catalogue.ts   account models -> LanguageModelChatInformation
  status.ts      account status markdown
  core/          vendored transport (see src/core/README.md)
test/            offline checks, live checks, extension-host smoke test
tools/           sync-core.mjs: refresh and verify the vendored core
```

`esbuild` bundles `src/` and `src/core/` into `dist/extension.js`, so the installed VSIX is
self-contained. The provider never imports the `vscode` module at runtime — part constructors
are injected — which is what makes the whole request path testable in plain Node.

## Development

```powershell
npm install
npm run typecheck     # tsc --noEmit against @types/vscode
npm test              # 22 offline checks
npm run test:live     # real endpoint: catalogue, text, tool round trip, image input
AG_IMAGE=1 AG_EXTRA=1 npm run test:live   # + image-model output and odd tool names
npm run package       # builds dist/ and antigravity-chat.vsix
```

Updating the vendored core (needs a checkout of the DSH plugin repository):

```powershell
$env:ANTIGRAVITY_PLUGIN_DIR = "..\dsh-plugin-antigravity"
npm run sync-core     # copy plugin/src/{antigravity,gemini,errors,throttle}.mjs + refresh upstream.json
npm run check-core    # verify hashes only (what CI runs)
```

Extension-host smoke test (proves the contribution point, activation event and live catalogue
inside a real VS Code). Redirect the output: VS Code is a GUI process, so a plain invocation
returns immediately and hides the test log.

```powershell
$env:ELECTRON_RUN_AS_NODE = $null
$code = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe"
$testArgs = @(
  "--extensionDevelopmentPath=$PWD",
  "--extensionTestsPath=$PWD\test\host.cjs",
  "--user-data-dir=$env:TEMP\ag-vscode-test"
)
Start-Process $code -ArgumentList $testArgs -Wait -RedirectStandardOutput "$env:TEMP\ag-test.txt"
Get-Content "$env:TEMP\ag-test.txt" | Select-String "\[host\]"
```

Expected: `[host] models: 18` and one line per model, including `gemini-3.1-flash-image`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Antigravity models do not appear | Open the model picker → **Manage Models…** → **Antigravity** and enable them. |
| "Antigravity is not signed in on this machine" | Open the Antigravity app, sign in, then run **Antigravity: Refresh model list**. |
| 401 / "token was rejected" | The stored session expired: sign in to Antigravity again. |
| 429 / quota message | The plan quota for that model is exhausted; the message includes the upstream reason. |
| The image model answers without an image | Image generation costs output tokens and the account has a separate image quota; retry later. |
| Everything works but replies are slow on Gemini 3 | Thinking is on by default on the service side; the reasoning text is hidden unless `antigravity.showThinking` is on. |

## License

MIT. See [LICENSE](LICENSE). Antigravity, Gemini and Google are trademarks of Google LLC;
Claude is a trademark of Anthropic; Visual Studio Code and Copilot are trademarks of Microsoft.
