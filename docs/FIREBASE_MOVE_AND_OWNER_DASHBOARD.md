# MaxImpress V2.7 — Firebase Hosting, GitHub, owner dashboard and analytics

**Status:** The supplied V2.6 website has been reorganized as a deploy-ready Firebase Hosting repository; it has NOT been deployed to Google or pushed to GitHub. Firebase/Google Analytics IDs are placeholders. You must authorize external accounts to finish.

## 1. What the owner will see

- **Private owner dashboard:** `/admin.html` at your final Firebase Hosting domain. Only a Firebase account holding a **server-issued `admin: true` custom claim** can read the customer/order data. The URL itself is not a security boundary; Firestore rules enforce permissions.
- **Registered customers:** real verified customer profiles, onboarding completion, new signups, customer categories, social goals, and referral sources.
- **Services / projects:** genuine service requests, pending/active/completed statuses, owner-edited progress notes and *manually confirmed* payment records; requests are not automatically paid projects.
- **Traffic:** Google Analytics 4 reports for website visitors, page views, traffic sources and realtime activity. The dashboard provides a private Google Analytics entry point, not fake traffic totals; GA4 account access is separate. Hosting usage statistics are in Firebase console.
- **Customer view:** `/dashboard.html` after login, shows only that signed-in customer's records.
- **Firebase console:** project administration, Authentication users and Firestore documents; does not expose third-party site visitor identities.

## 2. Prepare your Firebase project

1. In Firebase Console create one Firebase project (for example name: MaxImpress Production). Register a Web app; copy the public `apiKey`, `authDomain`, `projectId`, `appId` into `public/assets/firebase-config.js`. **Never** put an Admin SDK service-account key into `public/` or GitHub.
2. Firebase Authentication: enable Email/Password and Google providers. Under Authentication → Settings → Authorized domains, add your actual Firebase Hosting `.web.app` domain, and later your custom domain. Keep Apple disabled unless Apple Developer setup is completed.
3. Create Firestore; deploy production rules BEFORE opening registration to visitors. From an authenticated terminal at repo root run `firebase deploy --only firestore --project YOUR_FIREBASE_PROJECT_ID`. Review any permission prompts; never leave permissive test rules published.
4. In Firebase → Project settings, enable/link Google Analytics, and get your **Web stream Measurement ID `G-...`**. Put it into `public/assets/analytics-config.js`. Review site privacy disclosures and any applicable consent handling before publishing. Traffic tracking starts with deployment and cannot recover previous untracked visits. For site reporting use https://analytics.google.com/analytics/web/ .
5. Admins: first register a personal customer account with verified email using this site after deployment. Get its UID from Firebase Console → Authentication → Users. In a trusted local terminal, securely provision Admin SDK credentials **outside this repository**, set `GOOGLE_APPLICATION_CREDENTIALS` to that file and run:

```bash
npm install
node tools/grant-admin.mjs YOUR_FIREBASE_PROJECT_ID YOUR_OWN_FIREBASE_AUTH_UID
```

Use **only your own** UID. This script reads the real Firebase Auth user and preserves existing custom claims. Do not provide a service-account JSON/key to ChatGPT or commit it to GitHub. For security, disable/delete any downloaded local key when no longer needed. Sign out and in again for a new ID token.

## 3. Repository setup and Firebase deployment

This archive itself is a **GitHub-ready folder**, not a created GitHub repository. Create a **private** GitHub repo, e.g. `maximpress-official-website`, and upload/commit the contents of the **project root** (including `.github` directory, `firebase.json`, `firestore.rules`, `public/`). Do not publish customer exports, credentials or secrets.

Install Firebase CLI locally from official Firebase instructions (Node.js required):

```bash
npm install -g firebase-tools
firebase login
firebase projects:list
firebase use --add
# configure web-app config + GA4 ID; site origin procedure below
firebase deploy --only hosting,firestore --project YOUR_FIREBASE_PROJECT_ID
```

