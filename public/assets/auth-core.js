/** MaxImpress customer portal — Firebase 13.1.0 modular browser SDK.
 * No passwords, service-account credentials, or administrative claims live here. */
import { firebaseConfig, appleSignInEnabled } from './firebase-config.js?v=20261102-auth10';
export { appleSignInEnabled };
export const configured = ['apiKey','authDomain','projectId','appId'].every(k =>
  typeof firebaseConfig[k] === 'string' && firebaseConfig[k].length > 8 && !firebaseConfig[k].startsWith('REPLACE_'));
export const categories = ['Content Creator / Influencer','Business Owner / Brand','Social Media Manager / Agency','Freelancer / Professional','Just Getting Started','Other'];
export const goals = ['Grow My Social Media Audience','Monetize My Social Media Account','Increase Engagement and Reach','Manage My Business Social Media','Explore MaxImpress Services','Other'];
export const referrals = ['X (Twitter)','Facebook / Instagram','Meta Advertisement','Google Search','Client / Friend Referral','Direct Website Visit','Other'];
export const services = ['X Growth & Monetization','YouTube Monetization','TikTok Growth & Monetization','Instagram Management','Facebook Monetization','Brand & Social Media Management','Other MaxImpress Service'];
let clientPromise;
export function client() {
  if(!configured) return Promise.reject(new Error('Customer accounts are not active until the MaxImpress owner configures Firebase.'));
  if(!clientPromise) clientPromise = (async()=>{
    const [appMod, authMod, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js')
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    auth.useDeviceLanguage();
    await authMod.setPersistence(auth,authMod.browserLocalPersistence);
    const db = fs.getFirestore(app);
    return {auth, db, a:authMod, fs};
  })();
  return clientPromise;
}
export async function currentUser(){
  const {auth,a} = await client();
  await auth.authStateReady();
  return auth.currentUser;
}
export const isVerified = u => !!u && !!u.emailVerified;
export const primaryProvider = u => u.providerData.find(p => p.providerId!=='password')?.providerId || 'password';
export const providerIds = u => [...new Set(u.providerData.map(p => p.providerId))];
export async function getProfile(uid) {
  const {db,fs}=await client();
  const s=await fs.getDoc(fs.doc(db,'customers',uid));
  return s.exists()?s.data():null;
}
export async function ensureProfile(u){
  if(!u) throw new Error('Sign in before creating your customer profile.');
  const {db,fs}=await client();
  const ref=fs.doc(db,'customers',u.uid);
  const old=await fs.getDoc(ref);
  if(!old.exists()){
    const data={customerId:u.uid,fullName:(u.displayName||'').trim().slice(0,120),email:u.email||'',photoURL:u.photoURL||'',provider:primaryProvider(u),linkedProviders:providerIds(u),createdAt:fs.serverTimestamp(),lastLoginAt:fs.serverTimestamp(),category:'',goal:'',referral:'',socialProfile:'',onboardingComplete:false};
    await fs.setDoc(ref,data);
    return {...data,createdAt:null,lastLoginAt:null};
  }
  fs.updateDoc(ref,{lastLoginAt:fs.serverTimestamp(),linkedProviders:providerIds(u)}).catch(()=>{});
  return old.data();
}
export async function saveOnboarding(uid,data){
  const {db,fs}=await client();
  await fs.updateDoc(fs.doc(db,'customers',uid),{fullName:data.fullName,category:data.category,goal:data.goal,referral:data.referral,socialProfile:data.socialProfile,onboardingComplete:true});
}
export async function updateProfile(uid,data){
  const {db,fs}=await client();
  await fs.updateDoc(fs.doc(db,'customers',uid),{fullName:data.fullName,socialProfile:data.socialProfile});
}
export async function requestService(uid,service,notes){
  if(!services.includes(service))throw new Error('Select a valid service.');
  const {db,fs}=await client();
  return fs.addDoc(fs.collection(db,'orders'),{customerId:uid,service,notes:notes.trim().slice(0,2000),status:'pending',paymentStatus:'unconfirmed',createdAt:fs.serverTimestamp(),updatedAt:fs.serverTimestamp()});
}
export async function getMyOrders(uid){
  const {db,fs}=await client();
  const snap=await fs.getDocs(fs.query(fs.collection(db,'orders'),fs.where('customerId','==',uid)));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
}
export async function isAdmin(u){
  if(!u||!isVerified(u))return false;
  return (await u.getIdTokenResult()).claims.admin===true;
}
export async function allCustomers(){
  const {db,fs}=await client();
  const snap=await fs.getDocs(fs.collection(db,'customers'));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
export async function allOrders(){
  const {db,fs}=await client();
  const snap=await fs.getDocs(fs.collection(db,'orders'));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
}
export async function updateOrder(id,fields){
  const {db,fs}=await client();
  await fs.updateDoc(fs.doc(db,'orders',id),{...fields,updatedAt:fs.serverTimestamp()});
}
export async function logout(){const {auth,a}=await client(); await a.signOut(auth);location.assign(new URL('../index.html',import.meta.url).href);}
export const safe = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const dateText = ts => ts?.toDate?.()?.toLocaleDateString('en-GB',{year:'numeric',month:'short',day:'numeric'})||'—';
export function errorText(e){
 const map={
  'auth/invalid-credential':'Incorrect email or password, or the account uses another sign-in method.',
  'auth/email-already-in-use':'An account already exists with this email. Log in or use your original provider.',
  'auth/account-exists-with-different-credential':'This email is already linked to another sign-in method. Sign in using that method, then link the new provider in Account Settings.',
  'auth/weak-password':"Password must have at least 6 characters or meet any stronger policy configured in Firebase.",
  'auth/too-many-requests':'Too many attempts. Please try again later.',
  'auth/popup-closed-by-user':'Sign-in was cancelled.',
  'auth/popup-blocked':'Your browser blocked the sign-in popup. Allow popups and retry.',
  'auth/internal-error':'Google sign-in was interrupted before the secure account chooser opened. Reload this page and try again.',
  'auth/operation-not-supported-in-this-environment':'Google sign-in is not supported inside this embedded browser. Open the website in Chrome, Edge, or Safari.',
  'auth/unauthorized-domain':'This website domain is not yet authorized in Firebase Authentication.',
  'auth/operation-not-allowed':'This sign-in method is not yet enabled in Firebase Authentication.',
  'permission-denied':'Your secure customer profile could not be opened. Please reload once; if the problem continues, contact MaxImpress support.'
 };
 return map[e?.code]||String(e?.message||'Something went wrong. Please try again.').slice(0,250);
}
