#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const graphUrl = new URL('../references/skill-graph.json', import.meta.url);
export const graph = JSON.parse(readFileSync(graphUrl, 'utf8'));

const node = id => graph.nodes.find(n => n.id === id);
const flag = (state,key) => state?.[key] === true;
const severityRank = {critical:0,high:1,medium:2,low:3};

export function detectIntents(task='') {
  const scores = new Map();
  for (const intent of graph.intents) {
    let score = 0;
    for (const pattern of intent.patterns) {
      if (new RegExp(pattern,'iu').test(task)) score += intent.weight;
    }
    if (score) scores.set(intent.id, score);
  }
  if (!scores.size) scores.set('create',1);
  return [...scores.entries()].sort((a,b)=>b[1]-a[1]).map(([intent,score])=>({intent,score}));
}

function firstRepair(state={}) {
  const issues = Array.isArray(state.qaIssues) ? [...state.qaIssues] : [];
  issues.sort((a,b)=>(severityRank[a?.severity] ?? 9)-(severityRank[b?.severity] ?? 9));
  for (const issue of issues) {
    const type = typeof issue === 'string' ? issue : issue?.type;
    if (graph.repairRoutes[type]) return {target:graph.repairRoutes[type], issue};
  }
  return null;
}

function nextCreateStage(state={}) {
  if (flag(state,'sourcesAvailable') && !flag(state,'sourcesReviewed')) return 'portfolio-source';
  if (!flag(state,'factsApproved')) return 'portfolio-interview';
  if (!flag(state,'copyApproved')) return 'portfolio-story';
  if (!flag(state,'layoutApproved')) return 'portfolio-design';
  if (!flag(state,'buildExists')) return 'portfolio-build';
  if (!flag(state,'qaPassed')) return 'portfolio-audit';
  return null;
}

function resolvePrerequisites(target,state,path=[],seen=new Set()) {
  if (!target) return {path,blocked:null};
  if (seen.has(target)) throw new Error('Cycle in prerequisite graph at '+target);
  const lineage = new Set(seen);
  lineage.add(target);
  const n = node(target);
  if (!n) throw new Error('Unknown graph node: '+target);

  for (const req of n.requires || []) {
    if (req.when && !flag(state,req.when)) continue;
    if (flag(state,req.flag)) continue;
    if (req.type === 'approval') {
      return {path,blocked:{type:'approval',flag:req.flag,target}};
    }
    const r = resolvePrerequisites(req.via,state,path,lineage);
    if (r.blocked) return r;
    if (!r.path.includes(req.via)) r.path.push(req.via);
  }
  if (!path.includes(target)) path.push(target);
  return {path,blocked:null};
}

export function route(task,state={},forcedIntent=null) {
  if (!state || Array.isArray(state) || typeof state !== 'object') throw new TypeError('State must be an object');

  const intents = forcedIntent ? [{intent:forcedIntent,score:Infinity}] : detectIntents(task);
  const repair = firstRepair(state);
  let requestedIntent = intents[0].intent;
  if (forcedIntent && forcedIntent !== 'create' && !graph.intentTargets[forcedIntent]) throw new Error('Unknown intent: '+forcedIntent);

  let desired = requestedIntent === 'create' ? nextCreateStage(state) : graph.intentTargets[requestedIntent];
  const signals = [];

  if (repair && ['create','audit','publish','build','design'].includes(requestedIntent)) {
    desired = repair.target;
    signals.push('Blocking QA issue rerouted to '+repair.target);
  }

  if (!desired) {
    return {
      graphVersion:graph.version,
      intent:requestedIntent,
      intents,
      status:'ready_for_publication_decision',
      selected:null,
      plan:[],
      next:'portfolio-publish',
      blockers:['Publication requires a separate explicit request and approval'],
      signals
    };
  }

  const resolved = resolvePrerequisites(desired,state);
  if (resolved.blocked) {
    return {
      graphVersion:graph.version,
      intent:requestedIntent,
      intents,
      status:'blocked_approval',
      selected:null,
      plan:resolved.path,
      next:resolved.blocked.target,
      blockers:['Explicit approval missing: '+resolved.blocked.flag],
      signals
    };
  }

  const plan = resolved.path;
  const selected = plan[0] || desired;
  return {
    graphVersion:graph.version,
    intent:requestedIntent,
    intents,
    status:selected===desired ? 'ready' : 'needs_prerequisite',
    selected,
    desired,
    plan,
    subsequent:plan.slice(1),
    blockers:[],
    signals,
    handoff:{
      from:'portfolio-router',
      to:selected,
      reason:selected===desired ? 'Best current match for task and state' : 'Required prerequisite for '+desired,
      artifacts:[],
      statePatch:{},
      blockers:[],
      requestedOutcome:desired
    }
  };
}

function cli(argv) {
  const option = key => { const i=argv.indexOf(key); return i<0?null:argv[i+1]; };
  if (argv.includes('--help')) {
    console.log('Usage: node scripts/route.mjs --task "..." [--state state.json] [--intent create|source|interview|story|design|build|audit|publish]');
    return;
  }
  const stateFile = option('--state');
  const state = stateFile ? JSON.parse(readFileSync(resolve(stateFile),'utf8')) : {};
  console.log(JSON.stringify(route(option('--task') || '', state, option('--intent')), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode=1; }
}
