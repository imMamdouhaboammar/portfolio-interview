---
name: portfolio-interview
description: Interview the user through a short guided interview rounds, using popups when the host provides them (field, goals, identity, work, avatar photo, social accounts), then generate a responsive, bilingual-ready personal portfolio website modelled on the imMamdouhaboammar portfolio, fully prepared for SEO and GEO (Person/ProfilePage/FAQPage JSON-LD, hreflang, llms.txt, AI-crawler robots, sitemap, share image). Use when someone asks to build, make or generate a portfolio, personal website, profile page, CV site, "about me" page or link-in-bio site, or says "اعملي بورتفوليو", "عايز موقع شخصي", "صفحة بروفايل", "موقع CV". Adapts sections, schema types, tone and visual style to the person's field (developer, designer, marketer, writer, creator, photographer, product, consultant, academic, educator, law/medicine/finance).
metadata:
  version: "1.3"
---

# Portfolio Interview

Run a short interview in popups, collect a photo and social accounts, write the copy, then build a static portfolio site with `scripts/build.mjs` and prove it with `scripts/check.mjs`. The site follows the structure of `portfolio/` in the imMamdouhaboammar repository: one generator, plain HTML/CSS/JS, every section in the served HTML, and structured data for search and answer engines.

The person is the source of truth. Draft copy freely, but every fact, number, employer, client and quote on the page must come from them. When a detail is missing, leave the section out.

## Files

- `scripts/build.mjs <profile.json> [--out dir] [--og]`: writes the site. `--og` renders a 1200x630 share image when Playwright is installed.
- `scripts/check.mjs <profile.json> <site-dir>`: copy rules, SEO checks, and, when Playwright is available, overflow checks from 320 to 2560 px in light and dark themes, with screenshots.
- `scripts/selftest.mjs`: builds the fixtures and confirms that a bad profile fails.
- `scripts/package.mjs [out.zip]`: packs the skill as a ZIP for claude.ai upload.
- `README.md`: install methods for Claude Code, Codex and claude.ai.
- `agents/*.md`: three Claude Code subagents (profile-miner, portfolio-copywriter, portfolio-qa). `agents/openai.yaml` holds Codex display metadata.
- `hooks/`: two Claude Code hooks, loaded when the skill is installed as a plugin.
- `.claude-plugin/plugin.json`: the Claude Code plugin manifest.
- `../../../plugins/portfolio-interview/`: the separately packaged ChatGPT/Codex Plugin at repository level (available only in a full repository checkout). Its runtime files are kept in sync with this Skill.
- `references/interview.md`: every popup round with the exact question payloads. **Read it before asking anything.**
- `references/profile-schema.md`: the `profile.json` contract.
- `references/field-playbook.md`: how each field changes sections, copy, style, colour and schema.
- `references/seo-geo.md`: what the build emits for search and answer engines, and what still needs the person after launch.
- `references/copy-rules.md`: the writing standard for every line on the page.
- `evals/fixtures/`: two worked profiles, one bilingual designer and one Arabic-only lawyer in formal Arabic.

## Asking questions

Use the host's interactive question tool when it is actually available; otherwise present each round as a concise chat message:

- **Claude Code:** `AskUserQuestion`. Each call takes 1 to 4 questions, each question 2 to 4 options, with a header of 12 characters or less. The tool adds "Other" automatically, so free text always works. Use `multiSelect: true` when choices can combine.
- **claude.ai:** the ask-user-input widget, when it is available.
- **No popup tool (ChatGPT, Codex, API or plain chat):** send the same round as one short numbered message and wait.

Free-text answers (name, handles, project details) still go through popups. Offer 2 to 4 **prefilled suggestions** drawn from what you already know: `git config user.name`, a GitHub profile, an attached CV, or earlier answers. The person picks one or types their own under "Other". A popup never shows only placeholder options like "I'll type it".

Keep the interview to about 8 rounds. Skip a round when earlier answers or attached files already cover it. After each round, say in one line what you understood, then move on.

## Subagents and hooks

