// FragZoneTV: admin player editing and MVP/EVP trophy management.
(()=>{
 const legacy=['sw4mper','loytaber','skrizzi','xblackerx','bosskpec'];
 const $=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const slugOf=p=>p.id?'team:'+p.id:p.nickname.toLowerCase();
 const fields=[['first_name','Имя'],['last_name','Фамилия'],['country','Страна'],['primary_role','Основная роль'],['secondary_role','Дополнительная роль'],['steam_url','Steam'],['telegram','Telegram'],['discord','Discord'],['birth_date','Дата рождения'],['faceit_level','FACEIT уровень'],['prize_usd','Призовые ($)']];
 async function mount(){
  if(typeof sb==='undefined')return;
  const root=document.querySelector('#app');if(!root)return;
  if(location.hash.startsWith('#/admin')&&typeof isAdmin==='function'&&isAdmin()&&!document.getElementById('fztv-admin-players')){
   const panel=$('section');panel.id='fztv-admin-players';panel.className='panel';panel.style.cssText='padding:20px;margin:16px 0';
   panel.append($('h2','Управление игроками и трофеями'));
   const select=$('select');select.style.cssText='width:100%;max-width:450px;padding:10px;background:#142236;color:white;border:1px solid #41536c;border-radius:8px;margin:12px 0';
   const editor=$('div'),notice=$('p');notice.setAttribute('role','status');
   panel.append(select,editor,notice);root.prepend(panel);
   const [{data:dynamic},{data:profiles}]=await Promise.all([sb.from('fztv_team_players').select('*'),sb.from('fztv_legacy_player_profiles').select('*')]);
   const players=[...legacy.map(n=>({nickname:n,legacy:true,...(profiles||[]).find(p=>p.player_slug===n)})),...(dynamic||[])];
   players.forEach((p,i)=>{const o=$('option',p.nickname+(p.legacy?' · Team Woods':''));o.value=String(i);select.append(o);});
   async function edit(){
    editor.replaceChildren();notice.textContent='';const p=players[Number(select.value)||0];if(!p)return;
    const form=$('form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0';
    const inputs={};
    for(const [key,label] of fields){const wrap=$('label',label);wrap.style.cssText='display:flex;flex-direction:column;gap:5px;color:#b9c9df;font-size:13px';const input=$('input');input.value=p[key]??'';input.type=key==='birth_date'?'date':key==='faceit_level'||key==='prize_usd'?'number':'text';if(key==='faceit_level'){input.min=1;input.max=10;}if(key==='prize_usd')input.min=0;input.style.cssText='background:#101c2c;color:white;border:1px solid #42546a;padding:9px;border-radius:6px';inputs[key]=input;wrap.append(input);form.append(wrap);}
    const save=$('button','Сохранить профиль');save.className='toolbtn';save.type='submit';form.append(save);editor.append(form);
    form.onsubmit=async e=>{e.preventDefault();save.disabled=true;const values={};for(const [key] of fields)values[key]=inputs[key].value||null;values.faceit_level=values.faceit_level?Number(values.faceit_level):null;values.prize_usd=Number(values.prize_usd||0);if(p.legacy)values.player_slug=p.nickname;const query=p.legacy?sb.from('fztv_legacy_player_profiles').upsert(values,{onConflict:'player_slug'}):sb.from('fztv_team_players').update(values).eq('id',p.id);const {error}=await query;notice.textContent=error?'Ошибка: '+error.message:'Профиль сохранён';if(!error)Object.assign(p,values);save.disabled=false;};
    const trophies=$('div');trophies.style.cssText='margin-top:20px;border-top:1px solid #34445b;padding-top:14px';trophies.append($('h3','Трофеи игрока'));
    const list=$('div');trophies.append(list);
    const key=slugOf(p);
    async function reload(){const {data,error}=await sb.from('fztv_player_trophies').select('id,medal_type,tournament_name').eq('player_slug',key).order('created_at',{ascending:false});list.replaceChildren();if(error){list.textContent=error.message;return;}if(!data?.length)list.append($('p','Трофеев пока нет'));for(const t of data||[]){const row=$('div');row.style.cssText='display:flex;align-items:center;gap:12px;margin:8px 0';row.append($('strong',t.medal_type+' — '+t.tournament_name));const del=$('button','Удалить');del.className='toolbtn';del.type='button';del.onclick=async()=>{if(!confirm('Удалить трофей?'))return;const {error}=await sb.from('fztv_player_trophies').delete().eq('id',t.id);notice.textContent=error?error.message:'Трофей удалён';if(!error)reload();};row.append(del);list.append(row);}}
    const add=$('form');add.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:12px';const medal=$('select');for(const kind of ['MVP','EVP']){const o=$('option',kind);o.value=kind;medal.append(o);}const tournament=$('input');tournament.placeholder='Название турнира';tournament.required=true;tournament.maxLength=150;tournament.style.cssText='padding:10px;min-width:220px;background:#101c2c;color:white;border:1px solid #42546a';const btn=$('button','Добавить медаль');btn.className='toolbtn';btn.type='submit';add.append(medal,tournament,btn);add.onsubmit=async e=>{e.preventDefault();btn.disabled=true;const {error}=await sb.from('fztv_player_trophies').insert({player_slug:key,medal_type:medal.value,tournament_name:tournament.value.trim()});notice.textContent=error?'Ошибка: '+error.message:'Медаль добавлена';if(!error){tournament.value='';reload();}btn.disabled=false;};trophies.append(add);editor.append(trophies);await reload();
   }
   select.onchange=edit;await edit();
  }
  if(location.hash.startsWith('#/player/')){
   const trophyBox=root.querySelector('.fztv-trophies');if(!trophyBox||trophyBox.dataset.loaded)return;trophyBox.dataset.loaded='1';
   const slug=decodeURIComponent(location.hash.split('/')[2]||'').toLowerCase();
   const {data,error}=await sb.from('fztv_player_trophies').select('medal_type,tournament_name').eq('player_slug',slug).order('created_at',{ascending:false});
   if(error||!data?.length)return;
   trophyBox.querySelector('p')?.remove();
   const list=$('div');list.style.cssText='display:flex;flex-wrap:wrap;gap:14px;margin-top:16px';
   for(const t of data){const item=$('div');item.style.cssText='display:flex;align-items:center;gap:12px;background:#142238;padding:12px;border-radius:10px;min-width:210px';const medal=$('span',t.medal_type);medal.style.cssText='display:grid;place-items:center;width:65px;height:65px;border-radius:50%;border:4px double '+(t.medal_type==='MVP'?'#f8c451':'#b7c5d8')+';background:#06265a;color:'+(t.medal_type==='MVP'?'#f8c451':'#d7e1ef')+';font-size:20px;font-weight:900';const name=$('strong',t.tournament_name);item.append(medal,name);list.append(item);}trophyBox.append(list);
  }
 }
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;mount().catch(console.error);});});
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:false});
 window.addEventListener('hashchange',()=>setTimeout(()=>mount().catch(console.error),0));
 mount().catch(console.error);
})();


