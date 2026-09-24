---
name: portfolio-publish
description: "Use only when someone explicitly requests publishing or deploying a reviewed portfolio site to an approved host. Requires passing QA and separate confirmation of public contact exposure. Provides a deploy checklist when host credentials or actions are unavailable."
license: MIT
metadata:
  version: "1.4"
---

# Portfolio Publish: authorization-gated release

Input: actual generated site, QA report, approved destination and domain, publish authorization and explicit consent for every public contact channel. A request to create or preview a site is not permission to deploy it.

Preflight: require qaPassed, publishApproved and contactApproved when contacts are exposed. Confirm the user's intended GitHub Pages, Netlify, Vercel or custom-domain destination. Never display secret tokens, overwrite an existing live site without permission or guess DNS settings. If site.url changes, update profile.json, rebuild and rerun checks because canonical, JSON-LD, hreflang, sitemap and social previews derive from it.

Use the host's existing authorized deployment tools where available. If unavailable, deliver exact manual steps and clearly say publication has not happened. After deployment, check the returned live URL, navigation, canonical tags and contact information if real browsing is available; report unverified items explicitly.

## Neural handoff

QA regression -> portfolio-audit. Canonical URL mismatch -> portfolio-build -> portfolio-audit. Unauthorized public details -> portfolio-interview before any publishing action. Stop at approval boundaries; the router must never auto-execute this skill merely because all other stages are complete.
