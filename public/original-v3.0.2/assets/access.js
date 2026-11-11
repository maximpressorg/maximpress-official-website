/** MaxImpress V2.9.2 — public browsing policy.
 * Marketing pages, services, prices, work, reviews, and contact are open to everyone.
 * Customer account data and admin operations remain protected by Firebase Auth
 * and Firestore Security Rules (see account-pages.js and firestore.rules).
 */
document.documentElement.classList.remove('mi-locked');
window.miAccessReady = Promise.resolve();