// FragZoneTV roster, free agents and transfers (admin managed).
(()=>{
  const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
  const client=()=>typeof sb!=='undefined'?sb:null;
  const admin=()=>typeof isAdmin==='function'&&isAdmin();
  const style=el('style');
  style.textContent='.fztv-move-panel{background:#131e30;color:#e8edf7;border:1px solid #324158;border-radius:12px;padding:16px;margin:16px 0}.fztv-move-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 14px}.fztv-move-heading h3{margin:0;font-size:16px}.fztv-transfer-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid #28374b;font-size:13px}.fztv-transfer-row .fztv-transfer-name{font-weight:800;min-width:95px}.fztv-transfer-sides{display:flex;align-items:center;gap:8px;flex:1;justify-content:flex-end;text-align:center}.fztv-transfer-team{font-size:12px;max-width:112px;overflow-wrap:anywhere}.fztv-transfer-team.free{color:#aabbd1}.fztv-transfer-arrow{color:#91a2b9}.fztv-roster-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#9caec6}.fztv-roster-field input,.fztv-roster-field select{border:1px solid #43536b;background:#0b1525;color:#fff;border-radius:7px;padding:10px;min-width:0}.fztv-roster-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:12px 0}.fztv-roster-btn{background:#283d5b;border:1px solid #496080;color:white;border-radius:7px;padding:9px 13px;cursor:pointer}.fztv-roster-link{color:#b7d8ff;cursor:pointer}.fztv-agent-tag{display:inline-block;background:#38455a;color:#e7edf5;border-radius:6px;padding:4px 8px;font-size:12px;font-weight:700}.fztv-agent-card{border:1px solid #32435b;border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px;margin:8px 0}.fztv-agent-card img{width:45px;height:45px;border-radius:50%;object-fit:cover}.fztv-free-banner{padding:12px;background:#1e3048;border:1px solid #576981;border-radius:9px;margin:12px 0;font-weight:700}';
  document.head.append(style);
  let rendering=false;
  const state={rows:[],transfers:[],teams:[],loadedAt:0};
  async function read(force=false){
    const c=client();if(!c)return false;
    if(!force&&Date.now()-state.loadedAt<8000)return true;
    const [p,t,teams]=await Promise.all([
      c.from('fztv_roster_players').select('*').order('nickname'),
      c.from('fztv_transfers').select('*').order('occurred_at',{ascending:false}).limit(100),
      c.from('fztv_teams').select('name').eq('status','approved')
    ]);
    if(p.error||t.error){console.warn('FZTV transfers:',p.error||t.error);return false;}
    state.rows=p.data||[];state.transfers=t.data||[];state.teams=teams.data||[];
    state.loadedAt=Date.now();return true;
  }
  function titleBar(heading,showAll=false){
    const row=el('div');row.className='fztv-move-heading';row.append(el('h3',heading));
    if(showAll){const a=el('a','Все трансферы');a.href='#/transfers';a.className='fztv-roster-link';row.append(a);}
    return row;
  }
  function transferRow(t){
    const p=state.rows.find(x=>x.player_slug===t.player_slug),r=el('div');
    r.className='fztv-transfer-row';
    const nick=el('a',p?.nickname||t.player_slug);nick.href='#/player/'+encodeURIComponent(t.player_slug);
    nick.className='fztv-transfer-name fztv-roster-link';r.append(nick);
    const sides=el('div');sides.className='fztv-transfer-sides';
    const left=el('span',t.from_team||'NO TEAM');left.className='fztv-transfer-team'+(t.from_team?'':' free');
    const right=el('span',t.to_team||'NO TEAM');right.className='fztv-transfer-team'+(t.to_team?'':' free');
    sides.append(left,el('span','→'),right);r.append(sides);return r;
  }
  function transferPanel(showAll=false){
    const box=el('section');box.className='fztv-move-panel';
    box.append(titleBar('↗ Трансферы',!showAll));
    const transfers=showAll?state.transfers:state.transfers.slice(0,5);
    if(!transfers.length)box.append(el('p','Трансферов пока нет.'));
    for(const t of transfers)box.append(transferRow(t));
    const agents=state.rows.filter(p=>!p.team_name);
    const agentsTitle=el('details');agentsTitle.style.marginTop='12px';
    const summary=el('summary','Свободные агенты ('+agents.length+')');summary.style.cursor='pointer';
    agentsTitle.append(summary);
    for(const p of agents){const a=el('a',p.nickname);a.href='#/player/'+encodeURIComponent(p.player_slug);a.style.cssText='display:block;padding:7px;color:#c1d5f8';agentsTitle.append(a);}
    box.append(agentsTitle);return box;
  }
  function rosterField(name,type='text'){
    const label=el('label',name),input=el('input');
    label.className='fztv-roster-field';input.type=type;label.append(input);return {label,input};
  }
  function teamSelector(){
    const sel=el('select');const free=el('option','Свободный агент / NO TEAM');free.value='';sel.append(free);
    const names=new Set(['Team Woods',...state.teams.map(x=>x.name),...state.rows.map(x=>x.team_name).filter(Boolean)]);
    for(const name of names){const option=el('option',name);option.value=name;sel.append(option);}return sel;
  }
  async function adminPanel(root){
    if(!admin()||document.getElementById('fztv-admin-transfers'))return;
    const box=el('section');box.id='fztv-admin-transfers';box.className='fztv-move-panel';
    box.append(el('h2','Управление игроками и трансферами'));
    const choose=el('select');choose.style.cssText='width:100%;max-width:400px;background:#15253a;color:white;border:1px solid #52637a;padding:10px;border-radius:7px';
    const form=el('form');form.className='fztv-roster-grid';
    const status=el('p');status.setAttribute('role','status');
    box.append(choose,form,status);root.prepend(box);
    const refreshOptions=()=>{
      choose.replaceChildren();
      let o=el('option','＋ Создать нового игрока');o.value='';choose.append(o);
      for(const p of state.rows){o=el('option',p.nickname+(p.team_name?' · '+p.team_name:' · свободный агент'));o.value=p.player_slug;choose.append(o);}
    };
    const renderForm=()=>{
      form.replaceChildren();status.textContent='';
      const current=state.rows.find(p=>p.player_slug===choose.value);
      const nick=rosterField('Ник'),slug=rosterField('ID (латиница, цифры, _ и -)'),age=rosterField('Возраст','number'),photo=rosterField('Ссылка на фото','url'),rating=rosterField('Рейтинг','number');
      age.input.min=5;age.input.max=100;
      nick.input.required=true;slug.input.required=true;
      const team=teamSelector(),label=el('label','Команда');label.className='fztv-roster-field';label.append(team);
      for(const f of [nick,slug,age,photo,rating])form.append(f.label);
      form.append(label);
      if(current){
        nick.input.value=current.nickname;slug.input.value=current.player_slug;slug.input.readOnly=true;
        age.input.value=current.age??'';photo.input.value=current.photo_url||'';
        rating.input.value=current.rating||0;team.value=current.team_name||'';
      }else rating.input.value='0';
      const save=el('button',current?'Сохранить игрока и трансфер':'Создать игрока');
      save.type='submit';save.className='fztv-roster-btn';form.append(save);
      form.onsubmit=async e=>{
        e.preventDefault();save.disabled=true;status.textContent='Сохранение…';
        try{
          const player_slug=slug.input.value.trim().toLowerCase();
          if(!/^[a-z0-9_-]{2,40}$/.test(player_slug))throw Error('ID должен содержать 2–40 латинских символов/цифр');
          const newTeam=team.value||null;
          const payload={player_slug,nickname:nick.input.value.trim(),age:age.input.value?Number(age.input.value):null,team_name:newTeam,photo_url:photo.input.value.trim()||null,rating:Number(rating.input.value||0),updated_at:new Date().toISOString()};
          const c=client();
          const result=current?await c.from('fztv_roster_players').update(payload).eq('player_slug',current.player_slug):await c.from('fztv_roster_players').insert(payload);
          if(result.error)throw result.error;
          if(current&&current.team_name!==newTeam){
            const moved=await c.from('fztv_transfers').insert({player_slug,from_team:current.team_name||null,to_team:newTeam});
            if(moved.error)throw Error('Профиль сохранён, но трансфер не записан: '+moved.error.message);
          }
          status.textContent='Игрок сохранён';await read(true);refreshOptions();choose.value=player_slug;renderForm();status.textContent='Игрок сохранён';
        }catch(err){status.textContent='Ошибка: '+err.message;}finally{save.disabled=false;}
      };
      if(current){
        const note=el('p','При смене команды переход автоматически появится в ленте трансферов. Для свободного агента выбери «NO TEAM».');
        note.style.gridColumn='1/-1';form.append(note);
      }
    };
    refreshOptions();choose.onchange=renderForm;renderForm();
    const refresh=el('button','Обновить список');refresh.type='button';refresh.className='fztv-roster-btn';
    refresh.onclick=async()=>{await read(true);refreshOptions();renderForm();};
    box.append(refresh);
  }
  function freeAgents(root){
    const box=el('section');box.id='fztv-free-agents';box.className='fztv-move-panel';
    box.append(titleBar('Свободные агенты'));
    const agents=state.rows.filter(p=>!p.team_name);
    if(!agents.length)box.append(el('p','Свободных агентов пока нет.'));
    for(const p of agents){
      const row=el('div');row.className='fztv-agent-card';
      if(p.photo_url){const photo=el('img');photo.src=p.photo_url;photo.alt='';row.append(photo);}
      const link=el('a',p.nickname);link.href='#/player/'+encodeURIComponent(p.player_slug);
      link.className='fztv-roster-link';row.append(link,el('span','Свободный агент'));
      row.lastChild.className='fztv-agent-tag';box.append(row);
    }
    root.append(box);
  }
  async function mount(){
    const root=document.querySelector('#app');if(!root||rendering)return;
    rendering=true;
    try{
      if(!await read())return;
      const hash=location.hash.toLowerCase();
      if(hash.startsWith('#/admin'))await adminPanel(root);
      else if(hash.startsWith('#/transfers')){
        if(!document.getElementById('fztv-all-transfers')){const p=transferPanel(true);p.id='fztv-all-transfers';root.prepend(p);}
      }else if(hash.startsWith('#/player/')){
        const slug=decodeURIComponent(location.hash.split('/')[2]||'').toLowerCase();
        const p=state.rows.find(x=>x.player_slug===slug||x.nickname.toLowerCase()===slug);
        if(p&&!document.getElementById('fztv-player-team-status')){
          const badge=el('div',p.team_name?'Команда: '+p.team_name:'Свободный агент · NO TEAM');
          badge.id='fztv-player-team-status';badge.className='fztv-free-banner';root.prepend(badge);
        }
      }else{
        if(!document.getElementById('fztv-transfer-preview')){
          const panel=transferPanel(false);panel.id='fztv-transfer-preview';
          // Show next to the statistics section if possible; otherwise at the end of the page.
          const stats=[...root.querySelectorAll('h2,h3,h4')].find(x=>x.textContent.trim().toLowerCase().includes('статистика'));
          const statsBox=stats?.closest('section,aside,.panel,.card');
          if(statsBox?.parentElement)statsBox.insertAdjacentElement('afterend',panel);
          else root.append(panel);
        }
        if((hash.includes('player')||hash.includes('игрок'))&&!document.getElementById('fztv-free-agents'))freeAgents(root);
      }
    }finally{rendering=false;}
  }
  let busy=false;
  const obs=new MutationObserver(()=>{if(busy)return;busy=true;setTimeout(()=>{busy=false;mount().catch(console.error);},120);});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:false});
  window.addEventListener('hashchange',()=>setTimeout(()=>mount().catch(console.error),120));
  mount().catch(console.error);
})();
