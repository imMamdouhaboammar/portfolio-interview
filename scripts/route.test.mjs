import test from 'node:test';
import assert from 'node:assert/strict';
import { graph, route, detectIntent } from '../skills/portfolio-interview/scripts/route.mjs';

const ready = {sourcesAvailable:true,sourcesReviewed:true,factsApproved:true,copyApproved:true,layoutApproved:true,buildExists:true,qaPassed:true,publishApproved:true,contactApproved:true,contactsExposed:true};

test('graph nodes and handoff endpoints resolve', () => {
  const names = graph.nodes.map(n=>n.id);
  assert.equal(new Set(names).size,names.length);
  for (const edge of graph.edges) { assert.ok(names.includes(edge.from),edge.from); assert.ok(names.includes(edge.to),edge.to); }
  for (const n of graph.nodes) for (const req of n.requires) if(req.via) assert.ok(names.includes(req.via));
});
test('first-time portfolio routes to source when sources exist',()=>assert.equal(route('make a portfolio',{sourcesAvailable:true}).selected,'portfolio-source'));
test('first-time portfolio routes to interview without sources',()=>assert.equal(route('عايز بورتفوليو').selected,'portfolio-interview'));
test('approved facts route to story',()=>assert.equal(route('create my portfolio',{factsApproved:true}).selected,'portfolio-story'));
test('approved copy routes to design',()=>assert.equal(route('portfolio',{factsApproved:true,copyApproved:true}).selected,'portfolio-design'));
test('approved layout routes to build',()=>assert.equal(route('portfolio',{factsApproved:true,copyApproved:true,layoutApproved:true}).selected,'portfolio-build'));
test('generated site routes to QA',()=>assert.equal(route('portfolio',{factsApproved:true,copyApproved:true,layoutApproved:true,buildExists:true}).selected,'portfolio-audit'));
test('complete site does not auto-publish',()=>assert.equal(route('portfolio',ready).status,'ready_for_publication_decision'));
test('unapproved publish is blocked even if QA passed',()=>assert.equal(route('publish', {...ready,publishApproved:false}).status,'blocked_approval'));
test('contact consent is independently required',()=>assert.equal(route('deploy', {...ready,contactApproved:false}).status,'blocked_approval'));
test('without exposed contacts does not require contact approval',()=>assert.equal(route('deploy',{...ready,contactsExposed:false,contactApproved:false}).selected,'portfolio-publish'));
test('without QA publish routes to audit',()=>assert.equal(route('انشر موقعي',{...ready,qaPassed:false}).selected,'portfolio-audit'));
test('copy-only request routes to story if facts approved',()=>assert.equal(route('rewrite headline',{factsApproved:true}).selected,'portfolio-story'));
test('copy-only request cannot bypass unapproved facts',()=>assert.equal(route('rewrite headline').selected,'portfolio-interview'));
test('source-only and audit-only intents are discoverable',()=>{assert.equal(detectIntent('read my resume'),'source');assert.equal(detectIntent('check site accessibility'),'audit')});
test('QA feedback re-enters appropriate skill',()=>{assert.equal(route('review my site',{...ready,qaIssues:['rtl']}).selected,'portfolio-design');assert.equal(route('review my site',{...ready,qaIssues:['facts']}).selected,'portfolio-source')});
test('forced unknown intent is rejected',()=>assert.throws(()=>route('',{},'rm -rf'),/Unknown intent/));
test('invalid state is rejected',()=>assert.throws(()=>route('',[]),/State must be an object/));
