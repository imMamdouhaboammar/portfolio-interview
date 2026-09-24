# Neural skill routing

The portfolio system is a skill graph, not one long prompt.

```text
portfolio-router
  ├─ portfolio-source
  ├─ portfolio-interview
  ├─ portfolio-story
  ├─ portfolio-design
  ├─ portfolio-build
  ├─ portfolio-audit
  └─ portfolio-publish
```

The router reads three things: the user's current intent, shared project state, and active blockers. It then selects the smallest valid specialist path.

Examples:

- "Rewrite my About section" with approved facts -> story only
- "Build my site" without approved facts -> interview -> story -> design -> build
- "Publish it" with an RTL QA failure -> design repair first, then re-route
- "Publish it" with passing QA but no explicit approval -> blocked at the approval gate

## Neural connections

A connection is a typed handoff. It carries artifact paths, a small state patch, blockers and the requested outcome. Skills return control to the router after completing their responsibility. This allows forward progress, repair loops and re-entry without assuming one fixed pipeline.

The canonical graph is `skills/portfolio-router/references/skill-graph.json`. The old graph path under `skills/portfolio-interview/references/` is maintained as a compatibility mirror.

## Shared state

The router uses evidence-backed flags. A flag changes only when a specialist actually produced the corresponding result.

Key flags:

- `factsApproved`
- `copyApproved`
- `layoutApproved`
- `buildExists`
- `qaPassed`
- `publishApproved`
- `contactApproved`
- `contactsExposed`
- `sourcesAvailable`
- `sourcesReviewed`
- `qaIssues`

## Test

Run:

```bash
npm run test:router
```

The router test covers fresh creation, source-first intake, unmet prerequisites, QA repair routing, multi-intent detection and separate publication/contact approval gates.
