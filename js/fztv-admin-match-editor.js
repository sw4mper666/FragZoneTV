/* FragZoneTV admin editor for published match scores, maps, players and demos */
(()=>{
'use strict';
if(window.__fztvMatchEditor)return;window.__fztvMatchEditor=true;
const db=()=>typeof sb!=='undefined'?sb:null;
const E=(tag,label)=>{const x=document.createElement(tag);if(label!==undefined)x.textContent=label;return x;};
const css=E('style');
css.textContent='.fzme{padding:17px;background:#122037;border:1px solid #465e7c;border-radius:12px;margin:18px 0;color:#ebf2ff}.fzme h2,.fzme h3{margin:0 0 14px}.fzme select,.fzme input{padding:9px;background:#0c1728;color:#f6faff;border:1px solid #49627e;border-radius:7px;max-width:100%;box-sizing:border-box}.fzme label{display:grid;gap:6px;font-size:12px;color:#aac2df}.fzme-row{display:flex;flex-wrap:wrap;gap:9px;align-items:end;margin:10px 0}.fzme-btn{padding:10px 13px;background:#274663;color:white;border:1px solid #527394;border-radius:8px;cursor:pointer;font-weight:750}.fzme-primary{background:#da2e4e;border-color:#f4506c}.fzme-btn:disabled{opacity:.5}.fzme-card{border:1px solid #334d6a;border-radius:9px;padding:12px;margin:10px 0;background:#182942}.fzme-table{border-collapse:collapse;width:100%;min-width:440px}.fzme-table th,.fzme-table td{border-bottom:1px solid #354b62;padding:7px;text-align:left}.fzme-table input{width:70px}.fzme-scroll{overflow:auto}.fzme-status{color:#a7d8ff;font-size:13px}.fzme-layout{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}.fzme-note{font-size:12px;color:#a8bfd8}';
document.head.append(css);
function B(text,fn,primary=false){const b=E('button',text);b.type='button';b.className='fzme-btn'+(primary?' fzme-primary':'');if(fn)b.onclick=fn;return b;}
function field(name,val,type='text'){const l=E('label');l.append(E('span',name));const input=E('input');input.type=type;input.value=val??'';l.append(input);return {label:l,input};}
const integer=(v,name)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>1000)throw Error(name+': целое число от 0 до 1000');return n;};
function mountTable(container,data,options,onChange){
 const wrap=E('div');wrap.className='fzme-scroll';
 const table=E('table');table.className='fzme-table';const head=E('thead');const hr=E('tr');
 ['Игрок','Команда','K','D','A','Действие'].forEach(t=>hr.append(E('th',t)));head.append(hr);table.append(head);
 const body=E('tbody');table.append(body);wrap.append(table);container.append(wrap);
 const draw=()=>{
  body.replaceChildren();
  data.forEach((item,i)=>{
   const tr=E('tr'),slug=E('td',options.find(p=>p.slug===item.player_slug)?.name||item.player_slug),side=E('select');
   for(const [v,t] of [['a','Команда 1'],['b','Команда 2']]){const opt=E('option',t);opt.value=v;side.append(opt);}side.value=item.side||'a';
   const cell=E('td');cell.append(side);tr.append(slug,cell);
   const vals=['kills','deaths','assists'].map(k=>{const td=E('td'),inp=E('input');inp.type='number';inp.min='0';inp.max='1000';inp.value=item[k]??0;td.append(inp);tr.append(td);inp.addEventListener('change',()=>{item[k]=integer(inp.value,k);onChange()});return inp;});
   side.onchange=()=>{item.side=side.value;onChange()};
   const del=E('td'),remove=B('Удалить',()=>{data.splice(i,1);onChange();draw()});del.append(remove);tr.append(del);body.append(tr);
  });
 };
 draw();
 return draw;
}
async function editor(root,client,match){
 const parent=E('section');parent.className='fzme-card';root.replaceChildren(parent);
 const title=E('h3',match.team_a+' — '+match.team_b);parent.append(title);
 const status=E('p','Изменения появятся на сайте после сохранения.');status.className='fzme-status';
 const [mr,pr,teamr,roster]=await Promise.all([
  client.from('fztv_match_maps').select('*').eq('match_id',match.id).order('map_order'),
  client.from('fztv_player_match_stats').select('*').eq('match_id',match.id),
  client.from('fztv_team_players').select('id,nickname,team_id'),
  client.from('fztv_roster_players').select('player_slug,nickname,team_name')
 ]);
 for(const r of [mr,pr,teamr,roster])if(r.error)throw r.error;
 const maps=(mr.data||[]).map(m=>({...m})),stats=(pr.data||[]).map(x=>({...x})),options=[];
 (teamr.data||[]).forEach(p=>options.push({slug:'team_'+p.id.replace(/-/g,''),name:p.nickname}));
 (roster.data||[]).forEach(p=>{if(!options.some(x=>x.slug===p.player_slug))options.push({slug:p.player_slug,name:p.nickname})});
 stats.forEach(p=>{if(!options.some(x=>x.slug===p.player_slug))options.push({slug:p.player_slug,name:p.player_slug})});
 const base=E('div');base.className='fzme-layout';parent.append(base);
 const fields={};
 for(const [key,name,value,type] of [['title','Название матча',match.title],['team_a','Команда 1',match.team_a],['team_b','Команда 2',match.team_b],['result_overall','Итоговый счёт (например 1:2)',match.result_overall],['starts_at','Дата и время',match.starts_at?.slice(0,16),'datetime-local']]){
  const f=field(name,value,type);fields[key]=f.input;base.append(f.label);
 }
 const statusField=E('label');statusField.append(E('span','Статус'));const statusSelect=E('select');
 for(const v of ['scheduled','live','finished']){const opt=E('option',v);opt.value=v;statusSelect.append(opt)}statusSelect.value=match.status||'scheduled';statusField.append(statusSelect);base.append(statusField);
 const mapArea=E('div');parent.append(E('h3','Карты и счёт'));parent.append(mapArea);
 function renderMaps(){
  mapArea.replaceChildren();
  for(const [i,m] of maps.entries()){
   const row=E('div');row.className='fzme-row';const name=field('Карта',m.map_name),a=field('Счёт 1',m.score_a,'number'),b=field('Счёт 2',m.score_b,'number');
   for(const f of [name,a,b])row.append(f.label);
   name.input.onchange=()=>m.map_name=name.input.value;
   a.input.onchange=()=>m.score_a=integer(a.input.value,'Счёт');
   b.input.onchange=()=>m.score_b=integer(b.input.value,'Счёт');
   row.append(B('Удалить карту',()=>{maps.splice(i,1);renderMaps()}));mapArea.append(row);
  }
  mapArea.append(B('Добавить карту',()=>{maps.push({id:null,map_name:'Mirage',score_a:0,score_b:0,map_order:maps.length+1});renderMaps()}));
 }
 renderMaps();
 const group=E('div');parent.append(E('h3','Статистика игроков за матч'));parent.append(group);
 const addPlayer=()=>{
  const row=E('div');row.className='fzme-row';
  const selection=E('select');
  for(const p of options){const o=E('option',p.name+' · '+p.slug);o.value=p.slug;selection.append(o)}
  row.append(selection,B('Добавить игрока',()=>{
   if(!selection.value)return;
   if(stats.some(p=>p.player_slug===selection.value)){status.textContent='Игрок уже есть в статистике';return}
   stats.push({player_slug:selection.value,side:'a',kills:0,deaths:0,assists:0});
   showStats();
  }));return row;
 };
 function showStats(){group.replaceChildren();group.append(addPlayer());mountTable(group,stats,options,()=>{});}
 showStats();
 const mapStatsArea=E('div');parent.append(E('h3','Статистика по каждой карте'));parent.append(mapStatsArea);
 const cache=new Map();
 for(const map of maps.filter(m=>m.id)){
  const res=await client.from('fztv_player_map_stats').select('*').eq('map_id',map.id);
  if(res.error)throw res.error;
  cache.set(map.id,(res.data||[]).map(x=>({...x})));
 }
 function drawMapStats(){
  mapStatsArea.replaceChildren();
  for(const map of maps){
   const box=E('div');box.className='fzme-card';box.append(E('h4',map.map_name||'Новая карта'));mapStatsArea.append(box);
   const rows=cache.get(map.id)||[];cache.set(map.id,rows);
   const row=E('div');row.className='fzme-row';const selection=E('select');
   for(const p of options){const o=E('option',p.name);o.value=p.slug;selection.append(o)}
   row.append(selection,B('Добавить статистику игрока',()=>{
    if(rows.some(x=>x.player_slug===selection.value)){status.textContent='Игрок уже добавлен на карту';return}
    rows.push({player_slug:selection.value,side:stats.find(x=>x.player_slug===selection.value)?.side||'a',kills:0,deaths:0,assists:0});
    drawMapStats();
   }));box.append(row);mountTable(box,rows,options,()=>{});
  }
 }
 drawMapStats();
 parent.append(E('h3','Демозапись'));const file=E('input');file.type='file';file.accept='.dem,.zip,.gz,.bz2,.7z';parent.append(file);
 const fileNote=E('p','Демка обязательна для завершённого матча с заполненной статистикой игроков. Без статистики — необязательна. Максимум 50 МБ.');fileNote.className='fzme-note';parent.append(fileNote);
 const save=B('Сохранить изменения',async()=>{
  save.disabled=true;status.textContent='Сохранение...';
  try{
   const ids=new Set(),slugs=new Set();
   for(const p of stats){if(slugs.has(p.player_slug))throw Error('Игрок повторяется в общей статистике');slugs.add(p.player_slug);for(const k of ['kills','deaths','assists'])p[k]=integer(p[k],k)}
   if(maps.some(m=>!m.map_name.trim()))throw Error('Укажи название всех карт');
   const resultString=fields.result_overall.value.trim();
   if(resultString&&!/^\d+\s*:\s*\d+$/.test(resultString))throw Error('Счёт матча должен быть в формате 1:2');
   const fieldsToSave={title:fields.title.value.trim(),team_a:fields.team_a.value.trim(),team_b:fields.team_b.value.trim(),result_overall:resultString||null,starts_at:new Date(fields.starts_at.value).toISOString(),status:statusSelect.value};
   if(!fieldsToSave.team_a||!fieldsToSave.team_b)throw Error('Укажи команды');
   const mapStatsPresent=[...cache.values()].some(rows=>rows.length>0);
   const hasPlayerStats=stats.length>0||mapStatsPresent;
   if(fieldsToSave.status==='finished'&&hasPlayerStats&&!file.files.length&&!match.demo_path){
    throw Error('Для завершённого матча с заполненной статистикой игроков обязательно прикрепить демку.');
   }
   if(file.files.length){
    const f=file.files[0];
    if(f.size>50*1024*1024||!/\.(dem|zip|gz|bz2|7z)$/i.test(f.name))throw Error('Демка должна быть до 50 МБ в формате DEM или архива');
    const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Нет авторизации');
    const path=user.id+'/'+crypto.randomUUID()+'.'+f.name.split('.').pop().toLowerCase();
    const uploaded=await client.storage.from('fztv-match-demos').upload(path,f,{upsert:false,contentType:'application/octet-stream'});
    if(uploaded.error)throw uploaded.error;fieldsToSave.demo_path=path;
   }
   const update=await client.from('fztv_site_matches').update(fieldsToSave).eq('id',match.id);
   if(update.error)throw update.error;
   const oldIds=(mr.data||[]).map(x=>x.id);
   for(const m of maps){
    if(m.id){const u=await client.from('fztv_match_maps').update({map_name:m.map_name,score_a:integer(m.score_a,'Счёт'),score_b:integer(m.score_b,'Счёт'),map_order:maps.indexOf(m)+1}).eq('id',m.id);if(u.error)throw u.error;}
    else{const u=await client.from('fztv_match_maps').insert({match_id:match.id,map_name:m.map_name,score_a:integer(m.score_a,'Счёт'),score_b:integer(m.score_b,'Счёт'),map_order:maps.indexOf(m)+1}).select('id').single();if(u.error)throw u.error;m.id=u.data.id;}
   }
   const deleted=oldIds.filter(x=>!maps.some(m=>m.id===x));if(deleted.length){const d=await client.from('fztv_match_maps').delete().in('id',deleted);if(d.error)throw d.error}
   for(const m of maps){
    const rows=cache.get(m.id)||[];
    for(const p of rows){const u=await client.from('fztv_player_map_stats').upsert({match_id:match.id,map_id:m.id,player_slug:p.player_slug,side:p.side,kills:integer(p.kills,'K'),deaths:integer(p.deaths,'D'),assists:integer(p.assists,'A')},{onConflict:'map_id,player_slug'});if(u.error)throw u.error}
    const beforeRows=(m.id&&(await client.from('fztv_player_map_stats').select('id,player_slug').eq('map_id',m.id)));
    if(beforeRows?.error)throw beforeRows.error;
    const removed=(beforeRows?.data||[]).filter(x=>!rows.some(p=>p.player_slug===x.player_slug)).map(p=>p.id);
    if(removed.length){const d=await client.from('fztv_player_map_stats').delete().in('id',removed);if(d.error)throw d.error}
   }
   // Explicit overall stats are used when individual map numbers are incomplete.
   const mapSlugSet=new Set([...cache.values()].flat().map(p=>p.player_slug));
   for(const p of stats){
    if(mapSlugSet.has(p.player_slug))continue;
    const u=await client.from('fztv_player_match_stats').upsert({match_id:match.id,player_slug:p.player_slug,side:p.side,kills:integer(p.kills,'K'),deaths:integer(p.deaths,'D'),assists:integer(p.assists,'A')},{onConflict:'match_id,player_slug'});
    if(u.error)throw u.error;
   }
   const removed=pr.data.filter(p=>!stats.some(x=>x.player_slug===p.player_slug)&&!mapSlugSet.has(p.player_slug)).map(p=>p.id);
   if(removed.length){const d=await client.from('fztv_player_match_stats').delete().in('id',removed);if(d.error)throw d.error}
   status.textContent='Матч, карты и статистика сохранены. Обнови страницу матча.';
   if(typeof loadContent==='function')await loadContent();
  }catch(err){status.textContent='Ошибка: '+err.message;}finally{save.disabled=false}
 },true);
 parent.append(save,status);
}
async function mount(){
 const root=document.getElementById('app'),client=db();if(!root||!client||!location.hash.startsWith('#/admin'))return;
 if(root.querySelector('#fzme'))return;
 const access=await client.rpc('fztv_is_admin');if(access.error||access.data!==true)return;
 const section=E('section');section.id='fzme';section.className='fzme';section.append(E('h2','Редактор опубликованных матчей'));
 const select=E('select'),refresh=B('Обновить список'),open=B('Редактировать матч',null,true);
 const bar=E('div');bar.className='fzme-row';bar.append(select,refresh,open);section.append(bar);
 const content=E('div');section.append(content);
 const where=root.querySelector('[data-adminpanel="matches"]')||root.querySelector('[data-fzac-section="matches"]')||root;where.append(section);
 async function list(){
  const r=await client.from('fztv_site_matches').select('*').order('starts_at',{ascending:false}).limit(150);select.replaceChildren();
  if(r.error){content.textContent='Ошибка: '+r.error.message;return}
  for(const m of r.data||[]){const o=E('option',m.team_a+' — '+m.team_b+' · '+new Date(m.starts_at).toLocaleDateString('ru-RU'));o.value=m.id;select.append(o)}
 }
 refresh.onclick=list;
 open.onclick=async()=>{
  open.disabled=true;content.textContent='Загрузка матча…';
  try{const r=await client.from('fztv_site_matches').select('*').eq('id',select.value).single();if(r.error)throw r.error;await editor(content,client,r.data)}
  catch(e){content.textContent='Ошибка: '+e.message}
  finally{open.disabled=false}
 };
 await list();
}
let wait=false;function schedule(){if(wait)return;wait=true;setTimeout(()=>{wait=false;mount().catch(console.error)},100)}
document.getElementById('app')&&new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true,subtree:false});
window.addEventListener('hashchange',schedule);schedule();
})();