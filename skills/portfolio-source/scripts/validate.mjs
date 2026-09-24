#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  if (!Array.isArray(value.entries)) fail(errors, 'entries must be an array');
  const confidence = new Set(['confirmed','unconfirmed','conflicting']);
  const permission = new Set(['yes','no','unknown']);
  for (const [i, entry] of (value.entries || []).entries()) {
    if (!isObject(entry)) { fail(errors, `entries[${i}] must be an object`); continue; }
    for (const key of ['claim_id','claim','source','location','confidence','publication_permission']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) fail(errors, `entries[${i}].${key} is required`);
    }
    if (entry.confidence && !confidence.has(entry.confidence)) fail(errors, `entries[${i}].confidence invalid`);
    if (entry.publication_permission && !permission.has(entry.publication_permission)) fail(errors, `entries[${i}].publication_permission invalid`);
  }
  for (const key of ['unreadable_sources','conflicts','evidence_gaps']) if (value[key] !== undefined && !Array.isArray(value[key])) fail(errors, key + ' must be an array');
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "entries": [
    {
      "claim_id": "role-001",
      "claim": "Worked as Product Designer",
      "source": "cv.pdf",
      "location": "p.2",
      "observed_at": "2026-09-24",
      "confidence": "confirmed",
      "publication_permission": "yes"
    }
  ],
  "unreadable_sources": [],
  "conflicts": [],
  "evidence_gaps": [],
  "statePatch": {
    "sourcesAvailable": true,
    "sourcesReviewed": true
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
    console.log('portfolio-source validator selftest passed');
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
  console.log('portfolio-source artifact valid');
}

if (import.meta.url === new URL('file://' + process.argv[1]).href) main(process.argv.slice(2));
