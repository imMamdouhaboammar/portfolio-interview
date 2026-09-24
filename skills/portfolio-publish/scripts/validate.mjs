#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  if (typeof value.artifact !== 'string' || !value.artifact) fail(errors, 'artifact required');
  if (!isObject(value.destination)) fail(errors, 'destination must be an object');
  if (!isObject(value.approvals)) fail(errors, 'approvals must be an object');
  if (!isObject(value.deployment)) fail(errors, 'deployment must be an object');
  const status = value.deployment?.status;
  if (!['pass','fail','not-run'].includes(status)) fail(errors, 'deployment.status must be pass|fail|not-run');
  if (status === 'pass') {
    if (value.approvals?.qaPassed !== true) fail(errors, 'successful deployment requires qaPassed');
    if (value.approvals?.publishApproved !== true) fail(errors, 'successful deployment requires publishApproved');
    if (value.approvals?.contactsExposed === true && value.approvals?.contactApproved !== true) fail(errors, 'successful deployment with contacts requires contactApproved');
    if (typeof value.liveUrl !== 'string' || !/^https:\/\//.test(value.liveUrl)) fail(errors, 'successful deployment requires https liveUrl');
  }
  if (!Array.isArray(value.postDeployChecks)) fail(errors, 'postDeployChecks must be an array');
  if (!Array.isArray(value.blockers)) fail(errors, 'blockers must be an array');
  const serialized = JSON.stringify(value);
  if (/\b(?:token|password|private[_-]?key)\b\s*[:=]\s*["'][^"']{8,}/i.test(serialized)) fail(errors, 'release record appears to contain secret material');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "artifact": "portfolio/site",
  "destination": {
    "host": "github-pages",
    "target": "owner/repo",
    "url": "https://owner.github.io/repo/"
  },
  "approvals": {
    "qaPassed": true,
    "publishApproved": true,
    "contactApproved": true,
    "contactsExposed": true
  },
  "deployment": {
    "status": "pass",
    "action": "deploy",
    "evidence": "authorized GitHub release action succeeded"
  },
  "liveUrl": "https://owner.github.io/repo/",
  "postDeployChecks": [
    {
      "name": "home",
      "status": "pass"
    }
  ],
  "rollbackPlan": "redeploy previous commit",
  "blockers": [],
  "statePatch": {
    "published": true
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
    console.log('portfolio-publish validator selftest passed');
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
  console.log('portfolio-publish artifact valid');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
