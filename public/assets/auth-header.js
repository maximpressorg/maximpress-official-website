/** Progressive account links on each existing page; never rewrites site navigation. */
import {configured,client,isVerified,logout,getProfile,safe} from './auth-core.js';
const desktop=document.querySelector('.mi-account-nav'),mobile=document.querySelector('.mi-mobile-account');
const show=(u,p)=>{
 const name=safe(p?.fullName||u?.displayName||'My Account');
 if(desktop)desktop.innerHTML=u&&isVerified(u)?`<a class="mi-auth-link mi-auth-profile" href="dashboard.html" title="${name}">My Dashboard</a><button type="button" class="mi-auth-link mi-auth-out" data-mi-logout>Logout</button>`:
   `<a class="mi-auth-link" href="account.html?mode=login">Log In</a><a class="mi-auth-link mi-auth-create" href="account.html?mode=register">Create Account</a>`;
 if(mobile)mobile.innerHTML=u&&isVerified(u)?`<a href="dashboard.html">My Dashboard</a><button type="button" data-mi-logout>Logout</button>`:
  `<a href="account.html?mode=login">Log In</a><a href="account.html?mode=register">Create Account</a>`;
 document.querySelectorAll('[data-mi-logout]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await logout()}catch(e){b.disabled=false;alert('Unable to log out. Please try again.')}}));
};
// The default (guest) links intentionally remain usable before Firebase is configured.
if(desktop||mobile){
 const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
 const fixLinks=()=>{document.querySelectorAll('.mi-account-nav a,.mi-mobile-account a').forEach(a=>{if(!a.getAttribute('href').startsWith(prefix))a.href=prefix+a.getAttribute('href')})};
 show(null,null);fixLinks();
 if(configured){client().then(({auth,a})=>{
  a.onAuthStateChanged(auth,async u=>{try{const profile=u&&isVerified(u)?await getProfile(u.uid):null;show(u,profile);fixLinks()}catch(e){show(u,null);fixLinks()}});
 }).catch(()=>{});}
}
