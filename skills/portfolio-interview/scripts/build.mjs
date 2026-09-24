#!/usr/bin/env node
// Portfolio generator for the portfolio-interview skill.
//
//   node build.mjs <profile.json> [--out <dir>] [--og]
//
// Reads the profile the interview produced and writes a complete static site:
//   <out>/index.html            default locale
//   <out>/<code>/index.html     every further locale (e.g. ar/, RTL)
//   <out>/assets/               site.css, site.js, avatar, work images, og.png
//   <out>/robots.txt, sitemap.xml, llms.txt, site.webmanifest, 404.html
//
// No runtime dependencies. --og renders a 1200x630 share image with
// Playwright's Chromium when it is installed, and skips quietly otherwise.
// Derived from portfolio/build.mjs in github.com/imMamdouhaboammar/imMamdouhaboammar.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { dirname, join, resolve, extname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(here, '..', 'assets', 'template');

/* ------------------------------------------------------------- arguments ---- */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const profilePath = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--out');
if (!profilePath) {
  console.error('usage: node build.mjs <profile.json> [--out <dir>] [--og]');
  process.exit(2);
}
const PROFILE_DIR = dirname(resolve(profilePath));
const P = JSON.parse(readFileSync(profilePath, 'utf8'));
const OUT = resolve(opt('--out', join(PROFILE_DIR, 'site')));

/* ----------------------------------------------------------------- utils ---- */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const LOCALES = (P.locales && P.locales.length ? P.locales : ['en']).map(String);
const DEFAULT = LOCALES[0];
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

/** Localised value: a plain string/array applies to every locale, an object is keyed by locale. */
function tx(v, code) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || Array.isArray(v)) return v;
  if (typeof v === 'object') return v[code] ?? v[DEFAULT] ?? Object.values(v)[0] ?? '';
  return '';
}
const list = (v, code) => { const x = tx(v, code); return Array.isArray(x) ? x : (x ? [x] : []); };

const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 60) || 'item';

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

/* ------------------------------------------------------------ archetypes ---- */
// Field decides section labels, the schema.org type of work items, default
// style and default brand colour. The interview maps the person's field here.

const ARCHETYPES = {
  developer:    { style: 'bold', brand: '#df9367', workType: 'SoftwareSourceCode', work: { en: 'Projects', ar: 'مشاريع' }, workLede: { en: 'Selected builds. Each one links to something you can open and read.', ar: 'مشاريع مختارة، وكل واحد منها ليه رابط تقدر تفتحه وتقراه.' }, services: { en: 'What I build', ar: 'بشتغل على إيه' }, icon: 'code' },
  designer:     { style: 'bold', brand: '#c9a8f2', workType: 'CreativeWork', work: { en: 'Selected work', ar: 'أعمال مختارة' }, workLede: { en: 'A few pieces, with the problem each one had to solve.', ar: 'شوية أعمال، ومع كل واحد المشكلة اللي كان لازم يحلها.' }, services: { en: 'What I design', ar: 'بصمم إيه' }, icon: 'palette', media: true },
  marketer:     { style: 'bold', brand: '#f6cf63', workType: 'CreativeWork', work: { en: 'Case studies', ar: 'دراسات حالة' }, workLede: { en: 'What the brief was, what I changed, and what moved.', ar: 'البريف كان إيه، اتغير إيه، والنتيجة اتحركت إزاي.' }, services: { en: 'What I run', ar: 'بدير إيه' }, icon: 'chart' },
  writer:       { style: 'calm', brand: '#df9367', workType: 'Article', work: { en: 'Writing', ar: 'كتابات' }, workLede: { en: 'Published pieces and the outlets that ran them.', ar: 'مقالات منشورة والأماكن اللي نشرتها.' }, services: { en: 'What I write', ar: 'بكتب إيه' }, icon: 'pen' },
  creator:      { style: 'bold', brand: '#f28b82', workType: 'CreativeWork', work: { en: 'Content', ar: 'المحتوى' }, workLede: { en: 'Series, formats and channels worth a look.', ar: 'سلاسل وفورمات وقنوات تستاهل تتشاف.' }, services: { en: 'What I make', ar: 'بعمل إيه' }, icon: 'video', media: true },
  photographer: { style: 'calm', brand: '#8fbef5', workType: 'Photograph', work: { en: 'Portfolio', ar: 'الأعمال' }, workLede: { en: 'Selected shoots and commissions.', ar: 'جلسات تصوير وشغل لعملاء.' }, services: { en: 'What I shoot', ar: 'بصور إيه' }, icon: 'camera', media: true },
  product:      { style: 'bold', brand: '#7fd6b4', workType: 'CreativeWork', work: { en: 'Products', ar: 'منتجات' }, workLede: { en: 'Products I shaped, and the decisions behind them.', ar: 'منتجات شاركت في تشكيلها، والقرارات اللي وراها.' }, services: { en: 'What I own', ar: 'مسؤول عن إيه' }, icon: 'layers' },
  consultant:   { style: 'calm', brand: '#7fd6b4', workType: 'CreativeWork', work: { en: 'Engagements', ar: 'مشاريع مع عملاء' }, workLede: { en: 'Selected engagements, shared with client permission.', ar: 'مشاريع مختارة، منشورة بإذن العملاء.' }, services: { en: 'How I help', ar: 'بساعد في إيه' }, icon: 'briefcase' },
  academic:     { style: 'calm', brand: '#8fbef5', workType: 'ScholarlyArticle', work: { en: 'Publications', ar: 'الأبحاث المنشورة' }, workLede: { en: 'Peer-reviewed work and talks.', ar: 'أبحاث محكمة ومحاضرات.' }, services: { en: 'Research areas', ar: 'مجالات البحث' }, icon: 'book' },
  educator:     { style: 'bold', brand: '#c6e86c', workType: 'Course', work: { en: 'Courses and talks', ar: 'كورسات ومحاضرات' }, workLede: { en: 'What I teach and where.', ar: 'بدرّس إيه وفين.' }, services: { en: 'What I teach', ar: 'بدرّس إيه' }, icon: 'book' },
  professional: { style: 'calm', brand: '#8fbef5', workType: 'CreativeWork', work: { en: 'Selected matters', ar: 'نماذج من الشغل' }, workLede: { en: 'Representative work, shared within confidentiality limits.', ar: 'نماذج من الشغل، في حدود السرية المهنية.' }, services: { en: 'Practice areas', ar: 'مجالات الممارسة' }, icon: 'scale' },
  other:        { style: 'bold', brand: '#df9367', workType: 'CreativeWork', work: { en: 'Work', ar: 'الشغل' }, workLede: { en: 'Selected work.', ar: 'شغل مختار.' }, services: { en: 'What I do', ar: 'بعمل إيه' }, icon: 'spark' },
};

const FIELD = P.field || {};
const ARC = ARCHETYPES[FIELD.archetype] || ARCHETYPES.other;

const PALETTES = { peach: '#df9367', lime: '#c6e86c', sky: '#8fbef5', lilac: '#c9a8f2', mint: '#7fd6b4', butter: '#f6cf63', coral: '#f28b82', ink: '#1f2937', navy: '#1e3a8a', forest: '#166534', wine: '#881337' };
const SITE = P.site || {};
const BRAND = (() => {
  const b = SITE.brand || SITE.palette;
  if (b && PALETTES[b]) return PALETTES[b];
  if (b && hexToRgb(b)) return b.startsWith('#') ? b : `#${b}`;
  return ARC.brand;
})();
const BRAND_INK = (() => {
  const rgb = hexToRgb(BRAND);
  return contrast(rgb, [22, 18, 14]) >= contrast(rgb, [255, 255, 255]) ? '#16120e' : '#ffffff';
})();
const STYLE = SITE.style === 'calm' || SITE.style === 'bold' ? SITE.style : ARC.style;

/* ------------------------------------------------------------------- URLs ---- */

const BASE_URL = SITE.url ? (SITE.url.endsWith('/') ? SITE.url : `${SITE.url}/`) : '';
const pagePath = (code) => (code === DEFAULT ? '' : `${code}/`);
const absUrl = (code) => (BASE_URL ? `${BASE_URL}${pagePath(code)}` : '');
const depthOf = (code) => (code === DEFAULT ? '' : '../');
const UPDATED = SITE.updated || new Date().toISOString().slice(0, 10);

/* -------------------------------------------------------------- UI strings ---- */

