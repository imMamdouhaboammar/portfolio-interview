#!/usr/bin/env node
// Release checks for a generated portfolio.
//
//   node check.mjs <profile.json> <site-dir> [--shots <dir>] [--no-browser]
//   node check.mjs <profile.json> --profile-only      (copy rules and profile only)
//
// 1. Copy rules on every string in profile.json (banned phrasing, em dash,
//    unsourced numbers, missing essentials).
// 2. Static HTML checks on every built page (one h1, alt text, JSON-LD parses,
//    title and description length, canonical and hreflang, link names).
// 3. Browser checks with Playwright when available: no horizontal overflow and
//    no page errors at 320 to 2560 px in both themes, plus screenshots.
// Exit code 1 when any error is found. Warnings never fail the run.

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--shots'].includes(argv[i - 1]));
const [profilePath, siteDir] = positional;
const PROFILE_ONLY = argv.includes('--profile-only');
if (!profilePath || (!siteDir && !PROFILE_ONLY)) {
  console.error('usage: node check.mjs <profile.json> <site-dir> [--shots <dir>] [--no-browser]\n       node check.mjs <profile.json> --profile-only');
  process.exit(2);
}
const shotsIdx = argv.indexOf('--shots');
const SHOTS = shotsIdx >= 0 ? resolve(argv[shotsIdx + 1]) : siteDir ? resolve(siteDir, '..', `${siteDir.replace(/\/$/, '').split('/').pop()}-qa`) : '';
let P;
try {
  P = JSON.parse(readFileSync(profilePath, 'utf8'));
} catch (e) {
  console.log(`\nerrors (1):\n  x profile: ${profilePath} is not valid JSON (${e.message})`);
  process.exit(1);
}
const SITE = siteDir ? resolve(siteDir) : '';

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

/* ------------------------------------------------------------ copy rules ---- */
// The page speaks for a real person, so the copy has to sound like one.
// These patterns read as machine-written and are rejected outright.

const COPY_RULES = [
  { re: /—/, why: 'em dash (use a comma, colon or full stop)' },
  { re: /\bnot (just|only|merely|simply)\b/i, why: '"not just X" contrast formula' },
  { re: /\b(this|it|that) (is|was)n[’']?t (just |only )?(a|an|about)\b[^.]{0,60}[.,;]\s*(it|this|that)[’']?s\b/i, why: '"it is not X, it is Y" contrast formula' },
  { re: /\bthis is not\b/i, why: '"this is not" contrast formula' },
  { re: /\b(more than just|rather than just)\b/i, why: '"more than just" formula' },
  { re: /مش مجرد|ليس مجرد|ليست مجرد|ليس فقط|ليست فقط|مو بس|مش بس .{1,40} لكن/, why: 'نفي ثم إثبات ("مش مجرد" / "ليس فقط")' },
  { re: /(^|[\s.،])(ده|دي|دا|هذا|هذه|هاذا) (مش|ليس|ليست|مو) [^.،]{1,50}[.،]\s*(ده|دي|دا|هذا|هذه|إنه|انه|بل)/, why: 'نمط "ده مش X. ده Y"' },
  { re: /ليس[^.،]{1,50}\s*،?\s*بل /, why: 'نمط "ليس X بل Y"' },
  { re: /لا (نتحدث|نتكلم) عن/, why: 'نمط "لا نتحدث عن"' },
];

const BANNED_WORDS = [
  'unleash', 'unlock', 'harness', 'leverage', 'revolutionize', 'revolutionise', 'game-changing', 'game changer', 'cutting-edge',
  'state-of-the-art', 'next-generation', 'next-gen', 'elevate', 'innovative', 'groundbreaking', 'seamless', 'seamlessly',
  'effortless', 'the power of', 'empower', 'disrupt', 'synergy', 'paradigm shift', 'best-in-class', 'world-class',
  'industry-leading', 'unparalleled', 'unprecedented', 'passionate about', 'delve', 'tapestry',
];

// Keys whose values are identifiers, not prose.
const SKIP_KEYS = new Set(['url', 'href', 'image', 'avatar', 'email', 'whatsapp', 'platform', 'handle', 'archetype', 'brand', 'style', 'palette', 'icon', 'countryCode', 'ogImage', 'orgUrl', 'schemaType', 'updated', 'start', 'end', 'year']);

function walk(node, path, fn) {
  if (typeof node === 'string') return fn(node, path);
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) walk(v, path ? `${path}.${k}` : k, fn);
  }
}

