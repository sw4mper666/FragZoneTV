// FragZoneTV team + tournament workflow. Uses the site's existing Supabase client.
// Call mountFragZoneTeams({client: supabase, root: document.querySelector('#teams-workflow')})
export async function mountFragZoneTeams({client,root}) {
 if (!client || !root) throw new Error('Supabase client and root are required');
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError || !user){root.textContent='Войдите в аккаунт, чтобы создать команду.';return;}
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const heading=(title)=>root.append(el('h2',title));
 const msg=el('p');msg.setAttribute('role','status');
 const field=(label,required=true)=>{const wrap=el('label',label+' '),input=el('input');input.required=required;wrap.append(input);return {wrap,input};};
 root.replaceChildren();
 const adminRoute=location.hash.startsWith('#/admin');
 let form;
 if(!adminRoute){
 heading('Создание команды');
 const open=el('button','＋ Создать команду');open.type='button';open.className='toolbtn';root.append(open);
 form=el('form');form.className='auth-form';form.hidden=true;
 open.onclick=()=>{form.hidden=!form.hidden;open.textContent=form.hidden?'＋ Создать команду':'Закрыть форму';};
 const name=field('Название команды'),tag=field('Тег (2–5 символов)'),country=field('Страна',false);
 name.input.maxLength=70;name.input.minLength=2;tag.input.maxLength=5;tag.input.minLength=2;
 const avatarLabel=el('label','Аватарка команды '),avatar=el('input');avatar.type='file';avatar.accept='image/png,image/jpeg,image/webp';avatar.required=true;avatarLabel.append(avatar);
 const preview=el('img');preview.alt='Предпросмотр аватарки';preview.width=96;preview.height=96;preview.style.cssText='object-fit:cover;border-radius:14px;display:none';
 let previewUrl=null;
 avatar.onchange=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);const file=avatar.files?.[0];preview.style.display=file?'block':'none';if(file){previewUrl=URL.createObjectURL(file);preview.src=previewUrl;}};
 form.append(avatarLabel,preview,name.wrap,tag.wrap,country.wrap);
 const submit=el('button','Отправить на модерацию');submit.type='submit';submit.className='auth-submit';form.append(submit);root.append(form,msg);
 form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;msg.textContent='Отправляем заявку…';
 try {
 const file=avatar.files?.[0];
 if(!file || !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>2097152)throw Error('Выбери PNG, JPG или WebP размером до 2 МБ');
 const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];
 const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
 const {error:uploadError}=await client.storage.from('fztv-team-avatars').upload(path,file,{contentType:file.type,upsert:false});
 if(uploadError)throw uploadError;
 const logo_url=client.storage.from('fztv-team-avatars').getPublicUrl(path).data.publicUrl;
 const {error}=await client.from('fztv_teams').insert({name:name.input.value.trim(),tag:tag.input.value.trim(),country:country.input.value.trim(),logo_url,owner_id:user.id,status:'pending'});
 if(error)throw error;
 msg.textContent='Команда отправлена на модерацию';form.reset();preview.style.display='none';form.hidden=true;open.textContent='＋ Создать команду';
 await refresh();
 }catch(error){msg.textContent='Ошибка: '+error.message;}finally{submit.disabled=false;}
 });
 }
 const myTeams=el('section');root.append(myTeams);
 async function refresh(){
 myTeams.replaceChildren(el('h2','Мои команды'));
 const {data:teams,error}=await client.from('fztv_teams').select('id,name,tag,status').eq('owner_id',user.id).order('created_at',{ascending:false});
 if(error){myTeams.append(el('p',error.message));return;}
 const {data:tournamentRows}=await client.from('tournaments').select('id,name,status,registration_opens_at,starts_at').eq('status','registration');const tournaments=(tournamentRows||[]).filter(t=>Date.now()>=new Date(t.registration_opens_at).getTime()&&(!t.starts_at||Date.now()<new Date(t.starts_at).getTime()));
 for(const team of teams||[]){
 const item=el('div');item.append(el('strong',team.name+' ['+team.tag+'] — '+team.status));
 if(team.status==='approved'){
 const select=el('select');for(const t of tournaments||[]){const option=el('option',t.name);option.value=t.id;select.append(option);}
 const button=el('button','Подать заявку на турнир');button.type='button';button.disabled=!select.options.length;
 button.onclick=async()=>{button.disabled=true;const {error}=await client.from('fztv_tournament_applications').insert({team_id:team.id,tournament_id:select.value,owner_id:user.id});msg.textContent=error?'Ошибка: '+error.message:'Заявка на турнир отправлена';button.disabled=false;};
 item.append(select,button);
 }myTeams.append(item);
 if(team.status==='approved'){
 import('./team-player-editor.js?v=lineups-20261107').then(m=>m.mountTeamPlayerEditor({client,container:item,team,user})).catch(err=>{const p=el('p','Не удалось загрузить управление игроками: '+err.message);item.append(p);});
 }
 }
 }
 await refresh();
 const {data:isAdmin,error:adminError}=await client.rpc('fztv_is_admin');
 if(adminError || !isAdmin)return;
 heading('Админ-панель — заявки');
 const admin=el('section');root.append(admin);
 async function loadAdmin(){
 admin.replaceChildren();
 const allTeams=el('section');allTeams.append(el('h3','Управление командами'));
 const {data:teams,error:teamsError}=await client.from('fztv_teams').select('id,name,tag,status,logo_url').order('created_at',{ascending:false});
 if(teamsError){allTeams.append(el('p','Ошибка загрузки команд: '+teamsError.message));}
 else {
 allTeams.append(el('p','Всего команд: '+(teams||[]).length));
 for(const team of teams||[]){
 const line=el('div');line.className='rank-team';line.style.cssText='display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:10px';
 if(team.logo_url){const img=el('img');img.src=team.logo_url;img.alt='';img.width=40;img.height=40;img.style.cssText='width:40px;height:40px;object-fit:cover;border-radius:8px';line.append(img);}
 const info=el('span',team.name+' ['+team.tag+'] — '+team.status);info.style.flex='1';line.append(info);
 const remove=el('button','Удалить команду');remove.type='button';remove.className='toolbtn';remove.style.color='#ff6975';
 remove.onclick=async()=>{
 if(!window.confirm('Удалить команду «'+team.name+'» навсегда? Игроки и заявки команды на турниры также будут удалены.'))return;
 remove.disabled=true;msg.textContent='Удаление команды…';
 const {data,error}=await client.from('fztv_teams').delete().eq('id',team.id).select('id');
 if(error){msg.textContent='Ошибка удаления: '+error.message;remove.disabled=false;return;}
 if(!data?.length){msg.textContent='Удаление не подтверждено. Проверь права администратора.';remove.disabled=false;return;}
 msg.textContent='Команда «'+team.name+'» удалена';await loadAdmin();
 };
 line.append(remove);allTeams.append(line);
 }
 }
 admin.append(allTeams);
 for(const spec of [
 {table:'fztv_teams',title:'Новые команды',label:r=>r.name+' ['+r.tag+']'},
 {table:'fztv_tournament_applications',title:'Заявки на турниры',label:r=>r.team_id+' → '+r.tournament_id}
 ]){
 const group=el('div');group.append(el('h3',spec.title));
 const {data,error}=await client.from(spec.table).select('*').eq('status','pending').order('created_at',{ascending:true});
 if(error){group.append(el('p',error.message));admin.append(group);continue;}
 group.append(el('p','Ожидают модерации: '+(data||[]).length));
 for(const r of data||[]){const line=el('div');line.append(el('span',spec.label(r)+' '));
 for(const [status,caption] of [['approved','Одобрить'],['rejected','Отклонить']]){
 const b=el('button',caption);b.type='button';b.onclick=async()=>{b.disabled=true;const {error}=await client.from(spec.table).update({status}).eq('id',r.id);msg.textContent=error?'Ошибка: '+error.message:'Решение сохранено';await loadAdmin();};line.append(b);
 }group.append(line);}admin.append(group);
 }
 }
 await loadAdmin();
 const refreshButton=el('button','Обновить уведомления');refreshButton.type='button';refreshButton.onclick=loadAdmin;root.append(refreshButton);
}