const UI = {
  en: {
    skip: 'Skip to main content', menuOpen: 'Open menu', menuClose: 'Close menu', themeLabel: 'Switch colour theme',
    newTab: 'opens in a new tab', copyEmail: 'Copy email', copied: 'Copied', copyFailed: 'Copy blocked, select it above',
    footerLinks: 'Elsewhere', lastUpdated: 'Last updated', backToTop: 'Back to top', navLabel: 'Sections',
    navCta: 'Get in touch', primary: 'Start a conversation', secondary: 'See the work',
    badge: '\u2726 OPEN TO WORK \u2726 {types} ',
    k: { services: 'Services', work: 'Work', experience: 'Experience', skills: 'Skills', process: 'Process', testimonials: 'Kind words', about: 'About', faq: 'Questions', contact: 'Contact' },
    t: { experience: 'Where I have worked', skills: 'Tools and skills', process: 'How I work', testimonials: 'What people say', about: 'About me', faq: 'Common questions', contact: 'Tell me what you are working on' },
    contactLede: 'Send the context and what you need. Replies come by email or WhatsApp.',
    nav: { services: 'Services', work: 'Work', experience: 'Experience', skills: 'Skills', about: 'About', contact: 'Contact' },
    statsTitle: 'In numbers', factsTitle: 'At a glance', marqueeLabel: 'Skills',
    facts: { role: 'Role', field: 'Focus', based: 'Based in', languages: 'Languages', available: 'Available for', worksWith: 'Works with' },
    availTitle: 'Available for', marketsTitle: 'Open across', present: 'Present',
    types: { freelance: 'Freelance', 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'Contract', consulting: 'Consulting', speaking: 'Speaking', collaborations: 'Collaborations' },
    langs: { ar: 'Arabic', en: 'English', fr: 'French', de: 'German', es: 'Spanish', tr: 'Turkish', ur: 'Urdu', hi: 'Hindi' },
    footerNote: 'Static page. No tracking, no cookies.',
    notFound: { title: 'Page not found', body: 'That address does not exist on this site.', back: 'Back to the home page' },
    faqAuto: {
      what: (n) => `What does ${n} do?`,
      avail: (n) => `Is ${n} available for work?`,
      availA: (n, types, markets) => `Yes. ${n} is open to ${types}${markets ? `, across ${markets}` : ''}.`,
      where: (n) => `Where is ${n} based?`,
      whereA: (n, place) => `${n} is based in ${place}.`,
      contact: (n) => `How can I contact ${n}?`,
      contactA: (routes) => `The fastest routes are ${routes}.`,
    },
  },
  ar: {
    skip: 'انتقل للمحتوى الأساسي', menuOpen: 'افتح القائمة', menuClose: 'اقفل القائمة', themeLabel: 'تغيير مظهر الألوان',
    newTab: 'بيفتح في تاب جديد', copyEmail: 'انسخ الإيميل', copied: 'اتنسخ', copyFailed: 'النسخ مرفوض، حدده من فوق',
    footerLinks: 'حسابات تانية', lastUpdated: 'آخر تحديث', backToTop: 'لفوق', navLabel: 'أقسام الصفحة',
    navCta: 'تواصل', primary: 'ابدأ المحادثة', secondary: 'شوف الشغل',
    badge: '\u2726 متاح للشغل \u2726 {types} ',
    k: { services: 'الخدمات', work: 'الشغل', experience: 'الخبرة', skills: 'المهارات', process: 'طريقة الشغل', testimonials: 'آراء', about: 'نبذة', faq: 'أسئلة', contact: 'تواصل' },
    t: { experience: 'الأماكن اللي اشتغلت فيها', skills: 'الأدوات والمهارات', process: 'بشتغل إزاي', testimonials: 'اللي اشتغلوا معايا بيقولوا إيه', about: 'عني', faq: 'أسئلة بتتكرر', contact: 'احكيلي عن اللي بتشتغل عليه' },
    contactLede: 'ابعت السياق واللي محتاجه، والرد بيوصلك على الإيميل أو واتساب.',
    nav: { services: 'الخدمات', work: 'الشغل', experience: 'الخبرة', skills: 'المهارات', about: 'نبذة', contact: 'تواصل' },
    statsTitle: 'بالأرقام', factsTitle: 'باختصار', marqueeLabel: 'المهارات',
    facts: { role: 'الدور', field: 'التركيز', based: 'المكان', languages: 'اللغات', available: 'متاح لـ', worksWith: 'بيشتغل مع' },
    availTitle: 'متاح لـ', marketsTitle: 'الأسواق', present: 'حتى الآن',
    types: { freelance: 'Freelance', 'full-time': 'Full-time', 'part-time': 'Part-time', contract: 'عقد مؤقت', consulting: 'استشارات', speaking: 'محاضرات', collaborations: 'تعاونات' },
    langs: { ar: 'العربية', en: 'الإنجليزية', fr: 'الفرنسية', de: 'الألمانية', es: 'الإسبانية', tr: 'التركية', ur: 'الأردية', hi: 'الهندية' },
    footerNote: 'صفحة Static بالكامل، من غير تتبع ومن غير Cookies.',
    notFound: { title: 'الصفحة مش موجودة', body: 'العنوان ده مش موجود على الموقع.', back: 'ارجع للصفحة الرئيسية' },
    faqAuto: {
      what: (n) => `إيه مجال شغل ${n}؟`,
      avail: (n) => `ينفع أشتغل مع ${n}؟`,
      availA: (n, types, markets) => `أيوه. الشغل المتاح: ${types}${markets ? `، في ${markets}` : ''}.`,
      where: (n) => `مقر شغل ${n} فين؟`,
      whereA: (n, place) => `في ${place}.`,
      contact: (n) => `إزاي أتواصل مع ${n}؟`,
      contactA: (routes) => `أسرع طريقة: ${routes}.`,
    },
  },
};
// Formal Arabic for audiences where Egyptian dialect reads wrong (Gulf
// professionals, law, medicine, government). Only the keys that differ.
const AR_MSA = {
  newTab: 'يفتح في علامة تبويب جديدة', copyEmail: 'نسخ البريد الإلكتروني', copied: 'تم النسخ', copyFailed: 'تعذر النسخ، حدده من الأعلى',
  footerLinks: 'حسابات أخرى', backToTop: 'للأعلى', menuOpen: 'افتح القائمة', menuClose: 'أغلق القائمة',
  navCta: 'تواصل', primary: 'ابدأ التواصل', secondary: 'اطّلع على الأعمال',
  k: { services: 'الخدمات', work: 'الأعمال', experience: 'الخبرة', skills: 'المهارات', process: 'منهجية العمل', testimonials: 'آراء العملاء', about: 'نبذة', faq: 'أسئلة', contact: 'تواصل' },
  t: { experience: 'الخبرات المهنية', skills: 'الأدوات والمهارات', process: 'منهجية العمل', testimonials: 'آراء من عملوا معي', about: 'نبذة عني', faq: 'أسئلة شائعة', contact: 'أخبرني بما تعمل عليه' },
  contactLede: 'أرسل تفاصيل طلبك، ويصلك الرد عبر البريد الإلكتروني أو واتساب.',
  nav: { services: 'الخدمات', work: 'الأعمال', experience: 'الخبرة', skills: 'المهارات', about: 'نبذة', contact: 'تواصل' },
  facts: { role: 'المسمى', field: 'التخصص', based: 'المقر', languages: 'اللغات', available: 'متاح لـ', worksWith: 'يعمل مع' },
  marketsTitle: 'نطاق العمل', present: 'حتى الآن',
  footerNote: 'صفحة ثابتة بالكامل، دون تتبع أو ملفات تعريف ارتباط.',
  notFound: { title: 'الصفحة غير موجودة', body: 'هذا العنوان غير موجود على الموقع.', back: 'العودة إلى الصفحة الرئيسية' },
  faqAuto: {
    what: (n) => `ما مجال عمل ${n}؟`,
    avail: (n) => `هل يمكن التعاون مع ${n}؟`,
    availA: (n, types, markets) => `نعم. أنواع التعاون المتاحة: ${types}${markets ? `، في ${markets}` : ''}.`,
    where: (n) => `أين مقر عمل ${n}؟`,
    whereA: (n, place) => `في ${place}.`,
    contact: (n) => `كيف أتواصل مع ${n}؟`,
    contactA: (routes) => `أسرع وسيلة: ${routes}.`,
  },
};
if (['msa', 'gulf'].includes((P.site || {}).dialect)) {
  UI.ar = { ...UI.ar, ...AR_MSA, types: { ...UI.ar.types, contract: 'عقد مؤقت', consulting: 'استشارات', speaking: 'محاضرات', collaborations: 'شراكات' } };
}
const ui = (code) => UI[code] || UI.en;

/* ------------------------------------------------------------------ icons ---- */

