/** Public-first navigation: visitors browse freely; project actions request an account. */
import {configured,client,isVerified,logout,getProfile,safe} from './auth-core.js?v=20261102-auth8';
const desktop=document.querySelector('.mi-account-nav'),mobile=document.querySelector('.mi-mobile-account');
const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
function show(u,p){
 const active=u&&isVerified(u);const name=safe(p?.fullName||u?.displayName||'My Account');
 if(desktop)desktop.innerHTML=active?`<a class="mi-auth-link mi-auth-profile" href="${prefix}dashboard.html" title="${name}">My Dashboard</a><a class="mi-auth-link mi-auth-create" href="${prefix}contact.html">Start Your Project</a><button type="button" class="mi-auth-link mi-auth-out" data-mi-logout>Log Out</button>`:
 `<a class="mi-auth-link mi-auth-create" href="${prefix}contact.html">Start Your Project</a>`;
 if(mobile)mobile.innerHTML=active?`<a href="${prefix}dashboard.html">My Dashboard</a><a href="${prefix}contact.html">Start Your Project</a><button type="button" data-mi-logout>Log Out</button>`:
 `<a href="${prefix}contact.html">Start Your Project</a>`;
 document.querySelectorAll('[data-mi-logout]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await logout()}catch{b.disabled=false;alert('Unable to log out. Please try again.')}}));
}
if(desktop||mobile){show(null,null);
 if(mobile){const menu=mobile.closest('.mobile-nav');if(menu)menu.prepend(mobile)}
 if(configured)client().then(({auth,a})=>a.onAuthStateChanged(auth,async u=>{
  try{show(u,u&&isVerified(u)?await getProfile(u.uid):null)}catch{show(u,null)}
 })).catch(()=>{});
}
