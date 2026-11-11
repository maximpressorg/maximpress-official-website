/* MaxImpress plan inquiry — local-only PDF generation, no tracking, no hidden transmission. */
(() => {
'use strict';
const form=document.getElementById('plan-inquiry-form');
if(!form)return;
const params=new URLSearchParams(location.search);
for(const key of ['service','plan','price']){
 const field=form.elements.namedItem(key);
 if(field)field.value=(params.get(key)||'').slice(0,120);
}
const destination='maximpress.org@gmail.com';
const xRecipientId='1582710858614018050'; // Saved in the original MaxImpress website.
const status=document.getElementById('inquiry-send-status');
const email=document.getElementById('send-inquiry-email');
const x=document.getElementById('send-inquiry-x');
const copy=document.getElementById('copy-inquiry');
const pdfButton=document.getElementById('download-inquiry-pdf');
function readForm(){
 if(!form.reportValidity())return null;
 const data=new FormData(form),val=k=>String(data.get(k)||'').trim();
 const fields=[['Name',val('name')],['Email',val('email')],['Phone',val('phone')],['Country',val('country')],['Social account',val('social')],['Service',val('service')],['Package',val('plan')],['Displayed price',val('price')],['Project goals',val('goals')],['Additional requirements',val('notes')]];
 const service=val('service')||'General project';
 const subject='MaxImpress project inquiry: '+(val('plan')||service);
 const text=['MAXIMPRESS | PROJECT INQUIRY','','Submitted (local): '+new Date().toLocaleString(),''].concat(fields.flatMap(([k,v])=>[k+': '+(v||'Not provided')])).join('\n');
 return {fields,subject,text,service};
}
function setStatus(message){if(status)status.textContent=message;}
function download(name,blob){
 const url=URL.createObjectURL(blob);const a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
/* A self-contained multi-page PDF writer. Each crisp page is painted to a local canvas
   (supports non-Latin names), placed into a PDF as a JPEG XObject, and never uploaded. */
function createPdf(data){
 const W=1260,H=1782,M=85, usable=W-M*2;
 let pages=[],canvas,ctx,y;
 function page(){
  canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  ctx=canvas.getContext('2d');ctx.fillStyle='#fbf9ff';ctx.fillRect(0,0,W,H);
  const hdr=ctx.createLinearGradient(0,0,W,0);hdr.addColorStop(0,'#312052');hdr.addColorStop(.65,'#6941a7');hdr.addColorStop(1,'#dc4e9f');
  ctx.fillStyle=hdr;ctx.fillRect(0,0,W,180);
  ctx.fillStyle='#fff';ctx.font='bold 58px Arial,sans-serif';ctx.fillText('MaxImpress',M,87);
  ctx.fillStyle='#f5defb';ctx.font='22px Arial,sans-serif';ctx.fillText('DIGITAL GROWTH PARTNERS  •  PROJECT INQUIRY',M,136);
  ctx.fillStyle='#decbea';ctx.fillRect(M,H-89,usable,2);
  ctx.fillStyle='#635a77';ctx.font='20px Arial,sans-serif';ctx.fillText('Generated on your device  •  Not submitted automatically',M,H-57);
  y=229;
 }
 function savePage(){pages.push(canvas.toDataURL('image/jpeg',.93).split(',')[1]);}
 function fit(h){if(y+h>H-136){savePage();page();}}
 function lines(value,maxWidth,font){
  const paragraphs=String(value||'Not provided').split(/\r?\n/);ctx.font=font;
  let out=[];
  for(const para of paragraphs){
   if(!para.trim()){out.push('');continue;}
   let words=para.split(/\s+/),line='';
   for(let word of words){
    let trial=line?line+' '+word:word;
    if(ctx.measureText(trial).width<=maxWidth){line=trial;continue;}
    if(line){out.push(line);line='';}
    while(ctx.measureText(word).width>maxWidth){
     let cut=1;while(cut<word.length && ctx.measureText(word.slice(0,cut+1)).width<maxWidth)cut++;
     out.push(word.slice(0,cut));word=word.slice(cut);
    }
    line=word;
   }
   if(line)out.push(line);
  }
  return out;
 }
 function section(label,value){
  const font='27px Arial,sans-serif';const content=lines(value,usable-48,font),ht=56+Math.max(1,content.length)*40+33;
  if(ht<H-410){fit(ht);}else if(y>310){savePage();page();}
  ctx.fillStyle='#4d2c87';ctx.font='bold 22px Arial,sans-serif';ctx.fillText(label.toUpperCase(),M,y+18);y+=39;
  ctx.fillStyle='#2a2636';ctx.font=font;
  for(const line of content){fit(44);ctx.fillStyle='#2a2636';ctx.font=font;ctx.fillText(line,M+9,y+25);y+=42;}
  y+=30;
 }
 page();
 ctx.fillStyle='#7b46cf';ctx.font='bold 28px Arial,sans-serif';ctx.fillText('Project details',M,y+18);y+=70;
 for(const [label,value] of data.fields)section(label,value);
 savePage();
 // Wrap JPEG images in a standards-compliant PDF 1.4 without external libraries.
 const enc=new TextEncoder(),parts=[];let total=0;const offsets=[0];
 function write(v){const a=(typeof v==='string'?enc.encode(v):v);parts.push(a);total+=a.length;}
 function obj(id,body){offsets[id]=total;write(id+' 0 obj\n'+body+'\nendobj\n');}
 write('%PDF-1.4\n%MaxImpress generated locally\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 const children=pages.map((_,i)=>(3+i*3)+' 0 R').join(' ');
 obj(2,'<< /Type /Pages /Kids [ '+children+' ] /Count '+pages.length+' >>');
 for(let i=0;i<pages.length;i++){
  const pi=3+i*3,ci=pi+1,im=pi+2;
  obj(pi,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 '+im+' 0 R >> >> /Contents '+ci+' 0 R >>');
  const stream='q\n595 0 0 842 0 0 cm\n/Im1 Do\nQ\n';
  offsets[ci]=total;
  write(ci+' 0 obj\n<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream\nendobj\n');
  const raw=atob(pages[i]),bytes=new Uint8Array(raw.length);
  for(let j=0;j<raw.length;j++)bytes[j]=raw.charCodeAt(j);
  offsets[im]=total;
  write(im+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n');
  write(bytes);write('\nendstream\nendobj\n');
 }
 const xref=total,qty=3+pages.length*3;
 write('xref\n0 '+qty+'\n0000000000 65535 f \n');
 for(let i=1;i<qty;i++)write(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 write('trailer\n<< /Root 1 0 R /Size '+qty+' >>\nstartxref\n'+xref+'\n%%EOF\n');
 return new Blob(parts,{type:'application/pdf'});
}
function pdfCopy(data){
 const file='MaxImpress_Project_Inquiry_'+new Date().toISOString().slice(0,10)+'.pdf';
 download(file,createPdf(data));return file;
}
email.addEventListener('click',()=>{
 const d=readForm();if(!d)return;
 try{pdfCopy(d);}catch(err){console.error('PDF generation failed',err);setStatus('PDF generation did not succeed. You can still send the full text by email.');}
 const mail='mailto:'+destination+'?subject='+encodeURIComponent(d.subject)+'&body='+encodeURIComponent(d.text);
 setStatus('PDF copy downloaded. Your email draft is opening with the full inquiry; attach the PDF manually if needed and press Send. No email has been sent automatically.');
 setTimeout(()=>location.href=mail,250);
});
x.addEventListener('click',()=>{
 const d=readForm();if(!d)return;
 try{pdfCopy(d);}catch(err){console.error('PDF generation failed',err);setStatus('PDF generation did not succeed. The inquiry text is still available.');}
 const url='https://x.com/messages/compose?recipient_id='+xRecipientId+'&text='+encodeURIComponent(d.text);
 setStatus('PDF copy downloaded. X is opening a direct-message draft with your full inquiry. Review and press Send in X. The PDF is not attached automatically.');
 const tab=window.open(url,'_blank');
 if(tab){try{tab.opener=null;}catch(_){}}
 else{setTimeout(()=>location.href=url,300);}
});
pdfButton?.addEventListener('click',()=>{
 const d=readForm();if(!d)return;
 try{const file=pdfCopy(d);setStatus(file+' downloaded. The form has not been sent to MaxImpress.');}
 catch(err){console.error(err);setStatus('Could not create the PDF in this browser. Please try Email or X with the full inquiry text.');}
});
copy.addEventListener('click',async()=>{
 const d=readForm();if(!d)return;
 try{await navigator.clipboard.writeText(d.text);setStatus('Complete inquiry copied to clipboard. Paste it into Email or X and press Send.');}
 catch{
  let t=document.getElementById('inquiry-fallback-text');
  if(!t){t=document.createElement('textarea');t.id='inquiry-fallback-text';t.setAttribute('aria-label','Copy prepared inquiry');t.className='inquiry-fallback-copy';form.append(t);}
  t.value=d.text;t.focus();t.select();setStatus('Select and copy the complete inquiry text shown below.');
 }
});
})();
