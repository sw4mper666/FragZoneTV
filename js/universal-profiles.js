// Unified dynamically created player and team profiles.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyFor=id=>'team_'+String(id).replace(/-/g,'');
const tier=r=>r<=10?1:r<=20?2:3;
const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200"><rect width="160" height="200" fill="#233147"/><circle cx="80" cy="62" r="30" fill="#596b84"/><path d="M16 182c0-100 128-100 128 0" fill="#596b84"/></svg>');
function statsHtml(rows,mapRows=[]){
 const sum=k=>rows.reduce((n,r)=>n+Number(r[k]||0),0),matches=rows.length,k=sum('kills'),d=sum('deaths'),a=sum('assists');
 const perMap=mapRows.length>0;
 const mr=(x)=>(Number(x.kills||0)+0.5*Number(x.assists||0))/Math.max(1,Number(x.deaths||0));
 const rating=perMap?mapRows.reduce((total,x)=>total+mr(x),0)/mapRows.length:(matches?(k+0.5*a)/Math.max(1,d):null);
 const kd=matches?(d?Math.round(k/d):k?'∞':'0'):'—';
 const wins=rows.filter(x=>x.won===true).length,winrate=matches?Math.round(wins/matches*100)+'%':'—';
 const divisor=perMap?mapRows.length:matches,avg=v=>divisor?Math.round(v/divisor):'—';
 const kills=perMap?mapRows.reduce((v,x)=>v+Number(x.kills||0),0):k;
 const deaths=perMap?mapRows.reduce((v,x)=>v+Number(x.deaths||0),0):d;
 const assists=perMap?mapRows.reduce((v,x)=>v+Number(x.assists||0),0):a;
 const stats=[
  ['K/D',kd,''],
  ['FZTVR',rating===null?'—':rating.toFixed(2),'fzsv-rating'],
  ['Винрейт',winrate,''],
  [perMap?'Убийств / карту':'Убийств / матч',avg(kills),'fzsv-green'],
  [perMap?'Смертей / карту':'Смертей / матч',avg(deaths),''],
  [perMap?'Ассистов / карту':'Ассистов / матч',avg(assists),'fzsv-green']
 ];
 const cards=stats.map(([label,value,kind],i)=>{
   const center=i===1;
   const upper=center?'<div class="fzsv-gauge" style="--progress:'+Math.min(100,Math.max(0,Number(rating||0)/2*100))+'%"><span>'+esc(value)+'</span></div>':'<strong>'+esc(value)+'</strong>';
   return '<div class="fzsv-metric '+kind+'">'+upper+'<small>'+esc(label)+'</small></div>';
 }).join('');
 return '<div class="fzsv-panel"><div class="fzsv-grid">'+cards+'</div><div class="fzsv-meta">'+matches+' матч(ей)'+(perMap?' · '+mapRows.length+' карт(ы)':'')+'</div></div>';
}

