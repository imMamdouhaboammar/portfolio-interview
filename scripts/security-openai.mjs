#!/usr/bin/env node
// Offline security regression for the distributable Skills-only Portfolio Plugin.
// Static checks only: not a replacement for a hosted secret scanner or live security review.
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../../plugins/portfolio-interview');
const failures=[];
function check(ok,label){if(!ok)failures.push(label)}
const forbiddenNames=/(^|\/)(\.env(?:\..+)?|id_rsa|id_ed25519|credentials\.json|service-account\.json|\.npmrc|\.pypirc|\.git-credentials|.*\.(?:pem|key|p12|pfx))$/i;
const tokens=[
  ['GitHub credential', /\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{36,}\b/g],
  ['OpenAI-style credential', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/g],
  ['AWS access key ID', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ['Private key PEM', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]
];
function visit(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const p=join(dir,entry.name), rel=relative(root,p).replaceAll('\\','/');
    check(!forbiddenNames.test('/'+rel),'sensitive filename: '+rel);
    check(!lstatSync(p).isSymbolicLink(),'symlink: '+rel);
    if(entry.isDirectory())visit(p);
    else if(entry.isFile() && /\.(md|mjs|js|json|yaml|yml|toml|svg|css|txt)$/i.test(entry.name)){
      const data=readFileSync(p,'utf8');
      for(const [label,pattern] of tokens){pattern.lastIndex=0;check(!pattern.test(data),label+' in '+rel)}
    }
  }
}
check(existsSync(join(root,'plugin.json')),'missing portable manifest');
check(existsSync(join(root,'skills/portfolio-interview/SKILL.md')),'missing portfolio skill');
check(!existsSync(join(root,'.mcp.json')) && !existsSync(join(root,'.app.json')),'Skills-only package must not declare MCP/app');
check(!existsSync(join(root,'hooks')),'Claude hooks must remain outside portable package');
visit(root);
const manifest=JSON.parse(readFileSync(join(root,'plugin.json'),'utf8'));
check(!manifest.mcpServers && !manifest.apps && !manifest.hooks,'unexpected active external capability');
const skill=readFileSync(join(root,'skills/portfolio-interview/SKILL.md'),'utf8');
check(/Do not pretend the generated HTML exists/.test(skill),'missing non-execution fallback');
check(/publication/.test(skill) && /confirm/i.test(skill),'missing publication approval boundary');
const review=JSON.parse(readFileSync(join(root,'submission/proposed-reviewer-cases.json'),'utf8'));
check([...review.positive,...review.negative].every(c=>c.agentRunStatus==='not-executed'),'misleading live agent test evidence');
if(failures.length){console.error('Security regression failed:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Security regression passed: secret-shaped strings, sensitive filenames, symlinks, unexpected MCP/app/hooks, consent and test-evidence boundaries');
