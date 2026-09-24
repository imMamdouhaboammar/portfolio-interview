---
name: portfolio-interview
description: "Use when the portfolio workflow needs direct user input: missing facts, audience and positioning choices, language/register, visual preferences, contact exposure, or explicit approval decisions. Produces approved facts and state patches for sibling skills."
license: MIT
metadata:
  version: "2.0"
---

# Portfolio Interview: elicitation and approvals

This skill is a specialist node in the portfolio skill graph. It asks only for information that cannot be safely recovered from approved sources or current project state.

Before asking anything, inspect the handoff packet. If a source ledger already answers a question, prefill it and ask for confirmation rather than asking from zero. Keep rounds short and skip irrelevant questions.

## Responsibilities

Collect or confirm:

- target reader and portfolio goal
- role, positioning and field archetype
- identity, experience, projects and measurable claims
- language, locale and tone choices
- public photo and asset permissions
- social and contact channels
- confidentiality constraints
- explicit publication and contact-exposure approvals when requested

Never invent missing facts. Never convert a preference into factual evidence. A user approving copy is not the same as approving publication.

## Outputs

Return a compact state patch and approval record. Typical outputs include:

- `approvedFacts`
- `approvedProfile`
- `factsApproved`
- `publishApproved` only after an explicit publish request
- `contactApproved` only after explicit consent to expose contact channels
- unresolved questions or conflicts

## Neural handoffs

- Evidence gap or conflicting source -> `portfolio-source`
- Facts approved -> `portfolio-story`
- Pure layout preference with approved copy -> `portfolio-design`
- Publish/contact approval resolved -> return to `portfolio-router` for re-routing

Do not call downstream skills automatically. Return control to the router with your state patch so it can re-evaluate the graph.
