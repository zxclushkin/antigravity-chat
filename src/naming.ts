// Human model names derived from Antigravity's wire ids.
//
// Mirrors `prettyModelName` in the DSH plugin's adapter, which lives next to that plugin's
// harness-specific model metadata; this repository keeps the same formatting without pulling
// the harness surface in. Wire ids such as `claude-sonnet-5-5-low` become
// "Claude Sonnet 5.5 (Low)".
const CAPITALISED = new Set(['claude', 'gemini', 'sonnet', 'opus', 'flash', 'lite', 'pro', 'thinking', 'image']);

const capitalise = (word: string): string => word[0].toUpperCase() + word.slice(1);

export function prettyModelName(id: string): string {
  const tokens = String(id).split('-');
  const words: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (/^\d+$/.test(token) && /^\d+$/.test(next || '')) {
      words.push(token + '.' + next);
      i++;
      continue;
    }
    if (token === 'gpt' && next === 'oss') {
      words.push('GPT-OSS');
      i++;
      continue;
    }
    if (/^\d+b$/i.test(token)) {
      words.push(token.toUpperCase());
      continue;
    }
    if (['medium', 'high', 'low'].includes(token)) {
      words.push('(' + capitalise(token) + ')');
      continue;
    }
    if (CAPITALISED.has(token)) {
      words.push(capitalise(token));
      continue;
    }
    words.push(token);
  }
  return words.join(' ');
}
