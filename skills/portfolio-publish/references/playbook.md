# Portfolio Publish playbook

## Contents

- Authorization matrix
- Release candidate identity
- Host/destination checks
- Secret hygiene
- Canonical URL changes
- Post-deploy verification
- Rollback posture

## Authorization matrix

Release requires qaPassed true, explicit publishApproved true, explicit contactApproved true when contactsExposed true, and an approved destination.

The approvals are independent. A user saying "looks good" does not grant deployment. A user providing an email does not grant public display.

## Release candidate identity

Tie release to the exact output path or immutable commit/artifact identifier, build evidence, QA report generated for that artifact, and destination.

If the build changes after QA, the release candidate changed and relevant QA must run again.

## Host/destination checks

For GitHub Pages, Netlify, Vercel or a custom host:
- confirm project/repository/account context,
- confirm publish directory,
- confirm production vs preview environment,
- avoid overwriting an unrelated existing site,
- avoid guessing DNS values.

Use existing authorized connectors/sessions when possible rather than asking the user to paste secrets.

## Secret hygiene

Never put access tokens, passwords, private keys, cookie/session values or secret environment variables into release records.

Record the mechanism generically, such as "authorized GitHub connection".

## Canonical URL changes

site.url can affect canonical, hreflang, sitemap, JSON-LD and social URLs.

Destination URL change → update source profile → rebuild → audit → publish.

Do not patch canonical tags directly in generated HTML after QA.

## Post-deploy verification

When browsing is available, verify expected live URL, locale routes, navigation, canonical/hreflang, public contact exposure and obvious asset failures.

Mark unavailable checks not-run.

## Rollback posture

Document the host-appropriate rollback path: redeploy previous artifact/commit, revert release commit, switch production alias, or restore prior publish directory.

Do not claim rollback is tested unless it actually was exercised.