When the skill runs as the Claude Code plugin, three subagents are available. Delegate to them and pass `SKILL_DIR` (this folder's absolute path) in the prompt:

| Subagent | Hand it | When |
|---|---|---|
| `profile-miner` | the CV path, LinkedIn export, GitHub username or old site URL | Step 1, as soon as a source exists. Turn its `prefill` into R3/R4 popup suggestions, and its `needs_confirmation` into questions. |
| `portfolio-copywriter` | the `profile.json` path plus the collected answers | Step 5. Show its three headline options in the R8 review. |
| `portfolio-qa` | the `profile.json` path and the output folder | Steps 7 and 8. Act on every finding before the handover. |

If a subagent isn't available (a plain skill install, ChatGPT, Codex, claude.ai), do that step yourself with the same references. The separate OpenAI Plugin packages the workflow and scripts, not Claude-only subagent registrations or Claude hook execution.

The plugin also runs two hooks:

- **Before any Write or Edit** inside a folder that `build.mjs` generated, the edit is denied with a pointer to `profile.json`. Make the change there and rebuild.
- **After every save of `profile.json`**, the copy rules and profile checks run. When they fail, the report comes back to you. Fix it before building.

## Host portability

Use Node.js 18+ for `build.mjs` and `check.mjs` **only when executable shell access exists**. Some ChatGPT sessions can read and create files but cannot execute Node.js. In that case complete the interview, prepare `profile.json`, validate its facts and structure as far as the available tools permit, and hand over exact local build/check commands. Do not report successful build, screenshots, hooks or browser tests that have not run. Always request approval before publishing contact details or deploying a site.

Claude hooks and subagents only activate when that host loads them. In ChatGPT/Codex, explicitly check the profile after each meaningful edit and avoid direct edits to generated HTML. Refer to the OpenAI package's `references/host-compatibility.md` when present.

## Workflow

1. **Kickoff.** Say in two lines what will happen: up to eight short interview rounds, a photo, social links, then a site they can publish. Check context first: an attached CV, LinkedIn export, GitHub username or old site can fill most answers. Offer to read it before asking.
2. **Interview.** Follow `references/interview.md` round by round:
   R1 setup (language, field, goal, look) → R2 field depth → R3 identity → R4 proof of work → R5 avatar → R6 social accounts → R7 contact and address → R8 review.
3. **Classify the field.** Map the answers to one archetype in `references/field-playbook.md`. It sets section order, labels, schema type for work items, default style and colour, and what proof matters for that field. When a person spans two fields, pick the one their target reader hires for and pull vocabulary from the second.
4. **Handle the avatar.** Get a local path, URL or attachment, as described in `references/interview.md` R5. Copy the file next to `profile.json`. Check that it is jpg, png, webp or avif, roughly square, at least 400 px, and ideally under 300 KB. Tell the person when it is not. With no photo, the build makes an initials monogram. Never generate or pull a face from the internet as a stand-in.
5. **Write the copy.** Draft every string in the site language(s) and follow `references/copy-rules.md`. For Arabic, match the dialect chosen in R1: Egyptian for a casual Egyptian audience, formal Arabic (`site.dialect: "msa"`) for Gulf professionals, law, medicine, finance and government. Write the headline as three parts (lead, highlight, tail) so the highlight lands on the phrase that makes a reader stay. Show the person the headline, summary and meta description in the R8 review before building.
6. **Write `profile.json`.** Follow `references/profile-schema.md`. Default location: `./portfolio/profile.json` in the working directory, with the avatar and work images beside it. Ask before overwriting an existing folder.
7. **Build.** `node <skill>/scripts/build.mjs portfolio/profile.json --out portfolio/site --og`
8. **Check.** `node <skill>/scripts/check.mjs portfolio/profile.json portfolio/site`. Fix every error by editing `profile.json`, never the generated HTML, then rebuild. Look at the screenshots it writes (390 px and 1440 px, both locales, dark mode) before calling the site done.
9. **Hand over.** Show the screenshots, name the folder, and give one deploy path that matches their situation (see "Publishing" below). List the warnings still open, such as no `site.url` yet, and the post-launch steps from `references/seo-geo.md`.

## Publishing

Pick one path from the R7 answer and give its exact steps:

- **GitHub Pages:** push `site/` to a repository named `<user>.github.io` (root URL), or to any repository with Pages enabled (URL ends in `/<repo>/`). `site.url` must match that address exactly.
- **Netlify or Vercel:** drag and drop the `site/` folder, or connect the repository with `site` as the publish directory and no build command.
- **Custom domain:** set `site.url` to `https://domain/`, rebuild, and point DNS as the host instructs.

When `site.url` changes, rebuild. Canonical, hreflang, sitemap, OG and JSON-LD URLs all derive from it.

## Editing later

To change anything, edit `profile.json` and rebuild. When the person asks for a change in chat, apply it to `profile.json`, rebuild, rerun the checks and show the affected screenshot. The generated HTML is output only; hand edits there disappear on the next build.

## Guardrails

- No invented metrics, clients, employers, awards, degrees or testimonials. Every number carries a `source` (the build hides stats without one). Testimonials need a real name, and the person must confirm they have permission to quote.
- Contact data is public once published. Confirm before showing a personal email or phone number. Offer `showEmail: false` and WhatsApp or LinkedIn instead.
- Only use social URLs the person gave you. Normalise handles into full URLs, and confirm any you had to guess the format for.
- Respect client confidentiality for consultants, lawyers, doctors and agency staff. Describe the work without naming a client unless the person says the name is public.
- Photos of other people, client logos and screenshots of client work need the person's confirmation that they may publish them.
