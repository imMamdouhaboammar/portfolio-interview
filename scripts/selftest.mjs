#!/usr/bin/env node
// Builds every valid fixture, runs the checks, and confirms the invalid
// fixture is rejected. Browser checks run only with --browser.
//   node scripts/selftest.mjs [--browser]

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = (n) => join(root, 'evals', 'fixtures', n);
const run = (script, args) => execFileSync(process.execPath, [join(root, 'scripts', script), ...args], { encoding: 'utf8', stdio: 'pipe' });
const browser = process.argv.includes('--browser') ? [] : ['--no-browser'];
const work = mkdtempSync(join(tmpdir(), 'portfolio-selftest-'));
let failed = 0;

function expect(ok, label) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}

try {
  for (const name of ['designer-bilingual.json', 'lawyer-arabic.json']) {
    const out = join(work, name.replace('.json', ''));
    run('build.mjs', [fx(name), '--out', out]);
    expect(existsSync(join(out, 'index.html')) && existsSync(join(out, 'llms.txt')), `${name} builds`);
    try {
      run('check.mjs', [fx(name), out, '--shots', join(work, 'shots'), ...browser]);
      expect(true, `${name} passes checks`);
    } catch (e) {
      expect(false, `${name} passes checks\n${e.stdout || e.message}`);
    }
  }
  expect(existsSync(join(work, 'designer-bilingual', 'ar', 'index.html')), 'second locale lands in /ar/');

  // Variants of the bilingual fixture for edge cases found in review.
  const base = JSON.parse(readFileSync(fx('designer-bilingual.json'), 'utf8'));
  const variant = (name, mutate) => {
    const p = structuredClone(base);
    mutate(p);
    const file = join(work, `${name}.json`);
    writeFileSync(file, JSON.stringify(p));
    return file;
  };

  // External avatar + no site.url: localized pages keep the absolute URL and
  // no page links to a sitemap that was never written.
  const extFile = variant('external-avatar', (p) => {
    p.person.avatar = 'https://github.com/octocat.png?size=600';
    delete p.site.url;
    p.work = p.work.map(({ image, ...w }) => w);
  });
  const extOut = join(work, 'external-avatar');
  run('build.mjs', [extFile, '--out', extOut]);
  const arHtml = readFileSync(join(extOut, 'ar', 'index.html'), 'utf8');
  expect(!arHtml.includes('../https://'), 'external avatar is not prefixed with ../ on /ar/');
  expect(!arHtml.includes('sitemap.xml') && !existsSync(join(extOut, 'sitemap.xml')), 'no sitemap link or file without site.url');
  try {
    run('check.mjs', [extFile, extOut, '--no-browser']);
    expect(true, 'external avatar + no site.url passes checks');
  } catch (e) {
    expect(false, `external avatar + no site.url passes checks\n${e.stdout || e.message}`);
  }

  // Dropping a locale removes its old page from the same output folder.
  const enOnly = variant('en-only', (p) => { p.locales = ['en']; });
  run('build.mjs', [enOnly, '--out', extOut]);
  expect(!existsSync(join(extOut, 'ar')), 'rebuild without Arabic removes the stale /ar/ page');

  // A hidden email alone is not a contact route.
  const hidden = variant('hidden-email', (p) => { p.person.showEmail = false; delete p.person.whatsapp; p.socials = []; });
  let hiddenOut = '';
  try { run('check.mjs', [hidden, join(work, 'designer-bilingual'), '--no-browser']); } catch (e) { hiddenOut = e.stdout || ''; }
  expect(hiddenOut.includes('no public contact route'), 'hidden email with no other route is rejected');

  // Hooks: feed them the same JSON Claude Code sends on stdin.
  const hook = (name, payload) => spawnSync(process.execPath, [join(root, 'hooks', name)], { input: JSON.stringify(payload), encoding: 'utf8' });
  const builtPage = join(work, 'designer-bilingual', 'index.html');
  const guard = hook('guard-generated.mjs', { cwd: work, tool_name: 'Edit', tool_input: { file_path: builtPage } });
  expect(guard.status === 0 && JSON.parse(guard.stdout || '{}').hookSpecificOutput?.permissionDecision === 'deny', 'guard hook denies edits inside a generated site');
  const free = hook('guard-generated.mjs', { cwd: work, tool_name: 'Write', tool_input: { file_path: join(work, 'notes.md') } });
  expect(free.status === 0 && !free.stdout, 'guard hook stays silent outside generated sites');
  const lintDir = join(work, 'lint');
  execFileSync('mkdir', ['-p', lintDir]);
  copyFileSync(fx('invalid-copy.json'), join(lintDir, 'profile.json'));
  const lintBad = hook('lint-profile.mjs', { cwd: lintDir, tool_name: 'Write', tool_input: { file_path: 'profile.json' } });
  expect(lintBad.status === 2 && lintBad.stderr.includes('em dash'), 'lint hook reports copy errors with exit 2');
  copyFileSync(fx('lawyer-arabic.json'), join(lintDir, 'profile.json'));
  const lintGood = hook('lint-profile.mjs', { cwd: lintDir, tool_name: 'Edit', tool_input: { file_path: join(lintDir, 'profile.json') } });
  expect(lintGood.status === 0, 'lint hook passes a clean profile');
  writeFileSync(join(lintDir, 'package.json'), '{}');
  const lintOther = hook('lint-profile.mjs', { cwd: lintDir, tool_name: 'Edit', tool_input: { file_path: join(lintDir, 'package.json') } });
  expect(lintOther.status === 0, 'lint hook ignores files other than profile.json');
  const lintJunk = spawnSync(process.execPath, [join(root, 'hooks', 'lint-profile.mjs')], { input: 'not json', encoding: 'utf8' });
  expect(lintJunk.status === 0, 'hooks exit 0 on a malformed payload');

  // Agents: every file has the frontmatter Claude Code needs.
  const agents = readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).sort();
  const requiredAgents = [
    'portfolio-audit-worker.md',
    'portfolio-build-worker.md',
    'portfolio-copywriter.md',
    'portfolio-design-worker.md',
    'portfolio-orchestrator.md',
    'portfolio-publish-worker.md',
    'portfolio-qa.md',
    'portfolio-source-worker.md',
    'portfolio-story-worker.md',
    'profile-miner.md'
  ];
  expect(requiredAgents.every((f) => agents.includes(f)), `all compatibility + graph subagents ship (${agents.join(', ')})`);
  for (const f of agents) {
    const head = readFileSync(join(root, 'agents', f), 'utf8').split('---')[1] || '';
    expect(/^name: [a-z0-9-]+$/m.test(head) && /^description: .{40,}/m.test(head), `agent ${f} has name and description`);
  }

  // One version everywhere it is declared.
  const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
  const skillVersion = (readFileSync(join(root, 'SKILL.md'), 'utf8').match(/version: "([^"]+)"/) || [])[1];
  const marketFile = join(root, '..', '..', '..', '.claude-plugin', 'marketplace.json');
  const market = existsSync(marketFile) ? JSON.parse(readFileSync(marketFile, 'utf8')) : null;
  expect(plugin.version.startsWith(`${skillVersion}.`), `plugin.json ${plugin.version} matches SKILL.md ${skillVersion}`);
  if (market) expect(market.metadata?.version === plugin.version, `marketplace ${market.metadata?.version} matches plugin.json ${plugin.version}`);

  const bad = join(work, 'invalid');
  run('build.mjs', [fx('invalid-copy.json'), '--out', bad]);
  let output = '';
  try { run('check.mjs', [fx('invalid-copy.json'), bad, '--no-browser']); } catch (e) { output = e.stdout || ''; }
  for (const needle of ['em dash', 'not just', 'banned word "unlock"', 'ده مش X', 'has no source', 'must be an absolute https', 'has no name']) {
    expect(output.includes(needle), `invalid fixture is rejected for: ${needle}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failed) { console.log(`\n${failed} failure(s)`); process.exit(1); }
console.log('\nselftest passed');
