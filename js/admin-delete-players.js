// FragZoneTV — admin player removal. Server enforces admin authorization.
(()=>{
 const style=document.createElement('style');style.textContent='.fz-delete-players{padding:17px;border:1px solid #344963;border-radius:10px;background:#122034;margin:14px 0}.fz-delete-players h2{font-size:19px;margin:0 0 7px}.fz-delete-players p{color:#aebfd6;font-size:13px}.fz-delete-players input{box-sizing:border-box;background:#0e1929;border:1px solid #415672;color:#fff;border-radius:7px;padding:11px;width:100%;margin:10px 0}.fz-delete-players-list{max-height:460px;overflow-y:auto}.fz-delete-players-row{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:11px 6px;border-bottom:1px solid #2f4057}.fz-delete-players-person{display:flex;align-items:center;gap:12px;min-width:0}.fz-delete-players-person img{width:39px;height:39px;border-radius:6px;object-fit:cover}.fz-delete-players-person strong{display:block}.fz-delete-players-person small{display:block;color:#96aac4;font-size:12px}.fz-delete-players-row button{padding:9px 13px;color:#ff9ba6;background:#341d2b;border:1px solid #a84a60;border-radius:7px;cursor:pointer;flex-shrink:0}.fz-delete-players-row button:disabled{opacity:.4;cursor:wait}.fz-delete-players-result{color:#eac0ca!important;min-height:20px}';document.head.append(style);
 const app=document.getElementById('app');let removed=new Set(),scheduled=false;
 window.fztvRemovedPlayers=removed;
 async function loadRemoved(){
  try{
   const {data,error}=await sb.from('fztv_removed_players').select('player_slug');
   if(error)throw error;
   const next=new Set((data||[]).map(x=>x.player_slug));
   window.fztvRemovedPlayers=removed=next;
   const part=location.hash.split('/')[1];
   if(['players','player','team','home','ranking'].includes(part)&&typeof render==='function')render();
  }catch(e){console.warn('Hidden players:',e)}
 }
 async function mount(){
  if(!location.hash.startsWith('#/admin'))return;
  const panel=app.querySelector('[data-adminpanel="players"]')||app.querySelector('[data-fzac-section="players"]')||app;
  if(panel.querySelector('#fz-delete-players'))return;
  if(typeof isAdmin==='function'&&!isAdmin())return;
  const section=document.createElement('section');section.id='fz-delete-players';section.className='fz-delete-players';
  const heading=document.createElement('h2');heading.textContent='Удаление игроков';
  const description=document.createElement('p');description.textContent='Удаляет профиль, игрока из состава и его статистику. Матчи и команды сохраняются. Действие необратимо.';
  const input=document.createElement('input');input.placeholder='Поиск игрока или команды';input.setAttribute('aria-label','Поиск игроков');
  const list=document.createElement('div');list.className='fz-delete-players-list';
  const result=document.createElement('p');result.className='fz-delete-players-result';result.setAttribute('role','status');
  section.append(heading,description,input,list,result);panel.append(section);
  const {data:{user}}=await sb.auth.getUser();if(!user){section.remove();return}
  const [teams,legacy]=await Promise.all([
   sb.from('fztv_team_players').select('id,nickname,photo_url,fztv_teams(name)').order('nickname'),
   sb.from('fztv_roster_players').select('player_slug,nickname,photo_url,team_name').order('nickname')
  ]);
  if(!section.isConnected)return;
  if(teams.error||legacy.error){result.textContent='Ошибка загрузки: '+(teams.error?.message||legacy.error?.message);return}
  let entries=[...(teams.data||[]).map(p=>({kind:'team',id:p.id,slug:'team_'+p.id.replace(/-/g,''),name:p.nickname,photo:p.photo_url,team:p.fztv_teams?.name||'Без команды'})),...(legacy.data||[]).map(p=>({kind:'legacy',id:p.player_slug,slug:p.player_slug,name:p.nickname,photo:p.photo_url,team:p.team_name||'Свободный агент'}))].filter(p=>!removed.has(p.slug));
  function paint(){
   list.replaceChildren();
   const term=input.value.trim().toLowerCase();
   const visible=entries.filter(p=>(p.name+' '+p.team).toLowerCase().includes(term));
   if(!visible.length){const empty=document.createElement('p');empty.textContent='Игроки не найдены';list.append(empty);return}
   for(const player of visible){
    const row=document.createElement('div');row.className='fz-delete-players-row';
    const identity=document.createElement('div');identity.className='fz-delete-players-person';
    if(player.photo){const image=document.createElement('img');image.src=player.photo;image.alt='';image.loading='lazy';identity.append(image)}
    const label=document.createElement('div');const name=document.createElement('strong');name.textContent=player.name;
    const team=document.createElement('small');team.textContent=player.team;label.append(name,team);identity.append(label);
    const button=document.createElement('button');button.type='button';button.textContent='Удалить';
    button.onclick=async()=>{
     if(!confirm('Удалить игрока «'+player.name+'»? Его профиль, статистика и участие в составе будут удалены. Отменить действие нельзя.'))return;
     button.disabled=true;result.textContent='Удаляем '+player.name+'…';
     const {error}=await sb.rpc('fztv_admin_remove_player',{p_kind:player.kind,p_identifier:player.id});
     if(error){result.textContent='Ошибка: '+error.message;button.disabled=false;return}
     entries=entries.filter(p=>p!==player);removed.add(player.slug);window.fztvRemovedPlayers=removed;
     result.textContent='Игрок '+player.name+' удалён';row.remove();
     if(typeof loadPublicPlayers==='function')loadPublicPlayers();
     if(typeof loadLegacyRoster==='function')loadLegacyRoster();
     if(typeof loadContent==='function')loadContent();
    };
    row.append(identity,button);list.append(row);
   }
  }
  input.oninput=paint;paint();
 }
 function run(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;mount()},180)}
 if(app)new MutationObserver(run).observe(app,{childList:true,subtree:false});
 window.addEventListener('hashchange',run);
 loadRemoved().then(run);
})();
