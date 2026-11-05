// Re-syncs src/core with the transport core of zxclushkin/dsh-plugin-antigravity.
//
//   node tools/sync-core.mjs            copy the files and refresh upstream.json
//   node tools/sync-core.mjs --check    verify the vendored files still match upstream.json
//
// ANTIGRAVITY_PLUGIN_DIR points at a checkout of the plugin repository (default:
// ../dsh-plugin-antigravity next to this repository).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'src', 'core');
const manifestPath = path.join(target, 'upstream.json');
const source = path.resolve(process.env.ANTIGRAVITY_PLUGIN_DIR || path.join(root, '..', 'dsh-plugin-antigravity'));
const sourceDir = path.join(source, 'plugin', 'src');
const checkOnly = process.argv.includes('--check');
const files = ['antigravity.mjs', 'gemini.mjs', 'errors.mjs', 'throttle.mjs'];

const sha256 = (bytes) => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

if (checkOnly) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let failed = false;
  for (const name of files) {
    const expected = manifest.files?.[name];
    const actual = sha256(fs.readFileSync(path.join(target, name)));
    if (expected !== actual) {
      failed = true;
      console.error('drift: src/core/' + name + ' is ' + actual + ', upstream.json says ' + expected);
    }
  }
  if (failed) {
    console.error('Re-run node tools/sync-core.mjs against a plugin checkout to update the vendored core.');
    process.exit(1);
  }
  console.log('core check: ' + files.length + ' files match upstream.json (commit ' + manifest.commit.slice(0, 7) + ')');
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.error('plugin checkout not found at ' + sourceDir + '; set ANTIGRAVITY_PLUGIN_DIR');
  process.exit(1);
}

const commit = execFileSync('git', ['-C', source, 'log', '-1', '--format=%H', '--', 'plugin/src'], { encoding: 'utf8' }).trim();
const manifest = {
  source: 'zxclushkin/dsh-plugin-antigravity',
  path: 'plugin/src',
  commit,
  syncedAt: new Date().toISOString(),
  files: {},
};
for (const name of files) {
  const bytes = fs.readFileSync(path.join(sourceDir, name));
  fs.writeFileSync(path.join(target, name), bytes);
  manifest.files[name] = sha256(bytes);
  console.log('copied ' + name + ' (' + bytes.length + ' bytes)');
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('upstream.json updated: commit ' + commit.slice(0, 7));
