
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pic = u => /^https:\/\/[^\s"'<>]+$/.test(u||'') ? u : '';
function initStyle(){
 if(document.getElementById('fztv-profile-v2-css'))return;
 const style=document.createElement('style');style.id='fztv-profile-v2-css';
 style.textContent="\n.fztv-account{max-width:1200px;margin:10px auto 50px;color:#edf2fa}\n.fztv-cover{height:164px;border:1px solid #27364a;border-radius:15px 15px 0 0;background:radial-gradient(circle at 65% 15%,#234d87,#172943 48%,#381c29 100%);position:relative;overflow:hidden}\n.fztv-cover:after{content:'';position:absolute;inset:0;opacity:.2;background-image:radial-gradient(#8faeda 1px,transparent 1px);background-size:20px 20px}\n.fztv-profile-head{padding:0 26px 20px;background:#101720;border:1px solid #29384b;border-top:0;border-radius:0 0 15px 15px;display:flex;align-items:center;gap:20px}\n.fztv-user-avatar{height:104px;width:104px;border:3px solid #397df5;border-radius:50%;background:#1e2c40;display:grid;place-items:center;font-size:46px;overflow:hidden;flex-shrink:0;margin-top:-50px;z-index:1;position:relative}\n.fztv-user-avatar img{width:100%;height:100%;object-fit:cover}\n.fztv-profile-head h1{font-size:26px;margin:10px 0 2px;font-weight:950;text-transform:uppercase}\n.fztv-profile-head p{color:#a8b5c7;margin:5px 0;font-size:13px}\n.fztv-profile-stat{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}\n.fztv-profile-stat article{padding:18px;border:1px solid #2a3b51;background:#101720;border-radius:12px;display:flex;gap:12px;align-items:center}\n.fztv-profile-stat b{display:block;font-size:20px}.fztv-profile-stat span{font-size:11px;color:#9dacbd}\n.fztv-profile-tabs{display:flex;gap:12px;border-bottom:1px solid #2b3b50;overflow-x:auto;margin:10px 0 20px}\n.fztv-profile-tabs button{color:#9aafc4;background:none;border:0;padding:14px 12px;cursor:pointer;white-space:nowrap;font-weight:800}\n.fztv-profile-tabs button.active{border-bottom:2px solid #448dff;color:#4a9dff}\n.fztv-profile-panel{display:none}.fztv-profile-panel.active{display:block}\n.fztv-settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}\n.fztv-settings-card{padding:22px;border:1px solid #29384c;background:#101720;border-radius:13px;min-width:0}\n.fztv-settings-card h3{margin:0 0 18px;font-size:17px}\n.fztv-settings-card form{display:grid;gap:12px}\n.fztv-settings-card label{display:grid;gap:7px;font-size:12px;color:#a0b0c2;font-weight:700}\n.fztv-settings-card input:not([type=checkbox]),.fztv-settings-card textarea{width:100%;background:#090e16;border:1px solid #324258;border-radius:5px;padding:12px;color:#e9eef8;font:inherit;box-sizing:border-box}\n.fztv-settings-card textarea{resize:vertical}\n.fztv-settings-card button[type=submit]{justify-self:start;background:#e83438;color:#fff;border:0;border-radius:5px;padding:11px 17px;font-weight:800;cursor:pointer}\n.fztv-settings-card button:disabled{opacity:.6;cursor:wait}\n.fztv-profile-help,.fztv-profile-message{font-size:12px;color:#a7b7c9;line-height:1.5}\n.fztv-profile-message{min-height:19px}\n.fztv-pw-check{display:flex!important;align-items:center;gap:10px!important}\n.fztv-news-comments{border-top:1px solid #29364b;margin-top:20px;padding-top:16px}\n.fztv-news-comments h3{font-size:16px;margin:0 0 12px}\n.fztv-comment{background:#0d141f;border:1px solid #243146;border-radius:9px;padding:12px;margin:9px 0}\n.fztv-comment-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:#aebed3}\n.fztv-comment p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:7px 0 0}\n.fztv-comment-form{display:grid;gap:10px;margin-top:14px}\n.fztv-comment-form textarea{width:100%;background:#080d15;color:#fff;border:1px solid #2f4057;border-radius:7px;padding:12px;resize:vertical;font:inherit;box-sizing:border-box}\n.fztv-comment-form button{justify-self:start;border:0;border-radius:5px;padding:9px 14px;background:#e83438;color:#fff;cursor:pointer;font-weight:800}\n.fztv-comment-delete{background:none!important;color:#fa7980!important;padding:0!important;font-weight:600!important}\n@media(max-width:760px){.fztv-profile-head{padding:0 14px 15px;gap:12px}.fztv-user-avatar{height:78px;width:78px;margin-top:-33px}.fztv-profile-head h1{font-size:19px}.fztv-profile-stat{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fztv-profile-stat article{padding:12px}.fztv-settings-grid{grid-template-columns:1fr}.fztv-cover{height:120px}}\n";
 document.head.append(style);
}
const dateFmt = iso => iso ? new Date(iso).toLocaleDateString('ru-RU') : '—';

export async function mountAccount({client,root,user,onUpdated}){
 if(!root || !user)return;
 initStyle();
 const uid=user.id;
 const avatar=pic(user.avatar_url);
 const initial=esc(String(user.login||'U').slice(0,1).toUpperCase());
 root.innerHTML='<div class="fztv-account"><div class="fztv-cover"></div>'+
 '<div class="fztv-profile-head"><div class="fztv-user-avatar" id="fztvMyAvatar">'+(avatar?'<img alt="Аватар" src="'+esc(avatar)+'">':initial)+'</div><div><h1>'+esc(user.login||'Игрок')+'</h1><p>'+esc(user.email||'')+'</p><p>🟢 Мой профиль · На сайте с '+esc(dateFmt(user.created_at))+'</p></div></div>'+
 '<div class="fztv-profile-stat"><article>🛡️ <div><b id="fztvMyTeams">—</b><span>МОИХ КОМАНД</span></div></article><article>💬 <div><b id="fztvMyComments">—</b><span>КОММЕНТАРИЕВ</span></div></article><article>⭐ <div><b>'+esc(user.points||0)+'</b><span>БАЛЛОВ</span></div></article><article>📅 <div><b>'+esc(dateFmt(user.created_at))+'</b><span>ДАТА РЕГИСТРАЦИИ</span></div></article></div>'+
 '<div class="fztv-profile-tabs"><button type="button" data-fztv-tab="overview">Обзор</button><button type="button" data-fztv-tab="teams">Команды</button><button type="button" data-fztv-tab="settings" class="active">Настройки профиля</button></div>'+
 '<section class="fztv-profile-panel" data-fztv-panel="overview"><div class="fztv-settings-card"><h3>👤 Обо мне</h3><p id="fztvAbout">'+esc(user.bio||'Описание ещё не добавлено.')+'</p><button type="button" data-fztv-tab-open="settings" class="toolbtn">Редактировать профиль</button></div></section>'+
 '<section class="fztv-profile-panel" data-fztv-panel="teams"><div class="fztv-settings-card"><h3>🛡️ Мои команды</h3><div id="fztvMyTeamsList">Загрузка…</div></div></section>'+
 '<section class="fztv-profile-panel active" data-fztv-panel="settings"><div class="fztv-settings-grid">'+
 '<div class="fztv-settings-card"><h3>🖼️ Аватар профиля</h3><form id="fztvAvatarForm"><label>Выберите изображение (JPG, PNG, WebP, до 3 МБ)<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required></label><button type="submit">Сохранить аватарку</button><div class="fztv-profile-message" id="fztvAvatarMessage" role="status"></div></form><hr style="border:0;border-top:1px solid #26364a;margin:20px 0"><h3>🙋 О себе</h3><form id="fztvBioForm"><label>Никнейм<input value="'+esc(user.login||'')+'" disabled></label><label>Описание<textarea name="bio" rows="5" maxlength="500" placeholder="Расскажи о себе">'+esc(user.bio||'')+'</textarea></label><button type="submit">Сохранить описание</button><div class="fztv-profile-message" id="fztvBioMessage" role="status"></div></form></div>'+
 '<div class="fztv-settings-card"><h3>🔒 Смена пароля</h3><p class="fztv-profile-help">Можно установить новый пароль. Старый пароль посмотреть невозможно.</p><form id="fztvPasswordForm"><label>Новый пароль<input type="password" name="password" minlength="8" autocomplete="new-password" required></label><label>Повторите пароль<input type="password" name="confirm" minlength="8" autocomplete="new-password" required></label><label class="fztv-pw-check"><input type="checkbox" id="fztvShowPassword"> Показать вводимый пароль</label><button type="submit">Сохранить пароль</button><div class="fztv-profile-message" id="fztvPasswordMessage" role="status"></div></form><p style="margin-top:24px"><button type="button" class="auth-logout" id="fztvAccountLogout">Выйти из аккаунта</button></p></div></div></section></div>';
 const setTab=name=>{
  root.querySelectorAll('[data-fztv-tab]').forEach(x=>x.classList.toggle('active',x.dataset.fztvTab===name));
  root.querySelectorAll('[data-fztv-panel]').forEach(x=>x.classList.toggle('active',x.dataset.fztvPanel===name));
 };
 root.querySelectorAll('[data-fztv-tab]').forEach(x=>x.addEventListener('click',()=>setTab(x.dataset.fztvTab)));
 root.querySelector('[data-fztv-tab-open]').addEventListener('click',()=>setTab('settings'));
 root.querySelector('#fztvAccountLogout').addEventListener('click',async()=>{await client.auth.signOut();if(onUpdated)await onUpdated()});
 root.querySelector('#fztvShowPassword').addEventListener('change',e=>root.querySelectorAll('#fztvPasswordForm input[type=password],#fztvPasswordForm input[type=text]').forEach(x=>x.type=e.target.checked?'text':'password'));
 const teamsQ=client.from('fztv_teams').select('id,name,status').eq('owner_id',uid);
 const commentsQ=client.from('fztv_news_comments').select('id',{count:'exact',head:true}).eq('user_id',uid);
 Promise.all([teamsQ,commentsQ]).then(([teams,comments])=>{
  if(!root.isConnected)return;
  root.querySelector('#fztvMyTeams').textContent=teams.error?'—':String((teams.data||[]).length);
  root.querySelector('#fztvMyComments').textContent=comments.error?'—':String(comments.count||0);
  root.querySelector('#fztvMyTeamsList').textContent='';
  (teams.data||[]).forEach(t=>{const p=document.createElement('p');p.textContent=t.name+' · '+(t.status==='approved'?'Одобрена':t.status==='pending'?'На модерации':t.status||'');root.querySelector('#fztvMyTeamsList').append(p)});
  if(!(teams.data||[]).length)root.querySelector('#fztvMyTeamsList').textContent=teams.error?'Не удалось получить команды.':'Команд пока нет.';
 });
 const avatarForm=root.querySelector('#fztvAvatarForm');
 avatarForm.addEventListener('submit',async e=>{
  e.preventDefault();const file=avatarForm.elements.avatar.files?.[0],msg=root.querySelector('#fztvAvatarMessage'),btn=avatarForm.querySelector('button');msg.textContent='';
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024){msg.textContent='Выберите JPG, PNG или WebP до 3 МБ.';return}
  btn.disabled=true;
  try{
   const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
   const path=uid+'/avatar-'+Date.now()+'.'+ext;
   const {error:uploadError}=await client.storage.from('fztv-player-photos').upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   const url=client.storage.from('fztv-player-photos').getPublicUrl(path).data.publicUrl;
   const {error}=await client.from('profiles').update({avatar_url:url}).eq('id',uid);
   if(error)throw error;
   const el=root.querySelector('#fztvMyAvatar');el.innerHTML='<img alt="Аватар" src="'+esc(url)+'">';
   msg.textContent='Аватарка обновлена.';
   if(onUpdated)await onUpdated();
  }catch(err){msg.textContent=err.message||'Ошибка загрузки аватарки.'}finally{btn.disabled=false}
 });
 root.querySelector('#fztvBioForm').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,msg=root.querySelector('#fztvBioMessage'),btn=form.querySelector('button');btn.disabled=true;
  try{const bio=form.elements.bio.value.trim();const {error}=await client.from('profiles').update({bio}).eq('id',uid);if(error)throw error;root.querySelector('#fztvAbout').textContent=bio||'Описание ещё не добавлено.';msg.textContent='Описание сохранено.';if(onUpdated)await onUpdated()}catch(err){msg.textContent=err.message}finally{btn.disabled=false}
 });
 root.querySelector('#fztvPasswordForm').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,msg=root.querySelector('#fztvPasswordMessage'),btn=form.querySelector('button');
  const password=form.elements.password.value;
  if(password.length<8||password!==form.elements.confirm.value){msg.textContent='Проверьте длину (от 8 символов) и совпадение паролей.';return}
  btn.disabled=true;
  try{const {error}=await client.auth.updateUser({password});if(error)throw error;form.reset();form.querySelectorAll('input[name=password],input[name=confirm]').forEach(x=>x.type='password');msg.textContent='Пароль изменён. Теперь можно войти на другом устройстве.'}catch(err){msg.textContent=err.message||'Не удалось сменить пароль.'}finally{btn.disabled=false}
 });
}

