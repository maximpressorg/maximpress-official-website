/** Genuine feedback submission, customer identity and administrator moderation. */
import {configured,currentUser,isVerified,client} from './auth-core.js?v=20261102-auth9';
const form=document.getElementById('review-submission-form');
const status=document.getElementById('review-form-status');
const grid=document.getElementById('mi-community-grid');
const empty=document.getElementById('mi-community-empty');
const allowedServices=new Set([...form?.querySelectorAll('select[name="service"] option')||[]].map(o=>o.value).filter(Boolean));
if(form){
 const update=t=>{if(status)status.textContent=t};
 if(!configured){update('Online feedback submission will activate when MaxImpress is connected to Firebase. Nothing is being submitted or published yet.');form.addEventListener('submit',e=>{e.preventDefault();update('Feedback cannot be submitted until Firebase is configured. Please check back later.');});}
 else (async()=>{
  const u=await currentUser();if(!isVerified(u)){update('Please verify your account before sharing feedback.');return;}
  const {db,fs}=await client();
  const email=form.querySelector('[name="reply"]');if(email){email.value=u.email||'';email.readOnly=true;email.title='Verified account email';}
  const name=form.querySelector('[name="reviewer"]');if(name&&!name.value)name.value=u.displayName||'';
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(!form.reportValidity())return;
   const d=new FormData(form);const rating=Number(d.get('rating'));const review=String(d.get('review')||'').trim();
   const reviewer=String(d.get('reviewer')||'').trim();const service=String(d.get('service')||'').trim();
   if(!d.get('consent')||!allowedServices.has(service)||!Number.isInteger(rating)||rating<1||rating>5||review.length<15||reviewer.length<2){update('Please complete all fields and confirm the publication consent. Your feedback must be at least 15 characters.');return;}
   const button=form.querySelector('[type="submit"]');button.disabled=true;update('Submitting your feedback for verification…');
   try{await fs.addDoc(fs.collection(db,'reviewSubmissions'),{uid:u.uid,name:reviewer.slice(0,120),email:u.email,service,rating,review:review.slice(0,3000),consent:true,status:'pending',createdAt:fs.serverTimestamp(),updatedAt:fs.serverTimestamp()});
    form.reset();if(email)email.value=u.email||'';update('Feedback received! It will be published only after MaxImpress checks authenticity and approves it. No review has been published yet.');
   }catch(err){update('Feedback was not submitted. Please retry once database access is available.');}
   finally{button.disabled=false;}
  });
  if(!grid)return;
  const published=fs.query(fs.collection(db,'reviewSubmissions'),fs.where('status','==','approved'));
  fs.onSnapshot(published,snap=>{
   grid.replaceChildren();empty.hidden=!snap.empty;
   for(const doc of snap.docs){const d=doc.data();const id='s_'+doc.id;
    const article=document.createElement('article');article.className='review-card-v18 review-card-v23';
    const head=document.createElement('div');head.className='review-card-head';
    const person=document.createElement('div');person.className='review-card-person';const title=document.createElement('div');title.className='review-card-name';title.textContent=d.name;const sub=document.createElement('span');sub.className='review-card-sub';sub.textContent=d.service;
    person.append(title,sub);head.append(person);const badge=document.createElement('span');badge.className='review-badge';badge.textContent='Customer-submitted';head.append(badge);
    const quote=document.createElement('p');quote.className='review-card-quote-v24';quote.textContent=d.review;
    const stars=document.createElement('div');stars.className='mi-review-stars is-rated';stars.setAttribute('aria-label',d.rating+' out of 5 stars');const starText=document.createElement('span');starText.textContent='★'.repeat(d.rating)+'☆'.repeat(5-d.rating);starText.setAttribute('aria-hidden','true');const rate=document.createElement('small');rate.textContent=d.rating+' / 5';stars.append(starText,rate);
    const votes=document.createElement('div');votes.className='mi-review-actions';votes.dataset.reviewId=id;
    for(const [value,title,icon] of [[1,'Like','▲'],[-1,'Dislike','▼']]){const b=document.createElement('button');b.type='button';b.dataset.vote=String(value);b.textContent=icon+' '+title+' ';const n=document.createElement('span');n.className='mi-review-count';n.dataset.count=String(value);n.textContent='0';b.append(n);votes.append(b)}
    const commentsToggle=document.createElement('button');commentsToggle.type='button';commentsToggle.dataset.commentToggle='';commentsToggle.setAttribute('aria-expanded','false');commentsToggle.textContent='Comment';votes.append(commentsToggle);
    const area=document.createElement('div');area.className='mi-review-comments';area.dataset.commentsFor=id;area.hidden=true;
    const list=document.createElement('div');list.className='mi-review-comments-list';area.append(list);
    const reply=document.createElement('form');reply.className='mi-review-commentform';const label=document.createElement('label');label.textContent='Add a comment';const input=document.createElement('textarea');input.required=true;input.minLength=3;input.maxLength=700;input.placeholder='Share your genuine experience or question';input.id='comment-'+id;label.htmlFor=input.id;const send=document.createElement('button');send.type='submit';send.textContent='Submit for review';reply.append(label,input,send);area.append(reply);
    const hint=document.createElement('div');hint.className='mi-review-hint';hint.setAttribute('role','status');hint.textContent='New comments appear after moderation.';area.append(hint);
    article.append(head,quote,stars,votes,area);grid.append(article);
   }
   window.dispatchEvent(new Event('mi-review-cards-updated'));
  },()=>{empty.hidden=false;empty.textContent='Additional feedback is temporarily unavailable.'});
  })().catch(()=>update('Feedback services are currently unavailable.'));
}
