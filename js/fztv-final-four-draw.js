/* FZTV CUP #1 Final Four draw: public bracket and admin redraw. */
(()=>{
'use strict';
if(window.__fzFinalFourDraw)return;
window.__fzFinalFourDraw=true;
const CUP='be494a78-0d63-4ebd-8d29-f7ea9cb48a1b';
const $=(s,r=document)=>r.querySelector(s);
const make=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const client=()=>typeof sb!=='undefined'?sb:null;
const route=()=>location.hash.split('/')[1];
const id=()=>decodeURIComponent(location.hash.split('/')[2]||'');
const style=make('style');
style.textContent='.fz4-board{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,85px);align-items:center;margin:18px 0}.fz4-round{display:grid;gap:23px;min-width:0}.fz4-round h3{text-align:center;color:#9cb1d1;margin:0 0 5px}.fz4-match{background:#111a2b;border:1px solid #3b5070;border-radius:9px;overflow:hidden}.fz4-match small{display:block;color:#aebfd7;background:#1d2c43;padding:8px 12px}.fz4-team{display:flex;align-items:center;gap:11px;padding:10px 13px;min-height:60px;border-top:1px solid #30445e}.fz4-team img{width:39px;height:39px;object-fit:contain;border-radius:5px}.fz4-team b{overflow-wrap:anywhere;font-size:14px}.fz4-icon{width:39px;text-align:center;font-size:23px;color:#8fa8c7}.fz4-admin{background:#18283e;padding:17px;margin:15px 0;border:1px solid #4a688b;border-radius:10px}.fz4-admin h3{margin:0 0 12px}.fz4-admin button{padding:11px 15px;border:0;border-radius:7px;background:#e73d58;color:#fff;font-weight:800;cursor:pointer}.fz4-admin button:disabled{opacity:.5;cursor:wait}.fz4-note{color:#b5c9e4;font-size:12px;margin:9px 0}.fz4-live-cup{margin:22px 0;padding:20px;background:#132035;border:1px solid #405779;border-radius:12px}.fz4-live-cup h2{font-size:20px;margin:0 0 14px;color:#ecf3ff}.fzse-final-four-rounds{display:none!important}@media(max-width:650px){.fz4-board{grid-template-columns:1fr;gap:23px}}';
document.head.append(style);
const signature=a=>!Array.isArray(a)||a.length!==4?'':[a.slice(0,2).sort().join(':'),a.slice(2,4).sort().join(':')].sort().join('|');
function shuffle(ids,old){
 let next=ids.slice();
 for(let attempt=0;attempt<24;attempt++){
  next=ids.slice();
  for(let i=3;i>0;i--){const n=new Uint32Array(1);crypto.getRandomValues(n);const j=n[0]%(i+1);[next[i],next[j]]=[next[j],next[i]];}
  if(signature(next)!==signature(old))return next;
 }
 next=ids.slice();[next[1],next[2]]=[next[2],next[1]];
 if(signature(next)===signature(old))[next[1],next[3]]=[next[3],next[1]];
 return next;
}
function match(title,ids,byId){
 const card=make('div','fz4-match');
 card.append(make('small','',title));
 for(const key of ids){
  const t=byId.get(key),row=make('div','fz4-team');
  if(t?.logo_url){const img=make('img');img.src=t.logo_url;img.alt='';row.append(img);}
  else row.append(make('span','fz4-icon','◇'));
  row.append(make('b','',t?.name||key));
  card.append(row);
 }
 return card;
}
function display(root,ids,teams){
 if(!root.isConnected)return;
 if(!Array.isArray(ids)||ids.length!==4||new Set(ids).size!==4){root.replaceChildren(make('p','fz4-note','Жеребьёвка ещё не запущена. Пары появятся здесь после запуска администратором.'));return;}
 const byId=new Map((teams||[]).map(t=>[t.id,t]));
 const board=make('div','fz4-board'),semis=make('div','fz4-round'),final=make('div','fz4-round');
 semis.append(make('h3','','ПОЛУФИНАЛ'),match('Полуфинал №1',ids.slice(0,2),byId),match('Полуфинал №2',ids.slice(2,4),byId));
 final.append(make('h3','','ФИНАЛ'),match('Финал',['TBD','TBD'],new Map()));
 board.append(semis,final);root.replaceChildren(board);
}
async function refresh(root){
 const c=client();if(!c||!root.isConnected)return;
 const r=await c.from('tournaments').select('stage_config').eq('id',CUP).single();
 if(r.error)throw r.error;
 const ids=r.data.stage_config?.bracket?.team_ids;
 let teams=[];
 if(Array.isArray(ids)&&ids.length===4){
  const q=await c.from('fztv_teams').select('id,name,logo_url').in('id',ids);
  if(q.error)throw q.error;
  teams=q.data||[];
 }
 display(root,ids,teams);
}
function mountPublic(){
 const r=route(),slug=id();
 const isLegacy=r==='tournament'&&slug.trim().toLowerCase()==='fztv cup #1';
 const isSeason=r==='season-tournament'&&slug===CUP;
 if(!isLegacy&&!isSeason)return;
 // The live navigation uses #/tournament/FZTV%20CUP%20%231/<date>, not season-tournament.
 const parent=isLegacy?$('#app .detail-card'):$('#app .fzse-final-four');
 if(!parent||$('#fz4-root',parent))return;
 const section=isLegacy?make('section','fz4-live-cup'):parent;
 if(isLegacy){
  section.append(make('h2','','FZTV CUP #1 · СЕТКА FINAL FOUR'));
  const slots=$('.fztv-slots',parent);
  const info=slots?.closest('.fztv-tournament-registration')||null;
  // Insert after the participant slots, preserving trophy and registration.
  if(slots)slots.insertAdjacentElement('afterend',section);
  else parent.append(section);
 }
 const root=make('div');root.id='fz4-root';section.append(root);
 refresh(root).catch(e=>{if(root.isConnected)root.textContent='Ошибка сетки: '+e.message;});
}
function mountHome(){
 const hash=location.hash||'#/home';
 if(!['#/home','#/home/','#/'].includes(hash))return;
 const panel=$('#fztv-final-four-home');if(!panel)return;
 if($('#fz4-home',panel))return;
 panel.replaceChildren();
 const heading=make('div','fztv-move-heading');
 heading.append(make('h3','','FZTV CUP #1 · СЕТКА FINAL FOUR'));
 const link=make('a','','Открыть турнир');link.href='#/tournament/'+encodeURIComponent('FZTV CUP #1')+'/13-16.11.2026';link.style.cssText='color:#c2d8f6;margin-left:auto';
 heading.append(link);
 const root=make('div');root.id='fz4-home';
 panel.append(heading,root);
 refresh(root).catch(e=>{if(root.isConnected)root.textContent='Ошибка сетки: '+e.message;});
}

function mountAdmin(){
 if(route()!=='admin')return;
 // Attach to the real sidebar-based FZTV ADMIN -> Турниры tab,
 // not an old form that is moved or recreated by the admin shell.
 const bucket=$('#app .fzac-section[data-fzac-section="tournaments"]');
 if(!bucket||$('#fz4-admin',bucket))return;
 const panel=make('section','fz4-admin');panel.id='fz4-admin';
 const heading=make('h3','','FZTV CUP #1 · FINAL FOUR');
 const button=make('button','','ЗАПУСТИТЬ СЕТКУ ТУРНИРА');button.type='button';
 const msg=make('p','fz4-note','4 участника. Нажми для случайного распределения по двум полуфиналам. Повторная жеребьёвка без ограничений.');
 const preview=make('div');
 panel.append(heading,button,msg,preview);
 // Place it immediately below the existing tournament selector whenever present.
 const selector=$('.fzse-admin-select',bucket);
 if(selector)selector.insertAdjacentElement('afterend',panel);else bucket.prepend(panel);
 refresh(preview).then(()=>{
  if($('.fz4-board',preview))button.textContent='ПЕРЕМЕШАТЬ ПАРЫ ЗАНОВО';
 }).catch(e=>{msg.textContent='Не удалось загрузить сетку: '+e.message;});
 button.addEventListener('click',async()=>{
  button.disabled=true;msg.textContent='Проверяем четыре команды и сохраняем жеребьёвку…';
  try{
   const c=client();
   if(!c)throw Error('Подключение к базе данных не готово');
   const apps=await c.from('fztv_tournament_applications').select('team_id').eq('tournament_id',CUP).eq('status','approved');
   if(apps.error)throw apps.error;
   const ids=[...new Set((apps.data||[]).map(t=>t.team_id))];
   if(ids.length!==4)throw Error('Нужно ровно четыре одобренные команды, сейчас: '+ids.length);
   const found=await c.from('tournaments').select('stage_config,format').eq('id',CUP).single();
   if(found.error)throw found.error;
   if(found.data.format!=='final_four')throw Error('Неверный формат турнира — ожидался Final Four');
   const next=shuffle(ids,found.data.stage_config?.bracket?.team_ids);
   const config={...(found.data.stage_config||{}),type:'single_elimination',format:'Final Four',team_count:4,rounds:[{name:'Полуфиналы',matches:2},{name:'Финал',matches:1}],bracket:{team_ids:next,drawn_at:new Date().toISOString()}};
   const saved=await c.from('tournaments').update({stage_config:config,status:'in_progress'}).eq('id',CUP).select('id,stage_config').single();
   if(saved.error)throw saved.error;
   if(!saved.data?.stage_config?.bracket?.team_ids)throw Error('Сетка не сохранилась');
   const teams=await c.from('fztv_teams').select('id,name,logo_url').in('id',next);
   if(teams.error)throw teams.error;
   display(preview,next,teams.data||[]);
   button.textContent='ПЕРЕМЕШАТЬ ПАРЫ ЗАНОВО';
   msg.textContent='Сетка сохранена и опубликована. Можно проводить жеребьёвку повторно.';
   window.dispatchEvent(new Event('fz-final-four-updated'));
  }catch(e){msg.textContent='Ошибка: '+e.message;}
  finally{button.disabled=false;}
 });
}

let scheduled=false;
function schedule(){
 if(scheduled)return;scheduled=true;
 setTimeout(()=>{scheduled=false;mountHome();mountPublic();mountAdmin();},80);
}
const app=$('#app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
document.addEventListener('change',event=>{if(event.target?.matches?.('.fzse-admin-select'))schedule();});
window.addEventListener('fz-final-four-updated',()=>{
 const home=$('#fz4-home');if(home)refresh(home).catch(console.error);
 const detail=$('#fz4-root');if(detail)refresh(detail).catch(console.error);
});
window.addEventListener('hashchange',schedule);schedule();
})();
