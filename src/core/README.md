# Transport core (vendored)

These four modules are the Antigravity transport that this extension and the DSH plugin
[`dsh-plugin-antigravity`](https://github.com/zxclushkin/dsh-plugin-antigravity) share:
OAuth/token minting, the private `v1internal` client, Gemini request/response translation,
error classification and request shaping.

They are copied **byte for byte** from that repository's `plugin/src` so this repository can
be installed on its own (an extension cannot import files from a sibling checkout at runtime,
and the VSIX must be self-contained). Do not edit them here — edit upstream and re-sync:

```powershell
# once, with a local checkout of the plugin repo
$env:ANTIGRAVITY_PLUGIN_DIR = "..\dsh-plugin-antigravity"
node tools/sync-core.mjs           # copies the four files and refreshes upstream.json
node tools/sync-core.mjs --check   # verifies hashes; CI runs this
```

`upstream.json` records the source commit and the SHA-256 of every copied file, which is what
`--check` compares against. The extension-specific code (message conversion, model catalogue,
provider, status) lives one level up in `src/`.
