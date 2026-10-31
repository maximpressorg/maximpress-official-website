# MaxImpress New Official Website — V2.8

Authoritative baseline: owner-uploaded V2.7. Latest edits: login UX, signup-first social provider buttons, consent-once popup, logged-in navigation gate, branded intro, authentic review reactions and moderated comments.

**Not connected/live:** Firebase config, Apple configuration, GitHub, analytics ID, deployment, account and moderation functionality require the owner's real project credentials and deployment.

See `docs/V2.8_CHANGELOG.md` for details and **important limitation**: static HTML is not a secure access-control layer. Marketing prices embedded into HTML cannot be hidden securely via JavaScript.

1. Configure `public/assets/firebase-config.js` with public Firebase web-app settings, enable Firebase Authentication providers and authorize the target domain.
2. Deploy Firestore rules (`firebase deploy --only firestore:rules`) then Hosting (`firebase deploy --only hosting`); or use approved GitHub actions after configuring secrets.
3. For GA4 add the GA4 public measurement ID to `public/assets/analytics-config.js`; tracking runs only after the visitor accepts analytics.
4. Set Firebase admin custom claim server-side following V2.7 docs to enable Owner Dashboard and comment moderation.
5. Test Google/Apple logins, email/password verification, access routing, consent, mobile, comments, votes and moderation on the real deployed origin.
6. Verify platform-sourced ratings before editing `public/assets/review-ratings.json`, otherwise keep null values.

V2.7 docs remain available under `docs/`.

### Status of this package
All additions are source-code changes. This environment cannot validate live Google or Apple OAuth, Firestore writes, or deploy to your Firebase/GitHub projects without their real external setup. Mobile/desktop browser execution is also environment-restricted; static checks passed. No verified review ratings or historical likes/dislikes were fabricated.

The `account.html?mode=register` page now displays the new sign-up layout even while Firebase remains unconfigured, but sign-up itself stays disabled until configured. Successful Firebase email/password registration creates a signed-in session, then waits for the mandatory email verification before private account access.

**Privacy and pricing:** Client-side navigation gates do not protect static HTML prices. For enforceable confidentiality, remove price and restricted details from `public/` and serve them from a verified-authentication backend.
