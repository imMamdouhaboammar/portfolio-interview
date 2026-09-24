#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  const modes = new Set(['executed','prepared','failed','partial']);
  if (!modes.has(value.mode)) fail(errors, 'mode must be executed|prepared|failed|partial');
  for (const key of ['commands','artifacts','checks','skipped','blockers']) if (!Array.isArray(value[key])) fail(errors, key + ' must be an array');
  if (typeof value.profilePath !== 'string' || !value.profilePath) fail(errors, 'profilePath required');
  if (typeof value.outputDir !== 'string' || !value.outputDir) fail(errors, 'outputDir required');
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  if (value.statePatch?.buildExists === true) {
    if (value.mode !== 'executed') fail(errors, 'buildExists=true requires mode=executed');
    if (!(value.commands || []).some(c => c?.status === 'pass' && Number(c?.exitCode) === 0)) fail(errors, 'buildExists=true requires successful command evidence');
    if ((value.artifacts || []).length === 0) fail(errors, 'buildExists=true requires verified artifacts');
  }
  return { ok:errors.length === 0, errors };
}

const sample = {
  "mode": "executed",
  "profilePath": "portfolio/profile.json",
  "outputDir": "portfolio/site",
  "commands": [
    {
      "command": "node scripts/build.mjs",
      "status": "pass",
      "exitCode": 0
    }
  ],
  "artifacts": [
    "portfolio/site/index.html"
  ],
  "checks": [
    {
      "name": "static-check",
      "status": "pass"
    }
  ],
  "skipped": [],
  "statePatch": {
    "buildExists": true
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
    console.log('portfolio-build validator selftest passed');
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
  console.log('portfolio-build artifact valid');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