const ICONS = {
  mail: '<path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4.1-.9L3 20.5l1.5-4.6A8.4 8.4 0 0 1 3.6 11 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 3l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21l1.7-1.7"/>',
  code: '<path d="m8 6-6 6 6 6"/><path d="m16 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  research: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v6"/><path d="M8 11h6"/>',
  docs: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  tests: '<path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M8 3h8"/><path d="M6.5 15h11"/>',
  agents: '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M12 3v4"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M9.5 16h5"/>',
  chart: '<path d="M4 19V5"/><path d="m8 15 4-5 3 3 5-7"/><path d="M4 19h16"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9-.4-1.2.5-2.1 1.6-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M8 7h7"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7h6Z"/><path d="m19 7-3 7h6Z"/><path d="M8 21h8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1Z"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6 6 2.5 2.5"/><path d="m15.5 15.5 2.5 2.5"/><path d="m6 18 2.5-2.5"/><path d="m15.5 8.5 2.5-2.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8a5 5 0 0 0-.1-3.7s-1.2-.3-4 1.5a13.4 13.4 0 0 0-7 0C6 .8 4.8 1.1 4.8 1.1A5 5 0 0 0 4.7 4.8 5.4 5.4 0 0 0 3.2 8.6c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-1 2.5V22"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7"/><path d="M8 7v.01"/><path d="M12 17v-4a2 2 0 0 1 4 0v4"/><path d="M12 10v7"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.link}</svg>`;

const SPARK = '<path d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12C7.5 10.2 11.1 6.6 12 0Z"/>';
const spark = (cls) => `<svg class="spark ${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${SPARK}</svg>`;
const squiggle = () => '<svg class="squiggle" viewBox="0 0 240 12" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M2 8c14-8 28 8 42 0s28-8 42 0 28 8 42 0 28-8 42 0 28 8 42 0"/></svg>';

const EXT = ' target="_blank" rel="noopener noreferrer"';
const isExt = (href) => /^https?:/i.test(href || '');
/** Local assets get the locale depth prefix; absolute URLs pass through untouched. */
const assetHref = (p, d) => (isExt(p) ? p : `${d}${p}`);
const assetAbs = (p) => (isExt(p) ? p : BASE_URL ? `${BASE_URL}${p}` : '');
const srNewTab = (code) => `<span class="sr-only"> (${esc(ui(code).newTab)})</span>`;
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}</script>`;

/* ---------------------------------------------------------------- socials ---- */

const PLATFORMS = {
  linkedin:  { label: 'LinkedIn',  icon: 'linkedin', url: (h) => `https://www.linkedin.com/in/${h}/` },
  github:    { label: 'GitHub',    icon: 'github',   url: (h) => `https://github.com/${h}` },
  x:         { label: 'X',         icon: 'link',     url: (h) => `https://x.com/${h}` },
  instagram: { label: 'Instagram', icon: 'camera',   url: (h) => `https://www.instagram.com/${h}/` },
  facebook:  { label: 'Facebook',  icon: 'users',    url: (h) => `https://www.facebook.com/${h}` },
  tiktok:    { label: 'TikTok',    icon: 'video',    url: (h) => `https://www.tiktok.com/@${h}` },
  youtube:   { label: 'YouTube',   icon: 'video',    url: (h) => `https://www.youtube.com/@${h}` },
  behance:   { label: 'Behance',   icon: 'palette',  url: (h) => `https://www.behance.net/${h}` },
  dribbble:  { label: 'Dribbble',  icon: 'palette',  url: (h) => `https://dribbble.com/${h}` },
  medium:    { label: 'Medium',    icon: 'pen',      url: (h) => `https://medium.com/@${h}` },
  substack:  { label: 'Substack',  icon: 'pen',      url: (h) => `https://${h}.substack.com/` },
  threads:   { label: 'Threads',   icon: 'chat',     url: (h) => `https://www.threads.net/@${h}` },
  snapchat:  { label: 'Snapchat',  icon: 'camera',   url: (h) => `https://www.snapchat.com/add/${h}` },
  telegram:  { label: 'Telegram',  icon: 'chat',     url: (h) => `https://t.me/${h}` },
  scholar:   { label: 'Google Scholar', icon: 'book', url: (h) => `https://scholar.google.com/citations?user=${h}` },
  orcid:     { label: 'ORCID',     icon: 'book',     url: (h) => `https://orcid.org/${h}` },
  website:   { label: { en: 'Website', ar: 'الموقع' }, icon: 'globe', url: (h) => (h.startsWith('http') ? h : `https://${h}`) },
};

const SOCIALS = (P.socials || []).map((s) => {
  const p = PLATFORMS[s.platform] || { label: s.label || s.platform, icon: 'link', url: (h) => h };
  const raw = String(s.url || s.handle || '').trim().replace(/^@/, '');
  const url = /^https?:\/\//i.test(raw) ? raw : p.url(raw);
  return { platform: s.platform, label: s.label || p.label, icon: p.icon, url, handle: s.handle ? String(s.handle).replace(/^@/, '') : '' };
}).filter((s) => s.url);

const PERSON = P.person || {};
const phoneDigits = PERSON.whatsapp ? String(PERSON.whatsapp).replace(/[^\d]/g, '') : '';
const WHATSAPP = phoneDigits ? `https://wa.me/${phoneDigits}` : '';
const EMAIL = PERSON.email && PERSON.showEmail !== false ? PERSON.email : '';

/* ------------------------------------------------------------------ assets ---- */

mkdirSync(join(OUT, 'assets'), { recursive: true });
copyFileSync(join(TEMPLATE, 'site.css'), join(OUT, 'assets', 'site.css'));
copyFileSync(join(TEMPLATE, 'site.js'), join(OUT, 'assets', 'site.js'));

const warnings = [];
const fromProfile = (p) => resolve(PROFILE_DIR, p);

function copyAsset(src, destName) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const abs = fromProfile(src);
  if (!existsSync(abs)) { warnings.push(`missing file: ${src}`); return ''; }
  const ext = extname(abs).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'].includes(ext)) { warnings.push(`unsupported image type: ${src}`); return ''; }
  const size = statSync(abs).size;
  if (size > 1.5 * 1024 * 1024) warnings.push(`${src} is ${(size / 1048576).toFixed(1)} MB. Compress it below ~300 KB for a fast first paint.`);
  const rel = `assets/${destName}${ext}`;
  mkdirSync(dirname(join(OUT, rel)), { recursive: true });
  copyFileSync(abs, join(OUT, rel));
  return rel;
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const pair = [parts[0]?.[0] || '', parts.length > 1 ? parts[parts.length - 1][0] : ''];
  // Arabic letters would join into one glyph cluster, so keep them apart.
  return pair.join(/[\u0600-\u06FF]/.test(pair.join('')) ? ' ' : '').toUpperCase();
}

const NAME_DEFAULT = tx(PERSON.name, DEFAULT);
let AVATAR = copyAsset(PERSON.avatar, 'avatar');
if (!AVATAR) {
  // No photo: a monogram in the brand colour keeps the layout intact.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 460"><rect width="460" height="460" fill="${BRAND}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="IBM Plex Sans, Arial, sans-serif" font-size="180" font-weight="700" fill="${BRAND_INK}">${esc(initials(tx(PERSON.name, 'en') || NAME_DEFAULT))}</text></svg>`;
  writeFileSync(join(OUT, 'assets', 'avatar.svg'), svg);
  AVATAR = 'assets/avatar.svg';
  if (!PERSON.avatar) warnings.push('no avatar supplied: using an initials monogram. A real photo helps trust and the Person schema.');
}

const WORK = (P.work || []).map((w, i) => ({ ...w, _img: w.image ? copyAsset(w.image, `work/${slug(tx(w.name, 'en') || tx(w.name, DEFAULT) || `item-${i + 1}`)}`) : '' }));

let OG = SITE.ogImage ? copyAsset(SITE.ogImage, 'og') : '';
const OG_RENDERED = join(OUT, 'assets', 'og.png');
if (!OG && existsSync(OG_RENDERED)) OG = 'assets/og.png';

/* ------------------------------------------------------------ derived text ---- */

function availabilityTypes(code) {
  const a = PERSON.availability || {};
  return (a.types || []).map((t) => ui(code).types[t] || t);
}
function joinList(items, code) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  const and = code === 'ar' ? ' و' : ' and ';
  const sep = code === 'ar' ? '، ' : ', ';
  return items.slice(0, -1).join(sep) + and + items[items.length - 1];
}
function place(code) {
  const l = PERSON.location || {};
  return [tx(l.city, code), tx(l.country, code)].filter(Boolean).join(code === 'ar' ? '، ' : ', ');
}

