/* FragZoneTV: real Player of the Week on homepage with archive navigation. */
(()=>{
'use strict';
if(window.__fztvHomeWeekArchive)return;window.__fztvHomeWeekArchive=true;
const db=()=>typeof sb!=='undefined'?sb:null;
let fetching=false,rendering=false,lastRoot=null,cache=[],index=0,lastLoad=0;
const css=document.createElement('style');
css.textContent='.fzw-current{padding:13px;background:#141e2d;border:1px solid #344a65;border-radius:8px;color:#eef4ff}.fzw-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.fzw-top strong{font-size:11px;letter-spacing:1px;color:#ffbd6e}.fzw-arrows{display:flex;gap:5px}.fzw-arrows button{font-size:14px;color:#fff;background:#24344b;border:1px solid #4b5e78;border-radius:5px;cursor:pointer;padding:2px 9px}.fzw-arrows button:disabled{opacity:.25;cursor:default}.fzw-player{display:flex;align-items:center;gap:9px;margin:9px 0;color:#eaf2ff}.fzw-player img{width:38px;height:38px;object-fit:cover;border-radius:7px}.fzw-player b{font-size:13px}.fzw-player small{display:block;color:#9caec8;font-size:11px;margin-top:4px}.fzw-current .fzw-period{font-size:11px;color:#f4b878}.fzw-current .fzw-number{font-size:11px;color:#b1c7e4;border-top:1px solid #ffffff25;padding-top:8px;margin-top:8px}.fzw-current a{text-decoration:none;color:#f4f6ff}.fzw-empty{color:#a5b9d3;font-size:12px;padding:12px}';
document.head.append(css);
function fmt(d){return new Date(d+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'});}
function period(start){const e=new Date(start+'T12:00:00Z');e.setUTCDate(e.getUTCDate()+6);return fmt(start)+' – '+fmt(e.toISOString().slice(0,10));}
async function getData(){
 const c=db();if(!c)return;
 if(cache.length&&Date.now()-lastLoad<15000)return;
 if(fetching)return;fetching=true;
 try{
  const [r,p,s,t]=await Promise.all([
   c.from('fztv_player_week_awards').select('week_start,player_slug').order('week_start',{ascending:false}),
   c.from('fztv_roster_players').select('player_slug,nickname,photo_url,team_name'),
   c.from('fztv_player_match_stats').select('player_slug,kills,deaths,assists'),
   c.from('fztv_team_players').select('id,nickname,photo_url,fztv_teams(name)')
  ]);
  if(r.error)throw r.error;
  const profile=new Map();
  for(const row of p.data||[])profile.set(row.player_slug.toLowerCase(),{name:row.nickname,photo:row.photo_url,team:row.team_name});
  for(const row of t.data||[])profile.set('team_'+row.id.replace(/-/g,''),{name:row.nickname,photo:row.photo_url,team:row.fztv_teams?.name});
  const stats=new Map();
  for(const row of s.data||[]){
   const totals=stats.get(row.player_slug)||{k:0,d:0,a:0};
   totals.k+=Number(row.kills)||0;totals.d+=Number(row.deaths)||0;totals.a+=Number(row.assists)||0;stats.set(row.player_slug,totals);
  }
  cache=(r.data||[]).map(w=>({...w,player:profile.get(w.player_slug)||{name:w.player_slug,photo:null,team:''},stats:stats.get(w.player_slug)}));
  lastLoad=Date.now();index=Math.min(index,Math.max(cache.length-1,0));
 }catch(err){console.warn('FZTV weekly home:',err)}finally{fetching=false;}
}
function make(tag,text){const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;}
function draw(container){
 container.replaceChildren();const w=cache[index];
 if(!w){container.append(make('div','Игрок недели пока не назначен'));return;}
 const head=make('div');head.className='fzw-top';head.append(make('strong','ИГРОК НЕДЕЛИ'));
 const buttons=make('div');buttons.className='fzw-arrows';
 const old=make('button','‹');old.type='button';old.title='Предыдущая неделя';old.disabled=index===cache.length-1;
 const next=make('button','›');next.type='button';next.title='Следующая неделя';next.disabled=index===0;
 function shift(delta,e){e.preventDefault();e.stopPropagation();index+=delta;draw(container);}
 old.addEventListener('click',e=>shift(1,e));next.addEventListener('click',e=>shift(-1,e));buttons.append(old,next);head.append(buttons);container.append(head);
 container.append(Object.assign(make('div',period(w.week_start)),{className:'fzw-period'}));
 const name=make('div');name.className='fzw-player';
 if(w.player.photo){const img=make('img');img.src=w.player.photo;img.alt='';name.append(img);}
 const info=make('div'),link=make('a',w.player.name);link.href='#/player/'+encodeURIComponent(w.player_slug);
 link.onclick=e=>e.stopPropagation();info.append(link);
 info.append(make('small',w.player.team||'Игрок недели'));name.append(info);container.append(name);
 if(w.stats)container.append(Object.assign(make('div','K/D: '+(w.stats.k/Math.max(w.stats.d,1)).toFixed(2)+' · '+w.stats.k+'/'+w.stats.d+'/'+w.stats.a),{className:'fzw-number'}));
}
async function mount(){
 const root=document.querySelector('#app');if(!root||!db())return;
 const route=location.hash.split('/')[1];if(route&&route!=='home')return;
 const heading=[...root.querySelectorAll('h2,h3')].find(x=>x.textContent.includes('ИГРОКИ МЕСЯЦА И НЕДЕЛИ'));
 if(!heading)return;
 const panel=heading.closest('.panel');if(!panel)return;
 let widget=panel.querySelector('.fzw-current');
 if(!widget){
  widget=make('div');widget.className='fzw-current';
  const boxes=[...panel.querySelectorAll('div')].filter(x=>x.textContent.includes('ИГРОК НЕДЕЛИ')&&x.textContent.includes('Пока не выбран'));
  const candidate=boxes.reverse().find(x=>x.querySelector('b')?.textContent==='Пока не выбран');
  if(candidate&&candidate!==panel){candidate.replaceWith(widget);}
  else panel.append(widget);
 }
 await getData();
 if(!widget.isConnected)return;
 draw(widget);
}
let waiting=false;
function schedule(){if(waiting)return;waiting=true;setTimeout(()=>{waiting=false;mount().catch(console.error);},75);}
const root=document.querySelector('#app');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:false});
window.addEventListener('hashchange',schedule);
window.addEventListener('focus',()=>{lastLoad=0;schedule();});
schedule();
})();