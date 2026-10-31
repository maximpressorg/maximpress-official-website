import {configured,appleSignInEnabled,client,currentUser,isVerified,primaryProvider,providerIds,ensureProfile,getProfile,saveOnboarding,updateProfile,requestService,getMyOrders,isAdmin,allCustomers,allOrders,updateOrder,logout,categories,goals,referrals,services,safe,dateText,errorText} from './auth-core.js';
const $=id=>document.getElementById(id);
const page=document.body.dataset.accountPage;
const display=(id,text,type='')=>{const box=$(id);if(!box)return;box.textContent=text;box.className='mi-status '+type;box.setAttribute('role',type==='error'?'alert':'status')};
const setBusy=(button,busy)=>{if(button)button.disabled=busy};
const redirect=path=>location.replace(path);
const requireAccount=async()=>{
 const u=await currentUser();
 if(!u){redirect('account.html?mode=login');return null}
 if(!isVerified(u)){redirect('account.html?mode=login&verify=1');return null}
 return u;
};
const options=(items,prompt='Select an option')=>`<option value="">${safe(prompt)}</option>`+items.map(i=>`<option value="${safe(i)}">${safe(i)}</option>`).join('');
const fmt=entry=>dateText(entry?.createdAt);
async function ready(){
 if(!page)return;
 if(!configured){display('account-status','Customer account features require Firebase setup by the website owner. No registration, sign-in, or database changes are occurring yet.','error');document.querySelectorAll('.mi-requires-config').forEach(e=>e.disabled=true);return}
 try{if(page==='auth')await authPage();if(page==='onboarding')await onboardingPage();if(page==='dashboard')await dashboardPage();if(page==='settings')await settingsPage();if(page==='admin')await adminPage();}
 catch(e){display('account-status',errorText(e),'error');$('mi-loading')?.remove()}
}
async function authPage(){
 const {auth,a}=await client();
 const tabs=[...document.querySelectorAll('[data-mi-mode]')];
 const form=$('mi-auth-form');const forgot=$('mi-forgot-form');
 const choose=mode=>{
  mode=mode==='register'?'register':'login';
  tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.miMode===mode)));
  $('mi-name-row').classList.toggle('mi-hidden',mode!=='register');
  $('mi-confirm-row').classList.toggle('mi-hidden',mode!=='register');
  $('mi-submit').textContent=mode==='register'?'Create My Account':'Log In';
  $('mi-name').required=mode==='register';$('mi-confirm').required=mode==='register';
  $('mi-password').minLength=mode==='register'?12:6;
  $('mi-password').autocomplete=mode==='register'?'new-password':'current-password';
  $('mi-reset-link').classList.toggle('mi-hidden',mode==='register');
  $('mi-form-section').classList.remove('mi-hidden');forgot.classList.add('mi-hidden');
  document.querySelector('#mi-auth-title').textContent=mode==='register'?'Create your MaxImpress account':'Welcome back';
  history.replaceState(null,'',`account.html?mode=${mode}`);
  display('account-status','');
 };
 tabs.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.miMode)));
 choose(new URLSearchParams(location.search).get('mode'));
 let redirectUser=null;
 try{const r=await a.getRedirectResult(auth);redirectUser=r?.user||null}catch(err){display('account-status',errorText(err),'error')}
 const user=redirectUser||await currentUser();
 const verification=()=>{
  form.classList.add('mi-hidden');$('mi-provider-section').classList.add('mi-hidden');$('mi-verify-section').classList.remove('mi-hidden');
  $('mi-verify-email').textContent=auth.currentUser?.email||'your email';
  display('account-status','Your email is not verified. Open the Firebase verification email, follow its link, then select “I Have Verified My Email”.');
 };
 const advance=async u=>{
  if(!isVerified(u)){verification();return}
  const profile=await ensureProfile(u);
  redirect(profile.onboardingComplete?'dashboard.html':'onboarding.html');
 };
 if(user){if(!isVerified(user))verification();else await advance(user)}
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const mode=tabs.find(b=>b.getAttribute('aria-selected')==='true')?.dataset.miMode;
  const email=$('mi-email').value.trim();const pass=$('mi-password').value;const submit=$('mi-submit');
  if(mode==='register'){
   if(!$('mi-name').value.trim()){display('account-status','Enter your full name.','error');return}
   if(pass.length<12||!/[A-Z]/.test(pass)||!/[a-z]/.test(pass)||!/[0-9]/.test(pass)){display('account-status','Use at least 12 characters, including uppercase, lowercase, and a number.','error');return}
   if(pass!==$('mi-confirm').value){display('account-status','The passwords do not match.','error');return}
  }
  setBusy(submit,true);display('account-status','Processing your request…');
  try{
   if(mode==='register'){
    const r=await a.createUserWithEmailAndPassword(auth,email,pass);
    await a.updateProfile(r.user,{displayName:$('mi-name').value.trim().slice(0,120)});
    verification();
    try{await a.sendEmailVerification(r.user,{url:new URL('account.html?verify=1',location.href).href});display('account-status','Account created. Verification email sent. Please check your inbox and spam folder.','success')}
    catch(emailError){display('account-status',`Account created, but verification email could not be sent: ${errorText(emailError)}. Use Resend below.`,'error')}
   }else{
    const r=await a.signInWithEmailAndPassword(auth,email,pass);await advance(r.user);
   }
  }catch(err){display('account-status',errorText(err),'error')}
  finally{setBusy(submit,false)}
 });
 let lastResend=0;
 $('mi-resend').addEventListener('click',async e=>{
  if(!auth.currentUser)return;const btn=e.currentTarget;
  if(Date.now()-lastResend<60000){display('account-status','Please wait at least 60 seconds between verification emails.','error');return}
  lastResend=Date.now();setBusy(btn,true);
  try{await a.sendEmailVerification(auth.currentUser,{url:new URL('account.html?verify=1',location.href).href});display('account-status','Verification email resent. Check your inbox and spam folder.','success')}
  catch(err){display('account-status',errorText(err),'error')}
  finally{setBusy(btn,false);setTimeout(()=>{btn.disabled=false},60000)}
 });
 $('mi-check-verified').addEventListener('click',async e=>{
  const btn=e.currentTarget;setBusy(btn,true);
  try{await a.reload(auth.currentUser);await auth.currentUser.getIdToken(true);if(isVerified(auth.currentUser))await advance(auth.currentUser);else display('account-status','Email verification is not complete yet. Please follow the link in your email.','error')}
  catch(err){display('account-status',errorText(err),'error')}
  finally{setBusy(btn,false)}
 });
 $('mi-verify-logout').addEventListener('click',async()=>{await a.signOut(auth);redirect('account.html?mode=login')});
 $('mi-reset-link').addEventListener('click',()=>{form.classList.add('mi-hidden');$('mi-provider-section').classList.add('mi-hidden');forgot.classList.remove('mi-hidden');$('mi-forgot-email').value=$('mi-email').value;display('account-status','')});
 $('mi-reset-back').addEventListener('click',()=>{form.classList.remove('mi-hidden');$('mi-provider-section').classList.remove('mi-hidden');forgot.classList.add('mi-hidden')});
 forgot.addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('mi-send-reset');setBusy(btn,true);
  try{await a.sendPasswordResetEmail(auth,$('mi-forgot-email').value.trim());display('account-status','If an account is eligible, password reset instructions have been sent.','success')}
  catch(err){if(err.code==='auth/user-not-found')display('account-status','If an account is eligible, password reset instructions have been sent.','success');else display('account-status',errorText(err),'error')}
  finally{setBusy(btn,false)}
 });
 const signProvider=async kind=>{
  const provider=kind==='google'?new a.GoogleAuthProvider():new a.OAuthProvider('apple.com');
  if(kind==='apple'){provider.addScope('email');provider.addScope('name')}
  display('account-status',`Connecting securely to ${kind==='google'?'Google':'Apple'}…`);
  try{const r=await a.signInWithPopup(auth,provider);await advance(r.user)}
  catch(err){
   if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/internal-error'].includes(err.code)){
    try{await a.signInWithRedirect(auth,provider);return}catch(redirectErr){display('account-status',errorText(redirectErr),'error');return}
   }
   display('account-status',errorText(err),'error')
  }
 };
 $('mi-google').addEventListener('click',()=>signProvider('google'));
 if(appleSignInEnabled){$('mi-apple').disabled=false;$('mi-apple').querySelector('span').textContent='Continue with Apple';$('mi-apple').addEventListener('click',()=>signProvider('apple'))}
}
async function onboardingPage(){
 const u=await requireAccount();if(!u)return;
 const p=await ensureProfile(u);
 if(p.onboardingComplete){redirect('dashboard.html');return}
 $('mi-onboard-name').value=p.fullName||u.displayName||'';
 $('mi-category').innerHTML=options(categories);$('mi-goal').innerHTML=options(goals);$('mi-referral').innerHTML=options(referrals);
 $('mi-onboard-form').classList.remove('mi-hidden');$('mi-loading')?.remove();
 $('mi-onboard-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
  if(!$('mi-onboard-name').value.trim()){display('account-status','Please confirm your preferred name.','error');return}
  const btn=$('mi-complete');setBusy(btn,true);
  try{
   await saveOnboarding(u.uid,{fullName:$('mi-onboard-name').value.trim().slice(0,120),category:$('mi-category').value,goal:$('mi-goal').value,referral:$('mi-referral').value,socialProfile:$('mi-social').value.trim().slice(0,250)});
   redirect('dashboard.html');
  }catch(err){display('account-status',errorText(err),'error');setBusy(btn,false)}
 });
}
function renderOrders(orders){
 const list=$('mi-order-list');
 if(!orders.length){list.innerHTML='<div class="mi-empty">No service requests or purchases are recorded for this account yet. Explore our services or send your first request.</div>';return}
 list.innerHTML=orders.map(o=>`<div class="mi-listitem"><strong>${safe(o.service)}<span class="mi-chip ${safe(o.status)}">${safe(o.status)}</span></strong><small>Requested ${fmt(o)} · Payment: ${safe(o.paymentStatus||'unconfirmed')}</small>${o.notes?`<p class="mi-muted">${safe(o.notes)}</p>`:''}${o.progressNote?`<p class="mi-muted"><b>Service update:</b> ${safe(o.progressNote)}</p>`:''}${o.paymentStatus==='confirmed'&&o.paymentReference?`<p class="mi-muted"><b>Payment record:</b> ${safe(o.paymentReference)}</p>`:''}</div>`).join('');
}
async function dashboardPage(){
 const u=await requireAccount();if(!u)return;
 const p=await ensureProfile(u);
 if(!p.onboardingComplete){redirect('onboarding.html');return}
 const name=p.fullName||u.displayName||'Customer';
 $('mi-welcome').textContent=`Welcome back, ${name}`;$('mi-display-name').textContent=name;$('mi-display-email').textContent=p.email||u.email||'';
 if(p.photoURL?.startsWith('https://')){
  const img=document.createElement('img');img.src=p.photoURL;img.alt='Profile picture';img.referrerPolicy='no-referrer';$('mi-avatar').replaceChildren(img)
 }else $('mi-avatar').textContent=(name[0]||'M').toUpperCase();
 $('mi-customer-id').textContent=u.uid;$('mi-created').textContent=dateText(p.createdAt);
 $('mi-profile-category').textContent=p.category||'—';$('mi-profile-goal').textContent=p.goal||'—';
 $('mi-service-select').innerHTML=options(services,'Choose a MaxImpress service');
 const links=[['X Growth & Monetization','services/x.html'],['YouTube Monetization','services/youtube.html'],['TikTok Growth & Monetization','services/tiktok.html'],['Instagram Management','services/instagram.html'],['Other Services','services.html']];
 $('mi-explore').innerHTML=links.map(([label,href])=>`<a href="${href}">${safe(label)} →</a>`).join('');
 const refresh=async()=>{
  const orders=await getMyOrders(u.uid);
  $('mi-metric-pending').textContent=orders.filter(o=>o.status==='pending').length;
  $('mi-metric-active').textContent=orders.filter(o=>o.status==='active').length;
  $('mi-metric-completed').textContent=orders.filter(o=>o.status==='completed').length;
  $('mi-metric-purchases').textContent=orders.filter(o=>o.paymentStatus==='confirmed').length;
  renderOrders(orders);
 };
 await refresh();
 if(await isAdmin(u))$('mi-admin-link').classList.remove('mi-hidden');
 $('mi-loading')?.remove();$('mi-dashboard-body').classList.remove('mi-hidden');
 $('mi-request-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!e.currentTarget.reportValidity())return;
  const btn=$('mi-request-submit');setBusy(btn,true);
  try{await requestService(u.uid,$('mi-service-select').value,$('mi-request-notes').value);$('mi-request-notes').value='';$('mi-service-select').value='';display('account-status','Service request saved to your account. This is not a purchase or payment confirmation.','success');await refresh()}
  catch(err){display('account-status',errorText(err),'error')}
  finally{setBusy(btn,false)}
 });
 $('mi-logout').addEventListener('click',logout);
}
async function settingsPage(){
 const u=await requireAccount();if(!u)return;
 const p=await ensureProfile(u);if(!p.onboardingComplete){redirect('onboarding.html');return}
 $('mi-settings-name').value=p.fullName||u.displayName||'';$('mi-settings-email').textContent=u.email||'';$('mi-settings-social').value=p.socialProfile||'';
 $('mi-auth-methods').textContent=providerIds(u).map(x=>x==='password'?'Email / Password':x==='google.com'?'Google':x==='apple.com'?'Apple':x).join(', ');
 $('mi-created').textContent=dateText(p.createdAt);$('mi-id').textContent=u.uid;
 const {auth,a}=await client();
 const profileForm=$('mi-settings-form');
 profileForm.addEventListener('submit',async e=>{
  e.preventDefault();if(!$('mi-settings-name').value.trim()){display('account-status','Your display name cannot be empty.','error');return}const btn=$('mi-save-profile');setBusy(btn,true);
  try{const fullName=$('mi-settings-name').value.trim().slice(0,120);await updateProfile(u.uid,{fullName,socialProfile:$('mi-settings-social').value.trim().slice(0,250)});await a.updateProfile(u,{displayName:fullName});display('account-status','Profile saved successfully.','success')}
  catch(err){display('account-status',errorText(err),'error')}
  finally{setBusy(btn,false)}
 });
 $('mi-password-reset').addEventListener('click',async()=>{
  if(!u.email)return display('account-status','This sign-in provider did not share a contact email address.','error');
  try{await a.sendPasswordResetEmail(auth,u.email);display('account-status','If eligible, a password reset link has been emailed to your account.','success')}
  catch(err){display('account-status',errorText(err),'error')}
 });
 const linkProvider=async kind=>{
  const provider=kind==='google'?new a.GoogleAuthProvider():new a.OAuthProvider('apple.com');
  if(kind==='apple'){provider.addScope('email');provider.addScope('name')}
  try{await a.linkWithPopup(u,provider);const {db,fs}=await client();await fs.updateDoc(fs.doc(db,'customers',u.uid),{linkedProviders:providerIds(u)});$('mi-auth-methods').textContent=providerIds(u).join(', ');display('account-status','Sign-in method linked securely to your existing account.','success')}
  catch(err){display('account-status',errorText(err),'error')}
 };
 $('mi-link-google').addEventListener('click',()=>linkProvider('google'));
 if(appleSignInEnabled){$('mi-link-apple').disabled=false;$('mi-link-apple').addEventListener('click',()=>linkProvider('apple'))}
 if(await isAdmin(u))$('mi-settings-admin').classList.remove('mi-hidden');
 $('mi-loading')?.remove();$('mi-settings-body').classList.remove('mi-hidden');
 $('mi-settings-logout').addEventListener('click',logout);
}
async function adminPage(){
 const u=await requireAccount();if(!u)return;
 if(!await isAdmin(u)){display('account-status','Access denied. This page is only available to authorized MaxImpress administrators.','error');$('mi-loading')?.remove();return}
 let [customers,orders]=await Promise.all([allCustomers(),allOrders()]);
 const render=()=>{
  $('mi-total-customers').textContent=customers.length;
  $('mi-total-onboarded').textContent=customers.filter(c=>c.onboardingComplete===true).length;
  $('mi-total-requests').textContent=orders.length;
  $('mi-pending-requests').textContent=orders.filter(o=>o.status==='pending').length;
  $('mi-active-projects').textContent=orders.filter(o=>o.status==='active').length;
  $('mi-completed-projects').textContent=orders.filter(o=>o.status==='completed').length;
  $('mi-confirmed-payments').textContent=orders.filter(o=>o.paymentStatus==='confirmed').length;
  const recentThreshold=Date.now()-30*24*60*60*1000;
  $('mi-recent-customers').textContent=customers.filter(c=>c.createdAt?.toMillis?.()>=recentThreshold).length;
  const breakdown=(container,field)=>{
    const counts=new Map();
    for(const customer of customers){
      const value=String(customer[field]||'Not provided');
      counts.set(value,(counts.get(value)||0)+1);
    }
    const ordered=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    $(container).innerHTML=ordered.length?ordered.map(([name,count])=>
      `<div class="mi-breakdown-row"><div class="mi-breakdown-top"><span>${safe(name)}</span><strong>${count}</strong></div><div class="mi-breakdown-track" aria-hidden="true"><span style="width:${customers.length?Math.round(count/customers.length*100):0}%"></span></div></div>`
    ).join(''):'<div class="mi-empty">No customer profiles yet.</div>';
  };
  breakdown('mi-category-summary','category');
  breakdown('mi-goal-summary','goal');
  breakdown('mi-referral-summary','referral');
  const filter=$('mi-customer-search').value.toLowerCase().trim();
  $('mi-customers-body').innerHTML=customers.filter(c=>`${c.fullName||''} ${c.email||''}`.toLowerCase().includes(filter)).map(c=>
   `<tr><td><strong>${safe(c.fullName)}</strong><div class="mi-muted">${safe(c.customerId)}</div></td><td>${safe(c.email)}</td><td>${safe(c.category||'—')}<br><small>${safe(c.goal||'')}</small></td><td>${safe(c.referral||'—')}</td><td>${fmt(c)}</td><td>${orders.filter(o=>o.customerId===c.customerId).length}</td></tr>`).join('')||'<tr><td colspan="6">No matching customers.</td></tr>';
  $('mi-orders-body').innerHTML=orders.map(o=>{
   const c=customers.find(x=>x.customerId===o.customerId);
   const status=['pending','active','completed','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('');
   const paid=['unconfirmed','confirmed','refunded'].map(s=>`<option value="${s}" ${o.paymentStatus===s?'selected':''}>${s}</option>`).join('');
   return `<tr data-order-id="${safe(o.id)}"><td>${safe(c?.fullName||o.customerId)}<br><small>${safe(c?.email||'')}</small></td><td><b>${safe(o.service)}</b><div class="mi-muted">${safe(o.notes||'')}</div></td><td><select aria-label="Service status">${status}</select></td><td><select aria-label="Payment confirmation">${paid}</select></td><td><input class="mi-search mi-progress" maxlength="400" placeholder="Actual progress update" value="${safe(o.progressNote||'')}" aria-label="Progress update"><input class="mi-search mi-payment-ref" maxlength="120" placeholder="Payment reference (optional)" value="${safe(o.paymentReference||'')}" aria-label="Payment reference"></td><td>${fmt(o)}</td><td><button class="mi-outline mi-order-save">Save</button></td></tr>`
  }).join('')||'<tr><td colspan="7">No service requests recorded.</td></tr>';
  $('mi-orders-body').querySelectorAll('.mi-order-save').forEach(b=>b.addEventListener('click',async()=>{
   const row=b.closest('tr');const [status,paymentStatus]=[...row.querySelectorAll('select')].map(s=>s.value);
   const progressNote=row.querySelector('.mi-progress').value.trim(),paymentReference=row.querySelector('.mi-payment-ref').value.trim();
   if(paymentStatus==='confirmed'&&!confirm('Confirm payment ONLY if MaxImpress has verified the actual receipt of funds. Continue?'))return;
   if(['active','completed'].includes(status)&&!confirm('Update service progress only if it reflects actual work. Continue?'))return;
   b.disabled=true;
   try{await updateOrder(row.dataset.orderId,{status,paymentStatus,progressNote,paymentReference});const item=orders.find(o=>o.id===row.dataset.orderId);if(item){item.status=status;item.paymentStatus=paymentStatus;item.progressNote=progressNote;item.paymentReference=paymentReference}display('account-status','Order record updated in Firestore.','success')}
   catch(err){display('account-status',errorText(err),'error')}
   finally{b.disabled=false}
  }));
 };
 $('mi-customer-search').addEventListener('input',render);
 $('mi-export').addEventListener('click',()=>{
  const rows=[['customerId','fullName','email','provider','createdAt','category','goal','referral','socialProfile','onboardingComplete']];
  for(const c of customers) rows.push(rows[0].map(k=>k==='createdAt'?fmt(c):String(c[k]??'')));
  const csv=rows.map(row=>row.map(cell=>{const value=String(cell);return '"'+(/^[=+@\-\t\r]/.test(value)?"'":'')+value.replaceAll('"','""')+'"'}).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='MaxImpress_Authorized_Customers.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),300);
 });
 render();$('mi-loading')?.remove();$('mi-admin-body').classList.remove('mi-hidden');
}
ready();
