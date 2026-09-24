---
name: portfolio-build
description: "Use when an approved portfolio profile and layout need to become or update a static English/Arabic website. Runs the existing Node.js site builder and profile checks when execution is available; never overwrites or claims a build without actual evidence."
license: MIT
metadata:
  version: "1.4"
---

# Portfolio Build: repeatable static-site generation

Inputs: an approved profile.json, approved copy and layout, authorized output directory, user-supplied assets and the current workspace. Find the generator in the sibling portfolio-interview skill; do not create a competing site engine.

Before running commands, resolve the sibling directory from this skill's actual installed directory and ensure Node.js 18+ plus workspace access. Ask before overwriting pre-existing user work. Generated HTML is disposable; make edits in profile.json or the shared template source as authorized.

    node ../portfolio-interview/scripts/check.mjs portfolio/profile.json --profile-only
    node ../portfolio-interview/scripts/build.mjs portfolio/profile.json --out portfolio/site
    node ../portfolio-interview/scripts/check.mjs portfolio/profile.json portfolio/site --no-browser

These relative script paths assume the shell's working directory is this skill directory; replace them with absolute resolved paths otherwise. Optional --og requires Playwright/Chromium, and browser checks must only be claimed when executed.

If execution is unavailable, return the approved profile and exact local commands; do not claim a built site or screenshots. Record input and output paths, actual command results, skipped checks and outstanding warnings.

## Neural handoff

A missing approval or source claim goes back to portfolio-interview or portfolio-source. An unsupported generator feature goes to portfolio-design for a scoped template change. An actual generated site with build evidence goes to portfolio-audit; do not automatically deploy.
