/* FragZoneTV community enhancements — independent integration, 2026-11-07.
   Existing match feed / contracts / transfers are reused; no fake statistics. */
(() => {
'use strict';
if(window.__fztvCommunityEnhancementsV1)return;
window.__fztvCommunityEnhancementsV1=true;
const $=(sel,root=document)=>root.querySelector(sel);
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const safe=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=()=>((location.hash||'#/home').replace(/^#\/?/,'').split('/')[0]||'home');
const norm=s=>String(s||'').trim().toLocaleLowerCase('ru');
const format=d=>d?new Date(d).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
const parseScore=value=>{const m=String(value||'').match(/(\d+)\s*[:–-]\s*(\d+)/);return m?[Number(m[1]),Number(m[2])]:null;};
const client=typeof sb!=='undefined'?sb:null;
if(!client){console.warn('FZTV extensions: Supabase client not yet present');return;}
let matches=[],transfers=[],approved=[],roster=[],players=[],tournaments=[],contracts=[];
let loadedAt=0,loading=null,running=false,queued=false;
const css=el('style');css.id='fztv-community-enhancements-css';
css.textContent=`
.fzex-action{background:#172338;border:1px solid #38506e;border-radius:8px;color:#dce6f6;padding:8px 12px;cursor:pointer;font-weight:800}
.fzex-action:hover{border-color:#e0445e;color:white}
.fzex-top-actions{display:flex;gap:9px;align-items:center;margin-left:auto}
.fzex-bell{position:relative}
.fzex-unread{position:absolute;right:-5px;top:-6px;background:#ea3750;color:white;border-radius:20px;padding:1px 5px;font-size:9px}
.fzex-popup{position:fixed;top:72px;right:4%;z-index:1600;background:#0f1928;border:1px solid #3a4e68;border-radius:13px;box-shadow:0 15px 45px #000a;color:#e8eef9;width:min(430px,92vw);max-height:72vh;overflow:auto;padding:17px}
.fzex-popup-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.fzex-alert{display:block;padding:12px 6px;border-top:1px solid #2b3b53;font-size:12px;line-height:1.6;color:#d5e4f5;text-decoration:none}
.fzex-alert small{display:block;color:#90a7c7}
.fzex-search-shade{position:fixed;inset:0;background:#02060bdc;z-index:2000;display:grid;place-items:start center;padding:8vh 12px}
.fzex-search-modal{width:min(760px,96vw);max-height:85vh;overflow:auto;background:#111b2a;border:1px solid #40536b;border-radius:14px;padding:22px;box-shadow:0 25px 70px #000b}
.fzex-search-header{display:flex;justify-content:space-between;align-items:center;gap:12px}
.fzex-search-field{width:100%;padding:15px;margin:13px 0;background:#080e19;color:white;border:1px solid #51607a;border-radius:9px;outline-offset:3px;font:inherit}
.fzex-search-result{display:block;padding:13px 11px;border-bottom:1px solid #2c3a4f;color:#eff4fb;text-decoration:none}
.fzex-search-result:hover{background:#1e2b42}
.fzex-search-result small{color:#93aacb;margin-left:8px}
.fzex-empty{padding:15px;color:#9eb2ca}
.fzex-team-form{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:9px 0 5px}
.fzex-team-form span{font-weight:900;border-radius:5px;padding:4px 8px;background:#233249;color:#bdd0e9;font-size:11px}
.fzex-team-form span.win{background:#14543f;color:#7bf0b8}
.fzex-team-form span.loss{background:#5b2532;color:#ffa7b5}
.fzex-streak{color:#ffbd72!important;border:1px solid #a46a32!important;background:#432922!important}
.fzex-match-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:15px 0}
.fzex-box{background:#111b2a;border:1px solid #344962;padding:18px;border-radius:11px;color:#d8e6fa}
.fzex-box h3{font-size:16px;margin:0 0 13px;color:#f3f7fe}
.fzex-box p{font-size:12px;color:#afc0da;line-height:1.6}
.fzex-vote-row{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}
.fzex-vote-row button{flex:1;min-width:90px;background:#253a56;color:white;border:1px solid #526987;padding:11px;border-radius:8px;cursor:pointer}
.fzex-vote-row button:disabled{opacity:.55;cursor:default}
.fzex-percent-track{height:8px;border-radius:8px;background:#37455b;overflow:hidden;margin-top:8px}
.fzex-percent-fill{height:100%;background:#df4962}
.fzex-news{margin:18px 0;padding:18px;background:#101a28;border:1px solid #344762;border-radius:12px;color:#eaf1fc}
.fzex-news h2{font-size:17px;margin:0 0 9px}
.fzex-news-item{padding:11px 0;border-top:1px solid #2d4058;display:flex;flex-direction:column;gap:4px;font-size:13px}
.fzex-news-item small{color:#a6b9d3}
@media(max-width:680px){.fzex-top-actions{gap:4px}.fzex-top-actions .fzex-action{padding:8px}.fzex-match-panels{grid-template-columns:1fr}.fzex-popup{right:2%;top:70px}}
`;
document.head.append(css);

async function refresh(force=false){
 if(loading)return loading;
 if(!force&&Date.now()-loadedAt<60000)return;
 loading=(async()=>{
   const results=await Promise.allSettled([
    client.from('fztv_site_matches').select('id,title,team_a,team_b,starts_at,status,result_overall,created_at').order('starts_at',{ascending:false}).limit(300),
    client.from('fztv_transfers').select('id,player_slug,from_team,to_team,occurred_at').order('occurred_at',{ascending:false}).limit(60),
    client.from('fztv_teams').select('id,name,status').eq('status','approved').limit(200),
    client.from('fztv_roster_players').select('player_slug,nickname,team_name').limit(300),
    client.from('fztv_team_players').select('id,nickname,team_id').limit(300),
    client.from('tournaments').select('id,name,status,starts_at,created_at').limit(150)
   ]);
   const values=results.map(r=>r.status==='fulfilled'&&!r.value.error?r.value.data||[]:[]);
   [matches,transfers,approved,roster,players,tournaments]=values;
   loadedAt=Date.now();
 })().finally(()=>{loading=null});
 return loading;
}
function finished(){return matches.filter(m=>m.status==='finished'&&parseScore(m.result_overall)).sort((a,b)=>new Date(b.starts_at)-new Date(a.starts_at));}
function resultsFor(team){
 const key=norm(team);
 return finished().filter(m=>norm(m.team_a)===key||norm(m.team_b)===key).map(m=>{
  const score=parseScore(m.result_overall),isA=norm(m.team_a)===key;
  const own=isA?score[0]:score[1],opp=isA?score[1]:score[0];
  return {match:m,outcome:own>opp?'W':own<opp?'L':'D'};
 });
}
function decorateRanking(){
 if(!['home','ranking'].includes(route()))return;
 document.querySelectorAll('.fztv-unified-rank-list > .fztv-unified-team').forEach(card=>{
  const name=$('.fztv-unified-name strong',card)?.textContent?.trim();
  if(!name)return;
  let anchor=$('.fztv-unified-summary',card);
  if(!anchor)return;
  const history=resultsFor(name).slice(0,5);
  const streak=resultsFor(name).findIndex(m=>m.outcome!=='W');
  const count=streak===-1?resultsFor(name).length:streak;
  let block=$('.fzex-team-form',card);
  if(!block){block=el('div','fzex-team-form');anchor.insertAdjacentElement('afterend',block);}
  const signature=history.map(h=>h.match.id).join('|')+':'+count;
  if(block.dataset.signature===signature)return;
  block.dataset.signature=signature;
  block.replaceChildren(el('small','', 'ФОРМА · '));
  if(!history.length)block.append(el('span','','Матчей пока нет'));
  else history.forEach(item=>{
   const chip=el('span',item.outcome==='W'?'win':item.outcome==='L'?'loss':'',item.outcome);
   chip.title=item.match.team_a+' — '+item.match.team_b+' · '+format(item.match.starts_at);
   block.append(chip);
  });
  if(count>0)block.append(el('span','fzex-streak','🔥 WIN STREAK ×'+count));
 });
}
function headToHead(m){
 const a=norm(m.team_a),b=norm(m.team_b);
 const games=finished().filter(x=>(norm(x.team_a)===a&&norm(x.team_b)===b)||(norm(x.team_a)===b&&norm(x.team_b)===a));
 let wa=0,wb=0;
 games.forEach(x=>{
  const score=parseScore(x.result_overall),win=score[0]>score[1]?norm(x.team_a):score[0]<score[1]?norm(x.team_b):null;
  if(win===a)wa++;if(win===b)wb++;
 });
 return {games:games.length,wa,wb,draws:games.length-wa-wb};
}
async function mountMatch(){
 if(route()!=='match')return;
 const root=$('.fz-new-match')||$('#app');
 if(!root)return;
 const id=decodeURIComponent((location.hash.split('/')[2]||'').split('?')[0]);
 if(!id)return;
 const m=matches.find(x=>x.id===id);
 if(!m)return;
 const existing=$('.fzex-match-panels',root);
 if(existing&&existing.dataset.match===id)return;
 existing?.remove();
 const layout=el('div','fzex-match-panels');layout.dataset.match=id;
 const h2h=el('section','fzex-box');
 h2h.append(el('h3','','⚔️ История личных встреч'));
 const data=headToHead(m);
 h2h.append(el('p','',data.games?m.team_a+' — '+data.wa+' побед · '+m.team_b+' — '+data.wb+' побед'+(data.draws?' · Ничьих: '+data.draws:''):'Команды пока не встречались в опубликованных матчах.'));
 const poll=el('section','fzex-box');poll.append(el('h3','','🗳️ Прогноз на победителя'));
 const upcoming=['upcoming','scheduled'].includes(m.status)&&new Date(m.starts_at).getTime()>Date.now();
 const info=el('p','','Загрузка голосов…');poll.append(info);
 const votes=el('div','fzex-vote-row');poll.append(votes);
 const bar=el('div','fzex-percent-track'),fill=el('div','fzex-percent-fill');bar.append(fill);poll.append(bar);
 const {data:{user}}=await client.auth.getUser();
 let ownChoice=null;
 if(user){
   const mine=await client.from('fztv_match_predictions').select('choice').eq('match_id',id).eq('user_id',user.id).maybeSingle();
   ownChoice=mine.data?.choice||null;
 }
 async function totals(){
   const result=await client.rpc('fztv_prediction_totals',{p_match_id:id});
   if(result.error){info.textContent='Не удалось загрузить результаты голосования.';return;}
   const a=Number((result.data||[]).find(x=>x.choice==='a')?.votes||0),b=Number((result.data||[]).find(x=>x.choice==='b')?.votes||0);
   const all=a+b,pa=all?Math.round(a/all*100):0;
   info.textContent=all?m.team_a+' '+pa+'% · '+m.team_b+' '+(100-pa)+'% · Всего: '+all:'Голосов пока нет. Будь первым!';
   fill.style.width=pa+'%';fill.title=m.team_a+': '+pa+'%';
 }
 if(upcoming&&!ownChoice){
   if(!user)poll.append(el('p','','Чтобы проголосовать, войдите в аккаунт.'));
   else for(const [choice,name] of [['a',m.team_a],['b',m.team_b]]){
     const btn=el('button','',name);votes.append(btn);
     btn.onclick=async()=>{
       votes.querySelectorAll('button').forEach(x=>x.disabled=true);
       const res=await client.from('fztv_match_predictions').insert({match_id:id,user_id:user.id,choice});
       if(res.error){info.textContent='Голос не принят: '+res.error.message;votes.querySelectorAll('button').forEach(x=>x.disabled=false);return;}
       ownChoice=choice;votes.replaceChildren();poll.append(el('p','','✅ Твой голос принят. Изменить его нельзя.'));await totals();
     };
   }
 }else poll.append(el('p','',ownChoice?'✅ Ты уже проголосовал.':'Голосование закрыто или матч уже начался.'));
 await totals();
 layout.append(h2h,poll);
 const anchor=$('.fz-match-hero',root)||$('.fz-faceoff',root);
 if(anchor)anchor.insertAdjacentElement('afterend',layout);else root.append(layout);
}
function makeTransferNews(){
 if(!['home','news'].includes(route()))return;
 const parent=route()==='home'?$('#app'):$('#app');
 if(!parent)return;
 const items=transfers.filter(t=>t.to_team||t.from_team).slice(0,5);
 const old=$('#fzex-transfer-news');
 if(old){if(old.dataset.ids===items.map(x=>x.id).join('|'))return;old.remove();}
 const section=el('section','fzex-news');section.id='fzex-transfer-news';section.dataset.ids=items.map(x=>x.id).join('|');
 section.append(el('h2','','📰 Трансферные новости'));
 if(!items.length)section.append(el('p','fzex-empty','Подтверждённых переходов пока нет.'));
 for(const t of items){
  const item=el('div','fzex-news-item');
  const nick=roster.find(x=>x.player_slug===t.player_slug)?.nickname||t.player_slug||'Игрок';
  item.append(el('strong','',nick+' · '+(t.from_team||'Свободный агент')+' → '+(t.to_team||'Свободный агент')));
  item.append(el('small','',format(t.occurred_at)));
  section.append(item);
 }
 if(route()==='home'){const grid=$('#app .grid');if(grid)grid.insertAdjacentElement('afterend',section);else parent.append(section);}
 else parent.append(section);
}
function attachTopActions(){
 const header=$('.topbar');if(!header||$('#fzex-global-actions'))return;
 const box=el('div','fzex-top-actions');box.id='fzex-global-actions';
 const search=el('button','fzex-action','⌕ Поиск');search.type='button';search.onclick=openSearch;
 const bell=el('button','fzex-action fzex-bell','🔔');bell.type='button';bell.title='Уведомления';bell.onclick=openNotifications;
 box.append(search,bell);header.append(box);
}
function searchRows(){
 const rows=[];
 approved.forEach(t=>rows.push({name:t.name,type:'Команда',href:'#/team-created/'+encodeURIComponent(t.id)}));
 [['Team Woods','#/team/woods'],['Taykans','#/team/taykans']].forEach(([name,href])=>{
  if(!rows.some(r=>norm(r.name)===norm(name)))rows.push({name,type:'Команда',href});
 });
 roster.forEach(p=>rows.push({name:p.nickname||p.player_slug,type:'Игрок',href:'#/player/'+encodeURIComponent(p.player_slug)}));
 players.forEach(p=>rows.push({name:p.nickname,type:'Игрок',href:'#/player/team_'+p.id.replaceAll('-','')}));
 matches.forEach(m=>rows.push({name:m.team_a+' — '+m.team_b,type:'Матч',href:'#/match/'+encodeURIComponent(m.id)}));
 tournaments.forEach(t=>rows.push({name:t.name,type:'Турнир',href:'#/tournament/'+encodeURIComponent(t.name)}));
 return rows;
}
async function openSearch(){
 $('#fzex-search-shade')?.remove();
 const shade=el('div','fzex-search-shade');shade.id='fzex-search-shade';shade.setAttribute('role','presentation');
 const modal=el('div','fzex-search-modal');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Поиск по FragZoneTV');
 const header=el('div','fzex-search-header');header.append(el('h2','','Поиск по FragZoneTV'));
 const close=el('button','fzex-action','✕');close.onclick=()=>shade.remove();header.append(close);
 const input=el('input','fzex-search-field');input.placeholder='Игрок, команда, матч или турнир…';input.setAttribute('aria-label','Поиск');
 const body=el('div');modal.append(header,input,body);shade.append(modal);document.body.append(shade);
 shade.onclick=e=>{if(e.target===shade)shade.remove()};
 const onKey=e=>{if(e.key==='Escape'){shade.remove();document.removeEventListener('keydown',onKey)}};
 document.addEventListener('keydown',onKey);
 const redraw=()=>{
  body.replaceChildren();const q=norm(input.value);
  if(!q){body.append(el('p','fzex-empty','Начни вводить название или ник игрока.'));return;}
  const filtered=searchRows().filter(x=>norm(x.name).includes(q)).slice(0,35);
  if(!filtered.length){body.append(el('p','fzex-empty','Ничего не найдено.'));return;}
  filtered.forEach(x=>{const a=el('a','fzex-search-result',x.name);a.href=x.href;a.append(el('small','',x.type));a.onclick=()=>shade.remove();body.append(a)});
 };
 input.addEventListener('input',redraw);
 input.focus();redraw();await refresh(true);if(shade.isConnected)redraw();
}
async function alertRows(user){
 const rows=[];
 const dates=(m)=>new Date(m.created_at||m.starts_at||0).getTime();
 matches.filter(m=>dates(m)>Date.now()-30*86400000).slice(0,15).forEach(m=>{
   rows.push({id:'match-'+m.id,text:'🎮 Новый матч: '+m.team_a+' — '+m.team_b,ts:dates(m),href:'#/match/'+m.id});
 });
 tournaments.filter(t=>['finished','completed'].includes(t.status)).forEach(t=>rows.push({id:'tournament-'+t.id,text:'🏆 Завершён турнир: '+t.name,ts:dates(t),href:'#/tournaments'}));
 if(user){
   const offers=await client.from('fztv_contract_offers').select('id,player_slug,dynamic_player_id,team_id,status,created_at').order('created_at',{ascending:false}).limit(50);
   if(!offers.error){
    const p=await client.from('profiles').select('login').eq('id',user.id).maybeSingle();
    const nick=norm(p.data?.login);
    const mineSlug=new Set(roster.filter(x=>norm(x.nickname)===nick).map(x=>x.player_slug));
    const myIds=new Set(players.filter(x=>norm(x.nickname)===nick).map(x=>x.id));
    (offers.data||[]).filter(o=>mineSlug.has(o.player_slug)||myIds.has(o.dynamic_player_id)).forEach(o=>{
      const team=approved.find(t=>t.id===o.team_id);
      rows.push({id:'offer-'+o.id+'-'+o.status,text:'✉️ '+(o.status==='pending'?'Приглашение / предложение контракта':o.status==='accepted'?'Контракт одобрен':'Статус контракта: '+o.status)+' · '+(team?.name||'Команда'),ts:dates(o),href:'#/players'});
    });
   }
 }
 return rows.sort((a,b)=>b.ts-a.ts).slice(0,30);
}
async function openNotifications(){
 const old=$('#fzex-notifications');if(old){old.remove();return;}
 const popup=el('section','fzex-popup');popup.id='fzex-notifications';
 const header=el('div','fzex-popup-head');header.append(el('h3','','🔔 Уведомления'));
 const close=el('button','fzex-action','✕');close.onclick=()=>popup.remove();header.append(close);popup.append(header);
 const body=el('div');body.append(el('p','fzex-empty','Загрузка…'));popup.append(body);document.body.append(popup);
 await refresh(true);
 const {data:{user}}=await client.auth.getUser();
 const alerts=await alertRows(user);
 if(!popup.isConnected)return;
 body.replaceChildren();
 if(!alerts.length)body.append(el('p','fzex-empty','Новых событий пока нет.'));
 alerts.forEach(a=>{const link=el('a','fzex-alert',a.text);link.href=a.href;link.append(el('small','',format(a.ts)));link.onclick=()=>popup.remove();body.append(link)});
 try{localStorage.setItem('fztv-events-seen-at',String(Date.now()))}catch(_){}
 $('#fzex-global-actions .fzex-unread')?.remove();
}
function renderUnread(){
 const bell=$('#fzex-global-actions .fzex-bell');if(!bell)return;
 let since=Date.now()-7*86400000;try{since=Number(localStorage.getItem('fztv-events-seen-at')||since)}catch(_){}
 const unseen=matches.filter(m=>new Date(m.created_at).getTime()>since).length;
 let badge=$('.fzex-unread',bell);
 if(unseen>0){if(!badge){badge=el('span','fzex-unread');bell.append(badge)}badge.textContent=String(Math.min(99,unseen));}else badge?.remove();
}
async function run(){
 if(running)return;
 running=true;
 try{
  attachTopActions();
  await refresh();
  decorateRanking();
  if(route()==='match')await mountMatch();
  if(['home','news'].includes(route()))makeTransferNews();
  renderUnread();
 }catch(error){console.warn('FZTV enhancements:',error)}finally{running=false}
}
function schedule(){
 if(queued)return;
 queued=true;
 window.setTimeout(()=>{queued=false;run()},170);
}
const observer=new MutationObserver(schedule);
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>{loadedAt=0;schedule()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){loadedAt=0;schedule()}});
schedule();
})();
