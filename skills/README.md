# Portfolio skill packs

Each directory under skills/ is a self-contained Agent Skill pack. The packs are designed for progressive disclosure: discovery metadata stays in YAML frontmatter, operational instructions stay in SKILL.md, deeper context is loaded only from references/, and deterministic checks live in executable scripts.

## Required pack shape

    skills/<skill-name>/
    ├── SKILL.md
    ├── scripts/
    │   └── validate.mjs
    ├── references/
    │   └── playbook.md
    ├── assets/
    │   └── output-template.json
    └── evals/
        └── cases.json

The router and interview packs may contain additional runtime files such as references/skill-graph.json or scripts/route.mjs.

## Metadata source of truth

For Agent Skills discovery, SKILL.md YAML frontmatter is canonical for name and description. This repository intentionally does not duplicate those fields into a per-skill SKILL.json, because two metadata sources can drift. Machine-readable orchestration metadata belongs in portfolio-router/references/skill-graph.json.

An external orchestrator may derive a catalog from SKILL frontmatter plus the graph.

## Runtime contract

Every pack follows the same control pattern:

1. activate from intent/state,
2. load only the selected SKILL.md,
3. read the relevant playbook section on demand,
4. enforce trust/path/approval boundaries before side effects,
5. execute specialist work,
6. validate the primary artifact with scripts/validate.mjs,
7. merge only evidence-backed state,
8. return to portfolio-router,
9. reroute on verification failure instead of weakening the gate.

## Artifact discipline

Each skill has one primary JSON artifact shape in assets/output-template.json. Templates contain placeholders only; they are not evidence.

Validators are intentionally dependency-free Node.js scripts.

    node skills/portfolio-source/scripts/validate.mjs path/to/source-ledger.json
    node skills/portfolio-source/scripts/validate.mjs --selftest

## Evals

evals/cases.json contains at least a normal/happy case, a missing-prerequisite or approval case, an adversarial/trust-boundary case, and a repair/regression case.

These are behavioral specifications, not model scores. They should be exercised across supported agent hosts/models during release qualification.

## Repository-wide pack check

Run:

    node scripts/skills-selftest.mjs

It verifies pack structure, frontmatter, progressive-disclosure links, eval shape and validator syntax/selftests.
