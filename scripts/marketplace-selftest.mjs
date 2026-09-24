#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;

function expect(ok, label, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) {
    expect(false, path + ' is valid JSON', error.message);
    return null;
  }
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  return match ? match[1] : '';
}

const marketplacePath = join(root, '.claude-plugin', 'marketplace.json');
const pluginPath = join(root, '.claude-plugin', 'plugin.json');

expect(existsSync(marketplacePath), 'marketplace manifest exists at .claude-plugin/marketplace.json');
expect(existsSync(pluginPath), 'plugin manifest exists at .claude-plugin/plugin.json');

const marketplace = readJson(marketplacePath);
const plugin = readJson(pluginPath);
const kebab = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

if (marketplace) {
  expect(kebab.test(marketplace.name || ''), 'marketplace name is kebab-case', marketplace.name || 'missing');
  expect(typeof marketplace.owner?.name === 'string' && marketplace.owner.name.length > 0, 'marketplace owner.name is present');
  expect(Array.isArray(marketplace.plugins) && marketplace.plugins.length > 0, 'marketplace exposes at least one plugin');

  const entry = (marketplace.plugins || []).find(item => item?.name === 'portfolio-interview');
  expect(Boolean(entry), 'marketplace exposes portfolio-interview');
  if (entry) {
    expect(entry.source === '.', 'portfolio-interview installs from repository root', String(entry.source));
    expect(entry.strict === true, 'marketplace entry keeps plugin.json authoritative');
    expect(entry.repository === 'https://github.com/imMamdouhaboammar/portfolio-interview', 'marketplace repository points to this repo');
  }

  if (plugin && entry) {
    expect(plugin.name === entry.name, 'plugin name matches marketplace entry');
    expect(plugin.version === entry.version, 'plugin version matches marketplace entry', `${plugin.version} vs ${entry.version}`);
    expect(marketplace.metadata?.version === plugin.version, 'marketplace metadata version matches plugin version');
  }
}

if (plugin) {
  expect(plugin.name === 'portfolio-interview', 'plugin manifest name is portfolio-interview');
  expect(plugin.repository === 'https://github.com/imMamdouhaboammar/portfolio-interview', 'plugin repository points to this repo');
  expect(plugin.homepage === 'https://github.com/imMamdouhaboammar/portfolio-interview', 'plugin homepage points to this repo');
}

for (const relative of ['skills', 'agents', 'hooks/hooks.json']) {
  expect(existsSync(join(root, relative)), 'plugin auto-discovery component exists: ' + relative);
}

const hooks = readJson(join(root, 'hooks', 'hooks.json'));
expect(Boolean(hooks?.hooks?.PreToolUse?.length), 'PreToolUse guard hook is configured');
expect(Boolean(hooks?.hooks?.PostToolUse?.length), 'PostToolUse lint hook is configured');

const agentSkills = {
  'portfolio-orchestrator.md': 'portfolio-router',
  'portfolio-source-worker.md': 'portfolio-source',
  'portfolio-story-worker.md': 'portfolio-story',
  'portfolio-design-worker.md': 'portfolio-design',
  'portfolio-build-worker.md': 'portfolio-build',
  'portfolio-audit-worker.md': 'portfolio-audit',
  'portfolio-publish-worker.md': 'portfolio-publish'
};

for (const [file, skill] of Object.entries(agentSkills)) {
  const path = join(root, 'agents', file);
  expect(existsSync(path), 'agent exists: ' + file);
  if (!existsSync(path)) continue;
  const fm = frontmatter(readFileSync(path, 'utf8'));
  const agentName = file.endsWith('.md') ? file.slice(0, -3) : file;
  expect(new RegExp('^name:\\s+' + agentName + '$', 'm').test(fm), file + ' has matching agent name');
  expect(new RegExp('^\\s*-\\s+' + skill + '\\s*$', 'm').test(fm), file + ' preloads ' + skill);
}

const claudeProbe = spawnSync('claude', ['--version'], { encoding: 'utf8' });
if (claudeProbe.error?.code === 'ENOENT') {
  console.log('skip Claude CLI validation — claude executable not installed in this environment');
} else if (claudeProbe.status !== 0) {
  expect(false, 'claude --version succeeds', (claudeProbe.stderr || claudeProbe.stdout || '').trim());
} else {
  const validate = spawnSync('claude', ['plugin', 'validate', '.'], { cwd: root, encoding: 'utf8' });
  expect(validate.status === 0, 'claude plugin validate .', (validate.stderr || validate.stdout || '').trim());
}

if (failures) {
  console.log(`\n${failures} marketplace failure(s)`);
  process.exit(1);
}
console.log('\nmarketplace selftest passed');
