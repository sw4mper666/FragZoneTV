// FragZoneTV: match upload, live FZTVR and moderator approval.
const N=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
const slug=id=>'team_'+String(id).replace(/-/g,'');
const calc=(k,d,a)=>((Number(k||0)+Number(a||0)*0.5)/Math.max(1,Number(d||0))).toFixed(2);
const styles='.fz-sub{background:#111b2b;border:1px solid #354963;border-radius:12px;padding:20px;margin:18px 0;color:#f2f6ff}.fz-sub h2{margin:0 0 14px}.fz-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fz-grid label{display:flex;flex-direction:column;gap:6px;color:#abc1db;font-size:12px}.fz-grid input,.fz-grid select,.fz-grid textarea{min-width:0;background:#080f1c;border:1px solid #3a4d67;color:#fff;border-radius:7px;padding:10px}.fz-full{grid-column:1/-1}.fz-primary{padding:12px 18px;background:#e52546;color:#fff;border:0;border-radius:8px;font-weight:800;cursor:pointer}.fz-preview{display:flex;align-items:center;justify-content:space-between;gap:15px;background:#1a2940;padding:20px;border-radius:9px;font-weight:800}.fz-preview span{color:#9eb3ce}.fz-stat-table{border-collapse:collapse;width:100%;min-width:490px;font-size:13px}.fz-stat-table th{background:#1b2941;color:#a9bcd5;padding:9px}.fz-stat-table td{border-bottom:1px solid #2e3f56;padding:6px}.fz-stat-table input[type=number]{width:64px;padding:7px}.fz-rating{color:#25e8a5;font-weight:800}.fz-status{color:#ffc0ca;font-size:13px}.fz-review{border:1px solid #32465f;padding:12px;margin:12px 0;border-radius:9px}@media(max-width:650px){.fz-grid{grid-template-columns:1fr}.fz-sub{padding:12px}}';
const uploadStyles='.fz-upload-overlay{position:fixed;inset:0;background:rgba(2,7,15,.82);backdrop-filter:blur(7px);z-index:99999;display:flex;justify-content:center;align-items:center;padding:18px}.fz-upload-overlay[hidden]{display:none!important}.fz-upload-dialog{width:min(750px,100%);max-height:94vh;display:flex;flex-direction:column;background:#101a2a;border:1px solid #40536d;border-radius:14px;box-shadow:0 22px 95px #000b;overflow:hidden}.fz-upload-heading{padding:18px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2d405b;background:#111e31}.fz-upload-heading h2{font-size:23px;margin:0;color:#f1f5fb}.fz-upload-close{background:none;border:0;color:#a6bad3;font-size:32px;line-height:1;cursor:pointer}.fz-upload-close:hover{color:#fff}.fz-upload-panel{overflow-y:auto;min-height:0;flex:1;margin:0!important;padding:22px!important;border:0!important;border-radius:0!important;background:transparent!important}.fz-upload-panel>h2{display:none}.fz-upload-panel .fz-preview{grid-row:1;grid-column:1/-1;background:#1a2b43;border:1px solid #334c70;min-height:115px}.fz-upload-panel .fz-grid{gap:15px}.fz-upload-panel .fz-primary[type=submit]{background:#ed2638}.fz-upload-panel input:focus,.fz-upload-panel select:focus,.fz-upload-panel textarea:focus{outline:1px solid #eb3d56}@media(max-width:650px){.fz-upload-overlay{padding:0}.fz-upload-dialog{width:100%;height:100%;max-height:100vh;border-radius:0}.fz-upload-panel{padding:15px!important}}';
const field=(label,type='text')=>{const l=N('label',label),x=N('input');x.type=type;l.append(x);return {l,x};};
const sel=(options)=>{const s=N('select');for(const [v,t] of options){const o=N('option',t);o.value=v;s.append(o)}return s;};
async function getData(client){
 const [ts,ps,rs,tr]=await Promise.all([client.from('fztv_teams').select('id,name,country,logo_url').eq('status','approved'),client.from('fztv_team_players').select('id,nickname,team_id'),client.from('fztv_roster_players').select('player_slug,nickname,team_name'),client.from('tournaments').select('name')]);
 if(ts.error||ps.error||rs.error)throw ts.error||ps.error||rs.error;
 const teams=(ts.data||[]).map(t=>({...t,players:(ps.data||[]).filter(p=>p.team_id===t.id).map(p=>({slug:slug(p.id),nickname:p.nickname}))}));
 for(const t of teams){for(const p of rs.data||[]){if(p.team_name?.toLowerCase()===t.name.toLowerCase()&&!t.players.some(x=>x.slug===p.player_slug))t.players.push({slug:p.player_slug,nickname:p.nickname})}}
 for(const name of ['Team Woods','Taykans']){if(!teams.some(x=>x.name.toLowerCase()===name.toLowerCase()))teams.push({id:null,name,players:(rs.data||[]).filter(p=>p.team_name?.toLowerCase()===name.toLowerCase()).map(p=>({slug:p.player_slug,nickname:p.nickname}))})}
 return {teams,tournaments:tr.data||[]};
}
function addTable(root,team,side,scheduled){
 const container=N('div');container.style.cssText='overflow-x:auto;margin-top:15px';
 container.append(N('h3',(side==='a'?'Команда 1: ':'Команда 2: ')+team.name));
 const rows=[];
 if(!team.players.length){container.append(N('p','Игроки ещё не добавлены.'));return {container,rows};}
 const table=N('table');table.className='fz-stat-table';const h=N('thead');h.innerHTML='<tr><th>Игрок</th><th>K</th><th>D</th><th>A</th><th>FZTVR</th></tr>';table.append(h);
 const body=N('tbody');
 for(const p of team.players){
  const tr=N('tr'),name=N('td'),label=N('label',p.nickname),check=N('input');check.type='checkbox';check.checked=false;label.prepend(check);name.append(label);tr.append(name);
  const vals=[];for(const labelText of ['K','D','A']){const td=N('td'),input=N('input');input.type='number';input.min='0';input.max='200';input.step='1';input.value='';input.placeholder='—';input.disabled=true;input.setAttribute('aria-label',p.nickname+' '+labelText);td.append(input);tr.append(td);vals.push(input)}
  const result=N('td','—');result.className='fz-rating';tr.append(result);
  const refresh=()=>{vals.forEach(x=>x.disabled=scheduled||!check.checked);result.textContent=!scheduled&&check.checked&&vals.every(x=>x.value.trim()!=='')?String(calc(...vals.map(x=>x.value))):'—';};check.onchange=refresh;vals.forEach(x=>x.oninput=refresh);
  body.append(tr);rows.push({slug:p.slug,side,check,vals});
 }
 table.append(body);container.append(table);return {container,rows};
}
export async function mount({client,root,route}){
 if(!root||!client||!['matches','admin'].includes(route))return;
 if(!document.getElementById('fz-sub-style')){const style=N('style',styles+uploadStyles);style.id='fz-sub-style';document.head.append(style);}
 if(route==='admin')return review(client,root);

 const button=root.querySelector('#fz-upload-match')||N('button','＋ Загрузить матч');
 button.className='fz-primary';button.id='fz-upload-match';
 const overlay=N('div');overlay.className='fz-upload-overlay';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Новый матч');
 const dialog=N('div');dialog.className='fz-upload-dialog';
 const top=N('div');top.className='fz-upload-heading';
 const title=N('h2','НОВЫЙ МАТЧ');const close=N('button','×');close.type='button';close.className='fz-upload-close';close.setAttribute('aria-label','Закрыть');
 top.append(title,close);
 const panel=N('section');panel.className='fz-sub fz-upload-panel';
 dialog.append(top,panel);overlay.append(dialog);
 const anchor=root.querySelector('#fz-upload-match-anchor');
 if(!button.isConnected){(anchor||root).prepend(button)}
 document.body.append(overlay);
 const dismiss=()=>{overlay.hidden=true;document.body.style.overflow=''};
 close.onclick=dismiss;
 overlay.onclick=e=>{if(e.target===overlay)dismiss()};
 const keyHandler=e=>{if(e.key==='Escape'&&!overlay.hidden)dismiss()};
 document.addEventListener('keydown',keyHandler,{signal:(()=>{const c=new AbortController();window.addEventListener('hashchange',()=>{dismiss();document.removeEventListener('keydown',keyHandler);overlay.remove()},{once:true,signal:c.signal});return c.signal})()});
 button.onclick=async()=>{
  if(!overlay.hidden){dismiss();return}
  overlay.hidden=false;document.body.style.overflow='hidden';
  panel.replaceChildren(N('p','Загрузка команд…'));
  try{
   const {data:{user},error}=await client.auth.getUser();if(error)throw error;
   if(!user){panel.replaceChildren(N('p','Чтобы загрузить матч, войди в свой аккаунт.'));return}
   const data=await getData(client);if(overlay.isConnected)form(client,panel,data,user);
  }catch(err){panel.replaceChildren(N('p','Ошибка: '+err.message))}
 };

}
function form(client,panel,data,user){
 panel.replaceChildren(N('h2','НОВЫЙ МАТЧ'));
 const f=N('form');f.className='fz-grid';panel.append(f);
 const choices=[['','Выбрать команду'],...data.teams.map((t,i)=>[String(i),t.name])];
 const a=sel(choices),b=sel(choices);for(const [name,input] of [['Команда 1',a],['Команда 2',b]]){const l=N('label',name);l.append(input);f.append(l)}
 const preview=N('div');preview.className='fz-preview fz-full';preview.innerHTML='<strong>Команда 1</strong><span>VS</span><strong>Команда 2</strong>';f.append(preview);
 const scheduled=N('input');scheduled.type='checkbox';const planned=N('label','Запланировать матч без результата');planned.className='fz-full';planned.prepend(scheduled);f.append(planned);
 const scoreA=field('Счёт команды 1','number'),scoreB=field('Счёт команды 2','number');for(const item of [scoreA,scoreB]){item.x.min='0';item.x.max='99';item.x.value='0';f.append(item.l)}
 const format=sel([['Bo1','Bo1'],['Bo3','Bo3'],['Bo5','Bo5']]),fmt=N('label','Формат');fmt.append(format);f.append(fmt);
 const tour=sel([['','Не привязан'],...data.tournaments.map(x=>[x.name,x.name])]),tourLabel=N('label','Турнир');tourLabel.append(tour);f.append(tourLabel);
 const event=field('Название турнира / ивента'),date=field('Дата','date'),time=field('Время','time');date.x.required=true;date.x.value=new Date().toISOString().slice(0,10);for(const x of [event,date,time])f.append(x.l);
 const mapLabel=N('label','Карты (по одной строке: Mirage,13,9)'),maps=N('textarea');maps.rows=3;maps.placeholder='Mirage,13,9\nDust2,11,13';mapLabel.className='fz-full';mapLabel.append(maps);f.append(mapLabel);
 const demoLabel=N('label','Демка матча (.dem, .zip, .gz, до 50 МБ)');demoLabel.className='fz-full';
 const demoInput=N('input');demoInput.type='file';demoInput.accept='.dem,.zip,.gz,.bz2,.7z';demoInput.required=false;
 const demoHint=N('small','Демка обязательна только для завершённого матча с заполненной статистикой игроков. Если статистика не внесена — демка необязательна.');demoHint.style.color='#a6bad6';
 demoLabel.append(demoInput,demoHint);f.append(demoLabel);
 
 const lists=N('div');lists.className='fz-full';f.append(lists);
 const explain=N('p','FZTVR = (K + 0,5 × A) / max(D, 1), округление до 2 знаков. Рейтинг и статистика публикуются только после подтверждения администратором.');explain.className='fz-full';explain.style.color='#96abc7';f.append(explain);
 const send=N('button','Отправить на проверку');send.className='fz-primary fz-full';send.type='submit';f.append(send);
 const status=N('p');status.className='fz-status fz-full';status.setAttribute('role','status');f.append(status);
 const selected=s=>data.teams[Number(s.value)];
 const syncDemo=()=>{const filled=!scheduled.checked&&stats.some(x=>x.check.checked);demoInput.required=filled;demoHint.textContent=filled?'Статистика игроков выбрана: для завершённого матча демка обязательна.':'Без статистики игроков демка необязательна. Если отметишь игроков для статистики, демка станет обязательной.';};
 let stats=[];
 const refresh=()=>{
  preview.children[0].textContent=a.value===''?'Команда 1':selected(a)?.name||'Команда 1';preview.children[2].textContent=b.value===''?'Команда 2':selected(b)?.name||'Команда 2';
  lists.replaceChildren();stats=[];if(a.value!==''&&a.value===b.value){lists.append(N('p','Выбери разные команды.'));return}
  for(const [s,side] of [[a,'a'],[b,'b']])if(s.value!==''){const t=addTable(lists,selected(s),side,scheduled.checked);lists.append(t.container);stats.push(...t.rows)}
  for(const x of stats){x.check.addEventListener('change',syncDemo);x.vals.forEach(v=>v.addEventListener('input',syncDemo));}
  syncDemo();
 };
 a.onchange=refresh;b.onchange=refresh;
 scheduled.onchange=()=>{scoreA.x.disabled=scheduled.checked;scoreB.x.disabled=scheduled.checked;refresh()};
 refresh();
 f.onsubmit=async ev=>{
  ev.preventDefault();send.disabled=true;status.textContent='Отправка…';
  try{
   if(a.value===''||b.value===''||a.value===b.value)throw Error('Выбери две разные команды.');
   const ta=selected(a),tb=selected(b);
   if(scheduled.checked&&!time.x.value)throw Error('Укажи время запланированного матча.');
   const m=maps.value.split(/\n/).map(x=>x.trim()).filter(Boolean).map((line,i)=>{const [name,sa,sb]=line.split(',').map(x=>x.trim());if(!name||!/^\d{1,2}$/.test(sa)||!/^\d{1,2}$/.test(sb))throw Error('Формат карты: Mirage,13,9');return {name,a:Number(sa),b:Number(sb),order:i+1}});
   const player_stats=scheduled.checked?[]:stats.filter(x=>x.check.checked).map(x=>{if(x.vals.some(v=>v.value.trim()===''))throw Error('Для выбранных игроков заполни K/D/A полностью.');const [kills,deaths,assists]=x.vals.map(v=>Number(v.value));if(![kills,deaths,assists].every(n=>Number.isInteger(n)&&n>=0&&n<=200))throw Error('K/D/A: целые значения 0–200.');return {slug:x.slug,side:x.side,kills,deaths,assists,rounds:0,headshots:0}});
   if(new Set(player_stats.map(x=>x.slug)).size!==player_stats.length)throw Error('Дубликат игрока в матче.');
   const file=demoInput.files?.[0]||null;
   if(!scheduled.checked&&player_stats.length>0&&!file)throw Error('Для завершённого матча с заполненной статистикой игроков нужна демка.');
   if(file&&file.size>50*1024*1024)throw Error('Размер демки превышает 50 МБ. Сожми файл в ZIP.');
   if(file&&!/\.(dem|zip|gz|bz2|7z)$/i.test(file.name))throw Error('Допустимы файлы .dem, .zip, .gz, .bz2 и .7z.');
   let demoPath=null;
   if(file){
     const ext=file.name.split('.').pop().toLowerCase();
     demoPath=user.id+'/'+crypto.randomUUID()+'.'+ext;
     const uploaded=await client.storage.from('fztv-match-demos').upload(demoPath,file,{upsert:false,contentType:'application/octet-stream'});
     if(uploaded.error)throw Error('Не удалось загрузить демку: '+uploaded.error.message);
   }
   const result=await client.from('fztv_match_submissions').insert({
    created_by:user.id,team_a:ta.name,team_b:tb.name,team_a_id:ta.id,team_b_id:tb.id,event_name:event.x.value.trim()||tour.value||'',format:format.value,scheduled:scheduled.checked,
    played_at:new Date(date.x.value+'T'+(time.x.value||'12:00')+':00').toISOString(),score_a:scheduled.checked?null:Number(scoreA.x.value),score_b:scheduled.checked?null:Number(scoreB.x.value),maps:m,player_stats,demo_path:demoPath
   }).select('id').single();
   if(result.error){if(demoPath)await client.storage.from('fztv-match-demos').remove([demoPath]);throw result.error;}
   panel.replaceChildren(N('h2','Матч отправлен'),N('p','Ожидает проверки администратором. До одобрения статистика и результаты не отображаются.'));
  }catch(err){status.textContent='Ошибка: '+err.message}finally{send.disabled=false}
 };
}
async function review(client,root){
 if(document.getElementById('fz-match-review'))return;
 const section=N('section');section.id='fz-match-review';section.className='fz-sub';
 section.append(N('h2','Заявки на матчи'));const refreshBtn=N('button','Обновить заявки');refreshBtn.className='toolbtn',refreshBtn.type='button';const list=N('div');section.append(refreshBtn,list);
 const adminMatchPanel=root.querySelector('[data-adminpanel="matches"]')||root.querySelector('[data-fzac-section="matches"]')||root;adminMatchPanel.append(section);
 const published=N('section');published.className='fz-sub';published.id='fz-published-match-admin';
 published.append(N('h2','Опубликованные матчи'));
 const pubRefresh=N('button','Обновить список матчей');pubRefresh.className='toolbtn';pubRefresh.type='button';
 const pubList=N('div');published.append(pubRefresh,pubList);section.insertAdjacentElement('afterend',published);
 const loadPublished=async()=>{
  const access=await client.rpc('fztv_is_admin');if(access.error||!access.data){published.remove();return}
  const result=await client.from('fztv_site_matches').select('id,title,team_a,team_b,starts_at,result_overall').order('starts_at',{ascending:false}).limit(100);
  pubList.replaceChildren();
  if(result.error){pubList.append(N('p','Ошибка: '+result.error.message));return}
  if(!result.data?.length){pubList.append(N('p','Опубликованных матчей нет.'));return}
  for(const match of result.data){
   const row=N('div');row.className='fz-review';
   const link=N('a',match.team_a+' — '+match.team_b+' · '+(match.result_overall||'запланирован')+' · '+new Date(match.starts_at).toLocaleDateString('ru-RU'));
   link.href='#/match/'+match.id;link.style.color='#e8f0ff';row.append(link);
   const del=N('button','Удалить матч');del.type='button';del.className='toolbtn';del.style.marginLeft='15px';
   del.onclick=async()=>{
    if(!confirm('Удалить матч '+match.team_a+' — '+match.team_b+'? Статистика игроков и начисленные за этот матч RP также будут отменены. Это действие необратимо.'))return;
    del.disabled=true;
    const result=await client.rpc('fztv_admin_delete_match',{p_match_id:match.id});
    if(result.error){const error=N('p','Ошибка: '+result.error.message);row.append(error);del.disabled=false;return}
    await loadPublished();if(typeof loadContent==='function')await loadContent();
   };
   row.append(del);pubList.append(row);
  }
 };
 pubRefresh.onclick=loadPublished;await loadPublished();
 const load=async()=>{
  const allowed=await client.rpc('fztv_is_admin');if(allowed.error||!allowed.data){section.remove();return}
  const result=await client.from('fztv_match_submissions').select('*').eq('status','pending').order('created_at',{ascending:true});
  list.replaceChildren();if(result.error){list.append(N('p',result.error.message));return}if(!result.data?.length){list.append(N('p','Ожидающих матчей нет.'));return}
  for(const item of result.data){
   const card=N('div');card.className='fz-review';card.append(N('h3',item.team_a+' — '+item.team_b),N('p',(item.event_name||'Товарищеский матч')+' · '+item.format+' · '+new Date(item.played_at).toLocaleString('ru-RU')),N('p',item.scheduled?'Запланирован':'Счёт: '+item.score_a+' : '+item.score_b));
   if(item.demo_path){const a=N('a','Скачать демку');a.href=client.storage.from('fztv-match-demos').getPublicUrl(item.demo_path).data.publicUrl;a.target='_blank';a.rel='noopener';a.style.color='#64b5ff';card.append(a);}
   if(item.maps?.length)card.append(N('p','Карты: '+item.maps.map(x=>x.name+' '+x.a+':'+x.b).join(' / ')));
   for(const side of ['a','b']){const rows=(item.player_stats||[]).filter(x=>x.side===side);if(rows.length)card.append(N('p',(side==='a'?item.team_a:item.team_b)+': '+rows.map(x=>x.slug+' K'+x.kills+' D'+x.deaths+' A'+x.assists+' FZTVR '+calc(x.kills,x.deaths,x.assists)).join('; ')))}
   const message=N('p');
   for(const [approve,title] of [[true,'Подтвердить'],[false,'Отклонить']]){
    const action=N('button',title);action.type='button';action.className='toolbtn';action.onclick=async()=>{
     if(!confirm((approve?'Опубликовать матч и статистику?':'Отклонить матч?')+' '+item.team_a+' — '+item.team_b))return;
     action.disabled=true;message.textContent='Сохранение…';
     const reply=await client.rpc('fztv_review_match_submission',{p_submission_id:item.id,p_approve:approve});
     if(reply.error){message.textContent='Ошибка: '+reply.error.message;action.disabled=false;return}if(typeof loadContent==='function')await loadContent();else await load();
    };card.append(action)
   }
   card.append(message);list.append(card);
  }
 };
 refreshBtn.onclick=load;await load();
 const deleteSection=N('section');deleteSection.className='fz-sub';deleteSection.id='fz-admin-delete-matches';
 deleteSection.append(N('h2','Управление опубликованными матчами'));
 const deleteRefresh=N('button','Обновить список матчей');deleteRefresh.type='button';deleteRefresh.className='toolbtn';
 const deleteList=N('div');deleteSection.append(deleteRefresh,deleteList);section.insertAdjacentElement('afterend',deleteSection);
 const loadPublishedForDeletion=async()=>{
  const allowed=await client.rpc('fztv_is_admin');
  if(allowed.error||!allowed.data){deleteSection.remove();return}
  const result=await client.from('fztv_site_matches').select('id,team_a,team_b,starts_at,result_overall,title').order('starts_at',{ascending:false}).limit(100);
  deleteList.replaceChildren();
  if(result.error){deleteList.append(N('p','Ошибка: '+result.error.message));return}
  if(!result.data?.length){deleteList.append(N('p','Матчей нет.'));return}
  for(const match of result.data){
   const row=N('div');row.className='fz-review';
   row.append(N('h3',match.team_a+' — '+match.team_b),N('p',(match.title||'Матч')+' · '+(match.result_overall||'Без результата')+' · '+new Date(match.starts_at).toLocaleDateString('ru-RU')));
   const button=N('button','Удалить матч');button.type='button';button.className='toolbtn';
   const msg=N('p');
   button.onclick=async()=>{
    if(!confirm('Удалить матч '+match.team_a+' — '+match.team_b+'? Будут удалены карты и статистика игроков, а начисленные за матч RP отменены. Это действие необратимо.'))return;
    button.disabled=true;msg.textContent='Удаление…';
    const r=await client.rpc('fztv_admin_delete_match',{p_match_id:match.id});
    if(r.error){msg.textContent='Ошибка: '+r.error.message;button.disabled=false;return}
    await loadPublishedForDeletion();if(typeof loadContent==='function')await loadContent();
   };
   row.append(button,msg);deleteList.append(row);
  }
 };
 deleteRefresh.onclick=loadPublishedForDeletion;await loadPublishedForDeletion();
}
