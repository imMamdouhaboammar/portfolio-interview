---
name: portfolio-audit
description: "Use to review an existing portfolio site or built output for claim provenance, privacy, accessibility, responsive behavior, Arabic RTL, broken links, SEO/GEO and generator regressions. Returns severity-tagged findings and targeted repair routes."
license: MIT
metadata:
  version: "1.4"
---

# Portfolio Audit: evidence and browser QA

Require the actual site output, its profile.json and source ledger if available. When a site has not been built, report the missing artifact rather than pretending to inspect it. Use sibling portfolio-interview/scripts/check.mjs; inspect its actual results and screenshots, not just exit codes.

Check factual text and metrics against confirmed evidence; verify quote/logo/photo consent and public contact choices. Check canonical/hreflang, robots, sitemap and structured data against the actual published URL or explicitly mark the site unpublished. Review keyboard focus, semantic headings, alt text, contrast, mobile overflow at 320/390/768px, desktop at 1440px and both LTR/RTL where applicable. Browser QA and screenshots require an actual browser runner; label static-only checks clearly.

Return a structured QA result: check name, pass/fail/not-run, severity, concrete file/profile path, reproduction steps and remediation owner. Map each failing finding into qaIssues: facts -> portfolio-source or portfolio-interview, copy -> portfolio-story, layout/accessibility -> portfolio-design, build/rendering/metadata -> portfolio-build. Rebuild and re-audit after each repair; do not mark qaPassed until the blocking checks actually pass.

## Neural handoff

After verified QA, portfolio-publish becomes eligible only when the user separately approves publication and public contact exposure. Never infer that approval from a request to test.
