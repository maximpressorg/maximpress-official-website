/** ONE-TIME owner role setup. Runs in a trusted LOCAL terminal, NEVER the browser.
 * Requires Firebase Admin credentials in GOOGLE_APPLICATION_CREDENTIALS (outside repo)
 * or an approved service identity on Google Cloud. See docs/FIREBASE_MOVE_AND_OWNER_DASHBOARD.md.
 */
import {initializeApp, applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
const [projectId,uid]=process.argv.slice(2);
if(!projectId||!uid){
 console.error('Usage: node tools/grant-admin.mjs YOUR_FIREBASE_PROJECT_ID YOUR_AUTH_UID');process.exit(2);
}
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS){
 console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a local secure Admin SDK key file OUTSIDE this repository.');process.exit(2);
}
const app=initializeApp({credential:applicationDefault(),projectId});
const auth=getAuth(app);
const user=await auth.getUser(uid);
const ownerEmail='maximpress.org@gmail.com';
if(!user.emailVerified||String(user.email||'').toLowerCase()!==ownerEmail){
 console.error(`Refusing admin access: the account must be the verified MaxImpress owner (${ownerEmail}).`);process.exit(3);
}
const claims={...(user.customClaims||{}),admin:true};
await auth.setCustomUserClaims(uid,claims);
console.log('Admin claim assigned to UID:',uid,'Email:',user.email||'(not provided)');
console.log('Sign out then sign in to refresh the ID token. Do not share credentials.');
