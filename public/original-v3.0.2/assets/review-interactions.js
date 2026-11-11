/** MaxImpress review reactions: Like or Dislike only. Customer comments are closed.
 * Guests can browse. A guest's reaction is not recorded until verified sign-in.
 * The public summary requires one-time owner initialization on Firestore.
 */
import {configured,client,isVerified} from './auth-core.js';
const states=new Map(),pendingKey='mi-pending-review-interaction-v1';
const validId=id=>/^r(0[1-9]|1[0-6])$/.test(id)||/^s_[A-Za-z0-9]{20}$/.test(id);
const display=n=>Math.max(0,Math.trunc(n)).toLocaleString('en-US');
function savedIntent(){
 try{const x=JSON.parse(sessionStorage.getItem(pendingKey)||'null');
  if(x?.kind==='vote'&&validId(x.id)&&[-1,1].includes(x.value)&&
    Number.isFinite(x.at)&&x.at<=Date.now()+10000&&Date.now()-x.at<=1800000)return x;
  sessionStorage.removeItem(pendingKey);
 }catch{try{sessionStorage.removeItem(pendingKey);}catch{}}
 return null;
}
function clearIntent(id){if(savedIntent()?.id===id)sessionStorage.removeItem(pendingKey);}
function askToSignIn(st,value){
 try{sessionStorage.setItem(pendingKey,JSON.stringify({kind:'vote',id:st.id,value,at:Date.now()}));}catch{}
 const next='reviews.html'+location.search+location.hash;
 const params=new URLSearchParams({mode:'login',next});
 if(st.user&&!isVerified(st.user))params.set('verify','1');
 location.assign('account.html?'+params);
}
function message(st,msg){
 let el=st.p.nextElementSibling;
 if(!el?.classList?.contains('mi-review-action-status')){
  el=document.createElement('div');el.className='mi-review-action-status';
  el.setAttribute('role','status');st.p.after(el);
 }
 el.textContent=msg;
}
function counts(st,likes,dislikes){
 const l=st.p.querySelector('[data-count="1"]'),d=st.p.querySelector('[data-count="-1"]');
 if(l)l.textContent=display(likes);if(d)d.textContent=display(dislikes);
}
function render(st){st.p.querySelectorAll('[data-vote]').forEach(b=>{
 const active=Number(b.dataset.vote)===st.selected;
 b.dataset.selected=String(active);b.setAttribute('aria-pressed',String(active));
 b.disabled=st.pending||!!(st.user&&isVerified(st.user)&&!st.voteReady);
 b.title=!st.user?'Log in or sign up to save your reaction':!isVerified(st.user)?
  'Verify your email to save a reaction':!configured?'Firebase is not activated':
  !st.seeded?'Historical totals have not been initialized':active?'Remove your reaction':'Save your reaction';
});}
function startCard(p){
 if(p.dataset.miBound)return;
 const id=p.dataset.reviewId;if(!validId(id))return;
 p.dataset.miBound='true';
 const st={id,p,user:null,selected:0,seeded:false,voteReady:false,pending:false,
           resumeAttempted:false,subscribed:false,unsubs:[]};
 states.set(id,st);
 counts(st,Number(p.dataset.baseLikes)||0,Number(p.dataset.baseDislikes)||0);
 p.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>vote(st,Number(b.dataset.vote))));
 render(st);
}
async function vote(st,value,{resumed=false}={}){
 if(st.pending)return;
 if(!st.user||!isVerified(st.user)){askToSignIn(st,value);return;}
 if(!configured){message(st,'Voting is not available until Firebase is connected. No reaction was recorded.');return;}
 if(!st.seeded){message(st,'Historical totals must be initialized by MaxImpress before votes can be saved.');return;}
 if(!st.voteReady){message(st,'Checking your previous reaction. Please try again.');return;}
 st.pending=true;render(st);
 try{
  const {db,fs}=await client();
  const total=fs.doc(db,'reviewVoteTotals',st.id);
  const mine=fs.doc(db,'reviewVotes',st.id,'votes',st.user.uid);
  await fs.runTransaction(db,async tx=>{
   const [sum,existing]=await Promise.all([tx.get(total),tx.get(mine)]);
   if(!sum.exists())throw Error('Review summary has not been initialized.');
   const previous=existing.exists()?Number(existing.data().value):0;
   const next=previous===value?0:value;
   const likes=sum.data().likes+(next===1?1:0)-(previous===1?1:0);
   const dislikes=sum.data().dislikes+(next===-1?1:0)-(previous===-1?1:0);
   if(likes<0||dislikes<0)throw Error('Invalid counter state.');
   if(next===0)tx.delete(mine);
   else tx.set(mine,{value:next,updatedAt:fs.serverTimestamp()});
   tx.update(total,{likes,dislikes});
  });
  clearIntent(st.id);
  message(st,'Your reaction was saved. Updated totals are visible across the website.');
 }catch{
  message(st,resumed?'Your saved reaction could not be applied. Select a reaction to retry.':
    'Your reaction could not be saved. Please check your account and connection.');
 }finally{st.pending=false;render(st);}
}
function resume(st){
 const intent=savedIntent();
 if(!intent||intent.id!==st.id||!st.user||!isVerified(st.user)||
    st.resumeAttempted||!st.seeded||!st.voteReady)return;
 st.resumeAttempted=true;
 st.p.scrollIntoView({block:'center'});
 void vote(st,intent.value,{resumed:true});
}
function subscribe(st,user,db,fs){
 if(st.subscribed)return;
 st.subscribed=true;st.user=user;st.voteReady=!user||!isVerified(user);
 st.unsubs.push(fs.onSnapshot(fs.doc(db,'reviewVoteTotals',st.id),snap=>{
  if(snap.exists()&&Number.isSafeInteger(snap.data().likes)&&Number.isSafeInteger(snap.data().dislikes)){
   st.seeded=true;counts(st,snap.data().likes,snap.data().dislikes);
  }else{st.seeded=false;}
  render(st);resume(st);
 },()=>message(st,'Live reaction totals are temporarily unavailable.')));
 if(user&&isVerified(user))st.unsubs.push(fs.onSnapshot(
  fs.doc(db,'reviewVotes',st.id,'votes',user.uid),snap=>{
   st.selected=snap.exists()?Number(snap.data().value):0;st.voteReady=true;
   render(st);resume(st);
  },()=>{st.voteReady=false;render(st);message(st,'Could not load your previous vote.');}
 ));
}
async function boot(){
 if(!configured)return;
 try{const {auth,a,db,fs}=await client();
  a.onAuthStateChanged(auth,user=>{
   states.forEach(st=>{
    if(st.subscribed&&st.user?.uid!==user?.uid){
     st.unsubs.forEach(off=>off());st.unsubs=[];st.subscribed=false;
     st.selected=0;st.voteReady=false;st.resumeAttempted=false;
    }
    if(!st.subscribed)subscribe(st,user,db,fs);
   });
  });
 }catch{states.forEach(st=>message(st,'Reactions are not connected to Firebase yet.'));}
}
if(document.querySelector('.mi-review-actions[data-review-id]')){
 document.querySelectorAll('.mi-review-actions[data-review-id]').forEach(startCard);
 void boot();
 window.addEventListener('mi-review-cards-updated',()=>{
  document.querySelectorAll('.mi-review-actions[data-review-id]').forEach(startCard);
  if(configured)client().then(({auth,db,fs})=>states.forEach(st=>{
   if(!st.subscribed)subscribe(st,auth.currentUser,db,fs);
  })).catch(()=>{});
 });
}
