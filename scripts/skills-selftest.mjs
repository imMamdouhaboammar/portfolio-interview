#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(root, 'skills');
let failures = 0;

function expect(ok, label, detail='') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fm = match[1];
  const lines = fm.split('\n');
  const value = key => {
    const line = lines.find(item => item.startsWith(key + ':'));
    if (!line) return null;
    let result = line.slice(key.length + 1).trim();
    if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) result = result.slice(1, -1);
    return result;
  };
  return { name:value('name'), description:value('description'), raw:fm };
}

const skillDirs = readdirSync(skillsRoot)
  .filter(name => {
    const p = join(skillsRoot, name);
    return statSync(p).isDirectory() && existsSync(join(p, 'SKILL.md'));
  })
  .sort();

expect(skillDirs.length === 8, 'eight specialist/orchestrator skill packs ship', skillDirs.join(', '));

for (const name of skillDirs) {
  const dir = join(skillsRoot, name);
  const skillPath = join(dir, 'SKILL.md');
  const text = readFileSync(skillPath, 'utf8');
  const fm = parseFrontmatter(text);

  expect(Boolean(fm), `${name}: SKILL.md has YAML frontmatter`);
  expect(fm?.name === name, `${name}: frontmatter name matches directory`, fm?.name || 'missing');
  expect(Boolean(fm?.description && fm.description.length >= 40 && fm.description.length <= 1024), `${name}: discovery description is specific and within 1024 chars`, String(fm?.description?.length || 0));
  expect(/metadata:\s*[\s\S]*?pack:\s*[\"']?full[\"']?/m.test(fm?.raw || ''), `${name}: metadata declares full pack`);
  expect(text.split('\n').length < 500, `${name}: SKILL.md stays under 500 lines`, String(text.split('\n').length));

  const required = [
    ['references/playbook.md', 'reference'],
    ['scripts/validate.mjs', 'validator'],
    ['assets/output-template.json', 'asset template'],
    ['evals/cases.json', 'evals']
  ];

  for (const [relative, label] of required) {
    const p = join(dir, relative);
    expect(existsSync(p), `${name}: ${label} exists`);
    expect(text.includes('`' + relative + '`'), `${name}: SKILL.md links ${relative}`);
  }

  try {
    const asset = JSON.parse(readFileSync(join(dir, 'assets', 'output-template.json'), 'utf8'));
    expect(asset.skill === name, `${name}: output template identifies skill`);
  } catch (error) {
    expect(false, `${name}: output template is valid JSON`, error.message);
  }

  try {
    const evals = JSON.parse(readFileSync(join(dir, 'evals', 'cases.json'), 'utf8'));
    const cases = evals.cases;
    expect(evals.skill === name, `${name}: eval manifest identifies skill`);
    expect(Array.isArray(cases) && cases.length >= 4, `${name}: at least four eval cases`, String(cases?.length || 0));
    for (const [i, test] of (cases || []).entries()) {
      expect(typeof test.id === 'string' && test.id.length > 0, `${name}: eval[${i}] has id`);
      expect(typeof test.prompt === 'string' && test.prompt.length > 0, `${name}: eval[${i}] has prompt`);
      expect(Array.isArray(test.assertions) && test.assertions.length >= 2, `${name}: eval[${i}] has behavioral assertions`);
    }
  } catch (error) {
    expect(false, `${name}: eval manifest is valid JSON`, error.message);
  }

  const validator = join(dir, 'scripts', 'validate.mjs');
  const syntax = spawnSync(process.execPath, ['--check', validator], { encoding:'utf8' });
  expect(syntax.status === 0, `${name}: validator syntax`, (syntax.stderr || '').trim());

  const self = spawnSync(process.execPath, [validator, '--selftest'], { encoding:'utf8' });
  expect(self.status === 0, `${name}: validator selftest`, (self.stderr || self.stdout || '').trim());
}

if (failures) {
  console.log(`\n${failures} skill-pack failure(s)`);
  process.exit(1);
}
console.log('\nskill-pack selftest passed');