function autoFaq(code) {
  const u = ui(code).faqAuto;
  const n = tx(PERSON.name, code);
  const out = [];
  const what = [tx(PERSON.jobTitle, code), tx(FIELD.specialty, code)].filter(Boolean).join(code === 'ar' ? '. ' : '. ');
  const services = (P.services || []).map((s) => tx(s.title, code)).filter(Boolean);
  if (what) out.push({ q: u.what(n), a: `${what}${services.length ? (code === 'ar' ? `. الشغل بيغطي ${joinList(services, code)}.` : `. The work covers ${joinList(services.map((s) => s.toLowerCase()), code)}.`) : '.'}`.replace(/\.\./g, '.') });
  const types = availabilityTypes(code);
  const markets = list((PERSON.availability || {}).markets, code);
  if ((PERSON.availability || {}).open !== false && types.length) out.push({ q: u.avail(n), a: u.availA(n, joinList(types, code), joinList(markets, code)) });
  const pl = place(code);
  if (pl) out.push({ q: u.where(n), a: u.whereA(n, pl) });
  const routes = [EMAIL && (code === 'ar' ? `${['msa', 'gulf'].includes(SITE.dialect) ? 'البريد الإلكتروني' : 'الإيميل'} ${EMAIL}` : `email at ${EMAIL}`), WHATSAPP && (code === 'ar' ? 'واتساب' : 'WhatsApp'), SOCIALS.find((s) => s.platform === 'linkedin') && 'LinkedIn'].filter(Boolean);
  if (routes.length) out.push({ q: u.contact(n), a: u.contactA(joinList(routes, code)) });
  return out;
}
const faqFor = (code) => {
  const own = (P.faq || []).map((f) => ({ q: tx(f.q, code), a: tx(f.a, code) })).filter((f) => f.q && f.a);
  return own.length ? own : autoFaq(code);
};

function metaDescription(code) {
  const d = tx(PERSON.metaDescription, code) || tx(PERSON.summary, code) || '';
  if (d.length <= 160) return d;
  const cut = d.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 100 ? cut.lastIndexOf(' ') : 157)}...`;
}
const pageTitle = (code) => tx(SITE.title, code) || `${tx(PERSON.name, code)} | ${tx(PERSON.jobTitle, code)}`;

/* ------------------------------------------------------------------ schema ---- */

function structuredData(code) {
  const url = absUrl(code);
  const personId = `${absUrl(DEFAULT) || ''}#person`;
  const img = assetAbs(AVATAR) || undefined;
  const names = LOCALES.map((c) => tx(PERSON.name, c)).filter(Boolean);
  const alt = [...new Set([...names, ...(PERSON.alternateNames || []), ...SOCIALS.map((s) => s.handle).filter(Boolean)])].filter((n) => n !== tx(PERSON.name, code));
  const l = PERSON.location || {};
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: tx(PERSON.name, code),
    ...(alt.length ? { alternateName: alt } : {}),
    ...(url ? { url } : {}),
    ...(img ? { image: img } : {}),
    ...(EMAIL ? { email: `mailto:${EMAIL}` } : {}),
    jobTitle: tx(PERSON.jobTitle, code),
    description: metaDescription(code),
    ...(l.city || l.country ? { address: { '@type': 'PostalAddress', ...(tx(l.city, 'en') ? { addressLocality: tx(l.city, 'en') } : {}), ...(l.countryCode || tx(l.country, 'en') ? { addressCountry: l.countryCode || tx(l.country, 'en') } : {}) } } : {}),
    ...(PERSON.languages?.length ? { knowsLanguage: PERSON.languages } : {}),
    ...(PERSON.knowsAbout?.length ? { knowsAbout: PERSON.knowsAbout } : {}),
    ...(PERSON.worksFor?.name ? { worksFor: { '@type': 'Organization', name: PERSON.worksFor.name, ...(PERSON.worksFor.url ? { url: PERSON.worksFor.url } : {}) } } : {}),
    ...((PERSON.alumniOf || []).length ? { alumniOf: PERSON.alumniOf.map((a) => ({ '@type': 'EducationalOrganization', name: a.name || a, ...(a.url ? { url: a.url } : {}) })) } : {}),
    hasOccupation: {
      '@type': 'Occupation',
      name: tx(PERSON.jobTitle, code),
      ...(tx(FIELD.specialty, code) ? { description: tx(FIELD.specialty, code) } : {}),
      ...(l.countryCode || tx(l.country, 'en') ? { occupationLocation: { '@type': 'Country', name: tx(l.country, 'en') || l.countryCode } } : {}),
      ...((P.skills?.groups || []).length ? { skills: (P.skills.groups || []).flatMap((g) => g.items || []).slice(0, 30).join(', ') } : {}),
    },
    ...(SOCIALS.length ? { sameAs: SOCIALS.map((s) => s.url) } : {}),
    ...((PERSON.availability || {}).open !== false && availabilityTypes('en').length ? {
      seeks: { '@type': 'Demand', name: `${joinList(availabilityTypes('en'), 'en')} work`, ...(list((PERSON.availability || {}).markets, 'en').length ? { areaServed: list(PERSON.availability.markets, 'en') } : {}) },
    } : {}),
  };

  const page = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    ...(url ? { '@id': `${url}#page`, url } : {}),
    name: pageTitle(code),
    description: metaDescription(code),
    inLanguage: code,
    dateModified: UPDATED,
    mainEntity: { '@id': personId },
    ...(BASE_URL ? { isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}#website`, url: BASE_URL, name: tx(PERSON.name, DEFAULT), inLanguage: LOCALES } } : {}),
  };

  const blocks = [person, page];

  if (WORK.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      ...(url ? { '@id': `${url}#work` } : {}),
      name: tx(ARC.work, code),
      numberOfItems: WORK.length,
      itemListElement: WORK.map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': w.schemaType || ARC.workType,
          name: tx(w.name, code),
          description: tx(w.description, code),
          ...(w.url ? { url: w.url } : {}),
          ...(w.url && (w.schemaType || ARC.workType) === 'SoftwareSourceCode' && /github|gitlab|bitbucket/.test(w.url) ? { codeRepository: w.url } : {}),
          ...(w._img && assetAbs(w._img) ? { image: assetAbs(w._img) } : {}),
          ...(w.year ? { dateCreated: String(w.year) } : {}),
          ...((w.schemaType || ARC.workType) === 'Course' ? { provider: { '@id': personId } } : { author: { '@id': personId } }),
          ...(w.tags?.length ? { keywords: w.tags.join(', ') } : {}),
        },
      })),
    });
  }

  const faq = faqFor(code);
  if (faq.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      ...(url ? { '@id': `${url}#faq` } : {}),
      inLanguage: code,
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  // Testimonials are rendered but deliberately not marked up as Review:
  // Google ignores self-serving reviews on a person's own page.
  return blocks.map(jsonld).join('\n  ');
}

/* -------------------------------------------------------------------- head ---- */

const OG_LOCALE = { en: 'en_US', ar: 'ar_EG', fr: 'fr_FR', de: 'de_DE', es: 'es_ES', tr: 'tr_TR' };

function head(code) {
  const d = depthOf(code);
  const title = pageTitle(code);
  const desc = metaDescription(code);
  const ogImg = OG || AVATAR;
  const ogAbs = assetAbs(ogImg);
  const x = SOCIALS.find((s) => s.platform === 'x');
  const xHandle = x ? (x.handle || x.url.split('/').filter(Boolean).pop()) : '';
  const keywords = [tx(PERSON.name, code), tx(PERSON.jobTitle, code), tx(FIELD.specialty, code), ...(PERSON.knowsAbout || []).slice(0, 8), place(code)].filter(Boolean).join(', ');
  const fontAr = LOCALES.includes('ar') ? '&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700' : '';
  const ogIsRendered = ogImg === 'assets/og.png';
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(keywords)}">
  <meta name="author" content="${esc(tx(PERSON.name, code))}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f2efe9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0b0d12" media="(prefers-color-scheme: dark)">