walk(P, '', (text, path) => {
  for (const r of COPY_RULES) if (r.re.test(text)) err(`copy: ${path}: ${r.why}\n      "${text.slice(0, 140)}"`);
  const lower = text.toLowerCase();
  for (const w of BANNED_WORDS) {
    if (new RegExp(`(^|[^a-z])${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([^a-z]|$)`, 'i').test(lower)) err(`copy: ${path}: banned word "${w}"\n      "${text.slice(0, 140)}"`);
  }
  if (/!{2,}/.test(text)) warn(`copy: ${path}: stacked exclamation marks`);
});

/* ------------------------------------------------------- profile essentials ---- */

const person = P.person || {};
const locales = P.locales?.length ? P.locales : ['en'];
const tx = (v, c) => (v == null ? '' : typeof v === 'object' && !Array.isArray(v) ? (v[c] ?? '') : v);

for (const c of locales) {
  if (!tx(person.name, c)) err(`profile: person.name missing for locale "${c}"`);
  if (!tx(person.jobTitle, c)) err(`profile: person.jobTitle missing for locale "${c}"`);
  if (!tx(person.summary, c)) err(`profile: person.summary missing for locale "${c}"`);
  const desc = tx(person.metaDescription, c) || tx(person.summary, c);
  if (desc && (desc.length < 70 || desc.length > 170)) warn(`seo: meta description for "${c}" is ${desc.length} chars (aim for 120 to 160)`);
}
const publicEmail = person.email && person.showEmail !== false;
if (!publicEmail && !person.whatsapp && !(P.socials || []).length) err('profile: no public contact route (a shown email, WhatsApp or one social profile). A hidden email does not count.');
if (!person.avatar) warn('profile: no avatar, a monogram is used');
if (!P.site?.url) warn('seo: site.url empty, so no canonical, hreflang, og:url or sitemap');
else if (!/^https:\/\//.test(P.site.url)) err('seo: site.url must be an absolute https:// address');
for (const s of P.stats || []) if (!s.source) err(`profile: stat "${s.value}" has no source. Numbers on the page need a source the person can point to.`);
for (const s of P.socials || []) {
  const v = s.url || s.handle || '';
  if (/^http:\/\//i.test(v)) warn(`profile: social ${s.platform} uses http, switch to https`);
  if (!v) err(`profile: social ${s.platform} has no url or handle`);
}
for (const [i, w] of (P.work || []).entries()) {
  if (!tx(w.description, locales[0])) err(`profile: work[${i}] has no description`);
}
for (const [i, t] of (P.testimonials || []).entries()) {
  if (!t.name) err(`profile: testimonials[${i}] has no name. Only real, attributable quotes belong on the page.`);
}

/* -------------------------------------------------------- static html checks ---- */

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'assets' ? [] : htmlFiles(p);
    return f === 'index.html' ? [p] : [];
  });
}

const pages = PROFILE_ONLY ? [] : existsSync(SITE) ? htmlFiles(SITE) : [];
if (!PROFILE_ONLY && !pages.length) err(`site: no index.html found under ${SITE}. Run build.mjs first.`);

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

for (const file of pages) {
  const rel = relative(SITE, file) || 'index.html';
  const html = readFileSync(file, 'utf8');
  const h1 = html.match(/<h1\b/g) || [];
  if (h1.length !== 1) err(`html ${rel}: expected exactly one <h1>, found ${h1.length}`);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title) err(`html ${rel}: missing <title>`);
  else if (title.length > 65) warn(`seo ${rel}: title is ${title.length} chars, search results cut near 60`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) err(`html ${rel}: missing meta description`);
  if (!/<html [^>]*lang="[a-z]{2}/.test(html)) err(`html ${rel}: <html> has no lang`);
  if (P.site?.url && !/<link rel="canonical"/.test(html)) err(`html ${rel}: missing canonical`);
  if (P.site?.url && locales.length > 1 && (html.match(/hreflang=/g) || []).length < locales.length + 1) err(`html ${rel}: hreflang set incomplete`);
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\balt="/.test(img)) err(`html ${rel}: image without alt: ${img.slice(0, 90)}`);
    if (!/\bwidth="\d+"/.test(img) || !/\bheight="\d+"/.test(img)) warn(`html ${rel}: image without width/height (layout shift): ${img.slice(0, 90)}`);
  }
  for (const a of html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || []) {
    if (!strip(a) && !/aria-label="/.test(a)) err(`html ${rel}: link with no accessible name: ${a.slice(0, 90)}`);
    if (/target="_blank"/.test(a) && !/rel="[^"]*noopener/.test(a)) err(`html ${rel}: target=_blank without rel=noopener`);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!blocks.length) err(`html ${rel}: no JSON-LD`);
  const types = [];
  for (const b of blocks) {
    try { types.push(JSON.parse(b)['@type']); } catch (e) { err(`html ${rel}: JSON-LD does not parse: ${e.message}`); }
  }
  for (const t of ['Person', 'ProfilePage']) if (!types.includes(t)) err(`html ${rel}: JSON-LD missing ${t}`);
  if (!types.includes('FAQPage')) warn(`seo ${rel}: no FAQPage block. Q&A pairs are what answer engines quote most.`);
  if (/—/.test(strip(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')))) err(`html ${rel}: visible em dash`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) err(`html ${rel}: duplicate ids: ${[...new Set(dup)].join(', ')}`);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) err(`html ${rel}: in-page link to missing #${m[1]}`);
  for (const m of html.matchAll(/(?:src|href)="((?!https?:|mailto:|#|data:)[^"]+)"/g)) {
    const target = resolve(dirname(file), m[1].split('#')[0].split('?')[0]);
    const exists = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!exists) err(`html ${rel}: local reference not found: ${m[1]}`);
  }
}
if (!PROFILE_ONLY) {
  for (const f of ['robots.txt', 'llms.txt']) if (!existsSync(join(SITE, f))) err(`site: ${f} missing`);
  if (P.site?.url && !existsSync(join(SITE, 'sitemap.xml'))) err('site: sitemap.xml missing');
}

