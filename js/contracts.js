// FragZoneTV: team captain contract offers to free agents, reviewed by an administrator.
const make=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;};
const slug=id=>'team_'+String(id).replaceAll('-','');
const styles='.fz-contracts{background:#101c2d;color:#f4f6fb;border:1px solid #35475f;border-radius:11px;padding:17px;margin:16px 0}.fz-contracts h3{margin:0 0 12px}.fz-contract-row{padding:11px 0;border-bottom:1px solid #263a55;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.fz-contract-row span{flex:1;min-width:130px}.fz-contracts button,.fz-contracts select{background:#202f47;border:1px solid #e62e4a;border-radius:8px;padding:9px;color:#f8eff1;cursor:pointer}.fz-contracts p{color:#a7b7d3}.fz-contract-message{color:#ffb3c1}';
async function who(client){
 const {data:{user}}=await client.auth.getUser();
 if(!user)return {user:null,teams:[]};
 const {data:teams}=await client.from('fztv_teams').select('id,name').eq('owner_id',user.id).eq('status','approved');
 return {user,teams:teams||[]};
}
async function offer(client,agent,team,user,status){
 if(!confirm('Предложить контракт игроку '+agent.name+' от команды '+team.name+'?'))return;
 const payload={team_id:team.id,offered_by:user.id};
 if(agent.kind==='legacy')payload.player_slug=agent.id;
 else payload.dynamic_player_id=agent.id;
 const r=await client.from('fztv_contract_offers').insert(payload);
 status.textContent=r.error?'Ошибка: '+r.error.message:'Предложение отправлено на подтверждение администратора.';
}
async function onPlayers(client,root){
 const tbody=root.querySelector('.fztv-players-table tbody');if(!tbody)return;
 const {user,teams}=await who(client);if(!user||!teams.length)return;
 const [legacy,dynamic]=await Promise.all([
  client.from('fztv_roster_players').select('player_slug,nickname').is('team_name',null),
  client.from('fztv_team_players').select('id,nickname').is('team_id',null)
 ]);
 if(!location.hash.startsWith('#/players'))return;
 const agents=[...(legacy.data||[]).map(x=>({id:x.player_slug,name:x.nickname,kind:'legacy'})),...(dynamic.data||[]).map(x=>({id:x.id,name:x.nickname,kind:'dynamic'}))];
 const section=make('section');section.className='fz-contracts';section.append(make('h3','Свободные агенты · предложения контрактов'));
 if(!agents.length)section.append(make('p','Свободных агентов пока нет.'));
 for(const agent of agents){
  const line=make('div');line.className='fz-contract-row';
  const link=make('a',agent.name);link.href='#/player/'+(agent.kind==='legacy'?encodeURIComponent(agent.id):slug(agent.id));link.style.color='#cbd9f5';
  const whoLabel=make('span');whoLabel.append(link);
  const teamSelect=make('select');for(const team of teams){const o=make('option',team.name);o.value=team.id;teamSelect.append(o);}
  const button=make('button','Предложить контракт');
  const notice=make('small');notice.className='fz-contract-message';
  button.onclick=async()=>{button.disabled=true;await offer(client,agent,teams.find(t=>t.id===teamSelect.value),user,notice);button.disabled=false};
  line.append(whoLabel,teamSelect,button,notice);section.append(line);
 }
 root.append(section);
}
async function onProfile(client,root){
 const key=decodeURIComponent(location.hash.split('/')[2]||'').toLowerCase();
 const {user,teams}=await who(client);if(!user||!teams.length)return;
 let agent=null;
 if(key.startsWith('team_')){
  const {data}=await client.from('fztv_team_players').select('id,nickname').is('team_id',null);
  const p=(data||[]).find(x=>slug(x.id)===key);if(p)agent={id:p.id,name:p.nickname,kind:'dynamic'};
 }else{
  const {data}=await client.from('fztv_roster_players').select('player_slug,nickname').eq('player_slug',key).is('team_name',null).maybeSingle();
  if(data)agent={id:data.player_slug,name:data.nickname,kind:'legacy'};
 }
 if(!agent||!location.hash.startsWith('#/player/'+key))return;
 const section=make('section');section.className='fz-contracts';section.append(make('h3','Предложить контракт · '+agent.name));
 const select=make('select');for(const team of teams){const option=make('option',team.name);option.value=team.id;select.append(option);}
 const button=make('button','Отправить предложение');button.style.marginLeft='10px';
 const status=make('p');button.onclick=async()=>{button.disabled=true;await offer(client,agent,teams.find(x=>x.id===select.value),user,status);button.disabled=false};
 section.append(select,button,status);root.append(section);
}
async function onAdmin(client,root){
 const is=await client.rpc('fztv_is_admin');if(is.error||!is.data)return;
 const section=make('section');section.className='fz-contracts';section.id='fz-contract-admin';section.append(make('h3','Предложения контрактов'));
 const reload=make('button','Обновить');const list=make('div');section.append(reload,list);
 const title=root.querySelector('.page-title');if(title)title.insertAdjacentElement('afterend',section);else root.prepend(section);
 async function refresh(){
  const r=await client.from('fztv_contract_offers').select('*,fztv_teams(name)').eq('status','pending').order('created_at',{ascending:true});
  list.replaceChildren();
  if(r.error){list.append(make('p','Ошибка: '+r.error.message));return;}
  if(!r.data?.length){list.append(make('p','Нет ожидающих контрактов.'));return;}
  const legacies=(await client.from('fztv_roster_players').select('player_slug,nickname')).data||[];
  const dynamics=(await client.from('fztv_team_players').select('id,nickname')).data||[];
  for(const offerRow of r.data){
   const agent=offerRow.player_slug?legacies.find(x=>x.player_slug===offerRow.player_slug)?.nickname||offerRow.player_slug:dynamics.find(x=>x.id===offerRow.dynamic_player_id)?.nickname||offerRow.dynamic_player_id;
   const row=make('div');row.className='fz-contract-row';row.append(make('span',agent+' → '+(offerRow.fztv_teams?.name||'Команда')));
   const notice=make('small');notice.className='fz-contract-message';
   for(const [accept,label] of [[true,'Одобрить'],[false,'Отклонить']]){
    const button=make('button',label);
    button.onclick=async()=>{if(!confirm(label+' предложение для '+agent+'?'))return;button.disabled=true;
      const result=await client.rpc('fztv_review_contract',{p_id:offerRow.id,p_accept:accept});
      if(result.error){notice.textContent=result.error.message;button.disabled=false}else await refresh();
    };row.append(button);
   }
   row.append(notice);list.append(row);
  }
 }
 reload.onclick=refresh;await refresh();
}
export async function mount({client,root,route}){
 if(!client||!root)return;
 if(!document.getElementById('fz-contract-css')){const s=make('style',styles);s.id='fz-contract-css';document.head.append(s);}
 if(route==='players')return onPlayers(client,root);
 if(route==='player')return onProfile(client,root);
 if(route==='admin')return onAdmin(client,root);
}
