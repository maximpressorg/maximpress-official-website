/** Admin-only moderation for verified customer comments. Access enforced by Firestore rules. */
import {configured,currentUser,isAdmin,client} from './auth-core.js?v=20261102-auth13';
if(configured){(async()=>{
 const user=await currentUser();if(!user||!await isAdmin(user))return;
 const main=document.querySelector('.mi-wrap');if(!main)return;
 const section=document.createElement('section');section.className='mi-review-admin';section.innerHTML='<h2>Review Comment Moderation</h2><p class="mi-muted">Only approved comments become public. Verify context before approval.</p><div id="mi-review-moderation-list" class="mi-list"></div>';
 main.append(section);
 const formSection=document.createElement('section');formSection.className='mi-review-admin';formSection.innerHTML='<h2>New Customer Feedback for Approval</h2><p class="mi-muted">Confirm that the submission reflects a real customer experience before approving. Approved feedback becomes public.</p><div id="mi-feedback-approval-list"></div>';main.append(formSection);
 const {db:reviewDb,fs:reviewFs}=await client();
 const submissions=await reviewFs.getDocs(reviewFs.collection(reviewDb,'reviewSubmissions'));
 const pendingReviews=submissions.docs.filter(doc=>doc.data().status==='pending');const reviewList=formSection.querySelector('#mi-feedback-approval-list');
 if(!pendingReviews.length)reviewList.textContent='No pending customer feedback.';
 for(const doc of pendingReviews){const d=doc.data(),div=document.createElement('div');div.className='mi-review-admin-entry';const head=document.createElement('strong');head.textContent=d.name+' · '+d.service+' · '+d.rating+'/5';const quote=document.createElement('p');quote.textContent=d.review;const email=document.createElement('p');email.textContent='Account email: '+d.email;div.append(head,quote,email);
  for(const [title,status] of [['Approve','approved'],['Reject','rejected']]){const b=document.createElement('button');b.textContent=title;b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await reviewFs.updateDoc(doc.ref,{status,updatedAt:reviewFs.serverTimestamp()});div.remove()}catch{b.disabled=false;alert('Could not update feedback status.')}});div.append(b)}reviewList.append(div)
 }
 const list=section.querySelector('#mi-review-moderation-list');list.textContent='Checking submitted comments…';
 const {db,fs}=await client();const pending=[];
 for(let i=1;i<=16;i++){const id='r'+String(i).padStart(2,'0');const snap=await fs.getDocs(fs.collection(db,'reviewComments',id,'entries'));for(const d of snap.docs)if(d.data().status==='pending')pending.push({id,ref:d.ref,data:d.data()})}
 list.replaceChildren();if(!pending.length){list.textContent='No pending comments.';return}
 for(const c of pending){const div=document.createElement('div');div.className='mi-review-admin-entry';const label=document.createElement('strong');label.textContent=`Review ${c.id} — ${c.data.name||'Verified customer'}`;const body=document.createElement('p');body.textContent=c.data.text;div.append(label,body);
  for(const [title,status] of [['Approve','approved'],['Reject','rejected']]){const b=document.createElement('button');b.type='button';b.textContent=title;b.addEventListener('click',async()=>{b.disabled=true;try{await fs.updateDoc(c.ref,{status,updatedAt:fs.serverTimestamp()});div.remove()}catch{alert('Unable to moderate this comment.');b.disabled=false}});div.append(b)}list.append(div)
 }
})().catch(()=>{});}