/* ---------------------------------------------------------- browser checks ---- */

async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* fall through to the global install */ }
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return await import(pathToFileURL(createRequire(join(root, 'noop.js')).resolve('playwright')).href);
  } catch { return null; }
}

const WIDTHS = [320, 390, 768, 1024, 1440, 1920, 2560];

if (!argv.includes('--no-browser') && pages.length) {
  const pw = await loadPlaywright();
  const chromium = pw && (pw.chromium || pw.default?.chromium);
  if (!chromium) {
    warn('browser: Playwright not installed, responsive checks skipped. Open the page at 320 px and 1440 px by hand.');
  } else {
    let browser;
    try { browser = await chromium.launch(); } catch (e) { warn(`browser: Chromium did not start (${String(e.message).split('\n')[0]})`); }
    if (browser) {
      mkdirSync(SHOTS, { recursive: true });
      try {
        for (const file of pages) {
          const rel = relative(SITE, file) || 'index.html';
          const tag = rel.replace(/\/?index\.html$/, '') || 'root';
          for (const scheme of ['light', 'dark']) {
            const ctx = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce' });
            const page = await ctx.newPage();
            const problems = [];
            page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
            page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) problems.push(`console: ${m.text()}`); });
            for (const w of WIDTHS) {
              await page.setViewportSize({ width: w, height: 900 });
              await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
              const over = await page.evaluate(() => {
                const doc = document.documentElement;
                if (doc.scrollWidth <= window.innerWidth + 1) return null;
                const vw = window.innerWidth;
                const culprits = [...document.querySelectorAll('body *')]
                  .filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; })
                  .filter((el) => !el.closest('.marquee'))
                  .slice(0, 3)
                  .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
                return { scroll: doc.scrollWidth, culprits };
              });
              if (over) err(`browser ${rel} ${scheme} @${w}px: horizontal overflow (${over.scroll}px) from ${over.culprits.join(', ') || 'unknown'}`);
              if (scheme === 'light' && [390, 1440].includes(w)) await page.screenshot({ path: join(SHOTS, `${tag}-${w}.png`), fullPage: true });
              if (scheme === 'dark' && w === 390) await page.screenshot({ path: join(SHOTS, `${tag}-${w}-dark.png`), fullPage: true });
            }
            [...new Set(problems)].forEach((p) => err(`browser ${rel} ${scheme}: ${p}`));
            await ctx.close();
          }
        }
        // Script-off render: every section must still be in the document.
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const page = await ctx.newPage();
        await page.goto(pathToFileURL(pages[0]).href);
        const n = await page.locator('main section').count();
        if (n < 3) err(`browser: only ${n} sections render with JavaScript off`);
        await ctx.close();
      } finally {
        await browser.close();
      }
      console.log(`screenshots: ${SHOTS}`);
    }
  }
}

/* ------------------------------------------------------------------ report ---- */

console.log(PROFILE_ONLY ? `checked profile ${profilePath}` : `checked ${pages.length} page(s) in ${SITE}`);
if (warns.length) { console.log(`\nwarnings (${warns.length}):`); warns.forEach((w) => console.log(`  - ${w}`)); }
if (errors.length) {
  console.log(`\nerrors (${errors.length}):`);
  errors.forEach((e) => console.log(`  x ${e}`));
  process.exit(1);
}
console.log('\nall checks passed');
