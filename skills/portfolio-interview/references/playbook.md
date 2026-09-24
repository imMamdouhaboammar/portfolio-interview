# Portfolio Interview playbook

## Contents

- Question economy
- Gap prioritization
- Answer taxonomy
- Approval ledger
- Conflict resolution
- Consent and public exposure
- Host interaction patterns

## Question economy

The interview is a dependency resolver, not a questionnaire. Start from state.

Ask a question only when:
1. the requested downstream outcome depends on the answer,
2. the answer is not already in approved evidence/state,
3. no safer deterministic source can resolve it.

When a source provides a candidate answer, prefill it: "Your CV says Product Designer at X from 2023–2025. Is that correct for the portfolio?" This is better than "Where did you work?"

## Gap prioritization

Priority order for most portfolio work:

1. identity and current positioning,
2. target reader and desired action,
3. role/date/contribution conflicts that affect factual copy,
4. confidentiality and publication permission,
5. locale/register and public contact choices,
6. visual preferences,
7. optional enrichment.

A narrow edit should not reopen all seven layers.

## Answer taxonomy

Classify every answer before merging state:

- `fact`: a proposition about reality; may need provenance.
- `preference`: tone, color, style, ordering choice.
- `constraint`: confidentiality, technology, availability, policy.
- `approval`: explicit authorization for a bounded action/artifact.

Do not convert "I like this copy" into `publishApproved`.

## Approval ledger

Keep separate records for:

| Kind | Typical scope |
|---|---|
| `facts` | factual profile values |
| `copy` | exact narrative/locale patch |
| `layout` | section hierarchy/visual direction |
| `publish` | releasing a reviewed build to a named destination |
| `contact` | exposing specific contact channels publicly |
| `asset` | photo/logo/testimonial/client screenshot publication |

Each record should include whether approved, scope, and evidence such as "user explicitly requested deploy to GitHub Pages".

Publication approval should be destination-specific when possible. Contact approval should enumerate the channels.

## Conflict resolution

When the user's answer conflicts with sourced evidence:
- state the discrepancy neutrally,
- ask which value should govern the public portfolio,
- preserve both source observations,
- record the user's chosen resolution as an approval/fact update.

Do not delete the conflicting source record.

## Consent and public exposure

Supplying data is not the same as permission to publish it.

Examples:
- Email used to receive a draft ≠ approval to display it publicly.
- Uploading a portrait ≠ approval to use it on a public website unless the context clearly grants it.
- Naming a client while discussing work ≠ permission to publish the client name.
- "Build it" ≠ "deploy it".

## Host interaction patterns

If a structured question widget exists, use it for small bounded rounds. Otherwise use concise numbered chat questions.

Do not depend on UI-specific capabilities. The same question plan must degrade cleanly to plain chat.

After each round, summarize only the state change and unresolved blocker. Avoid long celebratory recaps that force the user to re-read the workflow.
