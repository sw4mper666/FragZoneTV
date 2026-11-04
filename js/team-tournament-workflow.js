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
 root.replaceChildren();heading('Регистрация команды');
 const form=el('form'),name=field('Название команды'),tag=field('Тег (2–5 символов)'),country=field('Страна',false);
 tag.input.maxLength=5;form.append(name.wrap,tag.wrap,country.wrap);
 const submit=el('button','Отправить на модерацию');submit.type='submit';form.append(submit);root.append(form,msg);
 form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;msg.textContent='Отправляем заявку…';
 const {error}=await client.from('fztv_teams').insert({name:name.input.value.trim(),tag:tag.input.value.trim(),country:country.input.value.trim(),owner_id:user.id,status:'pending'});
 msg.textContent=error?'Ошибка: '+error.message:'Команда отправлена на модерацию';if(!error)form.reset();submit.disabled=false;await refresh();});
 const myTeams=el('section');root.append(myTeams);
 async function refresh(){
 myTeams.replaceChildren(el('h2','Мои команды'));
 const {data:teams,error}=await client.from('fztv_teams').select('id,name,tag,status').eq('owner_id',user.id).order('created_at',{ascending:false});
 if(error){myTeams.append(el('p',error.message));return;}
 const {data:tournaments}=await client.from('tournaments').select('id,name,status').eq('status','registration');
 for(const team of teams||[]){
 const item=el('div');item.append(el('strong',team.name+' ['+team.tag+'] — '+team.status));
 if(team.status==='approved'){
 const select=el('select');for(const t of tournaments||[]){const option=el('option',t.name);option.value=t.id;select.append(option);}
 const button=el('button','Подать заявку на турнир');button.type='button';button.disabled=!select.options.length;
 button.onclick=async()=>{button.disabled=true;const {error}=await client.from('fztv_tournament_applications').insert({team_id:team.id,tournament_id:select.value,owner_id:user.id});msg.textContent=error?'Ошибка: '+error.message:'Заявка на турнир отправлена';button.disabled=false;};
 item.append(select,button);
 }myTeams.append(item);
 }
 }
 await refresh();
 const {data:isAdmin,error:adminError}=await client.rpc('fztv_is_admin');
 if(adminError || !isAdmin)return;
 heading('Админ-панель — заявки');
 const admin=el('section');root.append(admin);
 async function loadAdmin(){
 admin.replaceChildren();
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
