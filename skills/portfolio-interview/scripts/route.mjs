#!/usr/bin/env node
// Deterministic, offline portfolio skill routing. No LLM or background agent is
// implied by "Neural Connections"; the graph encodes conditional handoffs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const here = new URL('../references/skill-graph.json', import.meta.url);
export const graph = JSON.parse(readFileSync(here, 'utf8'));
const node = id => graph.nodes.find(item => item.id === id);
const milestone = (state, key) => state[key] === true;
const repairTarget = { facts: 'portfolio-source', copy: 'portfolio-story', layout: 'portfolio-design', accessibility: 'portfolio-design', rtl: 'portfolio-design', build: 'portfolio-build', rendering: 'portfolio-build', metadata: 'portfolio-build' };
const intents = { source:'portfolio-source', interview:'portfolio-interview', story:'portfolio-story', design:'portfolio-design', build:'portfolio-build', audit:'portfolio-audit', publish:'portfolio-publish' };

export function detectIntent(task) {
  for (const item of graph.signals) if (new RegExp(item.pattern, 'iu').test(task)) return item.intent;
  return 'create';
}
export function route(task, state = {}, forcedIntent = null) {
  if (!state || Array.isArray(state) || typeof state !== 'object') throw new TypeError('State must be an object');
  const intent = forcedIntent || detectIntent(task || '');
  if (!(intent in intents) && intent !== 'create') throw new Error('Unknown intent: ' + intent);
  const reasons = [], signals = [], isCreate = intent === 'create';
  let target = intents[intent];
  const issues = Array.isArray(state.qaIssues) ? state.qaIssues : [];
  if ((isCreate || intent === 'audit' || intent === 'publish') && issues.length) {
    const repair = issues.map(i => repairTarget[typeof i === 'string' ? i : i.type]).find(Boolean);
    if (repair) { target = repair; signals.push('QA feedback routes to ' + repair); }
  }
  if (isCreate && !target) {
    if (milestone(state,'sourcesAvailable') && !milestone(state,'sourcesReviewed')) target='portfolio-source';
    else if (!milestone(state,'factsApproved')) target='portfolio-interview';
    else if (!milestone(state,'copyApproved')) target='portfolio-story';
    else if (!milestone(state,'layoutApproved')) target='portfolio-design';
    else if (!milestone(state,'buildExists')) target='portfolio-build';
    else if (!milestone(state,'qaPassed')) target='portfolio-audit';
    else target = null; // Explicit permission is required to publish.
  }
  if (!target) return {intent,selected:null,status:'ready_for_publication_decision',next:'portfolio-publish',route:[],blockers:['Publication requires a separate explicit request and approval'],signals,graphVersion:graph.version};
  const desired = target, seen = new Set();
  while (target) {
    if (seen.has(target)) throw new Error('Cycle in prerequisite graph at ' + target);
    seen.add(target);
    const item = node(target);
    if (!item) throw new Error('Unknown graph node: ' + target);
    const missing = item.requires.find(r => (!r.when || milestone(state,r.when)) && !milestone(state,r.flag));
    if (!missing) break;
    if (missing.type === 'approval') {
      reasons.push('Explicit approval missing: ' + missing.flag);
      return {intent,selected:null,status:'blocked_approval',next:target,route:[],blockers:reasons,signals,graphVersion:graph.version};
    }
    reasons.push(target + ' needs ' + missing.flag + '; route to ' + missing.via);
    target = missing.via;
  }
  const chain = [];
  if (target !== desired) chain.push({skill:target,reason:'Prerequisite for '+desired});
  else chain.push({skill:target,reason:'Matches request and available evidence'});
  if (target === 'portfolio-source' && isCreate) signals.push('Evidence intake before asking questions');
  if (intent === 'publish' && target === 'portfolio-publish') signals.push('User requested publication and all explicit approvals are present');
  return {intent,selected:target,status:target===desired?'ready':'needs_prerequisite',next:desired,route:chain,blockers:reasons,signals,graphVersion:graph.version};
}
function cli(argv) {
  const option = key => { const i = argv.indexOf(key); return i < 0 ? null : argv[i+1]; };
  if (argv.includes('--help')) { console.log('Usage: node scripts/route.mjs --task "..." [--state state.json] [--intent create|source|interview|story|design|build|audit|publish]'); return; }
  const task = option('--task') || '';
  const file = option('--state');
  const state = file ? JSON.parse(readFileSync(resolve(file),'utf8')) : {};
  console.log(JSON.stringify(route(task,state,option('--intent')),null,2));
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch(e) { console.error(e.message); process.exitCode=1; }
}
