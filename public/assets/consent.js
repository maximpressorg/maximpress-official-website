/** Privacy choices persisted locally; analytics opt-in by explicit action. */
const key='mi-privacy-v28';
function readChoice(){try{const v=JSON.parse(localStorage.getItem(key));return v&&['accepted','essential'].includes(v.choice)?v.choice:null}catch{return null}}
function choice(newChoice){try{localStorage.setItem(key,JSON.stringify({choice:newChoice,updatedAt:new Date().toISOString()}))}catch{};
 window.dispatchEvent(new CustomEvent('mi-consent-change',{detail:{analytics:newChoice==='accepted'}}));
}
window.miAnalyticsConsent=()=>readChoice()==='accepted';
function panel(){document.querySelector('.mi-consent-pop')?.remove();const d=document.createElement('section');d.className='mi-consent-pop';d.setAttribute('role','dialog');d.setAttribute('aria-label','Privacy preferences');
 const prefix=document.querySelector('meta[name="mi-site-prefix"]')?.content||'';
 d.innerHTML='<h2>Your privacy choices</h2><p>Essential storage supports your session and security. Optional analytics helps us understand website visits. Choose once; you can change this later.</p><div class="mi-consent-btns"><button type="button" data-choice="accepted">Accept analytics</button><button type="button" data-choice="essential">Essential only</button></div>';
 const link=document.createElement('a');link.href=prefix+'privacy.html';link.textContent='Read privacy policy';d.append(link);document.body.append(d);
 d.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{choice(b.dataset.choice);d.remove()}));
}
function attach(){if(!readChoice())panel();const footer=document.querySelector('footer');if(footer&&!footer.querySelector('.mi-privacy-choice')){
 const a=document.createElement('a');a.href='#privacy-choices';a.className='mi-privacy-choice';a.textContent='Privacy choices';a.style.marginLeft='12px';a.addEventListener('click',e=>{e.preventDefault();panel()});
 (footer.querySelector('.footer-bottom')||footer).append(a)
}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
