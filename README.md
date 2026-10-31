# MaxImpress New Official Website V2.7 — Firebase and GitHub Ready

**Baseline:** owner-uploaded MaxImpress V2.6 Customer Portal ZIP. Website marketing visuals, existing content, logos, photos, video, branding, and pages are preserved. Customer management has an expanded private dashboard. GA4 public marketing-page tracking is added but inactive without its real measurement ID.

**Deployment structure:** `public/` contains ONLY deployable site files; `firebase.json` and `firestore.rules` live outside that folder. GitHub Actions files are under `.github/workflows/`.

**Not yet live:** Firebase web-app credentials, GA4 ID, GitHub repository, Firebase project, owner admin claim, hosting, DNS, verified traffic and production workflows all require account-level setup.

Read `docs/FIREBASE_MOVE_AND_OWNER_DASHBOARD.md` for exact setup, GitHub, admin privileges, real analytics and domain/SEO migration. Read `docs/CUSTOMER_PORTAL_SETUP.md` for the existing V2.6 customer-authentication instructions (older instructions refer to Cloudflare Pages and to config paths before the move; use the V2.7 guide for Firebase Hosting and new `public/` paths).

## Local quality checks

- `npm ci --ignore-scripts` installs the pinned local QA dependencies.
- `npm audit --audit-level=high` checks the dependency tree.
- `npm test` validates all public JavaScript and every internal website link.
- `npm run test:rules` starts the local Firestore emulator and verifies customer isolation, email-verification enforcement, owner-administrator access, and protected order ownership. Java 21 or newer is required.

The GitHub quality workflow repeats these checks on every pull request and push. The production workflow deploys Firestore rules and indexes before Firebase Hosting, and refuses to release while Firebase, Analytics, sitemap, or canonical placeholders remain.
