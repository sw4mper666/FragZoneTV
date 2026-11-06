// FragZoneTV match history and team performance — only approved, published match rows.
(()=>{
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');
style.textContent='.fzh-board{margin:18px 0}.fzh-day{color:#90a8c7;font-size:12px;font-weight:800;margin:19px 0 8px;border-bottom:1px solid #30415b;padding:8px}.fzh-row{display:grid;grid-template-columns:160px 1fr 115px;align-items:center;gap:15px;margin:6px 0;padding:14px 16px;background:#152339;border:1px solid #314561;border-radius:7px;color:#f2f6fd;text-decoration:none}.fzh-row:hover{border-color:#e83b54;background:#213048}.fzh-event{color:#9aafce;font-size:12px}.fzh-pair{display:flex;justify-content:space-between;align-items:center;gap:12px;font-weight:850;min-width:0}.fzh-pair span{flex:1;overflow:hidden;text-overflow:ellipsis}.fzh-pair span:last-child{text-align:right}.fzh-score{background:#0b1524;border:1px solid #344761;border-radius:5px;padding:5px 12px;font-size:19px;white-space:nowrap}.fzh-status{text-align:right;color:#23e3ac;font-size:11px;font-weight:900}.fzh-status.scheduled{color:#e9bc57}.fzh-empty{border:1px solid #32455e;border-radius:8px;padding:18px;color:#94a8c6;text-align:center}.fzh-history{background:#121d2d;border:1px solid #334761;border-radius:10px;margin:18px 0;padding:15px}.fzh-history h2{font-size:18px;margin:0 0 12px}.fzh-metrics{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px}.fzh-metrics span{padding:8px 12px;background:#1b2a42;border-radius:7px;color:#c4d5ec}.fzh-metrics b{color:white}.fzh-filter{display:flex;gap:8px;margin:0 0 13px}.fzh-filter input,.fzh-filter select{background:#101a29;border:1px solid #374b64;border-radius:7px;padding:11px;color:white}.fzh-filter input{flex:1;min-width:0}.fzh-home{display:block;color:#c8d9f4;text-decoration:none;padding:8px 4px;border-bottom:1px solid #2c4158;font-size:12px}@media(max-width:700px){.fzh-row{grid-template-columns:1fr;gap:7px}.fzh-status{text-align:left}.fzh-pair{font-size:12px}.fzh-score{font-size:16px}}';
document.head.append(style);
let list=[],lastFetch=0,busy=null;const app=document.getElementById('app'),seen=new WeakSet();
const route=()=>location.hash.split('/')[1]||'home';
async function getMatches(){
 if(Date.now()-lastFetch<6000)return list;
 if(busy)return busy;
 busy=(async()=>{try{const r=await sb.from('fztv_site_matches').select('id,title,team_a,team_b,starts_at,status,result_overall').order('starts_at',{ascending:false}).limit(200);if(r.error)throw r.error;list=r.data||[];lastFetch=Date.now()}catch(e){console.warn('Match history',e)}finally{busy=null}return list})();
 return busy;
}
function score(m){const found=String(m.result_overall||'').match(/(\d+)\s*[:–-]\s*(\d+)/);return found?found[1]+' : '+found[2]:'VS'}
function date(m){return new Date(m.starts_at).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})}
function clock(m){return new Date(m.starts_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
function row(m){const state=m.status==='finished'?'ЗАВЕРШЁН':m.status==='live'?'● LIVE':'ЗАПЛАНИРОВАН';return '<a class="fzh-row" href="#/match/'+encodeURIComponent(m.id)+'"><span class="fzh-event">'+esc(m.title||'Товарищеский матч')+' · '+esc(clock(m))+'</span><span class="fzh-pair"><span>'+esc(m.team_a)+'</span><b class="fzh-score">'+esc(score(m))+'</b><span>'+esc(m.team_b)+'</span></span><span class="fzh-status '+(m.status==='upcoming'?'scheduled':'')+'">'+state+'</span></a>'}
function board(items){if(!items.length)return '<div class="fzh-empty">Опубликованных матчей пока нет</div>';let last='';return items.map(m=>{const d=date(m);let heading=d===last?'':'<div class="fzh-day">'+esc(d)+'</div>';last=d;return heading+row(m)}).join('')}
function performance(name,items){let wins=0,losses=0,streak=0,on=true;const key=name.toLowerCase();for(const m of items){if(m.status!=='finished')continue;const found=String(m.result_overall||'').match(/(\d+)\s*[:–-]\s*(\d+)/);if(!found)continue;const a=Number(found[1]),b=Number(found[2]);if(a===b)continue;const won=m.team_a.toLowerCase()===key?a>b:b>a;if(won){wins++;if(on)streak++}else{losses++;on=false}}return {wins,losses,streak,rate:wins+losses?Math.round(wins/(wins+losses)*100):0}}
async function matchesPage(){
 const title=app.querySelector('.page-title');if(!title||seen.has(title))return;seen.add(title);
 const all=await getMatches();if(!title.isConnected||route()!=='matches')return;
 const section=document.createElement('section');section.className='fzh-board';section.id='fzh-board';
 const filter=document.createElement('div');filter.className='fzh-filter';const input=document.createElement('input');input.placeholder='Поиск команды или турнира…';const select=document.createElement('select');
 select.append(new Option('Все команды',''));const names=[...new Set(all.flatMap(m=>[m.team_a,m.team_b]))].sort();for(const n of names)select.append(new Option(n,n));filter.append(input,select);
 const contents=document.createElement('div');function refresh(){const v=input.value.trim().toLowerCase(),t=select.value;contents.innerHTML=board(all.filter(m=>(!v||[m.title,m.team_a,m.team_b].some(x=>String(x||'').toLowerCase().includes(v)))&&(!t||m.team_a===t||m.team_b===t)))}input.oninput=refresh;select.onchange=refresh;refresh();section.append(filter,contents);
 const anchor=app.querySelector('#fz-upload-match-anchor');(anchor||title).insertAdjacentElement('afterend',section);
 for(const el of app.querySelectorAll('section.panel.detail-empty'))if(el.textContent.includes('Матчи ещё не опубликованы'))el.style.display='none';
}
async function teamPage(){
 const profile=app.querySelector('.tw-profile');if(!profile||seen.has(profile))return;seen.add(profile);
 const all=await getMatches();if(!profile.isConnected||!['team','team-created'].includes(route()))return;
 const name=profile.querySelector('.tw-identity h1')?.textContent?.trim()||profile.querySelector('h1')?.textContent?.trim();if(!name)return;
 const teamMatches=all.filter(m=>m.team_a.toLowerCase()===name.toLowerCase()||m.team_b.toLowerCase()===name.toLowerCase());const p=performance(name,teamMatches);
 for(const metric of profile.querySelectorAll('.tw-metric')){const label=metric.querySelector('small'),value=metric.querySelector('b');if(!label||!value)continue;const k=label.textContent.trim().toUpperCase();if(k==='RP')label.textContent='FZ';if(k==='ВИНРЕЙТ')value.textContent=p.rate+'%';if(k==='W–L'||k==='W-L')value.textContent=p.wins+'–'+p.losses;if(k==='ВИНСТРИК')value.textContent=p.streak}
 for(const fact of profile.querySelectorAll('.tw-fact')){const label=fact.querySelector('span');if(label&&/рейтинг.*rp/i.test(label.textContent))label.textContent='Рейтинг (FZ)'}
 const section=document.createElement('section');section.className='fzh-history';section.innerHTML='<h2>МАТЧИ КОМАНДЫ</h2><div class="fzh-metrics"><span>W/L: <b>'+p.wins+' / '+p.losses+'</b></span><span>Винстрик: <b>'+p.streak+'</b></span><span>Винрейт: <b>'+p.rate+'%</b></span></div>'+board(teamMatches);profile.insertAdjacentElement('afterend',section);
 for(const panel of [...app.querySelectorAll('section.panel')]){const header=panel.querySelector('h2,h3');if(header&&/трансферы/i.test(header.textContent))panel.style.display='none'}
}
async function homePage(){const panel=[...app.querySelectorAll('section.panel')].find(p=>p.querySelector('h2')?.textContent.trim()==='МАТЧИ');if(!panel||seen.has(panel))return;seen.add(panel);const all=await getMatches();if(!panel.isConnected||route()!=='home'||!all.length)return;panel.querySelector('.empty')?.remove();const box=document.createElement('div');box.style.padding='10px';box.innerHTML=all.slice(0,3).map(m=>'<a class="fzh-home" href="#/match/'+encodeURIComponent(m.id)+'">'+esc(m.team_a)+' — '+esc(m.team_b)+' · '+esc(score(m))+'</a>').join('');panel.append(box)}
let scheduled=false;function run(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;const r=route();if(r==='matches')matchesPage();if(r==='team'||r==='team-created')teamPage();if(r==='home')homePage()},160)}
if(app)new MutationObserver(run).observe(app,{childList:true,subtree:false});window.addEventListener('hashchange',run);run();
})();