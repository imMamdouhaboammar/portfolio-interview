#!/usr/bin/env node
// PostToolUse hook. Lints a portfolio profile.json right after it is saved.
//
// Runs check.mjs --profile-only (copy rules, sources for numbers, contact
// routes, required fields). On errors it exits 2, which shows the report to
// Claude so the copy gets fixed before the next build. Any other file, or a
// profile.json that is not a portfolio profile, is ignored.

import { readFileSync } from 'node:fs';
import { basename, resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readTarget } from './read-input.mjs';

const target = await readTarget();
if (!target || basename(target.file) !== 'profile.json') process.exit(0);

const file = resolve(target.input.cwd || process.cwd(), target.file);
let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  process.stderr.write(`portfolio-interview: ${file} is not valid JSON after this edit (${e.message}). Fix it before building.\n`);
  process.exit(2);
}
// Only portfolio profiles: they carry a person block and either locales or a field.
if (!data || typeof data !== 'object' || !data.person || !(data.locales || data.field)) process.exit(0);

const check = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'check.mjs');
const run = spawnSync(process.execPath, [check, file, '--profile-only'], { encoding: 'utf8', timeout: 25000 });
if (run.status === 0) process.exit(0);

const report = (run.stdout || '').split('\n').filter((l) => /^\s+x |^errors/.test(l)).join('\n');
process.stderr.write(`portfolio-interview lint found problems in ${basename(dirname(file))}/profile.json. Fix them in the profile:\n${report || run.stderr || run.stdout}\n`);
process.exit(2);
