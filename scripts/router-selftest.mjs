#!/usr/bin/env node
import { route, detectIntents, graph } from '../skills/portfolio-router/scripts/route.mjs';

let failed=0;
function expect(ok,label){ console.log((ok?'ok  ':'FAIL')+label); if(!ok) failed++; }

const fresh=route('Build me a portfolio website',{});
expect(fresh.selected==='portfolio-interview','fresh create starts with interview when no source exists');
expect(fresh.plan.join('>')==='portfolio-interview','create plan is minimal at current state');

const sourced=route('Create my portfolio',{sourcesAvailable:true,sourcesReviewed:false});
expect(sourced.selected==='portfolio-source','available unreviewed evidence routes to source');

const build=route('build the site',{factsApproved:true,copyApproved:true,layoutApproved:true});
expect(build.selected==='portfolio-build' && build.status==='ready','approved build routes directly to builder');

const prereq=route('build the site',{});
expect(prereq.selected==='portfolio-interview','build resolves earliest unmet prerequisite');
expect(prereq.plan.at(-1)==='portfolio-build','build plan retains requested downstream outcome');

const repair=route('publish it',{
  factsApproved:true,copyApproved:true,layoutApproved:true,buildExists:true,qaPassed:false,
  qaIssues:[{type:'rtl',severity:'high'}]
});
expect(repair.selected==='portfolio-design','blocking RTL QA issue routes to design repair');

const blocked=route('publish it',{
  factsApproved:true,copyApproved:true,layoutApproved:true,buildExists:true,qaPassed:true,
  contactsExposed:true,publishApproved:false,contactApproved:false
});
expect(blocked.status==='blocked_approval' && blocked.blockers[0].includes('publishApproved'),'publish gate requires explicit publication approval');

const blockedContact=route('publish it',{
  factsApproved:true,copyApproved:true,layoutApproved:true,buildExists:true,qaPassed:true,
  contactsExposed:true,publishApproved:true,contactApproved:false
});
expect(blockedContact.status==='blocked_approval' && blockedContact.blockers[0].includes('contactApproved'),'public contact gate is independent');

const intents=detectIntents('review the UX then deploy the site');
expect(intents.some(x=>x.intent==='design') && intents.some(x=>x.intent==='publish'),'multi-intent detector keeps more than the first match');
expect(graph.nodes.some(n=>n.id==='portfolio-router'),'graph exposes router node');

if(failed){ console.error('\n'+failed+' router test(s) failed'); process.exit(1); }
console.log('\nrouter selftest passed');
