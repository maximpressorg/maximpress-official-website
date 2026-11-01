/** V2.8 authentic signed-in reactions, gated comments. No invented seed metrics. */
import {configured,client,currentUser,isVerified,safe} from './auth-core.js?v=20261102-auth10';
let panels=[...document.querySelectorAll('.mi-review-actions[data-review-id]')];
if(panels.length){
 const VALID=new Set(panels.map(e=>e.dataset.reviewId));
 // Ratings render only when there is genuine verified review rating evidence entered by the owner.
 fetch(new URL('./review-ratings.json',import.meta.url)).then(r=>r.json()).then(ratings=>{
  for(const [id,v] of Object.entries(ratings)){const el=document.querySelector(`[data-review-rating="${id}"]`);if(!el||!VALID.has(id)||!(typeof v==='number'&&v>=1&&v<=5))continue;
   const full=Math.round(v);el.classList.add('is-rated');el.setAttribute('aria-label','Customer rating: '+v+' out of 5');
   el.querySelector('span').textContent='★'.repeat(full)+'☆'.repeat(5-full);el.querySelector('small').textContent=v+' / 5';
  }
 }).catch(()=>{});
 window.addEventListener('mi-review-cards-updated',()=>{if(!configured)return;panels=[...document.querySelectorAll('.mi-review-actions[data-review-id]')];run().catch(()=>{});});
 if(!configured){panels.forEach(p=>p.querySelectorAll('button').forEach(b=>{b.disabled=true;b.title='Review reactions require Firebase setup'}));}
 else run().catch(()=>panels.forEach(p=>p.querySelectorAll('button').forEach(b=>{b.disabled=true;b.title='Review interactions could not be loaded'})));
 async function run(){const u=await currentUser();if(!isVerified(u))return;
  const {db,fs}=await client();
  for(const p of panels.filter(p=>!p.dataset.miBound)){p.dataset.miBound='1';const id=p.dataset.reviewId,votes=fs.collection(db,'reviewVotes',id,'votes'),mine=fs.doc(db,'reviewVotes',id,'votes',u.uid);
   let selected=0;let pending=false;
   p.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',async()=>{
    if(pending)return;pending=true;p.querySelectorAll('[data-vote]').forEach(x=>x.disabled=true);
    try{const val=Number(b.dataset.vote);if(selected===val)await fs.deleteDoc(mine);else await fs.setDoc(mine,{value:val,updatedAt:fs.serverTimestamp()})}
    catch(e){alert('Could not save your reaction. Please retry.')}finally{pending=false;p.querySelectorAll('[data-vote]').forEach(x=>x.disabled=false)}
   }));
   fs.onSnapshot(votes,snap=>{
     let likes=0,dislikes=0;selected=0;
     snap.forEach(d=>{const v=d.data().value;if(v===1)likes++;if(v===-1)dislikes++;if(d.id===u.uid)selected=v});
     p.querySelector('[data-count="1"]').textContent=likes;p.querySelector('[data-count="-1"]').textContent=dislikes;
     p.querySelectorAll('[data-vote]').forEach(b=>b.dataset.selected=String(selected===Number(b.dataset.vote)));
   },()=>{p.querySelectorAll('[data-vote]').forEach(b=>b.disabled=true)});
   const btn=p.querySelector('[data-comment-toggle]'),area=document.querySelector(`[data-comments-for="${id}"]`),list=area?.querySelector('.mi-review-comments-list');
   btn.addEventListener('click',()=>{area.hidden=!area.hidden;btn.setAttribute('aria-expanded',String(!area.hidden))});
   const approved=fs.query(fs.collection(db,'reviewComments',id,'entries'),fs.where('status','==','approved'));
   fs.onSnapshot(approved,snap=>{
     if(!list)return;list.replaceChildren();const entries=snap.docs.map(d=>d.data()).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)).slice(-25);
     if(!entries.length){const empty=document.createElement('div');empty.className='mi-review-hint';empty.textContent='No published comments yet.';list.append(empty)}
     for(const c of entries){const box=document.createElement('div');box.className='mi-review-comment';const n=document.createElement('strong');n.textContent=(c.name||'Verified customer').slice(0,90);const t=document.createElement('p');t.textContent=c.text;box.append(n,t);list.append(box)}
   },()=>{if(list)list.textContent='Comments are temporarily unavailable.'});
   const form=area.querySelector('form');form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;
    const btn=form.querySelector('button');btn.disabled=true;try{
     const text=form.querySelector('textarea').value.trim();if(text.length<3)return;
     await fs.addDoc(fs.collection(db,'reviewComments',id,'entries'),{uid:u.uid,name:(u.displayName||'Verified customer').slice(0,90),text,status:'pending',createdAt:fs.serverTimestamp(),updatedAt:fs.serverTimestamp()});
     form.reset();area.querySelector('.mi-review-hint').textContent='Comment received. It will appear if approved by a MaxImpress administrator.';
    }catch{area.querySelector('.mi-review-hint').textContent='Could not submit comment. Please try again.'}finally{btn.disabled=false}
   });
  }
 }
}
