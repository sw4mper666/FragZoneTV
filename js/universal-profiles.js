// Unified dynamically created player and team profiles.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyFor=id=>'team_'+String(id).replace(/-/g,'');
const tier=r=>r<=10?1:r<=20?2:3;
const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200"><rect width="160" height="200" fill="#233147"/><circle cx="80" cy="62" r="30" fill="#596b84"/><path d="M16 182c0-100 128-100 128 0" fill="#596b84"/></svg>');
function statsHtml(rows){
 const sum=k=>rows.reduce((n,r)=>n+Number(r[k]||0),0),m=rows.length,k=sum('kills'),d=sum('deaths');
 const vals=[['Матчи',m||'—'],['K/D',m?(d?(k/d).toFixed(2):k?'∞':'0.00'):'—'],['Винрейт',m?Math.round(rows.filter(x=>x.won===true).length/m*100)+'%':'—'],['Убийства',m?k:'—'],['Смерти',m?d:'—'],['Ассисты',m?sum('assists'):'—'],['Хедшоты',m?sum('headshots'):'—']];
 return '<div class="fztv-stat-grid">'+vals.map(([a,b])=>'<div class="fztv-stat"><strong>'+esc(b)+'</strong><small>'+a+'</small></div>').join('')+'</div>'+(m?'':'<div class="fztv-stat-empty">Статистика появится после внесения результатов матчей.</div>');
}
async function playerPage(client,root,key,tab){
 const [p,r]=await Promise.all([
 client.from('fztv_team_players').select('*,fztv_teams(name,status)'),
 client.from('fztv_roster_players').select('*')]);
 if(!location.hash.toLowerCase().startsWith('#/player/'+key))return;
 const item=(p.data||[]).find(x=>keyFor(x.id)===key);
 const free=(r.data||[]).find(x=>x.player_slug===key);
 if(!item&&!free){root.innerHTML='<div class="detail-empty">Игрок не найден. <a href="#/players">Все игроки</a></div>';return;}
 const name=item?.nickname||free.nickname,team=item?.fztv_teams?.name||free?.team_name||'Свободный агент',photo=item?.photo_url||free?.photo_url||fallback,slug=item?keyFor(item.id):free.player_slug;
 const st=await client.from('fztv_player_match_stats').select('*').eq('player_slug',slug);
 if(!location.hash.toLowerCase().startsWith('#/player/'+key))return;
 const birth=item?.birth_date,age=free?.age??(birth?Math.max(0,new Date().getFullYear()-Number(birth.slice(0,4))-(new Date().toISOString().slice(5,10)<birth.slice(5,10)?1:0)):'—');
 const details=[['Возраст',age],['Команда',team],['Роль',item?.primary_role||'—'],['Страна',item?.country||'—'],['Рейтинг',free?.rating??'—'],['Призовые','$'+Number(item?.prize_usd||0)]];
 const tabs='<div class="fztv-player-tabs"><a class="'+(tab==='main'?'active':'')+'" href="#/player/'+encodeURIComponent(key)+'">Основной</a><a class="'+(tab==='stats'?'active':'')+'" href="#/player/'+encodeURIComponent(key)+'/stats">Статистика</a></div>';
 const factHtml='<div class="fztv-player-facts">'+details.map(([a,b])=>'<div class="fztv-player-fact"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join('')+'</div>';
 root.innerHTML='<div class="crumb"><a href="#/players">Игроки</a> / '+esc(name)+'</div>'+tabs+'<section class="fztv-player-card"><div class="fztv-player-hero"><div class="fztv-player-photo"><img src="'+esc(photo)+'" alt="'+esc(name)+'"></div><div class="fztv-player-main"><h1>'+esc(name)+'</h1><p class="fztv-player-sub">'+esc(team)+' · CS2</p>'+(tab==='stats'?statsHtml(st.data||[]):factHtml)+'</div></div>'+(tab==='main'?'<div class="fztv-trophies"><h3>Трофеи</h3><p>Трофеев пока нет</p></div>':'')+'</section>';
}
async function teamPage(client,root,id){
 const [teams,players]=await Promise.all([
 client.from('fztv_teams').select('*').eq('status','approved').order('created_at',{ascending:true}),
 client.from('fztv_team_players').select('*').eq('team_id',id).order('created_at',{ascending:true})]);
 if(location.hash.split('/')[2]!==id)return;
 const team=(teams.data||[]).find(t=>t.id===id);
 if(!team){root.innerHTML='<div class="detail-empty">Команда не найдена или не одобрена.</div>';return;}
 const listed=(teams.data||[]).filter(t=>!['team woods','taykans'].includes(t.name.toLowerCase()));
 const rank=listed.findIndex(t=>t.id===id)+3,level=tier(rank),roster=players.data||[];
 const ages=roster.filter(p=>p.birth_date).map(p=>Math.floor((Date.now()-new Date(p.birth_date).getTime())/31557600000));
 const avg=ages.length?Math.round(ages.reduce((a,b)=>a+b,0)/ages.length):'—';
 const metrics=[['МИРОВОЙ РАНГ','#'+rank],['RP','0'],['ВИНРЕЙТ','0%'],['W–L','0–0'],['ВИНСТРИК','0'],['ПРИЗОВЫЕ','$0'],['ТИТУЛЫ','0'],['ЛУЧШАЯ ПОЗИЦИЯ','#'+rank],['СР. ВОЗРАСТ',avg]];
 const cards=roster.map(p=>'<a class="tw-player" href="#/player/'+keyFor(p.id)+'" style="color:inherit;text-decoration:none"><img src="'+esc(p.photo_url||fallback)+'" alt="'+esc(p.nickname)+'"><b>'+esc(p.nickname)+'</b><small class="tw-role">'+esc(p.primary_role||'Игрок')+'</small></a>').join('');
 const facts=[['Рейтинг (RP)','0'],['Позиция','#'+rank],['Тир','TIER '+level],['Лучшая позиция','#'+rank],['Игроков в составе',roster.length],['Средний возраст',avg],['Тренер',team.coach||'—']];
 const logo=team.logo_url?'<img src="'+esc(team.logo_url)+'" alt="'+esc(team.name)+'">':'★';
 root.innerHTML='<div class="crumb"><a href="#/ranking">Рейтинг</a> / '+esc(team.name)+'</div><section class="tw-profile fztv-universal-team"><div class="tw-top"><div class="tw-logo">'+logo+'</div><div class="tw-identity"><div class="tw-meta"><span>'+esc(team.country||'🌐 Международная')+'</span><span class="tw-tier">TIER '+level+'</span></div><h1>'+esc(team.name)+'</h1><span class="tw-tag">'+esc(team.tag)+'</span></div></div><div class="tw-metrics">'+metrics.map(([a,b])=>'<div class="tw-metric"><b>'+esc(b)+'</b><small>'+a+'</small></div>').join('')+'</div><div class="tw-roster">'+(cards||'<p style="padding:20px">Состав пока пуст</p>')+'</div><div class="tw-facts">'+facts.map(([a,b])=>'<div class="tw-fact"><span>'+esc(a)+'</span><b>'+esc(b)+'</b></div>').join('')+'</div></section>';
}
async function playersPage(client,root){
 const tbody=root.querySelector('.fztv-players-table tbody');if(!tbody)return;
 const [players,roster]=await Promise.all([client.from('fztv_team_players').select('id,nickname,fztv_teams(name,status)'),client.from('fztv_roster_players').select('*')]);
 if(!location.hash.startsWith('#/players'))return;
 for(const p of players.data||[]){
 if(p.fztv_teams?.status!=='approved')continue;
 const name=[...tbody.querySelectorAll('tr')].find(tr=>tr.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()===p.nickname.toLowerCase())?.querySelector('td:nth-child(2)');
 if(name)name.innerHTML='<a href="#/player/'+keyFor(p.id)+'">'+esc(p.nickname)+'</a>';
 else{
 const tr=document.createElement('tr');tr.innerHTML='<td>👤</td><td><a href="#/player/'+keyFor(p.id)+'">'+esc(p.nickname)+'</a></td><td>—</td><td>—</td><td>'+esc(p.fztv_teams.name)+'</td><td>—</td><td>—</td>';tbody.append(tr);
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
 const style=document.createElement('style');style.id='fztv-universal-team-style';style.textContent='.fztv-universal-team .tw-roster{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.fztv-universal-team .tw-player{display:flex;flex-direction:column;overflow:hidden}.fztv-universal-team .tw-player img{width:100%;height:220px;object-fit:cover;background:#223248}.fztv-universal-team .tw-logo img{width:100%;height:100%;object-fit:contain}@media(max-width:850px){.fztv-universal-team .tw-roster{grid-template-columns:repeat(2,minmax(0,1fr))}.fztv-universal-team .tw-player img{height:160px}}';document.head.append(style);
 }
 const parts=location.hash.split('/'),key=decodeURIComponent(parts[2]||'').toLowerCase();
 if(route==='team-created')return teamPage(client,root,parts[2]||'');
 if(route==='player'&&(key.startsWith('team_')||key==='xblackerx'||!['sw4mper','loytaber','skrizzi','fladar','bosskpec'].includes(key)))return playerPage(client,root,key,parts[3]==='stats'?'stats':'main');
 if(route==='players'){await playersPage(client,root);if(location.hash.startsWith('#/players')){const tbody=root.querySelector('.fztv-players-table tbody');if(tbody)await import('./player-quick-editor.js').then(m=>m.attachCaptainGears({client,tbody}));}return;}
}