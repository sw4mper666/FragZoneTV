/* FZTV Player of the Week / unified player trophy display */
(()=>{
'use strict';
if(window.__fztvPlayerWeek)return;window.__fztvPlayerWeek=true;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const db=()=>typeof sb!=='undefined'?sb:null;
const weekMonday=()=>{const d=new Date(Date.now()+10800000);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);};
const st=el('style');
st.textContent='.fzpw-admin{padding:18px;margin:16px 0;border:1px solid #425a79;background:#142137;border-radius:10px}.fzpw-admin h2{margin:0 0 12px}.fzpw-form{display:flex;flex-wrap:wrap;align-items:end;gap:12px}.fzpw-form label{display:grid;gap:6px;color:#b6cde8;font-size:13px}.fzpw-form input,.fzpw-form select{background:#101c2b;color:white;border:1px solid #526985;border-radius:8px;padding:10px;min-width:190px}.fzpw-form button{border:0;border-radius:8px;background:#e03350;color:#fff;font-weight:800;padding:11px 18px;cursor:pointer}.fzpw-form button:disabled{opacity:.5}.fzpw-status{color:#c0cde0;font-size:13px}.fzpw-grid{display:flex;gap:12px;flex-wrap:wrap;margin:15px 0}.fzpw-award{display:flex;align-items:center;gap:12px;background:linear-gradient(120deg,#271b19,#151e30);border:1px solid #d66e2c;border-radius:10px;padding:12px}.fzpw-award img{width:74px;height:112px;object-fit:contain}.fzpw-award b{display:block;color:#f8faff}.fzpw-award small{color:#ffbd79}.fzpw-old-medal{border-color:#607a9f}@media(max-width:650px){.fzpw-form{display:grid}.fzpw-form input,.fzpw-form select{width:100%}}';
st.textContent+='.fzpw-achievements{margin-top:18px}.fzpw-achievements h4{margin:0 0 10px;color:#f4f8ff}.fzpw-badges{display:flex;flex-wrap:wrap;gap:8px}.fzpw-badge{padding:8px 12px;border-radius:8px;background:#1b304c;border:1px solid #47648b;color:#dceaff;font-size:12px;font-weight:700}';document.head.append(st);
const legacy=['sw4mper','loytaber','skrizzi','fladar','bosskpec'];
async function players(client){
 const [a,b]=await Promise.all([client.from('fztv_roster_players').select('player_slug,nickname,team_name').order('nickname'),client.from('fztv_team_players').select('id,nickname,fztv_teams(name)').order('nickname')]);
 if(a.error)throw a.error;if(b.error)throw b.error;
 const map=new Map();
 legacy.forEach(slug=>map.set(slug,{slug,name:slug,team:'Team Woods'}));
 (a.data||[]).forEach(p=>map.set(p.player_slug.toLowerCase(),{slug:p.player_slug.toLowerCase(),name:p.nickname,team:p.team_name||'Свободный агент'}));
 (b.data||[]).forEach(p=>{const slug='team_'+p.id.replace(/-/g,'');map.set(slug,{slug,name:p.nickname,team:p.fztv_teams?.name||'Команда'});});
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
}
async function admin(root,client){
 if(root.querySelector('#fzpw-admin'))return;
 const panel=el('section');panel.id='fzpw-admin';panel.className='fzpw-admin';
 panel.append(el('h2','Назначить игрока недели'));
 const form=el('form');form.className='fzpw-form';
 const wl=el('label','Неделя (понедельник)'),week=el('input');week.type='date';week.value=weekMonday();week.required=true;wl.append(week);
 const pl=el('label','Игрок'),select=el('select');select.required=true;pl.append(select);
 const btn=el('button','Сохранить игрока недели');btn.type='submit';
 form.append(wl,pl,btn);panel.append(form);
 const status=el('p','Победитель назначается вручную. Один игрок на неделю.');status.className='fzpw-status';status.setAttribute('role','status');panel.append(status);root.prepend(panel);
 let list=[];
 try{list=await players(client);for(const p of list){const option=el('option',p.name+' · '+p.team);option.value=p.slug;select.append(option);}}catch(err){status.textContent='Ошибка игроков: '+err.message;}
 async function fetchWinner(){const {data,error}=await client.from('fztv_player_week_awards').select('player_slug').eq('week_start',week.value).maybeSingle();if(error){status.textContent=error.message;return;}if(data){select.value=data.player_slug;status.textContent='Текущий победитель: '+(list.find(p=>p.slug===data.player_slug)?.name||data.player_slug);}else status.textContent='Победитель на эту неделю пока не назначен.';}
 week.addEventListener('change',fetchWinner);await fetchWinner();
 form.addEventListener('submit',async e=>{
  e.preventDefault();btn.disabled=true;
  try{
   if(new Date(week.value+'T12:00:00Z').getUTCDay()!==1)throw Error('Выбери понедельник');
   if(!list.some(p=>p.slug===select.value))throw Error('Выбери игрока');
   const {data,error:authErr}=await client.auth.getUser();if(authErr||!data?.user)throw Error('Войди как администратор');
   const {error}=await client.from('fztv_player_week_awards').upsert({week_start:week.value,player_slug:select.value,awarded_by:data.user.id,updated_at:new Date().toISOString()},{onConflict:'week_start'});
   if(error)throw error;
   status.textContent='Награда выдана и сохранена.';
  }catch(err){status.textContent='Ошибка: '+err.message;}finally{btn.disabled=false;}
 });
}
const awardImage='./assets/trophies/fztv-player-of-week.svg?v=20261108-user-trophy';
async function profile(root,client,slug){
 const box=root.querySelector('.fztv-trophies')||[...root.querySelectorAll('h2,h3,h4')].find(e=>e.textContent.trim()==='Трофеи')?.parentElement;
 if(!box||box.dataset.fzpwRendered==='1')return;box.dataset.fzpwRendered='1';
 const keys=[slug];
 if(/^team_[0-9a-f]{32}$/.test(slug)){const x=slug.slice(5);keys.push('team:'+x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20));}
 const [a,b,stats]=await Promise.all([client.from('fztv_player_trophies').select('medal_type,tournament_name').in('player_slug',keys).order('created_at',{ascending:false}),client.from('fztv_player_week_awards').select('week_start').in('player_slug',keys).order('week_start',{ascending:false}),client.from('fztv_player_match_stats').select('kills,won').in('player_slug',keys)]);
 if(!box.isConnected)return;
 const old=box.querySelector('.fzpw-grid');if(old)old.remove();
 const grid=el('div');grid.className='fzpw-grid';let count=0;
 for(const w of b.data||[]){
  const item=el('div');item.className='fzpw-award';const img=el('img');img.src=awardImage;img.alt='Кубок игрока недели';const label=el('div');label.append(el('b','Игрок недели'),el('small',new Date(w.week_start+'T12:00:00Z').toLocaleDateString('ru-RU',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'})));item.append(img,label);grid.append(item);count++;
 }
 // Show older MVP / EVP awards even if stored under the legacy team:<uuid> key.
 if(!box.querySelector('.fztv-old-trophy-list')){
  for(const t of a.data||[]){const item=el('div');item.className='fzpw-award fzpw-old-medal';item.append(el('b',t.medal_type+' — '+t.tournament_name));grid.append(item);count++;}
 }
 if(count){box.querySelector('p')?.remove();box.append(grid);}
 else if(!box.querySelector('p'))box.append(el('p','Трофеев пока нет'));
 const rows=stats.data||[];
 if(rows.length){
   let section=box.querySelector('.fzpw-achievements');
   if(!section){section=el('section');section.className='fzpw-achievements';box.append(section);}
   section.replaceChildren();
   section.append(el('h4','Достижения'));
   const gridBadges=el('div');gridBadges.className='fzpw-badges';
   const badges=['Первый матч'];
   if(rows.some(x=>x.won===true))badges.push('Первая победа');
   const kills=rows.reduce((sum,x)=>sum+(Number(x.kills)||0),0);
   if(kills>=50)badges.push('50 убийств');
   for(const badge of badges){const item=el('span',badge);item.className='fzpw-badge';gridBadges.append(item);}
   section.append(gridBadges);
 }
 if(a.error||b.error||stats.error)console.warn('FZTV trophies:',a.error||b.error||stats.error);
}
let scheduled=false;
async function run(){
 const root=document.querySelector('#app'),client=db();if(!root||!client)return;
 const route=location.hash.split('/')[1];
 if(route==='admin'){if(typeof isAdmin==='function'&&isAdmin())await admin(root,client);}
 else if(route==='player'&&location.hash.split('/')[3]!=='stats')await profile(root,client,decodeURIComponent(location.hash.split('/')[2]||'').toLowerCase());
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;run().catch(console.error);},90);}
const app=document.querySelector('#app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
window.addEventListener('hashchange',schedule);schedule();
})();