export async function mountNewsComments({client,root,user}){
 initStyle();
 const mounts=[...root.querySelectorAll('.fztv-comment-mount')];
 if(!mounts.length)return;
 const ids=mounts.map(x=>x.dataset.newsId);
 const {data, error}=await client.from('fztv_news_comments').select('id,news_id,user_id,author_name,body,created_at').in('news_id',ids).order('created_at',{ascending:true}).limit(500);
 if(error){mounts.forEach(x=>x.textContent='Комментарии временно недоступны.');return}
 for(const mount of mounts){
  if(!mount.isConnected)continue;
  const newsId=mount.dataset.newsId;
  const comments=(data||[]).filter(x=>x.news_id===newsId);
  const box=document.createElement('div');box.className='fztv-news-comments';
  const title=document.createElement('h3');title.textContent='💬 Комментарии ('+comments.length+')';box.append(title);
  for(const item of comments){
   const el=document.createElement('div');el.className='fztv-comment';
   el.innerHTML='<div class="fztv-comment-head"><strong>'+esc(item.author_name)+'</strong><span>'+esc(dateFmt(item.created_at))+'</span></div><p>'+esc(item.body)+'</p>';
   if(user && user.id===item.user_id){
    const del=document.createElement('button');del.className='fztv-comment-delete';del.textContent='Удалить';el.append(del);
    del.onclick=async()=>{if(!confirm('Удалить комментарий?'))return;del.disabled=true;const {error}=await client.from('fztv_news_comments').delete().eq('id',item.id).eq('user_id',user.id);if(error){alert(error.message);del.disabled=false;return}el.remove();title.textContent='💬 Комментарии ('+(--commentCount)+')'};
   }
   box.append(el);
  }
  let commentCount=comments.length;
  if(user){
   const form=document.createElement('form');form.className='fztv-comment-form';form.innerHTML='<textarea name="body" rows="3" maxlength="1500" required placeholder="Оставить комментарий…"></textarea><button type="submit">Отправить комментарий</button><div class="fztv-profile-message" role="status"></div>';
   form.onsubmit=async e=>{
    e.preventDefault();const value=form.elements.body.value.trim(),btn=form.querySelector('button'),msg=form.querySelector('[role=status]');
    if(!value||value.length>1500)return;
    btn.disabled=true;msg.textContent='';
    const {error}=await client.from('fztv_news_comments').insert({news_id:newsId,user_id:user.id,author_name:String(user.login||user.email?.split('@')[0]||'Игрок').slice(0,80),body:value});
    if(error){msg.textContent=error.message;btn.disabled=false;return}
    const comment=document.createElement('div');comment.className='fztv-comment';comment.innerHTML='<div class="fztv-comment-head"><strong>'+esc(user.login||'Игрок')+'</strong><span>Только что</span></div><p>'+esc(value)+'</p>';
    box.insertBefore(comment,form);title.textContent='💬 Комментарии ('+(++commentCount)+')';form.reset();btn.disabled=false;
    const reload=document.createElement('button');reload.className='fztv-comment-delete';reload.textContent='Обновить комментарии';reload.onclick=()=>{location.reload()};comment.append(reload);
   };
   box.append(form);
  }else{
   const p=document.createElement('p');p.className='fztv-profile-help';p.innerHTML='Чтобы оставить комментарий, <a href="#/auth" style="color:#63a9ff">войдите в аккаунт</a>.';box.append(p);
  }
  mount.replaceChildren(box);
 }
}
