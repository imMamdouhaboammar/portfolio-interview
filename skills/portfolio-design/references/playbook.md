# Portfolio Design playbook

## Contents

- Reader-led information architecture
- Field patterns
- Responsive strategy
- Arabic and bidirectional layout
- Accessibility baseline
- Media handling
- Template capability decisions

## Reader-led information architecture

Section order should answer the reader's questions in sequence. A common pattern is:
1. identity and positioning,
2. strongest proof,
3. selected work/experience,
4. credibility,
5. fit/services,
6. contact.

Change the order when the field demands it. Do not mechanically reproduce a fixed portfolio template.

## Field patterns

- **Design/product:** visual work and case-study proof early; process only when it demonstrates judgment.
- **Engineering:** shipped systems, scope, architecture/impact and verifiable code evidence.
- **Research/academic:** publications, methods, affiliations and selected research.
- **Consulting/marketing:** problem classes, services, credible outcomes, confidentiality-safe examples.
- **Regulated professions:** credentials, areas of practice, public-safe experience; avoid implying guarantees.
- **Creative/photography:** work-first media with strong performance and accessible captions/alternatives.

## Responsive strategy

Design from narrow widths outward.

At 320/390 px:
- no horizontal scroll,
- readable line lengths,
- touch targets remain operable,
- cards/media preserve essential hierarchy,
- nav and locale controls remain reachable.

At ~768 px:
- verify grid transitions and content reflow, not just scaling.

At 1440 px:
- avoid over-wide text and giant empty gaps,
- ensure media crops remain intentional.

Do not rely on exact viewport-height hero tricks that hide content on mobile browser chrome changes.

## Arabic and bidirectional layout

Use semantic `dir` and CSS logical properties where possible. Verify:
- nav order,
- arrows/chevrons that convey direction,
- timeline alignment,
- mixed Arabic + Latin URLs,
- numbers and punctuation,
- icon/text spacing,
- text alignment based on direction rather than hardcoded left/right.

Do not mirror brand marks or media unless their meaning is directional.

## Accessibility baseline

Plan for:
- one logical heading hierarchy,
- keyboard-operable navigation/actions,
- visible focus,
- text/background contrast,
- non-color-only states,
- reduced motion,
- descriptive alt text or decorative null alt,
- form/control labels,
- target sizes that work on touch.

Accessibility decisions should be testable by `portfolio-audit`.

## Media handling

Preserve original aspect ratio unless a crop is approved. Specify object-fit/crop intent. Do not stretch logos or portraits to satisfy a grid.

If media is missing, prefer a deliberate text/monogram layout over unauthorized stock imagery.

## Template capability decisions

Before editing template code:
1. inspect current profile fields and tokens,
2. inspect the existing template component,
3. determine whether configuration can satisfy the request,
4. identify the smallest missing capability,
5. document the exact template files and audit checks affected.

Generated HTML is output and should not be patched directly.
