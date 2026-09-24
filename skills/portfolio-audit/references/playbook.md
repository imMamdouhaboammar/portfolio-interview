# Portfolio Audit playbook

## Contents

- Audit modes
- Severity model
- Factual/privacy checks
- Accessibility checks
- Responsive and RTL browser checks
- SEO/GEO and link checks
- Repair routing
- Re-audit strategy

## Audit modes

Declare one of static-only, local-browser, live-browser, or mixed.

A static-only run may inspect markup and files, but cannot prove visual overflow, focus appearance, runtime navigation or rendered contrast.

## Severity model

| Severity | Meaning |
|---|---|
| critical | Publication risks serious privacy/security harm, broken core access, or materially false public content |
| high | Blocks intended user task, accessibility, key locale, core metadata or a release promise |
| medium | Meaningful defect with workaround or limited surface |
| low | Minor defect with small user impact |
| info | Observation or improvement, not a failure |

Avoid severity inflation. Cosmetic taste is not a critical defect.

## Factual and privacy checks

Compare rendered claims to approved profile/source ledger: names, roles, employers, dates, metrics, client identities, testimonials, credentials and contact details.

Check that public media, quotes and logos have approval. A technically correct page can still fail release if it exposes unapproved contact data.

## Accessibility checks

Static checks cover language/direction attributes, semantic headings/landmarks, link/button semantics, alt strategy, labels/form associations and obvious duplicate IDs.

Browser checks cover keyboard traversal, visible focus, interactive states, reduced motion, rendered contrast, zoom/reflow and touch-target usability.

## Responsive and RTL browser checks

Use at least 320, 390, 768 and 1440 px when relevant. For each enabled locale/theme inspect horizontal overflow, clipped content, navigation, cards/grids, long names/URLs, bidi punctuation/numbers, directional icons and modal/menu focus behavior.

Screenshots are supporting evidence, not a substitute for interaction tests.

## SEO/GEO and link checks

Validate the generator's promises: canonical, hreflang, title/meta description, structured data, robots, sitemap, OG/social metadata, llms.txt and link validity when network access permits.

If the site is unpublished or has no final URL, mark live-only checks accordingly rather than manufacturing a canonical host.

## Repair routing

- evidence/factual provenance → source/interview
- copy/localization → story
- layout/accessibility/RTL → design
- rendering/metadata/generator → build
- release-only live regression → publish coordinates rollback, then responsible repair skill

## Re-audit strategy

After a fix:
1. rerun the failed check,
2. rerun checks sharing the same dependency,
3. rerun a small smoke set across locales/viewports,
4. only then update QA state.

Do not mark the whole audit passed because one screenshot looks fixed.
