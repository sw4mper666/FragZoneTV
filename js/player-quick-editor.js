// Captain edit button for players on the public Players page.
const E=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
export async function attachCaptainGears({client,tbody}){
 const auth=await client.auth.getUser(),user=auth.data?.user;if(!user||!tbody||!location.hash.startsWith('#/players'))return;
 const {data:teams,error:te}=await client.from('fztv_teams').select('id,name').eq('owner_id',user.id);
 if(te||!teams?.length)return;
 const {data:players,error:pe}=await client.from('fztv_team_players').select('*').in('team_id',teams.map(t=>t.id));
 if(pe)return;
 const css=E('style');css.textContent='.fztv-captain-gear{display:inline-flex;vertical-align:middle;align-items:center;justify-content:center;margin-left:8px;padding:4px 7px;border:1px solid #ed2947;border-radius:7px;background:#273449;color:#ff526c;font-size:17px;cursor:pointer}.fztv-captain-gear:hover{background:#d52b49;color:white}.fztv-captain-overlay{position:fixed;inset:0;z-index:99999;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}.fztv-captain-dialog{background:#111b2b;color:#fff;border:1px solid #e72b49;border-radius:13px;padding:20px;width:min(650px,100%);max-height:94vh;overflow:auto;box-shadow:0 15px 50px #000a}.fztv-captain-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.fztv-captain-form label{display:flex;flex-direction:column;gap:6px;color:#aebfda;font-size:13px}.fztv-captain-form input{min-width:0;background:#0b1423;color:white;border:1px solid #40516b;border-radius:7px;padding:10px}.fztv-captain-form button{padding:12px;border:0;border-radius:7px;background:#e82d4b;color:white;font-weight:800;cursor:pointer}';document.head.append(css);
 async function edit(player){
  document.querySelector('.fztv-captain-overlay')?.remove();
  const overlay=E('div');overlay.className='fztv-captain-overlay';
  const dialog=E('section');dialog.className='fztv-captain-dialog';overlay.append(dialog);
  const top=E('div');top.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px';
  const title=E('h2','Редактирование: '+player.nickname),close=E('button','✕');close.type='button';close.setAttribute('aria-label','Закрыть');close.onclick=()=>overlay.remove();top.append(title,close);dialog.append(top);
  const form=E('form');form.className='fztv-captain-form';dialog.append(form);
  const inputs={};
  const specs=[['nickname','Ник','text'],['first_name','Имя','text'],['last_name','Фамилия','text'],['country','Страна','text'],['birth_date','Дата рождения','date'],['primary_role','Роль','text'],['secondary_role','Дополнительная роль','text'],['faceit_level','FACEIT','number'],['steam_url','Steam URL','url'],['telegram','Telegram','text'],['discord','Discord','text'],['photo_url','URL аватарки','url']];
  for(const [key,label,type] of specs){
   const wrapper=E('label',label),field=E('input');field.name=key;field.type=type;field.value=player[key]??'';if(key==='nickname'){field.required=true;field.maxLength=40;field.minLength=2}if(key==='faceit_level'){field.min=1;field.max=10}
   wrapper.append(field);form.append(wrapper);inputs[key]=field;
  }
  const fileLabel=E('label','Загрузить фото (PNG/JPG/WebP до 2 МБ)'),file=E('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';fileLabel.append(file);form.append(fileLabel);
  const status=E('p');status.style.gridColumn='1/-1';status.setAttribute('role','status');form.append(status);
  const save=E('button','Сохранить изменения');save.type='submit';save.style.gridColumn='1/-1';form.append(save);
  form.onsubmit=async ev=>{
   ev.preventDefault();save.disabled=true;status.textContent='Сохранение…';
   try{
    const valid=await client.from('fztv_teams').select('owner_id').eq('id',player.team_id).single();
    if(valid.error||valid.data?.owner_id!==user.id)throw Error('Нет прав на редактирование игроков этой команды.');
    const payload={};
    for(const [key] of specs)payload[key]=inputs[key].value.trim()||null;
    if(!payload.nickname||payload.nickname.length<2)throw Error('Ник должен содержать минимум 2 символа.');
    payload.faceit_level=payload.faceit_level?Number(payload.faceit_level):null;
    for(const k of ['first_name','last_name','country','primary_role','secondary_role','steam_url','telegram','discord'])payload[k]??='';
    const upload=file.files?.[0];
    if(upload){
     const exts={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'},ext=exts[upload.type];
     if(!ext||upload.size>2097152)throw Error('Допустимы PNG, JPG, WebP до 2 МБ.');
     const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
     const result=await client.storage.from('fztv-player-photos').upload(path,upload,{contentType:upload.type});
     if(result.error)throw result.error;
     payload.photo_url=client.storage.from('fztv-player-photos').getPublicUrl(path).data.publicUrl;
    }
    const result=await client.from('fztv_team_players').update(payload).eq('id',player.id).eq('team_id',player.team_id).select('id');
    if(result.error)throw result.error;
    if(!result.data?.length)throw Error('Изменение не подтверждено.');
    overlay.remove();location.reload();
   }catch(err){status.textContent='Ошибка: '+err.message;save.disabled=false;}
  };
  overlay.onclick=ev=>{if(ev.target===overlay)overlay.remove()};
  document.body.append(overlay);inputs.nickname.focus();
 }
 for(const p of players||[]){
  const row=[...tbody.querySelectorAll('tr')].find(r=>r.querySelector('td:nth-child(2)')?.textContent.trim().toLowerCase()===p.nickname.toLowerCase());
  if(!row)continue;
  const cell=row.querySelector('td:nth-child(2)');
  if(cell.querySelector('.fztv-captain-gear'))continue;
  const gear=E('button','⚙');gear.type='button';gear.className='fztv-captain-gear';gear.title='Редактировать игрока';gear.setAttribute('aria-label','Редактировать '+p.nickname);
  gear.onclick=ev=>{ev.preventDefault();ev.stopPropagation();edit(p)};
  cell.append(' ',gear);
 }
}