#!/usr/bin/env node
// Synchronize the canonical Claude-side runtime into the self-contained OpenAI Plugin.
// --check: nonmutating CI gate; --write: copy only enumerated runtime files.
// Other package files (portable SKILL.md, manifests, branding, reviewer docs) are authored separately.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const source = join(repo, '.claude/skills/portfolio-interview');
const target = join(repo, 'plugins/portfolio-interview/skills/portfolio-interview');
const files = [
  'scripts/build.mjs',
  'scripts/check.mjs',
  'assets/template/site.css',
  'assets/template/site.js',
  'references/copy-rules.md',
  'references/field-playbook.md',
  'references/interview.md',
  'references/profile-schema.md',
  'references/seo-geo.md',
  'references/host-compatibility.md',
  'agents/openai.yaml'
];
const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  console.error('Usage: node scripts/sync-openai.mjs [--check|--write]');
  process.exit(2);
}
let bad = 0;
for (const file of files) {
  const src = join(source, file), dst = join(target, file);
  if (!existsSync(src)) { console.error('Canonical file missing: ' + file); bad++; continue; }
  if (mode === '--write') {
    mkdirSync(dirname(dst), { recursive:true });
    writeFileSync(dst, readFileSync(src));
    console.log('synced ' + file);
  } else if (!existsSync(dst) || !readFileSync(src).equals(readFileSync(dst))) {
    console.error('OpenAI runtime mirror out of date: ' + file + ' (run --write)');
    bad++;
  }
}
if (bad) process.exit(1);
console.log(mode === '--check' ? 'OpenAI runtime mirror matches canonical Skill' : 'OpenAI runtime mirror synchronized');
