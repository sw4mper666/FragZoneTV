// Team owner player editor for FragZoneTV
export async function mountTeamPlayerEditor({client,container,team,user}){
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;return n;};
 const style=el('style');style.textContent='.fztv-editor{margin:18px 0;padding:18px;border:1px solid #2c405a;border-radius:12px;background:#101925}.fztv-player-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.fztv-player-form[hidden]{display:none}.fztv-player-form label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:#9eafc6}.fztv-player-form input,.fztv-player-form select{background:#090f19;border:1px solid #33445b;color:#f1f5fc;border-radius:7px;padding:11px;min-width:0}.fztv-player-form button,.fztv-player-form p{grid-column:1/-1}.fztv-player-row{display:flex;gap:12px;align-items:center;padding:10px;border-bottom:1px solid #283a50}.fztv-player-row span{flex:1}.fztv-player-row img{width:40px;height:40px;object-fit:cover;border-radius:50%}@media(max-width:640px){.fztv-player-form{grid-template-columns:1fr}}';container.append(style);
 const box=el('section');box.className='fztv-editor';container.append(box);
 const header=el('h3','Состав команды · '+team.name);box.append(header);
 const roster=el('div');box.append(roster);
 const open=el('button','＋ Добавить игрока');open.className='toolbtn';open.type='button';box.append(open);
 const form=el('form');form.className='fztv-player-form';form.hidden=true;box.append(form);
 const status=el('p');status.setAttribute('role','status');box.append(status);
 const field=(label,key,required=false,type='text')=>{const l=el('label',label),i=el('input');i.name=key;i.type=type;i.required=required;l.append(i);return {l,i};};
 const fields=[
 field('Ник','nickname',true),field('Имя','first_name',true),field('Фамилия','last_name'),
 field('Страна','country',true),field('Дата рождения','birth_date',false,'date'),
 field('Steam URL','steam_url',false,'url'),field('Telegram','telegram'),field('Discord','discord')];
 const role=(label,key,opts)=>{const l=el('label',label),select=el('select');select.name=key;for(const [value,title] of opts){const o=el('option',title);o.value=value;select.append(o);}l.append(select);return {l,select};};
 const roles=['Rifler','AWP','Entry','IGL','Support','Lurker','Anchor'].map(x=>[x,x]);
 const primary=role('Основная роль','primary_role',roles),secondary=role('Дополнительная роль','secondary_role',[['','— Нет —'],...roles]);
 const faceit=role('Уровень FACEIT','faceit_level',[['','— Не указан —'],...Array.from({length:10},(_,i)=>[String(i+1),String(i+1)])]);
 const photo=field('Ссылка на фото','photo_url',false,'url');
 const upload=field('Загрузить фотографию (до 2 МБ)','photo_file',false,'file');upload.i.accept='image/png,image/jpeg,image/webp';
 const preview=el('img');preview.alt='Предпросмотр';preview.width=100;preview.height=100;preview.style.cssText='object-fit:cover;border-radius:12px;display:none';
 let editingId=null, previewUrl;upload.i.onchange=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);const f=upload.i.files?.[0];preview.style.display=f?'block':'none';if(f){previewUrl=URL.createObjectURL(f);preview.src=previewUrl;}};
 for(const f of fields.slice(0,5))form.append(f.l);
 form.append(primary.l,secondary.l,faceit.l);
 for(const f of fields.slice(5))form.append(f.l);
 form.append(photo.l,upload.l,preview);
 const note=el('p','В команде может быть только один игрок с FACEIT 10. Призовые нового игрока — $0.');form.append(note);
 const save=el('button','Сохранить игрока');save.type='submit';save.className='auth-submit';form.append(save);
 
 function resetEditor(){
   editingId=null;form.reset();form.hidden=true;preview.style.display='none';
   if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
   open.textContent='＋ Добавить игрока';save.textContent='Сохранить игрока';
 }
 function showEditor(p=null){
   editingId=p?.id||null;form.reset();
   for(const f of fields) f.i.value=(p?.[f.i.name]??'');
   primary.select.value=p?.primary_role||'Rifler';
   secondary.select.value=p?.secondary_role||'';
   faceit.select.value=p?.faceit_level==null?'':String(p.faceit_level);
   photo.i.value=p?.photo_url||'';
   upload.i.value='';
   if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
   preview.style.display=p?.photo_url?'block':'none';
   if(p?.photo_url)preview.src=p.photo_url;
   form.hidden=false;
   save.textContent=p?'Сохранить изменения':'Сохранить игрока';
   open.textContent='Закрыть форму';
   status.textContent=p?'Редактирование игрока: '+p.nickname:'Добавление игрока';
   form.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 open.onclick=()=>{if(form.hidden)showEditor();else resetEditor();};
 async function refresh(){
 const {data,error}=await client.from('fztv_team_players').select('*').eq('team_id',team.id).order('created_at',{ascending:true});
 roster.replaceChildren();
 if(error){roster.append(el('p','Ошибка загрузки: '+error.message));return;}
 if(!data?.length)roster.append(el('p','Игроков пока нет.'));
 for(const p of data||[]){
 const row=el('div');row.className='fztv-player-row';
 if(p.photo_url){const img=el('img');img.src=p.photo_url;img.alt='';row.append(img);}
 const text=el('span',p.nickname+' · '+(p.country||'—')+' · '+(p.primary_role||'Rifler')+(p.faceit_level?' · FACEIT '+p.faceit_level:''));row.append(text);
 const edit=el('button','Редактировать');edit.type='button';edit.className='toolbtn';
 edit.onclick=()=>showEditor(p);row.append(edit);
 const kick=el('button','Исключить из команды');kick.type='button';kick.className='toolbtn';
 kick.onclick=async()=>{if(!confirm('Исключить '+p.nickname+' из состава? Профиль и статистика сохранятся, игрок станет свободным агентом.'))return;kick.disabled=true;const {error}=await client.rpc('fztv_kick_player',{p_player_id:p.id});status.textContent=error?'Ошибка: '+error.message:'Игрок исключён и стал свободным агентом';await refresh();};row.append(kick);
 const remove=el('button','Удалить навсегда');remove.type='button';remove.className='toolbtn';
 remove.onclick=async()=>{if(!confirm('Безвозвратно удалить анкету '+p.nickname+'? Вместо этого можно исключить игрока, сохранив профиль.'))return;remove.disabled=true;const {error}=await client.from('fztv_team_players').delete().eq('id',p.id).eq('team_id',team.id);status.textContent=error?'Ошибка: '+error.message:'Анкета удалена';await refresh();};row.append(remove);roster.append(row);
 }
 }
 form.onsubmit=async e=>{e.preventDefault();save.disabled=true;status.textContent='Сохраняем игрока…';
 try{
 const payload=editingId?{}:{team_id:team.id,prize_usd:0};
 for(const f of fields){if(f.i.name!=='birth_date')payload[f.i.name]=f.i.value.trim();else payload.birth_date=f.i.value||null;}
 payload.primary_role=primary.select.value;payload.secondary_role=secondary.select.value;
 payload.faceit_level=faceit.select.value?Number(faceit.select.value):null;
 let photoUrl=photo.i.value.trim()||null;
 const file=upload.i.files?.[0];
 if(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2097152)throw Error('Фото должно быть PNG, JPG или WebP до 2 МБ');
 const path=user.id+'/'+crypto.randomUUID()+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]);
 const {error}=await client.storage.from('fztv-player-photos').upload(path,file,{contentType:file.type});if(error)throw error;
 photoUrl=client.storage.from('fztv-player-photos').getPublicUrl(path).data.publicUrl;}
 payload.photo_url=photoUrl;
 const result=editingId
   ?await client.from('fztv_team_players').update(payload).eq('id',editingId).eq('team_id',team.id).select('id')
   :await client.from('fztv_team_players').insert(payload).select('id');
 if(result.error)throw result.error;
 if(!result.data?.length)throw Error('Изменение не подтверждено. Проверь права капитана.');
 const wasEditing=Boolean(editingId);
 resetEditor();status.textContent=wasEditing?'Изменения игрока сохранены':'Игрок добавлен';await refresh();
 }catch(err){status.textContent='Ошибка: '+err.message;}finally{save.disabled=false;}
 };
 await refresh();
}
