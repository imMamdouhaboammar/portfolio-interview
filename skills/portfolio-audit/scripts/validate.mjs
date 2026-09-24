#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  const modes = new Set(['static-only','local-browser','live-browser','mixed']);
  if (!modes.has(value.auditMode)) fail(errors, 'auditMode invalid');
  if (!Array.isArray(value.artifacts) || value.artifacts.length === 0) fail(errors, 'artifacts must name inspected output');
  if (!Array.isArray(value.checks)) fail(errors, 'checks must be an array');
  const statuses = new Set(['pass','fail','not-run']);
  const severities = new Set(['critical','high','medium','low','info']);
  let blockingFailures = 0;
  for (const [i, check] of (value.checks || []).entries()) {
    if (!isObject(check)) { fail(errors, `checks[${i}] must be an object`); continue; }
    if (!statuses.has(check.status)) fail(errors, `checks[${i}].status invalid`);
    if (!severities.has(check.severity)) fail(errors, `checks[${i}].severity invalid`);
    if (check.status === 'fail') {
      for (const key of ['path','evidence','reproduction','remediationOwner']) if (typeof check[key] !== 'string' || !check[key].trim()) fail(errors, `checks[${i}].${key} required for failures`);
      if (['critical','high'].includes(check.severity)) blockingFailures++;
    }
  }
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  if (value.statePatch?.qaPassed === true && blockingFailures > 0) fail(errors, 'qaPassed cannot be true with critical/high failures');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "auditMode": "mixed",
  "artifacts": [
    "portfolio/site"
  ],
  "checks": [
    {
      "id": "html-heading",
      "category": "accessibility",
      "status": "pass",
      "severity": "low",
      "path": "index.html",
      "evidence": "heading order inspected",
      "reproduction": "inspect headings",
      "remediationOwner": "portfolio-design"
    }
  ],
  "summary": {
    "pass": 1,
    "fail": 0,
    "not-run": 0
  },
  "repairRoutes": [],
  "statePatch": {
    "qaPassed": true,
    "qaIssues": []
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
    console.log('portfolio-audit validator selftest passed');
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
  console.log('portfolio-audit artifact valid');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