${BASE_URL ? `
  <link rel="canonical" href="${absUrl(code)}">
  ${LOCALES.length > 1 ? LOCALES.map((c) => `<link rel="alternate" hreflang="${c}" href="${absUrl(c)}">`).join('\n  ') + `\n  <link rel="alternate" hreflang="x-default" href="${absUrl(DEFAULT)}">` : ''}
` : ''}
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="${esc(tx(PERSON.name, code))}">
  <meta property="og:locale" content="${OG_LOCALE[code] || code}">
  ${LOCALES.filter((c) => c !== code).map((c) => `<meta property="og:locale:alternate" content="${OG_LOCALE[c] || c}">`).join('\n  ')}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  ${BASE_URL ? `<meta property="og:url" content="${absUrl(code)}">` : ''}
  ${ogAbs ? `<meta property="og:image" content="${ogAbs}">` : ''}
  ${ogIsRendered ? '<meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">' : ''}
  <meta property="og:image:alt" content="${esc(`${tx(PERSON.name, code)}, ${tx(PERSON.jobTitle, code)}`)}">
  ${PERSON.givenName ? `<meta property="profile:first_name" content="${esc(PERSON.givenName)}">` : ''}
  ${PERSON.familyName ? `<meta property="profile:last_name" content="${esc(PERSON.familyName)}">` : ''}

  <meta name="twitter:card" content="${ogIsRendered || SITE.ogImage ? 'summary_large_image' : 'summary'}">
  ${xHandle ? `<meta name="twitter:creator" content="@${esc(xHandle)}">` : ''}
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${ogAbs ? `<meta name="twitter:image" content="${ogAbs}">` : ''}

  <link rel="icon" href="${assetHref(AVATAR, d)}">
  <link rel="apple-touch-icon" href="${assetHref(AVATAR, d)}">
  <link rel="manifest" href="${d}site.webmanifest">
  <link rel="help" href="${d}llms.txt" type="text/plain" title="LLM context">
  ${BASE_URL ? `<link rel="sitemap" type="application/xml" href="${d}sitemap.xml">` : ''}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700${fontAr}&family=JetBrains+Mono:wght@500;700&display=swap">
  <link rel="stylesheet" href="${d}assets/site.css">
  <link rel="preload" as="image" href="${assetHref(AVATAR, d)}" fetchpriority="high">

  ${structuredData(code)}
  <noscript><style>
    @media (max-width: 1220px) {
      .topbar { flex-wrap: wrap; border-radius: var(--r-lg); }
      .nav { position: static; order: 3; flex-basis: 100%; margin-inline: 0; padding: 8px 0 2px; opacity: 1; visibility: visible; transform: none; background: none; border: 0; box-shadow: none; }
      .nav-list { flex-direction: row; flex-wrap: wrap; justify-content: center; }
      .menu-btn { display: none; }
    }
  </style></noscript>
  <script>
    (function () {
      try {
        var saved = localStorage.getItem('pf-theme');
        if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
      } catch (e) {}
    })();
  </script>`;
}

/* ------------------------------------------------------------------ pieces ---- */

const kicker = (text) => `<p class="kicker"><span>${esc(text)}</span></p>`;
function sectionHead(code, id, kick, title, lede) {
  return `<header class="section-head" id="${id}-head">
        ${kicker(kick)}
        <h2 class="section-title">${esc(title)}${squiggle()}</h2>
        ${lede ? `<p class="section-lede">${esc(lede)}</p>` : ''}
      </header>`;
}

const S = P.sections || {};
const secText = (key, part, code, fallback) => tx(S[key]?.[part], code) || fallback;

function sectionsPresent() {
  return {
    services: (P.services || []).length > 0,
    work: WORK.length > 0,
    experience: (P.experience || []).length > 0,
    skills: (P.skills?.groups || []).length > 0,
    process: (P.process || []).length > 0,
    testimonials: (P.testimonials || []).length > 0,
    about: list(P.about?.body, DEFAULT).length > 0,
  };
}
const HAS = sectionsPresent();

function header(code) {
  const u = ui(code);
  const d = depthOf(code);
  const nav = ['services', 'work', 'experience', 'skills', 'about'].filter((k) => HAS[k]).map((id) => ({ id, label: u.nav[id] })).concat([{ id: 'contact', label: u.nav.contact }]);
  const others = LOCALES.filter((c) => c !== code);
  const switchLinks = others.map((c) => {
    const href = c === DEFAULT ? (d || './') : `${d}${c}/`;
    const label = c === 'ar' ? 'العربية' : c === 'en' ? 'English' : c.toUpperCase();
    return `<a class="lang-switch" href="${href}" hreflang="${c}" lang="${c}" dir="${RTL.has(c) ? 'rtl' : 'ltr'}">${icon('globe')}<span>${esc(label)}</span></a>`;
  }).join('\n      ');
  return `<header class="topbar" id="top">
    <a class="brand" href="#top">
      <img class="brand-avatar" src="${assetHref(AVATAR, d)}" width="40" height="40" alt="" loading="eager" decoding="async">
      <span class="brand-text">
        <strong>${esc(tx(PERSON.name, code))}</strong>
        <small>${esc(tx(PERSON.roleLine, code) || tx(PERSON.jobTitle, code))}</small>
      </span>
    </a>

    <nav class="nav" id="nav" aria-label="${esc(u.navLabel)}">
      <ul class="nav-list">
        ${nav.map((n) => `<li><a href="#${n.id}" data-nav="${n.id}">${esc(n.label)}</a></li>`).join('\n        ')}
      </ul>
    </nav>

    <div class="topbar-actions">
      ${switchLinks}
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="${esc(u.themeLabel)}">
        ${icon('sun', 'i i-sun')}${icon('moon', 'i i-moon')}
      </button>
      <a class="btn btn-primary btn-sm topbar-cta" href="#contact">${esc(tx(P.cta?.nav, code) || u.navCta)}</a>
      <button class="icon-btn menu-btn" id="menu-toggle" type="button" aria-expanded="false" aria-controls="nav" aria-label="${esc(u.menuOpen)}" data-open="${esc(u.menuOpen)}" data-close="${esc(u.menuClose)}">
        ${icon('menu', 'i i-menu')}${icon('close', 'i i-close')}
      </button>
    </div>
  </header>`;
}

function hero(code) {
  const u = ui(code);
  const d = depthOf(code);
  const h = PERSON.headline || {};
  const lead = tx(h.lead, code);
  const hl = tx(h.highlight, code);
  const tail = tx(h.tail, code);
  const titleHtml = hl ? `${esc(lead)} <mark class="mark">${esc(hl)}</mark> ${esc(tail)}` : esc(lead || tx(PERSON.jobTitle, code));
  const pills = [
    EMAIL && { icon: 'mail', label: EMAIL, href: `mailto:${EMAIL}` },
    WHATSAPP && { icon: 'chat', label: 'WhatsApp', href: WHATSAPP },
    place(code) && { icon: 'pin', label: place(code), href: null },
  ].filter(Boolean).map((p) => {
    const inner = `${icon(p.icon)}<span>${esc(p.label)}</span>`;
    return p.href ? `<a class="pill pill-dark" href="${esc(p.href)}"${isExt(p.href) ? EXT : ''}${p.icon === 'mail' ? ' dir="ltr"' : ''}>${inner}${isExt(p.href) ? srNewTab(code) : ''}</a>` : `<span class="pill pill-dark">${inner}</span>`;
  }).join('\n          ');
  const stickers = list(PERSON.stickers, code).slice(0, 3);
  const avail = PERSON.availability || {};
  const open = avail.open !== false && availabilityTypes(code).length > 0;
  const ring = u.badge.replace('{types}', availabilityTypes(code).slice(0, 2).join(code === 'ar' ? ' و' : ' & ').toUpperCase());
  const featured = P.featured;

  return `<section class="hero" aria-labelledby="hero-title">
      <div class="hero-main card" data-accent="1">
        ${spark('spark-a')}${spark('spark-b')}
        ${stickers.length ? `<ul class="sticker-row" aria-hidden="true">
          ${stickers.map((s, i) => `<li class="sticker" data-accent="${i + 2}">${esc(s)}</li>`).join('')}
        </ul>` : ''}
        ${kicker(tx(PERSON.eyebrow, code) || tx(FIELD.specialty, code) || tx(PERSON.jobTitle, code))}
        <h1 class="hero-title" id="hero-title">${titleHtml}</h1>
        <p class="hero-lede">${esc(tx(PERSON.summary, code))}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#contact">${esc(tx(P.cta?.primary, code) || u.primary)}${icon('arrow', 'i i-arrow')}</a>
          ${HAS.work ? `<a class="btn btn-ghost" href="#work">${esc(tx(P.cta?.secondary, code) || u.secondary)}</a>` : ''}
        </div>
        ${pills ? `<div class="pill-row">
          ${pills}
        </div>` : ''}
      </div>

      <aside class="hero-side">
        <figure class="card card-portrait">
          ${open ? `<div class="spin-badge" aria-hidden="true">
            <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
              <defs><path id="ring-${code}" d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0"/></defs>
              <text><textPath href="#ring-${code}" startOffset="0">${esc(ring)}</textPath></text>
            </svg>
            <span class="spin-badge-core">${icon('arrow', 'i i-arrow')}</span>
          </div>` : ''}
          <img src="${assetHref(AVATAR, d)}" width="460" height="460" alt="${esc(tx(PERSON.avatarAlt, code) || (code === 'ar' ? `صورة ${tx(PERSON.name, code)}` : `Portrait of ${tx(PERSON.name, code)}`))}" loading="eager" decoding="async" fetchpriority="high">
          <figcaption>
            ${open ? '<span class="status-dot" aria-hidden="true"></span>' : ''}
            ${esc(tx(avail.note, code) || (open ? `${u.availTitle} ${joinList(availabilityTypes(code), code)}` : tx(PERSON.jobTitle, code)))}
          </figcaption>
        </figure>
        ${featured?.url ? `<a class="card card-link" href="${esc(featured.url)}"${isExt(featured.url) ? EXT : ''} data-accent="4">
          <span class="card-link-label">${esc(tx(featured.label, code))}</span>
          <strong class="card-link-value">${esc(tx(featured.title, code))}${isExt(featured.url) ? srNewTab(code) : ''}</strong>
          <span class="card-link-go" aria-hidden="true">${icon('arrow', 'i i-arrow')}</span>
        </a>` : ''}
      </aside>
    </section>`;
}

function stats(code) {
  const st = (P.stats || []).filter((s) => s.value && s.source);
  if (!st.length) return '';
  const notes = [...new Set(st.map((s) => tx(s.source, code)).filter(Boolean))];
  return `<section class="stats" aria-label="${esc(ui(code).statsTitle)}">
      ${st.slice(0, 4).map((s, i) => `<div class="stat card" data-accent="${i + 1}">
        <strong class="stat-value">${esc(s.value)}</strong>
        <span class="stat-label">${esc(tx(s.label, code))}</span>
      </div>`).join('\n      ')}
      <p class="stats-note">${esc(notes.join(' · '))}</p>
    </section>`;
}

function marquee(code) {
  const words = list(P.skills?.marquee, code);
  if (words.length < 4) return '';
  const run = words.map((w, i) => `<li data-accent="${(i % 6) + 1}">${esc(w)}</li>`).join('');
  return `<section class="marquee" aria-label="${esc(ui(code).marqueeLabel)}">
      <ul class="marquee-track">${run}</ul>
      <ul class="marquee-track" aria-hidden="true">${run}</ul>
    </section>`;
}

function services(code) {
  if (!HAS.services) return '';
  const items = P.services;
  const cols = items.length % 3 === 0 || items.length > 4 ? 'grid-3' : items.length === 4 ? 'grid-4' : 'grid-2';
  return `<section class="section" id="services" aria-labelledby="services-head">
      ${sectionHead(code, 'services', secText('services', 'kicker', code, ui(code).k.services), secText('services', 'title', code, tx(ARC.services, code)), secText('services', 'lede', code, ''))}
      <div class="grid ${cols}">
        ${items.map((c, i) => `<article class="card card-cap" data-accent="${(i % 6) + 1}">
          <span class="cap-icon" aria-hidden="true">${icon(c.icon || ARC.icon)}</span>
          <h3 class="card-title">${esc(tx(c.title, code))}</h3>
          <p class="card-body">${esc(tx(c.body, code))}</p>
        </article>`).join('\n        ')}
      </div>
    </section>`;
}

function work(code) {
  if (!HAS.work) return '';
  const d = depthOf(code);
  const cols = WORK.length === 2 || WORK.length === 4 ? 'grid-2' : 'grid-3';
  return `<section class="section" id="work" aria-labelledby="work-head">
      ${sectionHead(code, 'work', secText('work', 'kicker', code, ui(code).k.work), secText('work', 'title', code, tx(ARC.work, code)), secText('work', 'lede', code, tx(ARC.workLede, code)))}
      <div class="grid ${cols}">
        ${WORK.map((w, i) => {
          const name = tx(w.name, code);
          const img = w._img ? `<div class="work-media"><img src="${assetHref(w._img, d)}" alt="${esc(tx(w.imageAlt, code) || name)}" width="800" height="500" loading="lazy" decoding="async"></div>` : '';
          const meta = [w.year, tx(w.role, code), tx(w.client, code)].filter(Boolean);
          const title = w.url
            ? `<a class="project-link" href="${esc(w.url)}"${isExt(w.url) ? EXT : ''}><h3 class="card-title">${esc(name)}${isExt(w.url) ? srNewTab(code) : ''}<span class="project-go" aria-hidden="true">${icon('arrow', 'i i-arrow')}</span></h3></a>`
            : `<div class="project-static"><h3 class="card-title">${esc(name)}</h3></div>`;
          return `<article class="card card-project" data-accent="${(i % 6) + 1}">
          ${img}
          ${title}
          ${meta.length ? `<p class="work-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</p>` : ''}
          <p class="card-body">${esc(tx(w.description, code))}</p>
          ${tx(w.outcome, code) ? `<p class="work-outcome">${esc(tx(w.outcome, code))}</p>` : ''}
          ${(w.tags || []).length ? `<ul class="tag-row">${w.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>` : ''}
        </article>`;
        }).join('\n        ')}
      </div>
      ${P.workMore?.url ? `<p class="section-foot"><a class="btn btn-ghost" href="${esc(P.workMore.url)}"${isExt(P.workMore.url) ? EXT : ''}>${esc(tx(P.workMore.label, code))}${icon('arrow', 'i i-arrow')}</a></p>` : ''}
    </section>`;
}

function experience(code) {
  if (!HAS.experience) return '';
  const u = ui(code);
  return `<section class="section" id="experience" aria-labelledby="experience-head">
      ${sectionHead(code, 'experience', secText('experience', 'kicker', code, u.k.experience), secText('experience', 'title', code, u.t.experience), secText('experience', 'lede', code, ''))}
      <ol class="timeline">
        ${P.experience.map((e, i) => {
          const end = !e.end || /present|now|current/i.test(e.end) ? u.present : e.end;
          const org = e.orgUrl ? `<a href="${esc(e.orgUrl)}"${EXT}>${esc(tx(e.org, code))}${srNewTab(code)}</a>` : esc(tx(e.org, code));
          return `<li class="timeline-item">
          <p class="timeline-when" dir="ltr"><time>${esc(e.start || '')}</time>${e.start ? ' - ' : ''}${esc(end)}</p>
          <article class="card timeline-card" data-accent="${(i % 6) + 1}">
            <h3 class="card-title">${esc(tx(e.role, code))}</h3>
            ${tx(e.org, code) ? `<span class="timeline-org">${org}</span>` : ''}
            ${tx(e.summary, code) ? `<p class="card-body">${esc(tx(e.summary, code))}</p>` : ''}
          </article>
        </li>`;
        }).join('\n        ')}
      </ol>
    </section>`;
}

function skills(code) {
  if (!HAS.skills) return '';
  const u = ui(code);
  return `<section class="section" id="skills" aria-labelledby="skills-head">
      ${sectionHead(code, 'skills', secText('skills', 'kicker', code, u.k.skills), secText('skills', 'title', code, u.t.skills), secText('skills', 'lede', code, ''))}
      <div class="grid grid-stack">
        ${P.skills.groups.map((g, i) => `<article class="card card-stack" data-accent="${(i % 6) + 1}">
          <h3 class="stack-title">${esc(tx(g.title, code))}</h3>
          <ul class="chip-row">${(g.items || []).map((x) => `<li class="chip" dir="auto">${esc(x)}</li>`).join('')}</ul>
        </article>`).join('\n        ')}
      </div>
    </section>`;
}

function processSection(code) {
  if (!HAS.process) return '';
  const u = ui(code);
  const steps = P.process.slice(0, 4);
  return `<section class="section" id="process" aria-labelledby="process-head">
      ${sectionHead(code, 'process', secText('process', 'kicker', code, u.k.process), secText('process', 'title', code, u.t.process), secText('process', 'lede', code, ''))}
      <div class="grid ${steps.length === 4 ? 'grid-4' : steps.length === 3 ? 'grid-3' : 'grid-2'} method-path">
        ${steps.map((p, i) => `<article class="card card-principle" data-accent="${i + 1}">
          <span class="principle-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="card-title">${esc(tx(p.title, code))}</h3>
          <p class="card-body">${esc(tx(p.body, code))}</p>
        </article>`).join('\n        ')}
      </div>
    </section>`;
}

function testimonials(code) {
  if (!HAS.testimonials) return '';
  const u = ui(code);
  const items = P.testimonials.filter((t) => t.name && tx(t.quote, code));
  if (!items.length) return '';
  return `<section class="section" id="testimonials" aria-labelledby="testimonials-head">
      ${sectionHead(code, 'testimonials', secText('testimonials', 'kicker', code, u.k.testimonials), secText('testimonials', 'title', code, u.t.testimonials), '')}
      <div class="grid ${items.length === 2 || items.length === 4 ? 'grid-2' : 'grid-3'}">
        ${items.map((t, i) => `<figure class="card card-testimonial" data-accent="${(i % 6) + 1}">
          <blockquote>${esc(tx(t.quote, code))}</blockquote>
          <figcaption><strong>${esc(tx(t.name, code))}</strong>${esc(tx(t.role, code))}${t.url ? ` · <a href="${esc(t.url)}"${EXT}>${code === 'ar' ? 'المصدر' : 'Source'}${srNewTab(code)}</a>` : ''}</figcaption>
        </figure>`).join('\n        ')}
      </div>
    </section>`;
}

function about(code) {
  const u = ui(code);
  const body = list(P.about?.body, code);
  const facts = [
    [u.facts.role, tx(PERSON.jobTitle, code)],
    [u.facts.field, tx(FIELD.specialty, code)],
    [u.facts.based, place(code)],
    [u.facts.languages, joinList((PERSON.languages || []).map((l) => u.langs[l] || l), code)],
    [u.facts.worksWith, tx(PERSON.audience, code)],
    [u.facts.available, (PERSON.availability || {}).open !== false ? joinList(availabilityTypes(code), code) : ''],
  ].filter(([, v]) => v);
  if (!body.length && !facts.length) return '';
  const quote = tx(P.about?.quote, code);
  return `<section class="section" id="about" aria-labelledby="about-head">
      ${sectionHead(code, 'about', secText('about', 'kicker', code, u.k.about), secText('about', 'title', code, u.t.about), secText('about', 'lede', code, ''))}
      <div class="bg-grid">
        ${body.length ? `<div class="card card-prose">
          ${body.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
        </div>` : ''}
        <div class="card card-facts">
          <h3 class="card-title">${esc(u.factsTitle)}</h3>
          <dl class="facts">
            ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n            ')}
          </dl>
        </div>
        ${quote ? `<div class="card card-feature">
          <h3 class="card-title">${esc(tx(P.about?.quoteTitle, code))}</h3>
          <p class="card-body">${esc(quote)}</p>
        </div>` : ''}
      </div>
    </section>`;
}

function faq(code) {
  const items = faqFor(code);
  if (!items.length) return '';
  const u = ui(code);
  return `<section class="section" id="faq" aria-labelledby="faq-head">
      ${sectionHead(code, 'faq', u.k.faq, u.t.faq, '')}
      <div class="faq-list">
        ${items.map((f, i) => `<details class="card card-faq"${i === 0 ? ' open' : ''}>
          <summary><span>${esc(f.q)}</span><span class="faq-mark" aria-hidden="true"></span></summary>
          <p>${esc(f.a)}</p>
        </details>`).join('\n        ')}
      </div>
    </section>`;
}

function contact(code) {
  const u = ui(code);
  const cards = [
    EMAIL && { icon: 'mail', label: code === 'ar' ? (['msa', 'gulf'].includes(SITE.dialect) ? 'البريد الإلكتروني' : 'الإيميل') : 'Email', value: EMAIL, href: `mailto:${EMAIL}`, ltr: true },
    WHATSAPP && { icon: 'chat', label: 'WhatsApp', value: code === 'ar' ? (['msa', 'gulf'].includes(SITE.dialect) ? 'راسلني مباشرة' : 'ابعت رسالة مباشرة') : 'Message directly', href: WHATSAPP },
    ...SOCIALS.filter((s) => s.platform !== 'website').slice(0, EMAIL && WHATSAPP ? 2 : 3).map((s) => ({ icon: s.icon, label: tx(s.label, code), value: s.handle ? `@${s.handle}` : tx(PERSON.name, code), href: s.url, ltr: !!s.handle })),
  ].filter(Boolean).slice(0, 4);
  const avail = PERSON.availability || {};
  const types = availabilityTypes(code);
  const markets = list(avail.markets, code);
  return `<section class="section" id="contact" aria-labelledby="contact-head">
      <div class="card card-contact" data-accent="1">
        ${spark('spark-c')}${spark('spark-d')}
        ${kicker(secText('contact', 'kicker', code, u.k.contact))}
        <h2 class="section-title" id="contact-head">${esc(secText('contact', 'title', code, u.t.contact))}</h2>
        <p class="section-lede">${esc(secText('contact', 'lede', code, u.contactLede))}</p>

        <div class="contact-grid">
          ${cards.map((c, i) => `<a class="contact-card" data-accent="${i + 1}" href="${esc(c.href)}"${isExt(c.href) ? EXT : ''}>
            <span class="contact-icon" aria-hidden="true">${icon(c.icon)}</span>
            <span class="contact-meta">
              <small>${esc(c.label)}</small>
              <strong dir="${c.ltr ? 'ltr' : 'auto'}">${esc(c.value)}${isExt(c.href) ? srNewTab(code) : ''}</strong>
            </span>
          </a>`).join('\n          ')}
        </div>

        ${avail.open !== false && (types.length || markets.length) ? `<div class="availability">
          ${types.length ? `<div class="availability-block">
            <h3>${esc(u.availTitle)}</h3>
            <ul class="chip-row">${types.map((x) => `<li class="chip chip-solid">${esc(x)}</li>`).join('')}</ul>
          </div>` : ''}
          ${markets.length ? `<div class="availability-block">
            <h3>${esc(u.marketsTitle)}</h3>
            <ul class="chip-row">${markets.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>
          </div>` : ''}
        </div>` : ''}

        ${EMAIL ? `<button class="btn btn-ghost btn-sm" id="copy-email" type="button" data-email="${esc(EMAIL)}" data-copied="${esc(u.copied)}" data-failed="${esc(u.copyFailed)}">
          ${icon('copy')}<span>${esc(u.copyEmail)}</span>
        </button>` : ''}
      </div>
    </section>`;
}

function footer(code) {
  const u = ui(code);
  return `<footer class="footer">
    <div class="footer-inner">
      <p class="footer-note">${esc(tx(SITE.footerNote, code) || u.footerNote)}</p>
      ${SOCIALS.length ? `<nav class="footer-links" aria-label="${esc(u.footerLinks)}">
        ${SOCIALS.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer me">${esc(tx(s.label, code))}${srNewTab(code)}</a>`).join('\n        ')}
      </nav>` : ''}
      <p class="footer-meta">
        <span>${esc(u.lastUpdated)}: <time datetime="${UPDATED}">${UPDATED}</time></span>
        <a href="#top">${esc(u.backToTop)}</a>
      </p>
    </div>
  </footer>`;
}

const htmlAttrs = (code) => `lang="${code}" dir="${RTL.has(code) ? 'rtl' : 'ltr'}" data-style="${STYLE}" data-archetype="${esc(FIELD.archetype || 'other')}" style="--brand:${BRAND};--brand-ink:${BRAND_INK}"`;

function page(code) {
  const d = depthOf(code);
  return `<!DOCTYPE html>
<html ${htmlAttrs(code)}>
<head>
  ${head(code)}
</head>
<body>
  <a class="skip-link" href="#main">${esc(ui(code).skip)}</a>
  ${header(code)}

  <main id="main">
    ${hero(code)}
    ${stats(code)}
    ${marquee(code)}
    ${services(code)}
    ${work(code)}
    ${experience(code)}
    ${skills(code)}
    ${processSection(code)}
    ${testimonials(code)}
    ${about(code)}
    ${faq(code)}
    ${contact(code)}
  </main>

  ${footer(code)}
  <script src="${d}assets/site.js" defer></script>
</body>
</html>
`.replace(/\n\s*\n(\s*\n)+/g, '\n\n');
}

/* ------------------------------------------------------- discovery files ---- */

function robots() {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'Bingbot'];
  return `# robots.txt : generated by the portfolio-interview skill
# Search engines and AI answer engines are welcome to read and cite this profile.

User-agent: *
Allow: /

${bots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}
${BASE_URL ? `\nSitemap: ${BASE_URL}sitemap.xml\n` : ''}`;
}

function sitemap() {
  if (!BASE_URL) return '';
  const alts = LOCALES.length > 1
    ? LOCALES.map((c) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${absUrl(c)}"/>`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(DEFAULT)}"/>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LOCALES.map((c) => `  <url>
    <loc>${absUrl(c)}</loc>
    <lastmod>${UPDATED}</lastmod>
${alts ? alts + '\n' : ''}  </url>`).join('\n')}
</urlset>
`;
}

function llms() {
  const code = LOCALES.includes('en') ? 'en' : DEFAULT;
  const name = tx(PERSON.name, code);
  const lines = [];
  lines.push(`# ${name}`, '');
  lines.push(`> ${metaDescription(code)}`, '');
  lines.push('## Summary for answer engines', '');
  lines.push(tx(PERSON.summary, code), '');
  const facts = [
    ['Role', tx(PERSON.jobTitle, code)],
    ['Focus', tx(FIELD.specialty, code)],
    ['Based in', place(code)],
    ['Languages', joinList((PERSON.languages || []).map((l) => UI.en.langs[l] || l), 'en')],
    ['Available for', (PERSON.availability || {}).open !== false ? joinList(availabilityTypes('en'), 'en') : ''],
    ['Markets', joinList(list((PERSON.availability || {}).markets, 'en'), 'en')],
    ['Contact', [EMAIL, WHATSAPP].filter(Boolean).join(' · ')],
  ].filter(([, v]) => v);
  lines.push('## Facts', '', ...facts.map(([k, v]) => `- ${k}: ${v}`), '');
  if (BASE_URL) {
    lines.push('## Pages', '');
    LOCALES.forEach((c) => lines.push(`- [${tx(PERSON.name, c)} (${c})](${absUrl(c)})`));
    lines.push('');
  }
  if ((P.services || []).length) {
    lines.push('## Services', '', ...P.services.map((s) => `- ${tx(s.title, code)}: ${tx(s.body, code)}`), '');
  }
  if (WORK.length) {
    lines.push(`## ${tx(ARC.work, 'en')}`, '', ...WORK.map((w) => `- ${w.url ? `[${tx(w.name, code)}](${w.url})` : tx(w.name, code)}: ${tx(w.description, code)}${tx(w.outcome, code) ? ` Outcome: ${tx(w.outcome, code)}` : ''}`), '');
  }
  if ((P.experience || []).length) {
    lines.push('## Experience', '', ...P.experience.map((e) => `- ${tx(e.role, code)}, ${tx(e.org, code)} (${e.start || ''}${e.start ? ' to ' : ''}${e.end || 'present'})`), '');
  }
  const f = faqFor(code);
  if (f.length) lines.push('## FAQ', '', ...f.flatMap((x) => [`### ${x.q}`, x.a, '']));
  if (SOCIALS.length) lines.push('## Verified profiles', '', ...SOCIALS.map((s) => `- ${tx(s.label, 'en')}: ${s.url}`), '');
  lines.push(`Last updated: ${UPDATED}`, '');
  return lines.join('\n');
}

function manifest() {
  return JSON.stringify({
    name: tx(PERSON.name, DEFAULT),
    short_name: tx(PERSON.name, DEFAULT).split(' ')[0],
    start_url: './',
    display: 'browser',
    background_color: '#f2efe9',
    theme_color: BRAND,
    icons: [{ src: AVATAR, sizes: 'any', type: AVATAR.endsWith('.svg') ? 'image/svg+xml' : `image/${(extname(new URL(AVATAR, 'file:///').pathname).slice(1) || 'png').replace('jpg', 'jpeg')}` }],
  }, null, 2);
}

function notFound() {
  const code = DEFAULT;
  const u = ui(code);
  return `<!DOCTYPE html>
<html ${htmlAttrs(code)}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${esc(u.notFound.title)} | ${esc(tx(PERSON.name, code))}</title>
  <link rel="stylesheet" href="${BASE_URL ? `${BASE_URL}assets/site.css` : 'assets/site.css'}">
</head>
<body>
  <main id="main">
    <section class="section">
      <div class="card card-contact" data-accent="1">
        <h1 class="section-title">${esc(u.notFound.title)}</h1>
        <p class="section-lede">${esc(u.notFound.body)}</p>
        <p class="section-foot"><a class="btn btn-primary" href="${BASE_URL || './'}">${esc(u.notFound.back)}</a></p>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- og image ---- */

async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* try the global install */ }
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const req = createRequire(join(root, 'noop.js'));
    return await import(pathToFileURL(req.resolve('playwright')).href);
  } catch { return null; }
}

async function renderOg() {
  const pw = await loadPlaywright();
  if (!pw) { warnings.push('--og skipped: Playwright is not installed. Share cards will use the avatar.'); return false; }
  const code = DEFAULT;
  const dir = RTL.has(code) ? 'rtl' : 'ltr';
  const avatarUrl = isExt(AVATAR) ? AVATAR : pathToFileURL(join(OUT, AVATAR)).href;
  const html = `<!DOCTYPE html><html lang="${code}" dir="${dir}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@500;700&display=swap">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f2efe9;background-image:radial-gradient(circle at 1px 1px,rgba(0,0,0,.12) 1px,transparent 0);background-size:22px 22px;font-family:"IBM Plex Sans","IBM Plex Sans Arabic",system-ui,sans-serif;display:grid;place-items:center}
.card{width:1100px;height:530px;background:#fff;border:3px solid #000;border-radius:28px;box-shadow:${dir === 'rtl' ? '-' : ''}10px 10px 0 #000;display:grid;grid-template-columns:1fr 360px;gap:48px;align-items:center;padding:56px}
.k{display:inline-block;padding:8px 20px;background:${BRAND};color:${BRAND_INK};border:3px solid #000;border-radius:999px;font-weight:700;font-size:24px}
h1{font-size:${tx(PERSON.name, code).length > 22 ? 62 : 76}px;line-height:1.05;margin-top:28px;letter-spacing:${dir === 'rtl' ? 0 : '-0.03em'}}
p{font-size:30px;line-height:1.35;color:#4a4a4a;margin-top:22px}
img{width:360px;height:360px;object-fit:cover;border:3px solid #000;border-radius:22px;background:${BRAND}}
.u{margin-top:34px;font-size:22px;color:#6b6b6b;font-weight:500}
</style></head><body><div class="card"><div>
<span class="k">${esc(tx(FIELD.specialty, code) || tx(PERSON.jobTitle, code))}</span>
<h1>${esc(tx(PERSON.name, code))}</h1>
<p>${esc(tx(PERSON.jobTitle, code))}</p>
${BASE_URL ? `<div class="u" dir="ltr">${esc(BASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>` : ''}
</div><img src="${avatarUrl}" alt=""></div></body></html>`;
  const tmp = join(OUT, 'assets', '.og.html');
  writeFileSync(tmp, html);
  const chromium = pw.chromium || pw.default?.chromium;
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    warnings.push(`--og skipped: Chromium did not start (${String(err.message || err).split('\n')[0]}).`);
    rmSync(tmp, { force: true });
    return false;
  }
  try {
    const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => pg.goto(pathToFileURL(tmp).href));
    await pg.screenshot({ path: OG_RENDERED, type: 'png' });
  } finally {
    await browser.close();
    rmSync(tmp, { force: true });
  }
  return true;
}

/* ------------------------------------------------------------------ write ---- */

if (flag('--og') && !SITE.ogImage) {
  if (await renderOg()) OG = 'assets/og.png';
}

// Pages from locales dropped since the last build would otherwise stay
// published with stale details, so remove what this generator wrote before.
const RECORD = join(OUT, '.portfolio-build.json');
try {
  const previous = JSON.parse(readFileSync(RECORD, 'utf8')).locales || [];
  const current = new Set(LOCALES.map(pagePath));
  for (const old of previous) {
    const dir = `${old}/`;
    if (/^[a-z]{2,3}$/.test(old) && !current.has(dir)) {
      rmSync(join(OUT, old), { recursive: true, force: true });
      console.log(`removed stale locale -> ${basename(OUT)}/${dir}`);
    }
  }
} catch { /* first build into this folder */ }
if (!BASE_URL) rmSync(join(OUT, 'sitemap.xml'), { force: true });

for (const code of LOCALES) {
  const out = join(OUT, pagePath(code), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  const html = page(code);
  writeFileSync(out, html, 'utf8');
  console.log(`built ${code.padEnd(2)} -> ${out.replace(OUT, basename(OUT))} (${(html.length / 1024).toFixed(1)} kB)`);
}
writeFileSync(join(OUT, 'robots.txt'), robots());
if (BASE_URL) writeFileSync(join(OUT, 'sitemap.xml'), sitemap());
writeFileSync(join(OUT, 'llms.txt'), llms());
writeFileSync(join(OUT, 'site.webmanifest'), manifest());
writeFileSync(join(OUT, '404.html'), notFound());
writeFileSync(join(OUT, '.nojekyll'), '');
writeFileSync(RECORD, JSON.stringify({ locales: LOCALES, profile: resolve(profilePath), built: new Date().toISOString() }, null, 2));

if (!BASE_URL) warnings.push('site.url is empty: canonical, hreflang, og:url and sitemap.xml were skipped. Set it once the address is known and rebuild.');
console.log(`style=${STYLE} archetype=${FIELD.archetype || 'other'} brand=${BRAND} ink=${BRAND_INK} locales=${LOCALES.join(',')}`);
if (warnings.length) {
  console.log('\nwarnings:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}
