# Portfolio Build playbook

## Contents

- Build modes
- Canonical paths and source of truth
- Preflight and overwrite policy
- Command evidence
- Artifact verification
- Browser/OG capability handling
- Failure taxonomy

## Build modes

A build result can be executed, prepared, failed, or partial.

Only executed with verified artifacts may set buildExists true.

## Canonical paths and source of truth

The portfolio profile and shared template are durable sources. Generated HTML/CSS/metadata under the output directory are disposable products.

When a user asks to change a generated page:
1. locate the responsible profile field or template rule,
2. edit that source,
3. rebuild,
4. re-check.

Direct generated-output edits are acceptable only for forensic diagnosis and must not be presented as the durable fix.

## Preflight and overwrite policy

Before build:
- resolve the profile and output paths,
- verify the profile is readable,
- verify referenced local assets exist,
- inspect the output directory,
- detect whether it is recognized generated output or unrelated user work,
- obtain overwrite permission when ambiguity exists.

Never use recursive deletion on an uncertain path.

## Command evidence

Record command/arguments, working directory, exit code/status, relevant stdout/stderr, and timing when useful.

Do not dump huge logs into handoffs; keep paths to logs and the decisive excerpt.

Canonical commands from repository root:

    node scripts/check.mjs portfolio/profile.json --profile-only
    node scripts/build.mjs portfolio/profile.json --out portfolio/site
    node scripts/check.mjs portfolio/profile.json portfolio/site --no-browser

Add --og or browser checks only when their runtime dependencies actually exist.

## Artifact verification

A successful command is not enough. Verify expected output such as the primary locale entry page, secondary locale path when configured, llms.txt, robots/sitemap when URL configuration warrants them, and copied/processed assets referenced by HTML.

Record only files you actually checked.

## Browser/OG capability handling

Playwright/Chromium-dependent work must be labeled pass/fail when executed, or not-run when unavailable.

Never substitute HTML parsing for viewport screenshots.

## Failure taxonomy

Input failure: profile schema/copy/evidence invalid → return upstream.

Environment failure: Node/browser missing → prepared/not-run, not a product defect.

Generator failure: command exception/invalid output → build-owned defect.

Output verification failure: command said success but required artifact missing → high-confidence build defect.

Metadata mismatch: site URL/canonical changed → update source, rebuild, then audit.
