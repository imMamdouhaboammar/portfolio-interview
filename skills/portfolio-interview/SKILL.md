---
name: portfolio-interview
description: Use when someone asks for a personal portfolio, CV site, profile page or link-in-bio in English or Arabic. Interview them in short rounds, source every claim, write an approved profile and build/check a responsive static site with Node.js when host execution is available. Works in ChatGPT and Codex with chat questions when popup tools are absent.
metadata:
  version: "1.3"
---

# Portfolio Interview

Turn approved facts and work samples into an English or Arabic static portfolio. The person controls what goes public. Never infer private contact details, fabricate metrics, or claim that build/QA ran if the current host cannot execute the scripts.

## Find the bundled files

All paths here are relative to this `SKILL.md` directory. Read `references/interview.md` before asking questions, then `references/profile-schema.md`, `references/field-playbook.md` and `references/copy-rules.md`. Consult `references/seo-geo.md` for publishing and `references/host-compatibility.md` for platform differences. The site generator and checker are `scripts/build.mjs` and `scripts/check.mjs`. `assets/template/` must travel with them.

Use the companion `host-workspace-operator` when host tools can read or change files. Available tools and approvals come from the host, not the Plugin. No MCP server, login or automatic deployment is bundled.

## Interview

Use a native question UI when available. Otherwise ask the same questions in short chat rounds. Avoid claiming that ChatGPT or Codex has a popup API. Follow the eight-round framework from `references/interview.md`, skipping facts already confirmed from an attached CV, a shared URL or previous answers:

1. Language, field, intended audience, goal, look and Arabic dialect.
2. Specialty, relevant experience, audience and markets.
3. Approved public name, title, city and availability.
4. Projects and results, supporting URLs, testimonial permissions.
5. Supplied photo or explicit initials-only fallback.
6. Actual professional and social profile links.
7. Explicitly approved public contact methods and intended hosting.
8. Preview headline, summary, metadata, visible sections and style. Ask for confirmation before the build.

When source access or the question widget is unavailable, ask for a paste or uploaded source; do not claim to have searched or read it. Pre-fill only from actually retrieved material. Prefer fewer rounds when the user has already supplied answers. If the user asks to proceed without a specific detail, omit the unsupported section.

## Assemble and review the source profile

Choose the field archetype in `references/field-playbook.md`. Draft first-person copy under `references/copy-rules.md` in the selected locale and register, showing three headline options. Save the user's approved data to `portfolio/profile.json` using `references/profile-schema.md`. Put image files beside it when the host supports file access. Never download third-party portraits or expose CV/private fields without specific approval.

Keep verifiable facts, achievements and quotations tied to sources. Confirm testimonial consent, client confidentiality, photos and logos. A hidden email is not a valid public contact route unless another approved route exists. Check authorization again before any publication. Generated `site/` files are disposable outputs: edit `profile.json`, then rebuild.

## Build and verify only with actual execution evidence

If the host has Node.js 18+ and permitted file/shell execution, run from the user workspace:

```bash
node <skill-dir>/scripts/check.mjs portfolio/profile.json --profile-only
node <skill-dir>/scripts/build.mjs portfolio/profile.json --out portfolio/site
node <skill-dir>/scripts/check.mjs portfolio/profile.json portfolio/site
```

Replace `<skill-dir>` with this Skill's real local path. Optionally pass `--og` when Playwright with Chromium exists. If browser QA is available, review actual 390px/1440px screenshots in both locales and dark mode. If no Playwright, state that responsive browser QA and OG rendering were skipped; never substitute a static check for a visual test.

When Node.js or writable workspace access is absent, still finish the interview and approved structured profile. Deliver it as a file when possible or copyable JSON and supply the exact three commands above for the user to run locally. Do not pretend the generated HTML exists.

For fixes, update `profile.json`, rerun validation/build and examine the result. Do not promise an unsupported host capability or auto-run a Claude-only hook. Ask before deleting or replacing any existing workspace folder.

## Deliver

Return the profile and generated site only if they exist, an actual screenshot only if captured, and one matching hosting path (GitHub Pages, Netlify or Vercel). Where `site.url` is missing, say that canonical URLs and sitemap need a rebuild after the address is confirmed. Report executed checks separately from skipped ones, and list any remaining evidence or accessibility warnings. Deploy only after user authorization.
