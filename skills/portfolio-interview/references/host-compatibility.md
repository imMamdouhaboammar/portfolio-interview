# Host compatibility

| Surface | Guided questions | Build and checks | Specialist agents and hooks |
| --- | --- | --- | --- |
| Claude Code plugin | `AskUserQuestion` when available | Node.js and optional Playwright installed in user environment | Three Claude subagents plus the Claude-specific pre/post tool hooks |
| Codex or ChatGPT Work with permitted shell | Available UI or short chat rounds | Node.js 18+; optional Playwright when installed | Main Skill performs mining, copywriting and QA directly; do not assume Claude subagents/hooks |
| ChatGPT chat without Node.js | Short chat rounds or available UI | Prepare `profile.json` and exact local instructions; only claim executed checks if the actual host ran them | No automatic hooks or shell permission from Plugin |
| Plain Skill import | Available UI or chat | Depends on host tools and the installed bundled files | No bundled plugin hook activation |

Host-native read, list, search, patch, write, shell and Python are optional capabilities, not permissions granted by Plugin metadata. Inspect and ask before replacing existing files or publishing a page.

## Scope and data boundaries

- There is no MCP server, account login, hidden analytics or automatic publication in this package.
- Treat CVs, email addresses, photos, customer names and metrics as private until the person approves specific public fields.
- If a website, GitHub account or LinkedIn export is inaccessible, ask for a supplied copy rather than inventing prefilled answers.
- Only request a supplied photo or avatar URL; never substitute someone else's portrait.
- If URL downloads or image inspection are unavailable, keep the URL if permitted, or use a initials monogram.
- Validate `profile.json` after every significant edit. Claude Code hooks are not portable enforcement. Edit source JSON instead of generated HTML.
- Browser QA and Open Graph rendering require Playwright/Chromium. A skipped browser phase is never a passed browser test.
- `site.url` must match the actual host before canonical, sitemap and share metadata are final.
