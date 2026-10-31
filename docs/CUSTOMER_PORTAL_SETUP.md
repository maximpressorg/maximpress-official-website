# MaxImpress Customer Portal — Configuration & Launch Guide

**Integration version:** MaxImpress V2.5 + customer account portal, 31 October 2026.

The original static website, branding, navigation, assets, animations, and existing homepage-only sitemap remain in place. New account links are added to all public headers. This package includes real Firebase Authentication and Firestore client integration; it deliberately **does not** contain a Firebase project, production credentials, service-account secret, provisioned Apple account, live users, purchases, or verified payments.

## Current status

| Feature | Implemented in website | Required before real usage |
|---|---|---|
| Log In / Create Account links (desktop + mobile) | Yes, all public pages | None |
| Email/password registration, verification, resend, password reset | Yes, Firebase SDK | Firebase project + email/password provider + authorized domain |
| Google OAuth sign-in with permitted profile data | Yes, Firebase SDK | Google provider enabled in Firebase Authentication |
| Apple sign-in, Hide My Email compatible | Code included; intentionally disabled | Active Apple Developer membership, Apple service ID/key, Firebase Apple provider configuration, enable feature flag |
| One-time onboarding form | Yes | Firebase Authentication + Firestore + published rules |
| Account dashboard, actual requests, empty states | Yes | Firebase Authentication + Firestore + published rules |
| Account settings & secure sign-in linking | Yes (Google; Apple feature flag) | Provider enabled, browser popup/redirect permitted |
| Customer and order data persistence across devices | Database operations implemented | Firebase configured, rules published and verified |
| Admin customer lookup, export, request status, progress, payment confirmations | Yes, private UI | Grant `admin:true` custom claim securely to real admin user |
| Optional MFA | Not implemented | Future secure enrollment and recovery design, potentially requiring paid features |
| Payment collection | **Not implemented** | Future payment provider integration; admin marking paid is not payment processing |
| Live end-to-end OAuth/email/database tests | **Not completed** | A real configured Firebase project and corresponding authorized access |

The portal will show a **configuration required** message until Firebase is configured. It must not claim any successful login or database save before setup.

## 1. Create Firebase web project (no password sharing)

1. Sign in as owner at https://console.firebase.google.com/ . Create or select a dedicated project for MaxImpress.
2. Go to **Project settings → General → Your apps → Add app → Web**. Register the web app. Copy the web **firebaseConfig** fields shown by Firebase.
3. Edit **`assets/firebase-config.js`** and replace `apiKey`, `authDomain`, `projectId` and `appId` with the corresponding web-app config. The `apiKey` is a public client configuration value, **not** a private Admin SDK service-account key. Do **not** put any server-side keys, credentials, passwords or Apple private keys in the website files.
4. In **Build → Authentication**, choose **Get started → Sign-in method → Email/Password**, enable it. Enable **Google**, select the required project support email and save. Keep **one account per email address** where possible.
5. Under Authentication **Settings → Authorized domains**, add `maximpress.pages.dev` and any real custom domains you use. Add preview domains only if they are actually required for testing. Include any necessary domains for the email action return URLs.
6. Under Authentication **Templates**, set the email sender/template as desired. Verify that Firebase is allowed to send verification and password reset emails for the project, and review email-delivery limits and quotas. Do not send test emails to real customers without consent.
7. In **Build → Firestore Database**, create a database in a location appropriate to your users/data-policy requirements, and then immediately publish the production rules in **`firestore.rules`**. Do **not** leave the database in open test mode. The account system does not use Firestore without these permissions.

Official references: https://firebase.google.com/docs/web/setup | https://firebase.google.com/docs/auth/web/start | https://firebase.google.com/docs/firestore/security/get-started

## 2. Firestore permissions and data structure

Copy the complete contents of `firestore.rules` to **Firestore → Rules → Publish**. The `firebase.json` and `firestore.indexes.json` files are provided for optional Firebase CLI rules deployment; Cloudflare Pages itself does not publish database rules. Example CLI commands when configured locally: `firebase login`, `firebase use YOUR_FIREBASE_PROJECT_ID`, `firebase deploy --only firestore:rules` (requires an authenticated authorized operator and Firebase CLI).

