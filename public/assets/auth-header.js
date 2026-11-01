/** Public-first navigation: visitors browse freely; project actions request an account. */
import {configured,client,isVerified,logout,getProfile,safe} from './auth-core.js?v=20261102-auth11';
const desktop=document.querySelector('.mi-account-nav'),mobile=document.querySelector('.mi-mobile-account');
const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
function show(u,p){
 const active=u&&isVerified(u);const name=safe(p?.fullName||u?.displayName||'My Account');
 const email=safe(u?.email||'');const customerId=safe(u?.uid||'');
 const photo=u?.photoURL?.startsWith('https://')?`<img src="${safe(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span>${safe((p?.fullName||u?.displayName||u?.email||'M').trim().charAt(0).toUpperCase())}</span>`;
 const profile=`<div class="mi-profile-control"><button class="mi-profile-summary" type="button" aria-expanded="false" aria-haspopup="menu"><span class="mi-profile-photo">${photo}</span><span class="mi-profile-identity"><strong>${name}</strong><small>${email}</small><em>Customer ID: ${customerId}</em></span><span class="mi-profile-chevron" aria-hidden="true">⌄</span></button><div class="mi-profile-menu" role="menu"><a role="menuitem" href="${prefix}dashboard.html">My Dashboard</a><a role="menuitem" href="${prefix}contact.html">Start Your Project</a><a role="menuitem" href="${prefix}dashboard.html#account-profile">Account Preview</a><a role="menuitem" href="${prefix}account-settings.html">Settings</a><button role="menuitem" type="button" data-mi-logout>Log Out</button></div></div>`;
 if(desktop)desktop.innerHTML=active?profile:
 `<a class="mi-auth-link mi-auth-create" href="${prefix}account.html?mode=login">Log In / Sign Up</a>`;
 if(mobile)mobile.innerHTML=active?profile:
 `<a href="${prefix}account.html?mode=login">Log In / Sign Up</a>`;
 document.querySelectorAll('.mi-profile-summary').forEach(button=>button.addEventListener('click',e=>{e.stopPropagation();const control=button.closest('.mi-profile-control');const open=!control.classList.contains('is-open');document.querySelectorAll('.mi-profile-control.is-open').forEach(x=>x.classList.remove('is-open'));control.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open))}));
 document.querySelectorAll('[data-mi-logout]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{await logout()}catch{b.disabled=false;alert('Unable to log out. Please try again.')}}));
}
document.addEventListener('click',()=>document.querySelectorAll('.mi-profile-control.is-open').forEach(x=>{x.classList.remove('is-open');x.querySelector('.mi-profile-summary')?.setAttribute('aria-expanded','false')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.body.click()});
if(desktop||mobile){show(null,null);
 if(mobile){const menu=mobile.closest('.mobile-nav');if(menu)menu.prepend(mobile)}
 if(configured)client().then(({auth,a})=>a.onAuthStateChanged(auth,async u=>{
  try{show(u,u&&isVerified(u)?await getProfile(u.uid):null)}catch{show(u,null)}
 })).catch(()=>{});
}