async function playerPage(client,root,key,tab){
 const [p,r]=await Promise.all([
 client.from('fztv_team_players').select('*,fztv_teams(name,status)'),
 client.from('fztv_roster_players').select('*')]);
 if(!location.hash.toLowerCase().startsWith('#/player/'+key))return;
 const item=(p.data||[]).find(x=>keyFor(x.id)===key);
 const free=(r.data||[]).find(x=>x.player_slug===key);
 if(!item&&!free){root.innerHTML='<div class="detail-empty">Игрок не найден. <a href="#/players">Все игроки</a></div>';return;}
 const name=item?.nickname||free.nickname,team=item?.fztv_teams?.name||free?.team_name||'Свободный агент',photo=item?.photo_url||free?.photo_url||(typeof window.fztvWoodsPhoto==='function'?window.fztvWoodsPhoto(item?keyFor(item.id):free.player_slug):null)||fallback,slug=item?keyFor(item.id):free.player_slug;
 const [st, standings,playerMapStats] = await Promise.all([client.from('fztv_player_match_stats').select('*').eq('player_slug',slug),client.from('fztv_roster_players').select('player_slug,rating').order('rating',{ascending:false}),client.from('fztv_player_map_stats').select('map_id,match_id,kills,deaths,assists').eq('player_slug',slug)]);
 const mapRows=playerMapStats.data||[];
 let mapNames=new Map();
 if(tab==='stats'&&mapRows.length){
  const refs=[...new Set(mapRows.map(x=>x.map_id))];
  const names=await client.from('fztv_match_maps').select('id,map_name,map_order,match_id').in('id',refs);
  if(!names.error)mapNames=new Map((names.data||[]).map(x=>[x.id,x]));
 }
 const mapRating=x=>(Number(x.kills||0)+0.5*Number(x.assists||0))/Math.max(1,Number(x.deaths||0));
 const detailedStats=()=>{
  if(!mapRows.length)return '<div class="fzsv-map-list"><h3>Статистика по картам</h3><p>Результаты по картам пока не внесены.</p></div>';
  const list=mapRows.slice().sort((a,b)=>String(a.match_id).localeCompare(String(b.match_id))||((mapNames.get(a.map_id)?.map_order||0)-(mapNames.get(b.map_id)?.map_order||0)));
  const cards=list.map(x=>{
    const name=mapNames.get(x.map_id)?.map_name||'Карта';
    const num=n=>Math.round(Number(n||0));
    return '<div class="fzsv-map-card"><div class="fzsv-map-title"><strong>'+esc(name)+'</strong><span>FZTVR <b>'+mapRating(x).toFixed(2)+'</b></span></div><div class="fzsv-map-numbers"><span>'+num(x.kills)+'<small>K</small></span><span>'+num(x.deaths)+'<small>D</small></span><span>'+num(x.assists)+'<small>A</small></span></div></div>';
  }).join('');
  return '<div class="fzsv-map-list"><h3>Статистика по картам</h3><div class="fzsv-maps">'+cards+'</div></div>';
 };

 const legacyRole=!item?await client.from('fztv_legacy_player_profiles').select('*').eq('player_slug',slug).maybeSingle():null;
 const isCaptain=String(item?.primary_role||legacyRole?.data?.primary_role||'').trim().toUpperCase()==='IGL';
 const registered=item?.created_at||free?.created_at;
 const memberSince=registered?new Date(registered).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}):'—';
 const matchRows=st.data||[],wins=matchRows.filter(x=>x.won===true).length;
 const ranks=(standings.data||[]).filter(x=>x.rating!=null);
 const position=ranks.findIndex(x=>x.player_slug===slug)+1;
 const badges=[matchRows.length>=1?'🎮 Первый матч':null,wins>=10?'🏅 10 побед':null,position>0&&position<=10?'⭐ Топ-10':null].filter(Boolean);
 const achievements='<div class="fztv-mini-achievements"><b>Мини-достижения</b><div>'+(badges.length?badges.map(x=>'<span class="fztv-mini-achievement">'+esc(x)+'</span>').join(''):'<small>Первые достижения появятся после матчей и попадания в рейтинг.</small>')+'</div></div>';
 if(location.hash.toLowerCase()!=='#/player/'+key+(tab==='stats'?'/stats':''))return;
 const birth=item?.birth_date||legacyRole?.data?.birth_date,age=free?.age??(birth?Math.max(0,new Date().getFullYear()-Number(birth.slice(0,4))-(new Date().toISOString().slice(5,10)<birth.slice(5,10)?1:0)):'—');
 const details=[['На FragZoneTV с',memberSince],['Возраст',age],['Команда',team],['Роль',item?.primary_role||legacyRole?.data?.primary_role||'—'],['Страна',item?.country||legacyRole?.data?.country||'Россия'],['Рейтинг',free?.rating??'—'],['Призовые','$'+Number(item?.prize_usd??legacyRole?.data?.prize_usd??0)]];
 const tabs='<div class="fztv-player-tabs"><a class="'+(tab==='main'?'active':'')+'" href="#/player/'+encodeURIComponent(key)+'">Основной</a><a class="'+(tab==='stats'?'active':'')+'" href="#/player/'+encodeURIComponent(key)+'/stats">Статистика</a></div>';
 const factHtml='<div class="fztv-player-facts">'+details.map(([a,b])=>'<div class="fztv-player-fact"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join('')+'</div>';
 root.innerHTML='<div class="crumb"><a href="#/players">Игроки</a> / '+esc(name)+'</div>'+tabs+'<section class="fztv-player-card"><div class="fztv-player-hero"><div class="fztv-player-photo"><img src="'+esc(photo)+'" alt="'+esc(name)+'"></div><div class="fztv-player-main"><h1>'+esc(name)+(isCaptain?' <span title="Капитан команды">👑</span>':'')+'</h1><p class="fztv-player-sub">'+esc(team)+' · CS2</p>'+(tab==='stats'?statsHtml(st.data||[],mapRows):factHtml+achievements)+'</div></div>'+(tab==='stats'?detailedStats():'<div class="fztv-trophies"><h3>Трофеи</h3><p>Трофеев пока нет</p></div>')+'</section>';
}
async function teamPage(client,root,id){
 const [teams,players,rpRows]=await Promise.all([
 client.from('fztv_teams').select('*').eq('status','approved').order('created_at',{ascending:true}),
 client.from('fztv_team_players').select('*').eq('team_id',id).order('created_at',{ascending:true}),
 client.from('fztv_team_rp').select('name,rp')]);
 if(location.hash.split('/')[2]!==id)return;
 const team=(teams.data||[]).find(t=>t.id===id);
 if(!team){root.innerHTML='<div class="detail-empty">Команда не найдена или не одобрена.</div>';return;}
 const listed=(teams.data||[]).filter(t=>!['team woods','taykans'].includes(t.name.toLowerCase()));
 const rp=Object.fromEntries((rpRows.data||[]).map(x=>[x.name.toLowerCase(),Number(x.rp)||0]));
 const ordered=['Team Woods','Taykans',...listed.map(x=>x.name)].sort((a,b)=>(rp[b.toLowerCase()]||0)-(rp[a.toLowerCase()]||0));
 const rank=Math.max(1,ordered.findIndex(n=>n.toLowerCase()===team.name.toLowerCase())+1),level=tier(rank),roster=(players.data||[]).sort((a,b)=>(a.lineup_position||99)-(b.lineup_position||99));
 const starters=roster.filter(p=>Number(p.lineup_position)<=5).slice(0,5),bench=roster.filter(p=>!starters.includes(p)).slice(0,5);
 const currentRp=rp[team.name.toLowerCase()]||0;
 const captainLogin='';
 const ages=roster.filter(p=>p.birth_date).map(p=>Math.floor((Date.now()-new Date(p.birth_date).getTime())/31557600000));
 const avg=ages.length?Math.round(ages.reduce((a,b)=>a+b,0)/ages.length):'—';
 const metrics=[['МИРОВОЙ РАНГ','#'+rank],['FZ',String(currentRp)],['ВИНРЕЙТ','0%'],['W–L','0–0'],['ВИНСТРИК','0'],['ПРИЗОВЫЕ','$0'],['ТИТУЛЫ','0'],['ЛУЧШАЯ ПОЗИЦИЯ','#'+rank],['СР. ВОЗРАСТ',avg]];
 const cards=starters.map(p=>'<a class="tw-player" href="#/player/'+keyFor(p.id)+'" style="color:inherit;text-decoration:none"><img src="'+esc(p.photo_url||fallback)+'" alt="'+esc(p.nickname)+'"><b>'+esc(p.nickname)+(String(p.primary_role||'').trim().toUpperCase()==='IGL'?' 👑':'')+'</b><small class="tw-role">'+esc(p.primary_role||'Игрок')+'</small></a>').join('');
 const facts=[['Рейтинг (FZ)',String(currentRp)],['Позиция','#'+rank],['Тир','TIER '+level],['Лучшая позиция','#'+rank],['Игроков в составе',roster.length],['Средний возраст',avg],['Тренер',team.coach||'—']];
 const logo=team.logo_url?'<img src="'+esc(team.logo_url)+'" alt="'+esc(team.name)+'">':'★';
 root.innerHTML='<div class="crumb"><a href="#/ranking">Рейтинг</a> / '+esc(team.name)+'</div><section class="tw-profile fztv-universal-team"><div class="tw-top"><div class="tw-logo">'+logo+'</div><div class="tw-identity"><div class="tw-meta"><span>'+esc(team.country||'🌐 Международная')+'</span><span class="tw-tier">TIER '+level+'</span></div><h1>'+esc(team.name)+'</h1><span class="tw-tag">'+esc(team.tag)+'</span></div></div><div class="tw-metrics">'+metrics.map(([a,b])=>'<div class="tw-metric"><b>'+esc(b)+'</b><small>'+a+'</small></div>').join('')+'</div><h3 class="fztv-lineup-head">Основной состав · '+starters.length+'/5</h3><div class="tw-roster">'+(cards||'<p style="padding:20px">Состав пока пуст</p>')+'</div>'+(bench.length?'<div class="fztv-profile-bench"><h3>Замена · '+bench.length+'/5</h3><div>'+bench.map(p=>'<a href="#/player/'+keyFor(p.id)+'"><img src="'+esc(p.photo_url||fallback)+'" alt=""><span>'+esc(p.nickname)+'</span></a>').join('')+'</div></div>':'')+'<div class="tw-facts">'+facts.map(([a,b])=>'<div class="tw-fact"><span>'+esc(a)+'</span><b>'+esc(b)+'</b></div>').join('')+'</div></section>';
}
async function playersPage(client,root){
 const tbody=root.querySelector('.fztv-players-table tbody');if(!tbody)return;
 const [players,roster]=await Promise.all([client.from('fztv_team_players').select('id,nickname,fztv_teams(name,status)'),client.from('fztv_roster_players').select('*')]);
 if(!location.hash.startsWith('#/players'))return;
 for(const p of players.data||[]){
 if(p.fztv_teams&&p.fztv_teams.status!=='approved')continue;
 const name=[...tbody.querySelectorAll('tr')].find(tr=>tr.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()===p.nickname.toLowerCase())?.querySelector('td:nth-child(2)');
 if(name)name.innerHTML='<a href="#/player/'+keyFor(p.id)+'">'+esc(p.nickname)+'</a>';
 else{
 const tr=document.createElement('tr');tr.innerHTML='<td>👤</td><td><a href="#/player/'+keyFor(p.id)+'">'+esc(p.nickname)+'</a></td><td>—</td><td>—</td><td>'+esc(p.fztv_teams?.name||'Свободный агент')+'</td><td>—</td><td>—</td>';tbody.append(tr);
 }
 }
 for(const p of roster.data||[]){
 const row=[...tbody.querySelectorAll('tr')].find(tr=>tr.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()===p.nickname.toLowerCase());
 if(row){
 const name=row.querySelector('td:nth-child(2)');name.innerHTML='<a href="#/player/'+encodeURIComponent(p.player_slug)+'">'+esc(p.nickname)+'</a>';
 if(!p.team_name)row.querySelector('td:nth-child(5)').textContent='Свободный агент';
 }
 }
}
export async function mount({client,root,route}){
 if(!root||!client)return;
 if(!document.getElementById('fztv-universal-team-style')){
 const style=document.createElement('style');style.id='fztv-universal-team-style';style.textContent='.fztv-lineup-head{margin:20px 0 12px;color:#dbe8f9;font-size:15px}.fztv-profile-bench{margin:15px 0;padding:14px;border-top:1px solid #34445b}.fztv-profile-bench h3{font-size:14px;margin:0 0 12px}.fztv-profile-bench>div{display:flex;gap:10px;flex-wrap:wrap}.fztv-profile-bench a{display:flex;align-items:center;gap:8px;background:#132136;border:1px solid #3b506c;border-radius:8px;padding:6px 12px;font-size:12px;color:#edf4ff;text-decoration:none}.fztv-profile-bench img{width:30px;height:30px;object-fit:cover;border-radius:5px}.fztv-mini-achievements{margin-top:16px;padding:14px;border:1px solid #34445c;border-radius:12px}.fztv-mini-achievements>div{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fztv-mini-achievement{padding:7px 12px;border-radius:20px;background:#253752;border:1px solid #55749d;font-size:12px}.fztv-universal-team .tw-roster{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.fztv-universal-team .tw-player{display:flex;flex-direction:column;overflow:hidden}.fztv-universal-team .tw-player img{width:100%;height:220px;object-fit:cover;background:#223248}.fztv-universal-team .tw-logo img{width:100%;height:100%;object-fit:contain}@media(max-width:850px){.fztv-universal-team .tw-roster{grid-template-columns:repeat(2,minmax(0,1fr))}.fztv-universal-team .tw-player img{height:160px}}';style.textContent+='.fzsv-panel{width:100%;padding:20px 22px 12px;background:linear-gradient(140deg,#172a3e,#15243a);border-radius:10px}.fzsv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.fzsv-metric{min-height:95px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:2px solid #354c68;text-align:center;color:#dfeaff}.fzsv-metric strong{font-size:25px}.fzsv-metric small{font-size:11px;color:#a7c1df;margin-top:6px}.fzsv-metric.fzsv-green{border-bottom-color:#43d84e}.fzsv-metric.fzsv-rating{border-bottom-color:#43d84e}.fzsv-gauge{height:62px;width:116px;border-radius:80px 80px 0 0;background:linear-gradient(#15283e,#15283e) padding-box,conic-gradient(from 270deg at 50% 100%,#4ce041 0 var(--progress),#344b64 var(--progress) 50%,transparent 50% 100%) border-box;border:5px solid transparent;border-bottom:0;display:flex;justify-content:center;align-items:end;font-size:24px;font-weight:900}.fzsv-meta{text-align:center;color:#9ab4d3;font-size:11px;padding-top:15px}.fzsv-map-list{padding:20px 22px;background:#142136;border-top:1px solid #314b65}.fzsv-map-list h3{margin:0 0 15px;font-size:17px}.fzsv-maps{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px}.fzsv-map-card{padding:15px;background:#1c314c;border:1px solid #415b7a;border-radius:9px}.fzsv-map-title{display:flex;justify-content:space-between;gap:8px;color:#eaf4ff}.fzsv-map-title span{font-size:11px;color:#a9c3e4}.fzsv-map-numbers{display:flex;justify-content:space-around;margin-top:17px;text-align:center;font-size:23px;font-weight:800}.fzsv-map-numbers small{display:block;font-size:11px;color:#9bb3d1}@media(max-width:600px){.fzsv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fzsv-panel{padding:10px}}';
 style.textContent+='.fzps-panel{background:#15253b;padding:20px;border-top:1px solid #344b65}.fzps-panel h3{color:#f4f8ff;font-size:18px;margin:0 0 18px}.fzps-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:19px}.fzps-stat{padding:15px;background:#20334c;border:1px solid #3a5776;border-radius:8px;text-align:center}.fzps-stat strong{display:block;font-size:24px}.fzps-stat span{font-size:11px;color:#abc5e5}.fzps-overflow{overflow-x:auto}.fzps-table{width:100%;min-width:420px;border-collapse:collapse}.fzps-table th,.fzps-table td{text-align:center;padding:12px;border-bottom:1px solid #39506a}.fzps-table th{color:#a9c0de;font-size:12px}.fzps-rating-track{height:3px;background:#283e54;max-width:130px;margin:5px auto 0}.fzps-rating-track i{display:block;height:100%;background:#5abeeb}.fzps-note{color:#a0b8d7;font-size:12px;margin-top:14px}';document.head.append(style);
 }
 const parts=location.hash.split('/'),key=decodeURIComponent(parts[2]||'').toLowerCase();
 if(route==='team-created')return teamPage(client,root,parts[2]||'');
 if(route==='player'&&key){
  // The original Team Woods statistics view is owned by index.html.
  // Do not overwrite it asynchronously with the newer universal renderer.
  if(parts[3]==='stats'&&['sw4mper','loytaber','skrizzi','fladar','bosskpec'].includes(key))return;
  return playerPage(client,root,key,parts[3]==='stats'?'stats':'main');
 }
 if(route==='players'){await playersPage(client,root);if(location.hash.startsWith('#/players')){const tbody=root.querySelector('.fztv-players-table tbody');if(tbody)await import('./player-quick-editor.js').then(m=>m.attachCaptainGears({client,tbody}));}return;}
}