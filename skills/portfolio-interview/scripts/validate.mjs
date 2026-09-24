#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  if (!Array.isArray(value.answers)) fail(errors, 'answers must be an array');
  const kinds = new Set(['fact','preference','constraint','approval']);
  for (const [i, answer] of (value.answers || []).entries()) {
    if (!isObject(answer)) { fail(errors, `answers[${i}] must be an object`); continue; }
    if (!kinds.has(answer.kind)) fail(errors, `answers[${i}].kind invalid`);
  }
  if (!Array.isArray(value.approvalRecords)) fail(errors, 'approvalRecords must be an array');
  const approvals = new Map((value.approvalRecords || []).filter(isObject).map(r => [r.kind, r]));
  for (const [i, record] of (value.approvalRecords || []).entries()) {
    if (!isObject(record)) { fail(errors, `approvalRecords[${i}] must be an object`); continue; }
    if (typeof record.kind !== 'string' || !record.kind) fail(errors, `approvalRecords[${i}].kind required`);
    if (typeof record.approved !== 'boolean') fail(errors, `approvalRecords[${i}].approved must be boolean`);
    if (record.approved && (typeof record.scope !== 'string' || !record.scope.trim())) fail(errors, `approvalRecords[${i}].scope required when approved`);
    if (record.approved && (typeof record.evidence !== 'string' || !record.evidence.trim())) fail(errors, `approvalRecords[${i}].evidence required when approved`);
  }
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  const requiredApproval = {factsApproved:'facts',copyApproved:'copy',layoutApproved:'layout',publishApproved:'publish',contactApproved:'contact'};
  for (const [flag, kind] of Object.entries(requiredApproval)) {
    if (value.statePatch?.[flag] === true && !(approvals.get(kind)?.approved === true)) fail(errors, `${flag} requires an explicit ${kind} approval record`);
  }
  for (const key of ['resolvedConflicts','unresolvedQuestions','blockers']) if (value[key] !== undefined && !Array.isArray(value[key])) fail(errors, key + ' must be an array');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "answers": [
    {
      "id": "q1",
      "kind": "fact",
      "value": "Product Designer"
    }
  ],
  "approvalRecords": [
    {
      "kind": "facts",
      "approved": true,
      "scope": "role title",
      "evidence": "User explicitly confirmed"
    }
  ],
  "resolvedConflicts": [],
  "unresolvedQuestions": [],
  "statePatch": {
    "factsApproved": true
  },
  "blockers": []
};

function main(argv) {
  if (argv.includes('--selftest')) {
    const result = validate(sample);
    if (!result.ok) {
      console.error(result.errors.join('\n'));
      process.exitCode = 1;
      return;
    }
    console.log('portfolio-interview validator selftest passed');
    return;
  }

  const path = argv[0];
  if (!path || path === '--help') {
    console.log('Usage: node scripts/validate.mjs <artifact.json> | --selftest');
    return;
  }

  let value;
  try { value = JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) {
    console.error('Unable to read valid JSON: ' + error.message);
    process.exitCode = 1;
    return;
  }

  const result = validate(value);
  if (!result.ok) {
    for (const error of result.errors) console.error('- ' + error);
    process.exitCode = 1;
    return;
  }
  console.log('portfolio-interview artifact valid');
}

if (import.meta.url === new URL('file://' + process.argv[1]).href) main(process.argv.slice(2));
