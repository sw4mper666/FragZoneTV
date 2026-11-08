/* FZTV CUP #1 trophy frame and team registration */
(()=>{
'use strict'; if(window.__fzCupFix)return;window.__fzCupFix=true;
const st=document.createElement('style');
st.textContent='.fz-cup-showcase{display:flex;align-items:center;gap:18px;margin:15px 0;padding:16px;background:linear-gradient(110deg,#270d18,#131c2d);border:1px solid #c02e44;border-radius:12px}.fz-cup-trophy-frame{flex:0 0 190px;width:190px;height:285px;background:#120a10;border:2px solid #dd354d;border-radius:13px;overflow:hidden;box-shadow:0 0 25px #df244d44}.fz-cup-trophy-frame img{width:100%;height:100%;object-fit:contain}.fz-cup-showcase h3{margin:4px 0 10px;font-size:21px}.fz-cup-showcase p{font-size:13px;color:#b6c6d9}.fz-cup-showcase small{font-size:11px;color:#ff8d9b;letter-spacing:2px}@media(max-width:620px){.fz-cup-showcase{gap:10px;padding:9px}.fz-cup-trophy-frame{flex-basis:125px;width:125px;height:190px}.fz-cup-showcase h3{font-size:15px}}';document.head.append(st);
let scheduled=false,mountedAt=null;
function onCup(){return location.hash.toLowerCase().includes('/tournament/fztv%20cup%20%231')||location.hash.toLowerCase().includes('/tournament/fztv cup #1');}
function mount(){if(!onCup())return;const app=document.getElementById('app');if(!app)return;const banner=app.querySelector('.detail-banner.fztv-banner');if(!banner)return;
if(!app.querySelector('.fz-cup-showcase')){const frame=document.createElement('section');frame.className='fz-cup-showcase';const box=document.createElement('div');box.className='fz-cup-trophy-frame';const img=document.createElement('img');img.src='./assets/tournaments/fztv-cup-trophy.png';img.alt='Кубок FZTV CUP #1';img.loading='eager';box.append(img);const copy=document.createElement('div');const small=document.createElement('small');small.textContent='FRAGZONETV · TROPHY';const title=document.createElement('h3');title.textContent='КУБОК FZTV CUP #1';const p=document.createElement('p');p.textContent='Оригинальный кубок первого турнира. Победитель станет первым чемпионом серии FragZoneTV.';copy.append(small,title,p);frame.append(box,copy);banner.insertAdjacentElement('afterend',frame);}
const root=app.querySelector('.detail-card');if(!root||!root.querySelector('.fztv-slots')||mountedAt===root)return;mountedAt=root;
import('./tournament-registration.js?v=20261108-cup-secure-v1').then(m=>m.mountTournamentRegistration({client:(typeof sb!=='undefined'?sb:window.sb),root})).catch(e=>{mountedAt=null;console.error('Cup registration',e);});
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mount();});}
const app=document.getElementById('app');if(app)new MutationObserver(()=>{mountedAt=null;schedule();}).observe(app,{childList:true,subtree:false});
window.addEventListener('hashchange',()=>{mountedAt=null;schedule();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
})();