Collections:

```
customers/{firebaseAuthUid}
  customerId (same Firebase UID), fullName, email, photoURL, provider,
  linkedProviders, createdAt, lastLoginAt, category, goal, referral,
  socialProfile, onboardingComplete

orders/{autoGeneratedRequestId}
  customerId, service, notes, status, paymentStatus, createdAt, updatedAt
  progressNote (admin-only addition, optional)
  paymentReference (admin-only addition, optional)
```

Users can read their own customer document and their own orders. Users can create **pending, unconfirmed** orders only. Users cannot mark payments, change service statuses, or alter someone else's records. Administrator permissions are checked **inside Firestore rules** against the authentication token's `admin` custom claim; buttons are not the security boundary. The rules restrict client changes to profile fields and prevent unauthorized data access.

**Important:** Do not manually merge Firebase accounts merely because two emails appear to match. A logged-in user may link an additional provider in Account Settings. If genuinely distinct Firebase UIDs were created, account consolidation requires a reviewed admin data-migration procedure; this version does not automatically merge their orders.

## 3. Provision one real administrator, securely

1. First create your own verified account using the same production Firebase project.
2. From Firebase Console → Authentication → Users, copy that account's **Firebase UID** (not your email address).
3. On a **trusted local computer or protected server only**, use the Firebase Admin SDK authenticated with a service account or managed application default credentials. Never run privileged Admin SDK code from static Cloudflare Pages JavaScript.
4. Example Node.js procedure (run locally, not in the website):

```js
// Local admin-only one-time task. Do NOT upload this script with credentials.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
initializeApp({ credential: applicationDefault() });
await getAuth().setCustomUserClaims('REPLACE_WITH_YOUR_VERIFIED_AUTH_UID', { admin: true });
console.log('Admin claim granted; sign out and back in to refresh token.');
```

Run only from a properly authenticated, controlled environment with `firebase-admin` installed and `GOOGLE_APPLICATION_CREDENTIALS` or another secure server-side credential mechanism. **Do not publish or email private keys.** Verify the UID carefully before granting admin. An administrator must sign out/back in (or force a token refresh) for new claims to appear. For multiple administrators, verify each UID and apply least privilege. Remove claims when access should end.

Admin portal: **`https://maximpress.pages.dev/admin.html`** after deployment and configuration. The page itself is publicly reachable (as HTML), but **no customer records can be read** without a verified Firebase account with the server-granted claim.

Official reference: https://firebase.google.com/docs/auth/admin/custom-claims

## 4. Sign in with Apple (separate paid prerequisites)

Apple web sign-in is integrated through Firebase `OAuthProvider('apple.com')` but is **disabled by default** until Apple setup is complete. Apple's Developer Program generally costs **USD 99/year** (or the equivalent local amount) to access this capability; Apple says membership is required for Firebase Sign in with Apple setup. Verify current price, eligibility and applicable fees before purchase.

1. Join/maintain the Apple Developer Program (Apple Developer account alone is not sufficient for production Apple sign-in setup).
2. In Apple's developer portal, create the appropriate **Service ID** and enable Sign in with Apple. Configure the web domain(s) and return URL, commonly `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`; use the exact Firebase console instructions for your project.
3. Generate the required Apple authentication key and note the **Team ID, Key ID, Service ID**. Keep the `.p8` private key out of the public website archive.
4. In Firebase Authentication → Sign-in method → Apple, provide the required IDs and Apple key **only in the secure provider configuration**. Follow Firebase's domain and redirect configuration instructions.
5. After fully configuring and testing Apple, set `appleSignInEnabled = true` inside `assets/firebase-config.js`, then deploy the updated site.
6. Apple **Hide My Email** may return an address ending `@privaterelay.appleid.com`. Make sure any necessary Apple private email relay settings and Firebase email sender domains are configured for reliable outgoing communication. Apple normally only releases the person's name on **first** authorization; onboarding therefore allows the customer to correct or add their preferred name. Apple does **not** normally supply a profile photo.
7. Apple may require explicit user consent before linking identifying information to a private relay Apple ID. Verify consent and policy compliance before enabling linking.

