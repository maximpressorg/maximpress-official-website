/** MaxImpress V2.8 navigation experience. Static HTML is not a server-side access boundary. */
import {configured,currentUser,isVerified} from './auth-core.js';
const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
const publicPages=new Set(['index.html','about.html','account.html','privacy.html','terms.html']);
const rawPage=location.pathname.split('/').pop()||'index.html';
const blocked=!publicPages.has(rawPage) || /\/services\//.test(location.pathname) || /\/portfolio\//.test(location.pathname);
const safeTarget = href=>{try{const u=new URL(href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('.html'))return null;return u;}catch{return null}};
let granted=false;
function urlFor(mode,u){const next=u?u.pathname+u.search+u.hash:'';return prefix+'account.html?mode='+mode+(next?'&next='+encodeURIComponent(next):'')}
function modal(target){
  document.querySelector('.mi-access-panel')?.remove();
  const back=document.createElement('div');back.className='mi-access-panel';back.setAttribute('role','presentation');
  const box=document.createElement('section');box.className='mi-access-box';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Account required');
  box.innerHTML=`<button class="mi-access-close" type="button" aria-label="Close">×</button><img class="mi-access-logo" src="${prefix}assets/img/maximpress-logo.png" alt=""><h2>Unlock your MaxImpress experience</h2><p>Create a free account or log in to explore services, pricing, projects and client reviews.</p><div class="mi-access-opts"><a data-mi-login>Log In</a><a data-mi-signup>Sign Up</a></div>`;
  box.querySelector('[data-mi-login]').href=urlFor('login',target);box.querySelector('[data-mi-signup]').href=urlFor('register',target);
  back.append(box);document.body.append(back);box.querySelector('button').focus();
  const close=()=>back.remove();box.querySelector('button').addEventListener('click',close);
  back.addEventListener('click',e=>{if(e.target===back)close()});
  const esc=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
}
// Only two informational marketing pages plus necessary legal and login pages are public in the UI.
function handleHomeCTAs(){const home=document.body.classList.contains('home-page');if(!home)return;
  document.querySelectorAll('[data-mi-guest-cta]').forEach(el=>{if(granted){el.href=el.dataset.miMemberHref;el.textContent=el.dataset.miMemberText}else{el.href=el.dataset.miGuestHref;el.textContent=el.dataset.miGuestText}})
}
function reveal(){document.documentElement.classList.remove('mi-locked');document.documentElement.classList.add('mi-authorized')}
const ready=(async()=>{
 if(configured){try{const u=await currentUser();granted=isVerified(u)}catch{granted=false}}
 if(blocked && !granted){
  const dst=location.pathname+location.search+location.hash;
  location.replace(urlFor('register',new URL(dst,location.origin)));return;
 }
 reveal();handleHomeCTAs();
 document.addEventListener('click',e=>{if(granted||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;
   const u=safeTarget(a.href);if(!u)return;
   const page=u.pathname.split('/').pop();if(publicPages.has(page) && !/\/services\//.test(u.pathname) && !/\/portfolio\//.test(u.pathname))return;
   e.preventDefault();modal(u);
 },true);
})();
window.miAccessReady=ready;
