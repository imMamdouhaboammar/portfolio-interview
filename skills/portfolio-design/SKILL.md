---
name: portfolio-design
description: "Use for portfolio information architecture, responsive visual direction, section order, bilingual/RTL layout, accessibility or UX redesign after the portfolio copy and reader goal are known. Produces layout decisions for the existing static-site generator."
license: MIT
metadata:
  version: "1.4"
---

# Portfolio Design: information architecture and visual direction

Inputs: approved messaging, target audience, field archetype, localization, available work samples and existing screenshots if provided. Inspect sibling portfolio-interview/references/field-playbook.md and the actual template under sibling portfolio-interview/assets/template/ before proposing a change.

Choose section hierarchy based on the audience's decision: proof-heavy case studies for designers and developers, publications for researchers, service and credentials for consultants, confidentiality-safe work for regulated fields. Prioritize readable type, clear calls to action, accessible contrast, keyboard navigation, reduced motion and realistic tap targets.

For Arabic, validate semantic direction, mixed-direction numerals/URLs, navigation and localized typography. Keep design tokens and section settings in the approved profile where supported. If a new capability genuinely requires template changes, identify precisely which files and request scope before patching template source. Never alter generated HTML as the source of truth.

Produce a compact layout decision record: section order, typography and color choices, media requirements, mobile/RTL behavior, accessibility checks and approved profile field changes.

## Neural handoff

Copy gaps -> portfolio-story. Confirmed design -> portfolio-build. Overflow, contrast or RTL defects from portfolio-audit -> fix the affected template or profile field, rebuild, and run audit again. If source photos or licensed work cannot be used, return to portfolio-source for authorized alternatives.