Official references: https://firebase.google.com/docs/auth/web/apple | https://developer.apple.com/programs/ | https://developer.apple.com/help/account/membership/program-enrollment

## 5. Deploy to the existing Cloudflare Pages project

1. Keep a separate ZIP backup of the original V2.5 project.
2. Edit the public Firebase web config in `assets/firebase-config.js`. Publish Firestore rules in Firebase **before** inviting any users.
3. Upload the **complete updated ZIP** (or its extracted directory) to the existing Cloudflare Pages project as a **new production deployment**: Cloudflare dashboard → Workers & Pages → existing MaxImpress Pages project → Create deployment / Upload assets → deploy. Confirm the actual domain and project before publishing. The ZIP has `index.html` at its root.
4. After deployment, check login/logout, registration, verification, password reset, onboarding, returning sessions, provider linking, admin claim, account isolation, and mobile navigation in the live domain. See QA checklist below.
5. `sitemap.xml` intentionally remains homepage-only, as in the supplied website. New account pages use `noindex,nofollow` and are not added to the sitemap. Search engines nevertheless independently determine indexing, so exact one-result search visibility cannot be guaranteed.
6. Keep the current Google Search Console verification and existing SEO files intact; do not repeat ownership verification simply to publish this version.

Official Cloudflare Direct Upload guide: https://developers.cloudflare.com/pages/get-started/direct-upload/

## 6. Required real-world acceptance tests

- New email/password customer: full name / email / strong password / match confirmation; Firebase verification email received; unverified user **cannot** access onboarding or dashboard; after clicking email link and refreshing verification status, account can advance.
- Resend verification is throttled in the interface (60s) and subject to Firebase backend limits. Password reset email is issued by Firebase, not by MaxImpress.
- Google sign-in: popup (or redirect fallback) requests only approved identity information; verified user onboarded once; returning login goes to saved dashboard.
- Apple sign-in: only after Apple Developer/Firebase setup; test Hide My Email and initial-name disclosure on supported browsers/devices.
- Account linking: sign in first, link another provider only when Firebase permits it; mismatched account credentials produce an error and **do not merge** accounts.
- Complete onboarding once; refresh and log in on another device; verify details persist under the same UID.
- New customer has zero genuine orders. New request must be **pending/unconfirmed**, not a paid order. Admin changes are only applied after real-world review.
- User A cannot fetch User B's `customers` document or orders; unverified users cannot read; an ordinary user cannot add an admin claim or update another customer's orders. Use the Firebase Rules Playground or emulator to verify denials.
- Admin export is available only to verified owner-granted administrators; exports are sensitive and should not be left in downloads folders or shared publicly.
- Check responsive desktop/mobile headers, links, form validation, no regressions to original splash animation, contact menu, portfolio, service pages, SEO and assets.

## Implementation limitations, explicitly disclosed

- **Live Firebase credentials and Apple developer setup were not provided.** OAuth callbacks, real email delivery, Firestore writes, rules enforcement in a live project, and persistence across actual devices cannot be verified in this offline build. Such tests must be completed after configuration.
- Firebase's default verification email and password-reset features have anti-abuse rules and rate limits; this implementation has additional client-side resend throttling, not a custom server-side email rate limiting system.
- No automatic account deletion, dedicated multi-factor enrollment, direct card/payment processing, invoicing, or external CRM integration is included. These can be separate later phases.
- The private admin view currently fetches all customer and order documents and filters by name/email locally. Add server-side pagination/search indexes before the customer database becomes large.
- Auth uses Firebase's browser module SDK from the official Google CDN, without introducing a new framework or build step. Configure a suitable production Content Security Policy and Auth domain/redirect approach for your deployment if you enforce CSP or encounter browser third-party-cookie restrictions.
- Add owner-approved privacy, data retention and deletion policies before collecting live customer information. A dedicated customer-account privacy disclosure has been included in the existing privacy page.

**Source version:** Firebase Web SDK 13.1.0 (21 October 2026); implementation uses the official Firebase Web modular CDN and Firebase security rules. No authentication, purchase, or database-save success has been simulated.
