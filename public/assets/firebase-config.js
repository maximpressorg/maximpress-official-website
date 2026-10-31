/* Public Firebase web app configuration (NOT service-account secrets).
 * Copy values from Firebase Console -> Project settings -> Your apps -> Web app.
 * Enable the authentication providers and publish firestore.rules before launch.
 * Firebase web API keys are project identifiers, not private credentials. */
export const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_WEB_API_KEY',
  authDomain: 'REPLACE_WITH_PROJECT_ID.firebaseapp.com',
  projectId: 'REPLACE_WITH_PROJECT_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID'
};
/* Set true only after Sign in with Apple has been configured in Apple Developer
 * and Firebase Authentication. Apple Developer Program enrollment costs money. */
export const appleSignInEnabled = false;
