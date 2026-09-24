#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const fail = (errors, message) => errors.push(message);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function validate(value) {
  const errors = [];
  if (!isObject(value)) return { ok:false, errors:['artifact must be a JSON object'] };
  if (!Array.isArray(value.sectionOrder) || value.sectionOrder.length === 0) fail(errors, 'sectionOrder must be a non-empty array');
  if (!isObject(value.responsive)) fail(errors, 'responsive must be an object');
  for (const width of ['320','390','768','1440']) if (!isObject(value.responsive?.[width])) fail(errors, `responsive.${width} is required`);
  if (!isObject(value.rtl)) fail(errors, 'rtl must be an object');
  if (!isObject(value.accessibility)) fail(errors, 'accessibility must be an object');
  for (const key of ['focus','contrast','keyboard','reducedMotion','altText']) if (!Array.isArray(value.accessibility?.[key])) fail(errors, `accessibility.${key} must be an array`);
  for (const key of ['mediaRequirements','profileChanges','templateChanges']) if (!Array.isArray(value[key])) fail(errors, key + ' must be an array');
  if (!isObject(value.statePatch)) fail(errors, 'statePatch must be an object');
  return { ok:errors.length === 0, errors };
}

const sample = {
  "sectionOrder": [
    {
      "id": "hero",
      "rationale": "Establish role before proof"
    }
  ],
  "tokens": {
    "typography": {},
    "spacing": {},
    "color": {},
    "motion": {}
  },
  "responsive": {
    "320": {},
    "390": {},
    "768": {},
    "1440": {}
  },
  "rtl": {
    "enabled": true,
    "decisions": [
      "Use logical properties"
    ]
  },
  "accessibility": {
    "focus": [
      "visible"
    ],
    "contrast": [
      "AA"
    ],
    "keyboard": [
      "nav"
    ],
    "reducedMotion": [
      "respect preference"
    ],
    "altText": [
      "meaningful media"
    ]
  },
  "mediaRequirements": [],
  "profileChanges": [],
  "templateChanges": [],
  "statePatch": {
    "layoutApproved": false
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
    console.log('portfolio-design validator selftest passed');
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
  console.log('portfolio-design artifact valid');
}

if (import.meta.url === new URL('file://' + process.argv[1]).href) main(process.argv.slice(2));
