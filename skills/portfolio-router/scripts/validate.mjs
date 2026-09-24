#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  const nodes = new Set(['portfolio-source','portfolio-interview','portfolio-story','portfolio-design','portfolio-build','portfolio-audit','portfolio-publish']);
  if (value.selected !== null && value.selected !== undefined && !nodes.has(value.selected)) fail(errors, 'selected is not a known specialist');
  if (!Array.isArray(value.plan)) fail(errors, 'plan must be an array');
  for (const node of value.plan || []) if (!nodes.has(node)) fail(errors, 'plan contains unknown node: ' + node);
  if (!Array.isArray(value.blockers)) fail(errors, 'blockers must be an array');
  if (!Array.isArray(value.signals)) fail(errors, 'signals must be an array');
  if (!isObject(value.handoff)) fail(errors, 'handoff must be an object');
  for (const key of ['from','to','reason','requestedOutcome']) if (typeof value.handoff?.[key] !== 'string') fail(errors, `handoff.${key} must be a string`);
  for (const key of ['artifacts','blockers']) if (!Array.isArray(value.handoff?.[key])) fail(errors, `handoff.${key} must be an array`);
  if (!isObject(value.handoff?.statePatch)) fail(errors, 'handoff.statePatch must be an object');
  if (!isObject(value.mergePolicy) || !Array.isArray(value.mergePolicy.allowedStateKeys)) fail(errors, 'mergePolicy.allowedStateKeys must be an array');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "intent": "build",
  "intents": [
    {
      "intent": "build",
      "score": 70
    }
  ],
  "status": "ready",
  "selected": "portfolio-build",
  "desired": "portfolio-build",
  "plan": [
    "portfolio-build"
  ],
  "blockers": [],
  "signals": [],
  "handoff": {
    "from": "portfolio-router",
    "to": "portfolio-build",
    "reason": "requested build with prerequisites met",
    "artifacts": [
      "portfolio/profile.json"
    ],
    "statePatch": {},
    "blockers": [],
    "requestedOutcome": "portfolio-build"
  },
  "mergePolicy": {
    "allowedStateKeys": [
      "buildExists"
    ]
  }
};

function main(argv) {
  if (argv.includes('--selftest')) {
    const result = validate(sample);
    if (!result.ok) {
      console.error(result.errors.join('\n'));
      process.exitCode = 1;
      return;
    }
    console.log('portfolio-router validator selftest passed');
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
  console.log('portfolio-router artifact valid');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
