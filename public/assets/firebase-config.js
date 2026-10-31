/* Public Firebase web app configuration (NOT service-account secrets).
 * Copy values from Firebase Console -> Project settings -> Your apps -> Web app.
 * Enable the authentication providers and publish firestore.rules before launch.
 * Firebase web API keys are project identifiers, not private credentials. */
export const firebaseConfig = {
  apiKey: 'AIzaSyAUCWl6p0mhaB2TOmcyd-2nZxNcNdSOplo',
  authDomain: 'maximpress-org.firebaseapp.com',
  projectId: 'maximpress-org',
  appId: '1:1054235184334:web:a81401a11bd004303dd49f'
};
/* Set true only after Sign in with Apple has been configured in Apple Developer
 * and Firebase Authentication. Apple Developer Program enrollment costs money. */
export const appleSignInEnabled = false;
