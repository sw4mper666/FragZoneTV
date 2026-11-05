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
