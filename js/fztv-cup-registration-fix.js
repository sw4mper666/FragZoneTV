/* FZTV CUP #1 trophy frame and team registration */
(()=>{
'use strict'; if(window.__fzCupFix)return;window.__fzCupFix=true;
const st=document.createElement('style');
st.textContent='.fz-cup-showcase{display:flex;align-items:center;gap:18px;margin:15px 0;padding:16px;background:linear-gradient(110deg,#270d18,#131c2d);border:1px solid #c02e44;border-radius:12px}.fz-cup-trophy-frame{flex:0 0 190px;width:190px;height:285px;background:#120a10;border:2px solid #dd354d;border-radius:13px;overflow:hidden;box-shadow:0 0 25px #df244d44}.fz-cup-trophy-frame img{width:100%;height:100%;object-fit:contain}.fz-cup-showcase h3{margin:4px 0 10px;font-size:21px}.fz-cup-showcase p{font-size:13px;color:#b6c6d9}.fz-cup-showcase small{font-size:11px;color:#ff8d9b;letter-spacing:2px}@media(max-width:620px){.fz-cup-showcase{gap:10px;padding:9px}.fz-cup-trophy-frame{flex-basis:125px;width:125px;height:190px}.fz-cup-showcase h3{font-size:15px}}';st.textContent += '.detail-card>.detail-banner.fztv-banner{display:none!important}.detail-card>.fz-cup-showcase{margin-top:0!important}';document.head.append(st);
let scheduled=false,activeRoot=null;
function onCup(){try{const p=decodeURIComponent(location.hash).toLowerCase();return p.startsWith('#/tournament/fztv cup #1/');}catch{return false;}}
function show(){
if(!onCup())return;
const app=document.getElementById('app');if(!app)return;
const detail=app.querySelector('.detail-card');if(!detail)return;
let showcase=detail.querySelector('.fz-cup-showcase');
if(!showcase){
showcase=document.createElement('section');showcase.className='fz-cup-showcase';
const frame=document.createElement('div');frame.className='fz-cup-trophy-frame';
const img=document.createElement('img');img.src='./assets/tournaments/fztv-cup-trophy.png';img.alt='Кубок FZTV CUP #1';frame.append(img);
const info=document.createElement('div');const over=document.createElement('small');over.textContent='FRAGZONETV · TROPHY';
const title=document.createElement('h3');title.textContent='КУБОК FZTV CUP #1';
const desc=document.createElement('p');desc.textContent='Оригинальный кубок первого турнира FragZoneTV. Победитель станет первым чемпионом серии.';
info.append(over,title,desc);showcase.append(frame,info);
const banner=detail.querySelector('.detail-banner.fztv-banner');
if(banner)banner.insertAdjacentElement('afterend',showcase);else detail.prepend(showcase);
}
if(activeRoot===detail)return;
const slots=detail.querySelector('.fztv-slots');if(!slots)return;
activeRoot=detail;
const client=typeof sb!=='undefined'?sb:window.sb;
if(!client){activeRoot=null;console.error('CUP: Supabase client unavailable');return;}
import('./tournament-registration.js?v=20261108-cup-single-v4').then(m=>{
 if(!app.contains(detail))return;
 return m.mountTournamentRegistration({client,root:detail});
}).catch(err=>{activeRoot=null;console.error('CUP registration failed',err);
 if(app.contains(detail)){const p=document.createElement('p');p.style.color='#ff8d8d';p.textContent='Ошибка регистрации: '+(err.message||err);slots.before(p);}
});
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;show();});}
const app=document.getElementById('app');
if(app)new MutationObserver(()=>{if(activeRoot&&!app.contains(activeRoot))activeRoot=null;schedule();}).observe(app,{childList:true,subtree:false});
window.addEventListener('hashchange',()=>{activeRoot=null;schedule();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
})();