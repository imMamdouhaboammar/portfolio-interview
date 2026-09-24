<div align="center">

# Portfolio Interview

**An agent skill that interviews you in a few popups, then builds your personal portfolio site: responsive, bilingual, and ready for search engines and AI answer engines.**

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Bun](https://img.shields.io/badge/Runtime-Bun%20%3E%3D1.0-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill%20%26%20Plugin-D97706?style=flat-square&logo=anthropic&logoColor=white)](https://claude.ai)
[![Antigravity](https://img.shields.io/badge/Antigravity%20%2F%20Gemini-Compatible-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google)
[![Skills.sh](https://img.shields.io/badge/Skills.sh-Registry-000000?style=flat-square&logo=vercel&logoColor=white)](https://skills.sh/portfolio-interview)
[![Bilingual](https://img.shields.io/badge/Bilingual-Arabic%20%26%20English-10B981?style=flat-square)](#arabic-and-english)

[English](#english) · [العربية](#العربية)

<img src="docs/desktop-en.jpg" alt="Generated portfolio, English desktop view" width="100%">

<img src="docs/mobile-ar.jpg" alt="Arabic RTL page on a phone" width="31%"> <img src="docs/mobile-dark.jpg" alt="Dark mode on a phone" width="31%"> <img src="docs/calm-ar.jpg" alt="Calm style for a lawyer, formal Arabic" width="31%">

<sub>Built from the two example profiles in <code>evals/fixtures/</code>: a bilingual product designer, and a Riyadh lawyer in formal Arabic with the calm style.</sub>

</div>

---

## English

### What you get

You answer about eight rounds of multiple-choice popups. Every popup also accepts a typed answer. Along the way you add your photo and social accounts. The skill writes the copy, builds the site, checks it, and shows you screenshots before you publish.

| | |
|---|---|
| **Fits your field** | 12 field types (developer, designer, marketer, writer, creator, photographer, product, consultant, academic, educator, law/medicine/finance, other). Each one sets the section names, what proof comes first, the style and the colour. |
| **Arabic and English** | One language or both. The Arabic page is fully RTL, in Egyptian or formal Arabic depending on your audience. |
| **Responsive** | Checked with no horizontal scroll from 320 px to 2560 px, in light and dark mode. Every section still shows with JavaScript turned off. |
| **Search and AI answers** | Person, ProfilePage, ItemList and FAQPage JSON-LD, plus hreflang, canonical, Open Graph, `sitemap.xml` and `llms.txt`. `robots.txt` allows GPTBot, ClaudeBot and PerplexityBot. The build also renders a 1200×630 share card. |
| **No filler** | The build fails on invented-sounding copy (the "not just X, it's Y" formula, a list of buzzwords, em dashes), on numbers without a source, and on unnamed testimonials. |
| **Easy to host** | Plain HTML, CSS and a small script with no dependencies. The output works on GitHub Pages, Netlify, Vercel or any static host. |
| **Claude Code marketplace** | This repository is itself a Claude Code marketplace and an agentic plugin. It ships the state-aware router, seven graph-aligned subagents, all eight full skill packs, and deterministic hooks for profile linting and generated-output protection. |

<img src="docs/og-card.png" alt="Generated 1200x630 share card" width="60%">

### Install

### Why this is a marketplace, not just a plugin

The repository carries both Claude manifests at its root:

- `.claude-plugin/marketplace.json` makes `imMamdouhaboammar/portfolio-interview` a real marketplace source.
- `.claude-plugin/plugin.json` defines the installable `portfolio-interview` plugin.
- The marketplace installs the repository root with `source: "."`; the plugin then auto-discovers `skills/`, `agents/`, and `hooks/hooks.json`.
- The agentic graph keeps approvals in the parent conversation and uses skill-preloaded subagents for source, story, design, build, audit, and publish work.
- CI validates both the eight skill packs and the marketplace contract.

<details>
<summary><strong>ChatGPT and Codex: install the full Skills-only Plugin</strong></summary>

The full OpenAI package is now under [`plugins/portfolio-interview`](../../../plugins/portfolio-interview/), registered in this repository's [OpenAI marketplace](../../../.agents/plugins/marketplace.json). It includes a portable root `plugin.json`, a Codex compatibility overlay, a self-contained interview Skill and a host-workspace helper, without assuming Claude subagents or Claude hooks run on OpenAI hosts.

```bash
# from a local checkout, verify canonical runtime and package deterministically
node .claude/skills/portfolio-interview/scripts/sync-openai.mjs --check
node .claude/skills/portfolio-interview/scripts/check-openai.mjs
node .claude/skills/portfolio-interview/scripts/package-openai.mjs /tmp/portfolio-interview-plugin.zip
```

In a compatible Codex/ChatGPT Desktop local plugin flow, add this repository as a marketplace and select `portfolio-interview@mamdouh-plugins`. For a surface that accepts Skills-only Plugin archives, use the ZIP. Installation and public listing require separate user action; this repo's CI is not proof of a live hosted install.

**Runtime:** Node.js 18+ is required for generated HTML and validation. When ChatGPT cannot execute Node.js, the Skill collects a confirmed `profile.json` and provides exact local build commands instead. Optional Playwright is required for browser screenshots. For standalone Skill installations, use the existing `npx skills` method below.

</details>


Pick the tool you use. Each method below was tested as written.

<details open>
<summary><strong>Claude Code: plugin (recommended)</strong></summary>

Inside Claude Code:

```text
/plugin marketplace add imMamdouhaboammar/portfolio-interview
/plugin install portfolio-interview@mamdouh-portfolio
```

Then start the graph with `/portfolio-interview:portfolio-router`, call `@agent-portfolio-interview:portfolio-orchestrator`, or simply say "build me a portfolio". To refresh the catalog later, run `/plugin marketplace update mamdouh-portfolio`.

This route installs the full agentic runtime: eight full skill packs, the graph orchestrator, six isolated execution workers, the compatibility subagents, and [two hooks](#hooks). The orchestrator returns interview/approval gates to the parent session instead of guessing them.

To try a local checkout without installing it: `claude --plugin-dir ./.claude/skills/portfolio-interview`.

</details>

<details>
<summary><strong>Claude Code and Codex: <code>npx skills</code></strong></summary>

```bash
# into the current project
npx skills add imMamdouhaboammar/portfolio-interview --skill portfolio-interview

# for every project on this machine, Claude Code and Codex only, without prompts
npx skills add imMamdouhaboammar/portfolio-interview --skill portfolio-interview -g -a claude-code -a codex -y
```

- **Claude Code:** start it with `/portfolio-interview`.
- **Codex:** start it with `$portfolio-interview`, or describe what you want and Codex picks it up.

</details>

<details>
<summary><strong>Claude Code: copy the folder</strong></summary>

```bash
git clone --depth 1 https://github.com/imMamdouhaboammar/portfolio-interview.git /tmp/mamdouh
mkdir -p ~/.claude/skills
cp -R /tmp/mamdouh ~/.claude/skills/
```

To install it for one project only, use `.claude/skills/` inside that project. Start it with `/portfolio-interview`.

</details>

<details>
<summary><strong>Codex: copy the folder</strong></summary>

```bash
git clone --depth 1 https://github.com/imMamdouhaboammar/portfolio-interview.git /tmp/mamdouh
mkdir -p ~/.agents/skills
cp -R /tmp/mamdouh ~/.agents/skills/
```

For one project only, copy it to `.agents/skills/` in the repository. Restart Codex if the skill doesn't appear.

</details>

<details>
<summary><strong>claude.ai (web and desktop): upload a ZIP</strong></summary>

1. Build the ZIP:
   ```bash
   git clone --depth 1 https://github.com/imMamdouhaboammar/portfolio-interview.git /tmp/mamdouh
   node /tmp/mamdouh/scripts/package.mjs ~/portfolio-interview.zip
   ```
   The same ZIP is attached to every run of the **Portfolio interview skill checks** workflow, under Actions → Artifacts (you need to be signed in to GitHub).
2. Turn on code execution: **Settings → Capabilities** (Team and Enterprise admins: **Organization settings → Plugins & skills**).
3. Go to **Customize → Skills → + → Create skill → Upload a skill** and choose the ZIP.
4. Start a chat and say "build me a portfolio".

On claude.ai the rounds appear as popups when the question widget is available. Otherwise they come as short numbered messages. The site is built in Claude's sandbox and handed to you as files.

</details>

### Agentic runtime and subagents

The marketplace plugin ships a graph orchestrator plus one isolated worker for each execution-heavy specialist node. Each worker preloads the matching full skill with Claude Code's `skills:` agent frontmatter. The interactive interview/approval node deliberately remains in the parent conversation so consent and publication decisions are never delegated away.

| Subagent | Preloaded skill | Responsibility |
|---|---|---|
| `portfolio-orchestrator` | `portfolio-router` | Resolves intent/state, chooses the smallest valid chain, validates handoffs, and stops on user gates. |
| `portfolio-source-worker` | `portfolio-source` | Builds a provenance/permission-aware evidence ledger. |
| `portfolio-story-worker` | `portfolio-story` | Produces evidence-linked copy and localization patches. |
| `portfolio-design-worker` | `portfolio-design` | Handles information architecture, responsive UX, accessibility and RTL. |
| `portfolio-build-worker` | `portfolio-build` | Runs the canonical generator/checker and records build evidence. |
| `portfolio-audit-worker` | `portfolio-audit` | Independently verifies provenance, privacy, accessibility, responsive/RTL behavior and metadata. |
| `portfolio-publish-worker` | `portfolio-publish` | Performs only approval-gated releases and records non-secret deployment evidence. |

The original `profile-miner`, `portfolio-copywriter`, and `portfolio-qa` agents stay available for backward compatibility with the root all-in-one workflow.

### Hooks

| Event | What happens |
|---|---|
| Before `Write` / `Edit` | If the file sits inside a folder that `build.mjs` generated (marked by `.portfolio-build.json`), the edit is denied with a pointer to `profile.json`, since the next build would overwrite it anyway. |
| After `Write` / `Edit` on `profile.json` | Runs the copy rules and profile checks. Problems come back to Claude straight away, before any build. |

Both hooks read only the file path from the event, finish in well under a second, stay silent on every other file, and exit cleanly when they receive input they don't recognise.

<details>
<summary><strong>Add the subagents and hooks without the plugin</strong></summary>

After a copy-the-folder or `npx skills` install into `~/.claude/skills/portfolio-interview`:

```bash
mkdir -p ~/.claude/agents
cp ~/.claude/skills/portfolio-interview/agents/*.md ~/.claude/agents/
```

Then merge this into the `hooks` block of `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Write|Edit|MultiEdit", "hooks": [
        { "type": "command", "command": "node \"$HOME/.claude/skills/portfolio-interview/hooks/guard-generated.mjs\"", "timeout": 10 }
      ] }
    ],
    "PostToolUse": [
      { "matcher": "Write|Edit|MultiEdit", "hooks": [
        { "type": "command", "command": "node \"$HOME/.claude/skills/portfolio-interview/hooks/lint-profile.mjs\"", "timeout": 30 }
      ] }
    ]
  }
}
```

Installed this way, the subagents are called `@agent-profile-miner`, `@agent-portfolio-copywriter` and `@agent-portfolio-qa`.

</details>

### Requirements

- **Node.js 18 or newer.** Needed for the build and the checks.
- **Playwright with Chromium** (optional). Used for the share card and for the responsive and dark-mode checks. Without it, those steps are skipped with a warning and every other check still runs. To add it: `npm i -g playwright && npx playwright install chromium`.

### How it runs

```mermaid
flowchart LR
  A[Popups<br/>8 rounds] --> B[Photo +<br/>social accounts]
  B --> C[Copy written<br/>in your language]
  C --> D[profile.json]
  D --> E[build.mjs]
  E --> F[check.mjs<br/>copy · SEO · 320-2560px]
  F -->|errors| D
  F -->|clean| G[site/ + screenshots]
```

| Round | Asks about |
|---|---|
| 1 Setup | Language, field, goal (clients, job, brand, academic), look, Arabic dialect |
| 2 Field | Specialty, years of experience, who hires you, markets |
| 3 Identity | Name and title (suggested from git or your CV), city, availability |
| 4 Proof | Where your work lives, numbers with sources, real testimonials |
| 5 Photo | File path, attachment or URL. With no photo, an initials monogram is used |
| 6 Socials | Professional and social accounts, turned into `sameAs` links |
| 7 Contact | Email, WhatsApp, hosting, colour |
| 8 Review | Headline, summary and meta description before anything is built |

The output lands in `./portfolio/` next to your `profile.json`:

```text
portfolio/
  profile.json          your answers, the single file you edit later
  avatar.jpg
  site/
    index.html          default language
    ar/index.html       second language, RTL
    assets/             css, js, avatar, og.png, work images
    robots.txt  sitemap.xml  llms.txt  site.webmanifest  404.html
```

### Running the scripts yourself

```bash
S=~/.claude/skills/portfolio-interview      # or wherever the skill is installed

node $S/scripts/build.mjs portfolio/profile.json --out portfolio/site --og
node $S/scripts/check.mjs portfolio/profile.json portfolio/site
node $S/scripts/selftest.mjs --browser       # the skill's own tests
node $S/scripts/package.mjs                  # ZIP for claude.ai
node $S/scripts/check.mjs portfolio/profile.json --profile-only   # copy and profile only, what the hook runs
```

To change anything later, edit `profile.json` and rebuild. Don't edit the generated HTML: the next build overwrites it.

### Publishing

- **GitHub Pages:** push `site/` to a repository named `<user>.github.io`, and set `site.url` to `https://<user>.github.io/`.
- **Netlify or Vercel:** drag the `site/` folder into the dashboard. No build command is needed.
- **Your own domain:** set `site.url` to it, rebuild, then point DNS as your host explains.

After launch, add the site URL to every social profile's website field, and submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools. Both steps help search engines and answer engines connect your accounts to one person. More in [`references/seo-geo.md`](references/seo-geo.md).

### Inside the folder

```text
SKILL.md                  the instructions the agent follows
references/
  interview.md            every popup round, as exact question payloads
  field-playbook.md       how each field changes the site
  profile-schema.md       the profile.json contract
  seo-geo.md              what the build emits, and post-launch steps
  copy-rules.md           the writing standard
scripts/                  build, check, selftest, package
assets/template/          site.css and site.js
agents/                   three Claude Code subagents, plus openai.yaml for Codex
hooks/                    hooks.json and the two hook scripts
.claude-plugin/           plugin.json, the Claude Code plugin manifest
evals/fixtures/           example profiles, including one built to fail
docs/                     the screenshots in this README
```

The design comes from the [portfolio page](https://immamdouhaboammar.github.io/imMamdouhaboammar/portfolio/) in this repository.

---

## العربية

<div dir="rtl">

### السكيل بيعمل إيه

بتجاوب على حوالي ثماني جولات Popups فيها اختيارات جاهزة، وكل سؤال فيه خانة تكتب فيها إجابتك لو مش لاقيها في الاختيارات. في النص بتضيف صورتك وحساباتك على السوشال. بعد كده السكيل بيكتب النصوص بلغتك، ويبني الموقع، ويراجعه، ويوريك صوره على الموبايل والديسكتوب قبل ما تنشره.

- **مناسب لمجالك:** فيه 12 نوع مجال، منهم المطوّر والمصمم والمسوّق والكاتب وصانع المحتوى والمصوّر والمحامي والدكتور. كل نوع بيحدد أسماء الأقسام، ونوع الإثبات اللي يظهر الأول، والستايل، واللون.
- **عربي وإنجليزي:** لغة واحدة أو الاتنين. الصفحة العربية RTL بالكامل، ولهجتها مصري أو فصحى حسب جمهورك.
- **بيشتغل على أي شاشة:** اتجرب من 320px لحد 2560px من غير Scroll بالعرض، في الوضع الفاتح والغامق، وبيظهر كامل حتى لو الـ JavaScript مقفول.
- **جاهز للبحث وأدوات الـ AI:** فيه Schema للشخص والصفحة والشغل والأسئلة الشائعة، وhreflang وSitemap و`llms.txt`، وملف `robots.txt` بيسمح لبوتات ChatGPT وClaude وPerplexity، وصورة مشاركة 1200×630 بتتعمل تلقائي.
- **من غير كلام محشو:** البناء بيقف لو النص فيه جمل النفي ثم الإثبات زي "ده مش X، ده Y" أو "مش مجرد"، أو كلمات مستهلكة، أو الـ em dash. وبيقف برضه لو فيه رقم ملوش مصدر، أو توصية من غير اسم صاحبها.

### التثبيت

جرّبت كل طريقة من دول بنفس الأوامر المكتوبة هنا.

**في Claude Code كـ Plugin (الأسهل):**

</div>

```text
/plugin marketplace add imMamdouhaboammar/portfolio-interview
/plugin install portfolio-interview@mamdouh-portfolio
```

<div dir="rtl">

بعدها شغّل الـ graph بـ `/portfolio-interview:portfolio-router`، أو نادِ `@agent-portfolio-interview:portfolio-orchestrator`، أو قول لـ Claude "اعملي بورتفوليو" وهو هيختار المسار المناسب.

الـ Plugin بينزّل معاه كل حاجة. ده جدول باللي بيجي معاه:

| الجزء | بيعمل إيه |
|---|---|
| `profile-miner` | Agent بيقرا الـ CV أو حسابك على GitHub أو موقعك القديم، ويطلع منهم إجابات جاهزة، وجنب كل معلومة مصدرها |
| `portfolio-copywriter` | Agent بيكتب كل نصوص الموقع بلغتك ولهجتك، ويفضل يعيد المراجعة لحد ما تعدّي من غير أخطاء |
| `portfolio-qa` | Agent بيبني الموقع ويراجعه بعين الـ Recruiter، ويديك التعديلات مرتبة حسب أهميتها |
| Hook قبل التعديل | بيمنع التعديل المباشر في ملفات الموقع اللي اتولدت، وبيوجّهك لـ `profile.json` |
| Hook بعد الحفظ | بيراجع `profile.json` كل مرة يتحفظ، ويرجّع الأخطاء لـ Claude على طول |

تقدر تبدأ الـagentic workflow مباشرة بـ `@agent-portfolio-interview:portfolio-orchestrator`، أو تنادي worker محدد مثل `@agent-portfolio-interview:portfolio-audit-worker`.

**في Claude Code أو Codex بأداة `npx skills`:**

</div>

```bash
npx skills add imMamdouhaboammar/portfolio-interview --skill portfolio-interview
```

<div dir="rtl">

في Claude Code شغّله بـ `/portfolio-interview`، وفي Codex بـ `$portfolio-interview`. ولو عايزه متاح في كل مشاريعك، زوّد `-g` على الأمر.

الطرق اللي جاية بتنزّل السكيل لوحده. ولو عايز الـ Agents والـ Hooks معاه، الخطوات في جزء "Add the subagents and hooks without the plugin" في النسخة الإنجليزية فوق.

**نسخ الفولدر بإيدك:** انسخ فولدر `.claude/skills/portfolio-interview` من الريبو لواحد من الأماكن دي:

- `~/.claude/skills/` عشان Claude Code
- `~/.agents/skills/` عشان Codex

**على claude.ai:**

1. اعمل ملف ZIP بالأمر `node scripts/package.mjs`. أو نزّله جاهز من Artifacts آخر تشغيل لـ Workflow **Portfolio interview skill checks** في تبويب Actions على GitHub، ولازم تكون عامل تسجيل دخول.
2. شغّل Code execution من **Settings ← Capabilities**.
3. ارفع الملف من **Customize ← Skills ← + ← Create skill ← Upload a skill**.

### المتطلبات

- **Node.js 18 أو أحدث:** لازم عشان البناء والمراجعة.
- **Playwright (اختياري):** بيعمل صورة المشاركة، وبيراجع الموقع على الشاشات المختلفة وفي الوضع الغامق. لو مش متسطب، الخطوتين دول بيتخطوا مع تنبيه، وباقي المراجعة بتكمل عادي.

### بعد النشر

1. حط لينك الموقع في خانة Website في كل حساباتك على السوشال. ده بيخلي جوجل وأدوات الـ AI تعرف إن الموقع والحسابات دي كلها لنفس الشخص.
2. سجّل الموقع في Google Search Console وBing Webmaster Tools، وابعت ملف `sitemap.xml` في الاتنين.

ولو عايز تعدل أي حاجة بعد كده، عدّل `profile.json` وابني الموقع تاني. متعدلش في ملفات الـ HTML نفسها، لإن أول Build جديد هيمسح تعديلاتك.

</div>

### إضافة ChatGPT وCodex

الحزمة الكاملة موجودة الآن في [`plugins/portfolio-interview`](../../../plugins/portfolio-interview/) ومسجلة في `.agents/plugins/marketplace.json`. تقدر تثبّتها من الـ local marketplace في Codex أو ChatGPT Desktop إن كان الخيار متاحا، أو تحزمها ZIP بالأوامر أعلاه. الـ Claude subagents والـ hooks تخص Claude Code فقط. لو الجلسة مافيهاش Node.js، المهارة تجهز `profile.json` وتعطيك خطوات البناء المحلي، من غير ادعاء أن الموقع أو اختبارات المتصفح اتنفذت.
