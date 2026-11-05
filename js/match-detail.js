// FragZoneTV public match page: teams, flags, maps, approved player statistics.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const codes={'россия':'ru','russia':'ru','ru':'ru','украина':'ua','ukraine':'ua','швеция':'se','sweden':'se','беларусь':'by','казахстан':'kz','азербайджан':'az','германия':'de','польша':'pl','сша':'us','france':'fr','франция':'fr'};
const mapNames=['Mirage','Dust2','Inferno','Nuke','Ancient','Anubis','Cache'];
const mapId=v=>String(v||'').toLowerCase().replace(/[\s_-]/g,'').replace('dustii','dust2').replace('dedust2','dust2');
const imgMap=v=>{
 const id=mapId(v);const match=mapNames.find(n=>mapId(n)===id);
 if(!match)return null;
 return 'https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/thumbs/de_'+mapId(match)+(id==='mirage'?'_2_png.png':'_1_png.png');
};
const rating=(k,d,a)=>((Number(k||0)+0.5*Number(a||0))/Math.max(Number(d||0),1)).toFixed(2);
const css='.fz-match-stats .fz-stats-table th:first-child,.fz-match-stats .fz-stats-table td:first-child{width:40%}.fz-match-stats .fz-stats-table th:not(:first-child),.fz-match-stats .fz-stats-table td:not(:first-child){width:15%}.fz-match-stats .fz-team-header{background:#1d2a40}.fz-match-stats .fz-team-header:nth-of-type(2){background:#1d2a40}.fz-match-stats .fz-stats-table{table-layout:fixed}.fz-new-match{color:#eaf0fc}.fz-new-match *{box-sizing:border-box}.fz-detail-crumb{margin-bottom:15px;color:#a1b4d1}.fz-detail-crumb a{color:#bfcee5}.fz-match-hero,.fz-match-maps,.fz-match-stats{border:1px solid #30445e;border-radius:12px;overflow:hidden;background:#111b2a;margin-bottom:18px}.fz-match-herohead{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 20px;background:#172339;border-bottom:1px solid #30445d;color:#acc0dc;font-size:13px}.fz-share{background:#1d2e47;color:#f4f7fd;border:1px solid #4b5f7e;border-radius:8px;padding:9px 14px;cursor:pointer}.fz-faceoff{display:grid;grid-template-columns:minmax(0,1fr) minmax(125px,.7fr) minmax(0,1fr);background:linear-gradient(110deg,#14263f,#0e192a 50%,#291b2f);min-height:300px}.fz-side{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px 10px;overflow:hidden}.fz-flag{position:absolute;inset:0;z-index:-1;opacity:.22;background-size:cover;background-position:center}.fz-flag.ru{background:linear-gradient(to bottom,#fff 0 33.333%,#0039a6 33.333% 66.666%,#d52b1e 66.666% 100%)}.fz-logo{width:92px;height:92px;object-fit:contain;margin-bottom:13px;filter:drop-shadow(0 5px 10px #0008)}.fz-logo-empty{display:grid;place-items:center;width:92px;height:92px;background:#1b2a42;border:1px solid #40516c;border-radius:10px;font-size:42px;margin-bottom:13px}.fz-side h2{font-size:clamp(16px,2.7vw,28px);line-height:1.1;margin:2px 0 8px;overflow-wrap:anywhere;font-weight:900}.fz-side small{color:#c3cee1}.fz-score-mid{display:flex;justify-content:center;align-items:center;flex-direction:column;text-align:center;padding:10px}.fz-score-mid strong{font-size:clamp(36px,5.5vw,70px);white-space:nowrap;letter-spacing:-.04em}.fz-score-mid em{font-style:normal;color:#f94c6b}.fz-score-mid b{color:#18e7a6}.fz-score-mid small{color:#acbdd7}.fz-subline{border-top:1px solid #30445e;background:#152238;color:#a6b8d5;text-align:center;padding:12px;font-size:12px}.fz-title{font-size:17px;padding:16px 18px;margin:0;background:#19283b;border-bottom:1px solid #35445b}.fz-map-strip{display:grid;grid-template-columns:repeat(7,minmax(95px,1fr));gap:9px;padding:13px;overflow-x:auto}.fz-map-option{position:relative;height:88px;border-radius:8px;overflow:hidden;background:linear-gradient(120deg,#36465d,#172337);border:1px solid #39495f;display:flex;align-items:flex-end;justify-content:center;filter:grayscale(.75)}.fz-map-option.played{filter:none;border:2px solid #ff3657}.fz-map-option img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;opacity:.65}.fz-map-option span{position:relative;padding:6px;font-size:12px;font-weight:900;text-shadow:0 2px 5px #000}.fz-map-grid{padding:15px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:13px}.fz-map-card{position:relative;min-height:170px;display:flex;align-items:flex-end;border-radius:10px;overflow:hidden;border:1px solid #4b5d77;background:linear-gradient(120deg,#40546a,#17243a)}.fz-map-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.fz-map-card:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#000e 0%,#0000 88%)}.fz-map-card .inside{position:relative;z-index:1;padding:14px;width:100%}.fz-map-card h3{font-size:23px;font-weight:900;text-transform:uppercase;margin:0}.fz-map-card strong{display:block;font-size:40px;margin:5px 0}.fz-map-card small{display:flex;justify-content:space-between;gap:8px;color:#e4e9f5}.fz-map-card .number{position:absolute;right:9px;top:9px;background:#142236d9;padding:4px 8px;border-radius:12px;z-index:2}.fz-team-header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#1d2a40;font-weight:900;border-top:1px solid #36475e}.fz-stats-overflow{overflow-x:auto}.fz-stats-table{width:100%;min-width:530px;border-collapse:collapse;font-size:13px}.fz-stats-table th{text-align:center;color:#a5bbdc;background:#15243a;padding:11px}.fz-stats-table th:first-child,.fz-stats-table td:first-child{text-align:left}.fz-stats-table td{text-align:center;padding:12px;border-top:1px solid #2d3d55}.fz-stats-table tr:nth-child(even){background:#18273a}.fz-player{display:flex;align-items:center;gap:9px;font-weight:700}.fz-player img{width:30px;height:30px;object-fit:cover;border-radius:5px}.fz-fztvr{color:#29edb0;font-weight:900}.fz-no-stats{padding:12px 16px;font-size:13px;color:#9aadc9}.fz-best{border-top:1px solid #b48c2f;padding:16px 18px;background:linear-gradient(100deg,#3a2c20,#111d2e);display:flex;justify-content:space-between;gap:15px}.fz-best strong{font-size:24px;color:#36e8ab}@media(max-width:680px){.fz-faceoff{min-height:215px;grid-template-columns:minmax(0,1fr) minmax(95px,.7fr) minmax(0,1fr)}.fz-logo,.fz-logo-empty{height:62px;width:62px}.fz-side{padding:12px 5px}.fz-side h2{font-size:15px}.fz-score-mid strong{font-size:32px}.fz-match-herohead{padding:11px}.fz-map-grid{grid-template-columns:repeat(auto-fit,minmax(165px,1fr))}}';
function woodsLogo(){
 try{
  if(typeof ranking==='function'){
   const t=document.createElement('template');t.innerHTML=ranking();
   return t.content.querySelector('a[href="#/team/woods"] .rank-logo img')?.getAttribute('src')||null;
  }
 }catch(err){console.warn('Woods logo:',err)}
 return null;
}
function face(team){
 const cc=codes[String(team.country||'').toLowerCase()]||'';
 const bg=cc==='ru'?'ru':'';
 const style=cc&&cc!=='ru'?' style="background-image:url(https://flagcdn.com/w640/'+cc+'.png)"':'';
 const avatar=team.logo_url?'<img class="fz-logo" src="'+esc(team.logo_url)+'" alt="'+esc(team.name)+'">':'<div class="fz-logo-empty">★</div>';
 return '<div class="fz-side"><div class="fz-flag '+bg+'"'+style+'></div>'+avatar+'<h2>'+esc(team.name)+'</h2><small>'+esc(team.country||'Международная')+'</small></div>';
}
function mapBox(mp,i,m){
 const image=imgMap(mp.map_name);
 return '<article class="fz-map-card">'+(image?'<img src="'+esc(image)+'" loading="lazy" alt="">':'')+'<span class="number">#'+(i+1)+'</span><div class="inside"><h3>'+esc(mp.map_name)+'</h3><strong>'+esc(mp.score_a??'—')+' : '+esc(mp.score_b??'—')+'</strong><small><span>'+esc(m.team_a)+'</span><span>'+esc(m.team_b)+'</span></small></div></article>';
}
function table(players,statRows){
 const bySlug=new Map(statRows.map(x=>[x.player_slug,x]));
 const rows=players.map(p=>{
  const st=bySlug.get(p.slug);
  const vals=st?[st.kills,st.deaths,st.assists,rating(st.kills,st.deaths,st.assists)]:['—','—','—','—'];
  return '<tr><td><div class="fz-player">'+(p.photo?'<img src="'+esc(p.photo)+'" alt="">':'')+esc(p.name)+'</div></td>'+vals.map((x,i)=>'<td'+(i===3?' class="fz-fztvr"':'')+'>'+esc(x)+'</td>').join('')+'</tr>';
 }).join('');
 return '<div class="fz-stats-overflow"><table class="fz-stats-table"><thead><tr><th>ИГРОК</th><th>K</th><th>D</th><th>A</th><th>FZTVR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+(statRows.some(x=>players.some(p=>p.slug===x.player_slug))?'':'<p class="fz-no-stats">Для этих игроков K/D/A не внесены. Показатели появятся после публикации статистики.</p>');
}
async function roster(client,team,legacy,stats){
 const players=[];
 if(team.id){
  const r=await client.from('fztv_team_players').select('id,nickname,photo_url').eq('team_id',team.id);
  if(r.error)console.warn('Match roster:',r.error);
  for(const p of r.data||[])players.push({slug:'team_'+p.id.replace(/-/g,''),name:p.nickname,photo:p.photo_url});
 }
 for(const p of legacy.filter(x=>(x.team_name||'').toLowerCase()===team.name.toLowerCase())){
  if(!players.some(x=>x.slug===p.player_slug))players.push({slug:p.player_slug,name:p.nickname,photo:p.photo_url});
 }
 // Historical match participants remain visible after team changes.
 for(const st of stats){
  if(players.some(x=>x.slug===st.player_slug))continue;
  const prev=legacy.find(x=>x.player_slug===st.player_slug);
  players.push({slug:st.player_slug,name:prev?.nickname||st.player_slug,photo:prev?.photo_url||null});
 }
 return players;
}
export async function mount({client,root,id}){
 if(!client||!root||!id)return;
 if(!document.getElementById('fz-match-page-styles')){
  const style=document.createElement('style');style.id='fz-match-page-styles';style.textContent=css;document.head.append(style);
 }
 root.innerHTML='<section class="panel detail-empty">Загружаем матч…</section>';
 const [mr,mapr,tr,sr,lr]=await Promise.all([
  client.from('fztv_site_matches').select('*').eq('id',id).maybeSingle(),
  client.from('fztv_match_maps').select('*').eq('match_id',id).order('map_order'),
  client.from('fztv_teams').select('id,name,country,logo_url').eq('status','approved'),
  client.from('fztv_player_match_stats').select('player_slug,kills,deaths,assists,won').eq('match_id',id),
  client.from('fztv_roster_players').select('player_slug,nickname,photo_url,team_name')
 ]);
 if(!location.hash.startsWith('#/match/'+id))return;
 if(!mr.data||mr.error){root.innerHTML='<section class="panel detail-empty">Матч не найден. <a href="#/matches">К списку матчей</a></section>';return;}
 const m=mr.data,teams=tr.data||[],maps=mapr.data||[],stats=sr.data||[],legacy=lr.data||[];
 const a={...(teams.find(x=>x.name.toLowerCase()===m.team_a.toLowerCase())||{}),name:m.team_a};
 const b={...(teams.find(x=>x.name.toLowerCase()===m.team_b.toLowerCase())||{}),name:m.team_b};
 if(a.name.toLowerCase()==='team woods'&&!a.logo_url)a.logo_url=woodsLogo();
 if(b.name.toLowerCase()==='team woods'&&!b.logo_url)b.logo_url=woodsLogo();
 const submissions=await client.from('fztv_match_submissions').select('player_stats').eq('published_match_id',id).eq('status','approved').maybeSingle();
 const sides=submissions.data?.player_stats||[];
 const sideSlugs=code=>new Set(sides.filter(p=>p.side===code).map(p=>p.slug));
 const [aPlayers,bPlayers]=await Promise.all([roster(client,a,legacy,stats.filter(x=>sideSlugs('a').has(x.player_slug))),roster(client,b,legacy,stats.filter(x=>sideSlugs('b').has(x.player_slug)))]);
 if(!location.hash.startsWith('#/match/'+id))return;
 const result=String(m.result_overall||'').match(/(\d+)\s*[:–-]\s*(\d+)/);
 const score=result?'<em>'+esc(result[1])+'</em> : <b>'+esc(result[2])+'</b>':'VS';
 const state=m.status==='finished'?'Завершён':m.status==='live'?'LIVE':'Запланирован';
 const played=new Set(maps.map(x=>mapId(x.map_name)));
 const thumbs=maps.map(({map_name:name})=>{
  const image=imgMap(name);
  return '<div class="fz-map-option'+(played.has(mapId(name))?' played':'')+'">'+(image?'<img src="'+esc(image)+'" loading="lazy" alt="">':'')+'<span>'+esc(name)+'</span></div>';
 }).join('');
 const hero='<section class="fz-match-hero"><div class="fz-match-herohead"><span>'+esc(m.title||'Матч FragZoneTV')+' · '+esc(new Date(m.starts_at||m.created_at).toLocaleString('ru-RU'))+'</span><button id="fz-share" class="fz-share">Поделиться</button></div><div class="fz-faceoff">'+face(a)+'<div class="fz-score-mid"><strong>'+score+'</strong><small>'+state+'</small></div>'+face(b)+'</div><div class="fz-subline">'+esc(m.team_a)+' · '+esc(m.result_overall||'VS')+' · '+esc(m.team_b)+'</div></section>';
 const mapSection='<section class="fz-match-maps"><h2 class="fz-title">КАРТЫ МАТЧА</h2><div class="fz-map-strip">'+thumbs+'</div><div class="fz-map-grid">'+(maps.length?maps.map((map,i)=>mapBox(map,i,m)).join(''):'<p class="fz-no-stats">Карты пока не указаны.</p>')+'</div></section>';
 const statSection='<section class="fz-match-stats"><h2 class="fz-title">СТАТИСТИКА ИГРОКОВ</h2><div class="fz-team-header"><span>'+esc(m.team_a)+'</span><span>FZTVR</span></div>'+table(aPlayers,stats.filter(x=>sideSlugs('a').has(x.player_slug)))+'<div class="fz-team-header"><span>'+esc(m.team_b)+'</span><span>FZTVR</span></div>'+table(bPlayers,stats.filter(x=>sideSlugs('b').has(x.player_slug)))+'</section>';
 const top=stats.length?stats.slice().sort((x,y)=>Number(rating(y.kills,y.deaths,y.assists))-Number(rating(x.kills,x.deaths,x.assists)))[0]:null;
 const best=top?'<div class="fz-best"><div><small>ИГРОК МАТЧА</small><h3>'+esc([...aPlayers,...bPlayers].find(x=>x.slug===top.player_slug)?.name||top.player_slug)+'</h3><span>'+esc(top.kills)+' / '+esc(top.deaths)+' / '+esc(top.assists)+'</span></div><strong>'+rating(top.kills,top.deaths,top.assists)+' FZTVR</strong></div>':'';
 root.innerHTML='<div class="fz-new-match"><div class="fz-detail-crumb"><a href="#/matches">Матчи</a> / '+esc(m.title||m.team_a+' — '+m.team_b)+'</div>'+hero+mapSection+statSection+best+'</div>';
 const share=root.querySelector('#fz-share');
 if(share)share.onclick=async()=>{try{if(navigator.share)await navigator.share({title:m.team_a+' — '+m.team_b,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);share.textContent='Ссылка скопирована';}else window.prompt('Ссылка на матч',location.href)}catch(err){if(err.name!=='AbortError')window.prompt('Ссылка на матч',location.href)}};
}
