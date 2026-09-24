#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  if (!Array.isArray(value.items)) fail(errors, 'items must be an array');
  for (const [i, item] of (value.items || []).entries()) {
    if (!isObject(item)) { fail(errors, `items[${i}] must be an object`); continue; }
    for (const key of ['path','text','locale','kind']) if (typeof item[key] !== 'string' || !item[key].trim()) fail(errors, `items[${i}].${key} required`);
    if (!Array.isArray(item.sourceClaims)) fail(errors, `items[${i}].sourceClaims must be an array`);
    const factual = item.kind !== 'ui';
    const hasNumber = typeof item.text === 'string' && /\d/.test(item.text);
    if ((factual || hasNumber) && (!Array.isArray(item.sourceClaims) || item.sourceClaims.length === 0)) fail(errors, `items[${i}] factual/quantitative copy requires sourceClaims`);
  }
  if (value.headlineOptions !== undefined && !Array.isArray(value.headlineOptions)) fail(errors, 'headlineOptions must be an array');
  if (!isObject(value.evidenceSummary)) fail(errors, 'evidenceSummary must be an object');
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "items": [
    {
      "path": "person.summary.en",
      "text": "Product designer focused on accessible services.",
      "locale": "en",
      "kind": "factual",
      "sourceClaims": [
        "role-001"
      ],
      "requiresApproval": true
    }
  ],
  "headlineOptions": [
    "Product designer for accessible digital services"
  ],
  "seo": {},
  "evidenceSummary": {
    "supported": [
      "role-001"
    ],
    "omitted": [],
    "unresolved": []
  },
  "statePatch": {
    "copyApproved": false
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
    console.log('portfolio-story validator selftest passed');
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
  console.log('portfolio-story artifact valid');
}

if (import.meta.url === new URL('file://' + process.argv[1]).href) main(process.argv.slice(2));
