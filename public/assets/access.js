/** MaxImpress V2.8 navigation experience. Static HTML is not a server-side access boundary. */
import {configured,currentUser,isVerified} from './auth-core.js?v=20261102-auth6';
const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
// Marketing and informational pages stay public. Only customer actions and
// private account workspaces require authentication.
const protectedPages=new Set(['contact.html','dashboard.html','account-settings.html','onboarding.html','admin.html']);
const rawPage=location.pathname.split('/').pop()||'index.html';
const blocked=protectedPages.has(rawPage);
const safeTarget = href=>{try{const u=new URL(href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('.html'))return null;return u;}catch{return null}};
let granted=false;
function urlFor(mode,u){const next=u?u.pathname+u.search+u.hash:'';return prefix+'account.html?mode='+mode+'&auth=20261102-6'+(next?'&next='+encodeURIComponent(next):'')}
function modal(target){
  document.querySelector('.mi-access-panel')?.remove();
  const back=document.createElement('div');back.className='mi-access-panel';back.setAttribute('role','presentation');
  const box=document.createElement('section');box.className='mi-access-box';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Account required');
  box.innerHTML=`<button class="mi-access-close" type="button" aria-label="Close">×</button><img class="mi-access-logo" src="${prefix}assets/img/maximpress-logo.png" alt=""><h2>Continue with your MaxImpress account</h2><p>Create a free account or log in to send a service request and access your private customer workspace.</p><div class="mi-access-opts"><a data-mi-login>Log In</a><a data-mi-signup>Sign Up</a></div>`;
  box.querySelector('[data-mi-login]').href=urlFor('login',target);box.querySelector('[data-mi-signup]').href=urlFor('register',target);
  back.append(box);document.body.append(back);box.querySelector('button').focus();
  const close=()=>back.remove();box.querySelector('button').addEventListener('click',close);
  back.addEventListener('click',e=>{if(e.target===back)close()});
  const esc=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
}
// Public marketing links remain available without an account.
function reveal(){document.documentElement.classList.remove('mi-locked');document.documentElement.classList.add('mi-authorized')}
const ready=(async()=>{
 if(configured){try{const u=await currentUser();granted=isVerified(u)}catch{granted=false}}
 if(blocked && !granted){
  const dst=location.pathname+location.search+location.hash;
  location.replace(urlFor('register',new URL(dst,location.origin)));return;
 }
 reveal();
 document.addEventListener('click',e=>{if(granted||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;
   const u=safeTarget(a.href);if(!u)return;
   const page=u.pathname.split('/').pop();if(!protectedPages.has(page))return;
   e.preventDefault();modal(u);
 },true);
})();
window.miAccessReady=ready;
