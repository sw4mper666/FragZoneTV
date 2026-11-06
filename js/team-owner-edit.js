// Team owner editor — names, countries and avatars, preserving the profile design.
(()=>{
 const css='.tw-profile .tw-facts,.tw-profile .tw-trophy{display:none!important}.fztv-team-edit-btn{margin-left:auto;padding:10px 16px;border-radius:8px;background:#213049;border:1px solid #536881;color:white;cursor:pointer}.fztv-team-edit{padding:17px;background:#142238;border:1px solid #3e5470;border-radius:10px;margin:14px 0}.fztv-team-edit[hidden]{display:none!important}.fztv-team-edit label{display:block;margin:11px 0;color:#b9cde7}.fztv-team-edit input{display:block;width:100%;max-width:550px;box-sizing:border-box;margin-top:6px;background:#101b2a;color:#fff;border:1px solid #40536b;padding:10px;border-radius:6px}.fztv-team-edit button{margin:8px 8px 0 0;padding:10px 16px;border:0;border-radius:7px;background:#e72a48;color:white;font-weight:800;cursor:pointer}.fztv-team-edit .cancel{background:#293a51}.fztv-team-edit img{display:block;width:90px;height:90px;object-fit:contain;margin:10px 0}';
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const app=document.getElementById('app');if(!app)return;
 let scheduled=false;
 async function mount(){
  const path=location.hash.split('/');if(!['team','team-created'].includes(path[1]))return;
  const profile=app.querySelector('.tw-profile'),header=profile?.querySelector('.tw-top');
  if(!header||header.dataset.teamEditMounted)return;header.dataset.teamEditMounted='loading';
  const heading=profile.querySelector('.tw-identity h1')||profile.querySelector('h1');
  if(!heading)return;
  const name=heading.textContent.trim();
  const {data:{user},error:userError}=await sb.auth.getUser();
  if(userError||!user||!header.isConnected)return;
  const {data:teams,error}=await sb.from('fztv_teams').select('id,name,country,logo_url,owner_id').eq('owner_id',user.id);
  if(error||!header.isConnected)return;
  const team=(teams||[]).find(t=>path[1]==='team-created'?t.id===path[2]:(path[2]==='woods'?t.id==='4f4585f3-f960-4b23-a835-de9d00cb10dd':t.name.toLowerCase()===name.toLowerCase()));
  if(!team)return;
  header.dataset.teamEditMounted='yes';
  heading.textContent=team.name;
  const oldLogo=header.querySelector('.tw-logo img');if(oldLogo&&team.logo_url)oldLogo.src=team.logo_url;
  const button=document.createElement('button');button.type='button';button.className='fztv-team-edit-btn';button.textContent='✎ Редактировать команду';header.append(button);
  const form=document.createElement('form');form.className='fztv-team-edit';form.hidden=true;
  const title=document.createElement('h3');title.textContent='Редактировать команду';form.append(title);
  const nameLabel=document.createElement('label');nameLabel.textContent='Название команды';
  const input=document.createElement('input');input.type='text';input.minLength=3;input.maxLength=40;input.required=true;input.value=team.name;nameLabel.append(input);form.append(nameLabel);
  const countryLabel=document.createElement('label');countryLabel.textContent='Страна команды';
  const country=document.createElement('select');country.required=true;country.style.cssText='display:block;width:100%;max-width:550px;box-sizing:border-box;margin-top:6px;background:#101b2a;color:white;border:1px solid #40536b;padding:10px;border-radius:6px';
  const countries=['Россия','Украина','Азербайджан','Беларусь','Казахстан','Германия','Франция','Польша','Швеция','США','Великобритания','Турция','Грузия','Армения','Узбекистан','Латвия','Литва','Эстония','Финляндия','Дания','Норвегия','Испания','Италия','Нидерланды','Чехия','Молдова','Румыния','Словакия','Канада','Бразилия','Международная'];
  if(team.country&&!countries.includes(team.country))countries.unshift(team.country);
  for(const item of countries){const option=document.createElement('option');option.value=item;option.textContent=item;country.append(option)}
  country.value=team.country||'Россия';countryLabel.append(country);form.append(countryLabel);
  const fileLabel=document.createElement('label');fileLabel.textContent='Аватар команды — JPG, PNG или WebP, до 2 МБ';
  const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';fileLabel.append(file);form.append(fileLabel);
  const preview=document.createElement('img');preview.alt='Аватар';if(team.logo_url)preview.src=team.logo_url;else preview.hidden=true;form.append(preview);
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Сохранить';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='cancel';cancel.textContent='Отмена';
  const message=document.createElement('p');message.setAttribute('role','status');form.append(submit,cancel,message);header.insertAdjacentElement('afterend',form);
  button.onclick=()=>{form.hidden=!form.hidden};
  cancel.onclick=()=>{form.hidden=true;input.value=team.name;country.value=team.country||'Россия';file.value=''};
  file.onchange=()=>{const selected=file.files?.[0];if(!selected)return;const url=URL.createObjectURL(selected);preview.src=url;preview.hidden=false;preview.onload=()=>URL.revokeObjectURL(url)};
  form.onsubmit=async e=>{
   e.preventDefault();if(submit.disabled)return;submit.disabled=true;message.textContent='Сохраняем…';
   try{
    const updated=input.value.trim();if(updated.length<3||updated.length>40)throw Error('Название должно содержать 3–40 символов');
    let logoUrl=null;const upload=file.files?.[0];
    if(upload){
     const kinds={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'},ext=kinds[upload.type];
     if(!ext||upload.size>2*1024*1024)throw Error('Допустимы JPG, PNG и WebP до 2 МБ');
     const key=user.id+'/'+crypto.randomUUID()+'.'+ext;
     const {error:uploadError}=await sb.storage.from('fztv-team-avatars').upload(key,upload,{upsert:false,contentType:upload.type,cacheControl:'3600'});
     if(uploadError)throw uploadError;
     logoUrl=sb.storage.from('fztv-team-avatars').getPublicUrl(key).data.publicUrl;
    }
    const {error:saveError}=await sb.rpc('fztv_owner_edit_team_details',{p_team_id:team.id,p_name:updated,p_logo_url:logoUrl,p_country:country.value});if(saveError)throw saveError;
    team.name=updated;team.country=country.value;if(logoUrl)team.logo_url=logoUrl;heading.textContent=updated;const countryText=header.querySelector('.tw-meta span');if(countryText)countryText.textContent=team.country;
    if(team.logo_url){const wrap=header.querySelector('.tw-logo');if(wrap){wrap.replaceChildren();const img=document.createElement('img');img.src=team.logo_url;img.alt=updated;wrap.append(img)}}
    message.textContent='Команда обновлена';form.hidden=true;
    if(typeof loadApprovedTeams==='function')loadApprovedTeams();
   }catch(err){message.textContent='Ошибка: '+(err.message||err)}
   finally{submit.disabled=false}
  };
 }
 function run(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;mount()},180)}
 new MutationObserver(run).observe(app,{childList:true,subtree:false});window.addEventListener('hashchange',run);run();
})();