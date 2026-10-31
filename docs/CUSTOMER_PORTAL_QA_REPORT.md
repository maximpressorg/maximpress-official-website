# MaxImpress Customer Portal — Static QA Report

**Tested:** 31 October 2026. **Baseline:** owner-uploaded `MaxImpress_V2.5_Homepage_Only_SEO(1).zip`.

### Verified in the local artifact

- Package retains the original homepage, 57 existing branded content HTML pages and Google verification file; account navigation was inserted without rebuilding original documents.
- Five separate account HTML pages (`account.html`, `onboarding.html`, `dashboard.html`, `account-settings.html`, `admin.html`) created with matching styling and privacy-conscious copy.
- All original assets, site animations and SEO files retained; account CSS/JS included alongside existing `assets/site.css` and `assets/site.js`.
- New Firebase client configuration file ships **with placeholders**, not real private credentials.
- Firestore rules restrict account documents by owner UID; admin read/edit permission requires a server-issued `admin` claim; customer order creation cannot certify payments or service completion.
- Account pages include `noindex,nofollow`, and original sitemap remains homepage-only.
- JavaScript passed Node syntax checks; all local asset/page hrefs passed a static link-path check.

### Cannot be certified until owner configures Firebase

Actual Google/Apple OAuth callbacks, verification-email delivery, password recovery, Firestore permissions against production service, account sharing across devices, live admin claim issuance, and end-to-end form workflows. Those actions were not simulated.

### Note on visual browser testing

The static test runner's Chromium browser returned `ERR_BLOCKED_BY_ADMINISTRATOR` when attempting to visit its own local HTTP preview, so a full desktop/mobile screenshot comparison could not be completed. The responsive styles and markup were inspected and all local paths were checked; a real browser review on the deployed site remains required.
