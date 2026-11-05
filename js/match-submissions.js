// FragZoneTV: match upload, live FZTVR and moderator approval.
const N=(tag,txt)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;return n;};
const slug=id=>'team_'+String(id).replace(/-/g,'');
const calc=(k,d,a)=>((Number(k||0)+Number(a||0)*0.5)/Math.max(1,Number(d||0))).toFixed(2);
const styles='.fz-sub{background:#111b2b;border:1px solid #354963;border-radius:12px;padding:20px;margin:18px 0;color:#f2f6ff}.fz-sub h2{margin:0 0 14px}.fz-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fz-grid label{display:flex;flex-direction:column;gap:6px;color:#abc1db;font-size:12px}.fz-grid input,.fz-grid select,.fz-grid textarea{min-width:0;background:#080f1c;border:1px solid #3a4d67;color:#fff;border-radius:7px;padding:10px}.fz-full{grid-column:1/-1}.fz-primary{padding:12px 18px;background:#e52546;color:#fff;border:0;border-radius:8px;font-weight:800;cursor:pointer}.fz-preview{display:flex;align-items:center;justify-content:space-between;gap:15px;background:#1a2940;padding:20px;border-radius:9px;font-weight:800}.fz-preview span{color:#9eb3ce}.fz-stat-table{border-collapse:collapse;width:100%;min-width:490px;font-size:13px}.fz-stat-table th{background:#1b2941;color:#a9bcd5;padding:9px}.fz-stat-table td{border-bottom:1px solid #2e3f56;padding:6px}.fz-stat-table input[type=number]{width:64px;padding:7px}.fz-rating{color:#25e8a5;font-weight:800}.fz-status{color:#ffc0ca;font-size:13px}.fz-review{border:1px solid #32465f;padding:12px;margin:12px 0;border-radius:9px}@media(max-width:650px){.fz-grid{grid-template-columns:1fr}.fz-sub{padding:12px}}';
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
  const tr=N('tr'),name=N('td'),label=N('label',p.nickname),check=N('input');check.type='checkbox';check.checked=!scheduled;label.prepend(check);name.append(label);tr.append(name);
  const vals=[];for(const labelText of ['K','D','A']){const td=N('td'),input=N('input');input.type='number';input.min='0';input.max='200';input.step='1';input.value='0';input.disabled=scheduled;input.setAttribute('aria-label',p.nickname+' '+labelText);td.append(input);tr.append(td);vals.push(input)}
  const result=N('td',scheduled?'—':'100');result.className='fz-rating';tr.append(result);
  const refresh=()=>{vals.forEach(x=>x.disabled=!check.checked);result.textContent=check.checked?String(calc(...vals.map(x=>x.value))):'—';};check.onchange=refresh;vals.forEach(x=>x.oninput=refresh);
  body.append(tr);rows.push({slug:p.slug,side,check,vals});
 }
 table.append(body);container.append(table);return {container,rows};
}
export async function mount({client,root,route}){
 if(!root||!client||!['matches','admin'].includes(route))return;
 if(!document.getElementById('fz-sub-style')){const style=N('style',styles);style.id='fz-sub-style';document.head.append(style);}
 if(route==='admin')return review(client,root);
 const button=N('button','＋ Загрузить матч');button.className='fz-primary';button.id='fz-upload-match';
 const panel=N('section');panel.className='fz-sub';panel.hidden=true;
 const slot=N('div');slot.append(button,panel);
 root.querySelector('.page-title')?.insertAdjacentElement('afterend',slot);
 button.onclick=async()=>{
  if(!panel.hidden){panel.hidden=true;return}
  panel.hidden=false;panel.replaceChildren(N('p','Загрузка…'));
  try{const {data:{user}}=await client.auth.getUser();if(!user){panel.replaceChildren(N('p','Войди в аккаунт, чтобы загрузить матч.'));return}const data=await getData(client);form(client,panel,data,user)}
  catch(err){panel.replaceChildren(N('p','Ошибка: '+err.message))}
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
 const lists=N('div');lists.className='fz-full';f.append(lists);
 const explain=N('p','FZTVR = (K + 0,5 × A) / max(D, 1), округление до 2 знаков. Рейтинг и статистика публикуются только после подтверждения администратором.');explain.className='fz-full';explain.style.color='#96abc7';f.append(explain);
 const send=N('button','Отправить на проверку');send.className='fz-primary fz-full';send.type='submit';f.append(send);
 const status=N('p');status.className='fz-status fz-full';status.setAttribute('role','status');f.append(status);
 const selected=s=>data.teams[Number(s.value)];
 let stats=[];
 const refresh=()=>{
  preview.children[0].textContent=a.value===''?'Команда 1':selected(a)?.name||'Команда 1';preview.children[2].textContent=b.value===''?'Команда 2':selected(b)?.name||'Команда 2';
  lists.replaceChildren();stats=[];if(a.value!==''&&a.value===b.value){lists.append(N('p','Выбери разные команды.'));return}
  for(const [s,side] of [[a,'a'],[b,'b']])if(s.value!==''){const t=addTable(lists,selected(s),side,scheduled.checked);lists.append(t.container);stats.push(...t.rows)}
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
   const player_stats=scheduled.checked?[]:stats.filter(x=>x.check.checked).map(x=>{const [kills,deaths,assists]=x.vals.map(v=>Number(v.value));if(![kills,deaths,assists].every(n=>Number.isInteger(n)&&n>=0&&n<=200))throw Error('K/D/A: целые значения 0–200.');return {slug:x.slug,side:x.side,kills,deaths,assists,rounds:0,headshots:0}});
   if(new Set(player_stats.map(x=>x.slug)).size!==player_stats.length)throw Error('Дубликат игрока в матче.');
   const result=await client.from('fztv_match_submissions').insert({
    created_by:user.id,team_a:ta.name,team_b:tb.name,team_a_id:ta.id,team_b_id:tb.id,event_name:event.x.value.trim()||tour.value||'',format:format.value,scheduled:scheduled.checked,
    played_at:new Date(date.x.value+'T'+(time.x.value||'12:00')+':00').toISOString(),score_a:scheduled.checked?null:Number(scoreA.x.value),score_b:scheduled.checked?null:Number(scoreB.x.value),maps:m,player_stats
   }).select('id').single();
   if(result.error)throw result.error;
   panel.replaceChildren(N('h2','Матч отправлен'),N('p','Ожидает проверки администратором. До одобрения статистика и результаты не отображаются.'));
  }catch(err){status.textContent='Ошибка: '+err.message}finally{send.disabled=false}
 };
}
async function review(client,root){
 if(document.getElementById('fz-match-review'))return;
 const section=N('section');section.id='fz-match-review';section.className='fz-sub';
 section.append(N('h2','Заявки на матчи'));const refreshBtn=N('button','Обновить заявки');refreshBtn.className='toolbtn',refreshBtn.type='button';const list=N('div');section.append(refreshBtn,list);
 root.querySelector('.page-title')?.insertAdjacentElement('afterend',section);
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
    await loadPublished();
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
   if(item.maps?.length)card.append(N('p','Карты: '+item.maps.map(x=>x.name+' '+x.a+':'+x.b).join(' / ')));
   for(const side of ['a','b']){const rows=(item.player_stats||[]).filter(x=>x.side===side);if(rows.length)card.append(N('p',(side==='a'?item.team_a:item.team_b)+': '+rows.map(x=>x.slug+' K'+x.kills+' D'+x.deaths+' A'+x.assists+' FZTVR '+calc(x.kills,x.deaths,x.assists)).join('; ')))}
   const message=N('p');
   for(const [approve,title] of [[true,'Подтвердить'],[false,'Отклонить']]){
    const action=N('button',title);action.type='button';action.className='toolbtn';action.onclick=async()=>{
     if(!confirm((approve?'Опубликовать матч и статистику?':'Отклонить матч?')+' '+item.team_a+' — '+item.team_b))return;
     action.disabled=true;message.textContent='Сохранение…';
     const reply=await client.rpc('fztv_review_match_submission',{p_submission_id:item.id,p_approve:approve});
     if(reply.error){message.textContent='Ошибка: '+reply.error.message;action.disabled=false;return}await load();
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
 const loadPublished=async()=>{
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
    await loadPublished();
   };
   row.append(button,msg);deleteList.append(row);
  }
 };
 deleteRefresh.onclick=loadPublished;await loadPublished();
}
