# Portfolio Interview: connected skill architecture

This repository ships a **portfolio orchestration skill** plus focused, independently discoverable Agent Skills. Neural Connections means a documented, directed graph of conditional handoffs, not a neural network or an autonomous agent runtime. Dynamic Routing is deterministic and auditable using the bundled, offline Node.js script. Compatible hosts may also choose a skill from its frontmatter description without running that script.

| Skill | Trigger | Handoff artifact |
| --- | --- | --- |
| portfolio-source | CV, LinkedIn, GitHub, site, source verification | consent-aware source ledger |
| portfolio-interview | new portfolio, missing facts, approvals | approved facts and profile |
| portfolio-story | headline, case studies, copy/localization | approved copy patch |
| portfolio-design | section architecture, UX, responsive/RTL | approved layout decisions |
| portfolio-build | generate or rebuild from approved profile | static site and build evidence |
| portfolio-audit | QA, accessibility, claims, SEO | QA report and typed feedback |
| portfolio-publish | **explicit** deployment request | verified live URL or manual release steps |
| host-workspace-operator | file tooling needed by host | host-native, permission-checked operations |

Full graph: skills/portfolio-interview/references/skill-graph.json.
Executable router: skills/portfolio-interview/scripts/route.mjs.

## Route contract

State flags are supplied by the host or reviewer based on actual evidence, never self-certified by the router: sourcesAvailable, sourcesReviewed, factsApproved, copyApproved, layoutApproved, buildExists, qaPassed, publishApproved, contactsExposed, contactApproved. The optional qaIssues array accepts facts, copy, layout, accessibility, rtl, build, rendering or metadata and routes an audit failure back to the responsible skill.

    node scripts/route.mjs --task "Build my Arabic portfolio" --state examples/portfolio-state.json
    node scripts/route.mjs --task "Publish the site" --state portfolio-state.json
    node --test scripts/route.test.mjs

No state file defaults to unknown/not approved. The router emits one **next** skill plus blockers rather than claiming to execute tools or silently activating all siblings. The host must re-run routing after each confirmed milestone. If a required skill is missing, use the orchestration instructions manually and report the missing capability. Publishing is never chosen by default.

## Cross-host distribution

Claude Code discovers individual skills under plugin-root skills/. The OpenAI portable and Codex manifests also use plugin-root skills/. Standalone installations copy every skill as a sibling into the supported host's skills folder; copying only one skill may break its references to siblings. Claude-only hooks and subagents remain host-specific and are not implied for ChatGPT.

Graph and router are bundled **inside** skills/portfolio-interview so ZIP and individual skill-folder installs have a stable relative path. Keep names consistent with frontmatter and validate links before release. Host-side model routing is nondeterministic; the Node router is a reproducible reference decision, not a claim that every host runs it automatically.

## Safety

User-owned facts, publication permission, client confidentiality, contact consent and deployment authorization are separate gates. A failed check cannot be converted to qaPassed because the next stage needs it. Every QA repair returns to the smallest responsible stage, then rebuilds and reruns the affected checks.
