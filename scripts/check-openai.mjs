#!/usr/bin/env node
// Offline structural and distribution checks. This is NOT a live-model benchmark
// or the independent Plugin Eval CLI, and it does not claim OpenAI portal acceptance.
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const pluginRoot = join(repo, 'plugins/portfolio-interview');
const root = join(repo, '.claude/skills/portfolio-interview');
const load = file => JSON.parse(readFileSync(file, 'utf8'));
const assert = (yes, message) => { if (!yes) throw new Error(message); };
const manifest = load(join(pluginRoot, 'plugin.json'));
const overlay = load(join(pluginRoot, '.codex-plugin/plugin.json'));
const claude = load(join(root, '.claude-plugin/plugin.json'));
const claudeMarket = load(join(repo, '.claude-plugin/marketplace.json'));
const openaiMarket = load(join(repo, '.agents/plugins/marketplace.json'));
const name = 'portfolio-interview', version = '1.3.0';
assert(manifest.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'portable schema');
assert(manifest.name === name && manifest.version === version, 'portable package identity/version');
assert(overlay.name === name && overlay.version === version && overlay.skills === './skills/', 'Codex overlay identity');
assert(claude.version === version && claudeMarket.metadata.version === version, 'Claude versions are out of sync');
const canonicalSkill = readFileSync(join(root,'SKILL.md'),'utf8');
const portableSkill = readFileSync(join(pluginRoot,'skills/portfolio-interview/SKILL.md'),'utf8');
assert(canonicalSkill.includes('version: "1.3"') && portableSkill.includes('version: "1.3"'), 'Skill version out of sync');
assert(!Object.keys(manifest).some(k => ['skills','mcpServers','apps'].includes(k)), 'portable manifest must use canonical skills/ discovery');
const openai = manifest.extensions?.['com.openai'];
const ui = openai?.interface;
assert(ui && typeof ui.displayName === 'string', 'OpenAI interface missing');
assert(JSON.stringify(ui) === JSON.stringify(overlay.interface), 'inline interface and compatibility overlay differ');
assert(!openai.apps && !openai.mcpServers && !openai.hooks && !ui.screenshots, 'unnecessary app/MCP/hook/screenshots declaration');
assert(ui.displayName.length <= 30 && ui.shortDescription.length <= 30, 'display copy too long');
assert(ui.capabilities.length <= 20 && ui.capabilities.every(c=>c.length<=120), 'capabilities invalid');
assert(ui.defaultPrompt.length > 0 && ui.defaultPrompt.length <=3 && ui.defaultPrompt.every(p=>p.length<=128 && !p.includes('@')), 'starter prompts invalid');
assert(openaiMarket.plugins.some(p=>p.name===name && p.source?.source==='local' && p.source?.path==='./plugins/portfolio-interview'), 'OpenAI local marketplace entry missing');
assert(claudeMarket.plugins.some(p=>p.name===name), 'Claude marketplace entry missing');
for (const skill of ['portfolio-interview','host-workspace-operator']) {
  const f=join(pluginRoot,'skills',skill,'SKILL.md');
  assert(existsSync(f), 'missing Skill: ' + skill);
  const content=readFileSync(f,'utf8');
  assert(content.startsWith('---\n') && content.includes('\nname: '+skill+'\n') && /\ndescription: .{25,}/.test(content.split('---')[1]), 'invalid frontmatter: '+skill);
}
for (const key of ['logo','composerIcon']) {
  const p=ui[key];assert(typeof p==='string' && /^\.\/assets\/[a-z0-9.-]+\.svg$/.test(p), 'unsafe branding path: '+key);
  const svg=readFileSync(join(pluginRoot,p),'utf8');
  const box=svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/);
  assert(svg.includes('<svg') && box && Number(box[3])===Number(box[4]) && Number(box[3])>=48, 'branding must be square SVG: '+key);
}
assert(existsSync(join(pluginRoot,'assets/logo-dark.svg')), 'missing dark brand variant');
const rootEntries=readdirSync(join(pluginRoot,'.codex-plugin'));
assert(rootEntries.length===1 && rootEntries[0]==='plugin.json', '.codex-plugin contains extra files');
function inspect(dir) {
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const p=join(dir,e.name);
    assert(!lstatSync(p).isSymbolicLink(), 'symlink in public Plugin: '+p);
    assert(!/(^\.env$|\.pem$|\.key$|\.p12$|\.zip$|\.DS_Store$)/i.test(e.name), 'prohibited package file: '+e.name);
    if (e.isDirectory()) inspect(p);
  }
}
inspect(pluginRoot);
for (const bad of ['.app.json','.mcp.json','mcp.json','hooks']) assert(!existsSync(join(pluginRoot,bad)), 'unneeded declaration or hooks: '+bad);
const fixture=load(join(pluginRoot,'submission/proposed-reviewer-cases.json'));
assert(fixture.version===version && fixture.positive.length===5 && fixture.negative.length===3, 'reviewer cases missing');
assert([...fixture.positive,...fixture.negative].every(c=>c.agentRunStatus==='not-executed' && c.id && c.prompt && c.expected), 'agent evidence must not be invented');
execFileSync(process.execPath, [join(root,'scripts/sync-openai.mjs'),'--check'],{stdio:'inherit'});
for (const script of ['scripts/build.mjs','scripts/check.mjs']) {
  execFileSync(process.execPath,['--check',join(pluginRoot,'skills/portfolio-interview',script)],{stdio:'inherit'});
}
console.log('OpenAI package structure, branding, paths, mirror and proposed-case checks passed');
