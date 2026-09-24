#!/usr/bin/env node
// Repository-level entrypoint; the self-contained portable skill owns routing.
import { route } from '../skills/portfolio-interview/scripts/route.mjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const a = process.argv.slice(2), opt = name => { const i=a.indexOf(name); return i<0?null:a[i+1]; };
try {
  if (a.includes('--help')) console.log('Usage: node scripts/route.mjs --task "..." [--state state.json] [--intent create|source|interview|story|design|build|audit|publish]');
  else console.log(JSON.stringify(route(opt('--task')||'',opt('--state')?JSON.parse(readFileSync(resolve(opt('--state')),'utf8')):{},opt('--intent')),null,2));
} catch(e) { console.error(e.message); process.exitCode=1; }