This creates a public site at `https://YOUR_PROJECT_ID.web.app` (check the actual URL shown by Firebase; the default Hosting site ID may differ from project ID). Run preview first if desired: `firebase hosting:channel:deploy review --project YOUR_FIREBASE_PROJECT_ID` (do not share OAuth secrets; review authorized-domain requirements for preview login).

### GitHub automatic deployments

Official Firebase integration: `firebase init hosting:github` from the project root. This connects to the owner-approved GitHub repository, creates deployment credentials and encrypted GitHub secret, and may modify the supplied starter workflows. Review generated workflow permissions before committing. If keeping the supplied workflows, configure:

- GitHub **Actions repository variable** `FIREBASE_PROJECT_ID` = actual Firebase Project ID.
- GitHub **Actions repository secret** `FIREBASE_SERVICE_ACCOUNT` = valid, narrowly authorized Firebase Hosting deployment service-account credential. Never put credential JSON in a Git commit. Prefer the official CLI integration to generate and securely store this credential; adjust action secret naming if it uses its own convention.
- Push to `main` only after testing. Same-repository pull requests produce preview deployments. The workflows purposely refuse deployment if Firebase web config or GA4 ID still contains placeholders. Firebase Hosting-only workflows do **not** automatically change database rules; deploy rules separately after explicit review.

## 4. Domain and SEO migration

Original site contains homepage canonical and homepage-only sitemap for **https://maximpress.pages.dev/**. This source intentionally has not guessed your final domain. Once you confirm the actual Firebase Hosting hostname or your custom domain, run:

```bash
python tools/set-site-url.py https://YOUR_CONFIRMED_HOSTNAME
```

This updates only the existing Cloudflare-origin references inside HTML and SEO files. Homepage-only sitemap and internal `noindex` behavior remain intact. Google can still crawl any public URL; sitemap exclusions and `noindex` do not guarantee only the homepage will ever show in search.

If you move from `maximpress.pages.dev`, keep the Cloudflare URL online only for **301 permanent redirects** to corresponding new URLs where you have control, or use a custom domain connected to Firebase while keeping the old Cloudflare project for redirects. DNS / custom domain mapping and redirect setup are separate account-level actions. Do not simply abandon the old indexed URLs. Verify the target domain's Search Console property, submit its new sitemap, and review indexing. Avoid running two live conflicting copies of the same site without redirects.

## 5. Data, privacy, and hosting notes

- `/public` is the ONLY publish directory. `docs/`, Firestore rules, GitHub workflows, maintenance scripts and any local credential material are **not served** by Firebase Hosting.
- This is the existing static website on Firebase Hosting with Auth + Firestore; it does not need a new React/Next.js framework.
- Google Analytics collects reports only after configuration, publication and any required user consent. It does not show identifiable visitor lists. Customers, traffic visitors and service requests are different metrics.
- Account/Firestore features need real Firebase Authentication/Firestore configuration; demo counts are never manufactured. The admin UI reads existing Firestore data; large datasets would eventually require paginated or aggregated server queries for efficient scaling.
- Firebase Hosting has a no-cost Spark allowance, subject to usage limits; Firestore/Auth have quotas and provider-specific limits. Cloud Functions or server-side GA4 reports may require an upgrade or added billing. Enable budget alerts and monitor usage.
- GitHub repo, Firebase project, GA4 property, domain DNS and Google Analytics administrative access require the owner's authorization. These external accounts are not created by the ZIP.

## 6. Manual production QA (NOT yet performed)

1. Hosting page loads on desktop/mobile; existing animations/media/navigation work.
2. Email sign-up, verification, Google sign-in and password recovery actually function.
3. New account completes onboarding, and reload / another device shows persisted data.
4. Account user cannot list any other customer's data; cannot mark a request as paid.
5. Owner with backend-issued admin claim views genuine customer data and can update requests.
6. A non-admin opening `/admin.html` is denied; Firestore rules deny direct unauthorized reads.
7. Google Analytics realtime displays your controlled test visit after consenting where required.
8. Search Console, canonical, sitemap and Cloudflare→Firebase redirects match final chosen domain.

**Do not call this website live or its accounts secure under production until these manual tests pass against a real configured Firebase project.**
