# MaxImpress V2.7 — Local Verification Report

**Date:** 31 October 2026. **Input:** owner-supplied V2.6 customer portal package.

## Passed locally

- Original 212 deployable site files and marketing assets were carried forward; zero source files missing. External logos, MP4 video, base `assets/site.css`, base `assets/site.js`, Google Search Console verification file, and original robots/sitemap files remained byte-identical. Marketing HTML pages changed only by adding the optional GA4 module tag; private owner dashboard was explicitly upgraded.
- Added Firebase Hosting root config with `public` as a separate publish-only folder. Firestore rules, docs, maintenance script and GitHub workflow files are outside the hosted public directory.
- 62 normal HTML pages checked for local links to files/assets: **zero unresolved local path references**.
- All 8 browser JavaScript files and maintenance JavaScript syntax-checked with Node.js: **passed**.
- Added owner-only dashboard markup: real Firestore-based totals, categories/goals/referrals, order management; visitors metric is deliberately a link to independently permissioned Google Analytics, not a fabricated metric.
- Site homepage still has only one canonical tag (old Cloudflare origin until live domain chosen), and homepage-only sitemap originally remains unchanged.
- CI starter workflows include checks that block releasing placeholder Firebase or GA4 identifiers, or the Cloudflare origin as canonical, until owner setup.

## Not verified; requires live account access

- Firebase Hosting site published or custom domain connected.
- GitHub repo created and authenticated deployment secret configured.
- OAuth login, email verification, persistent Firestore data, production Firestore rule denial checks, backend admin custom claim issuance.
- GA4 collection, realtime reporting, privacy/consent validation, Search Console domain migration.
- Live mobile/desktop visual browser tests and end-to-end production integration tests.

**This ZIP is a prepared deployment repository, not a deployed live website.**
