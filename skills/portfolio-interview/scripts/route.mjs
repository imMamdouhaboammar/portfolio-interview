#!/usr/bin/env node
// Compatibility entrypoint. Canonical dynamic routing now lives in portfolio-router.
export { graph, detectIntents, route } from '../../portfolio-router/scripts/route.mjs';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { route } from '../../portfolio-router/scripts/route.mjs';

function cli(argv) {
  const option = key => { const i=argv.indexOf(key); return i<0?null:argv[i+1]; };
  if (argv.includes('--help')) {
    console.log('Usage: node scripts/route.mjs --task "..." [--state state.json] [--intent create|source|interview|story|design|build|audit|publish]');
    return;
  }
  const file=option('--state');
  const state=file ? JSON.parse(readFileSync(resolve(file),'utf8')) : {};
  console.log(JSON.stringify(route(option('--task') || '', state, option('--intent')), null, 2));
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode=1; }
}
