
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pic = u => /^https:\/\/[^\s"'<>]+$/.test(u||'') ? u : '';
const FZTV_FOUNDER_ID = '7bbbb578-cc89-436b-8076-54235bf17e36';
const founderMark = id => String(id||'').toLowerCase() === FZTV_FOUNDER_ID
  ? '<span class="fztv-founder-mark" title="Основатель платформы FragZoneTV">👑 Создатель</span>'
  : '';
const founderPanel = id => String(id||'').toLowerCase() === FZTV_FOUNDER_ID
  ? '<div class="fztv-founder-description"><span class="fztv-founder-emblem">♛</span><div><strong>СОЗДАТЕЛЬ FRAGZONETV</strong><small>Основатель и главный разработчик платформы</small></div></div>'
  : '';

function initStyle(){
 if(document.getElementById('fztv-profile-v2-css'))return;
 const style=document.createElement('style');style.id='fztv-profile-v2-css';
 style.textContent="\n.fztv-account{max-width:1200px;margin:10px auto 50px;color:#edf2fa}\n.fztv-cover{height:164px;border:1px solid #27364a;border-radius:15px 15px 0 0;background:radial-gradient(circle at 65% 15%,#234d87,#172943 48%,#381c29 100%);position:relative;overflow:hidden}\n.fztv-cover:after{content:'';position:absolute;inset:0;opacity:.2;background-image:radial-gradient(#8faeda 1px,transparent 1px);background-size:20px 20px}\n.fztv-profile-head{padding:0 26px 20px;background:#101720;border:1px solid #29384b;border-top:0;border-radius:0 0 15px 15px;display:flex;align-items:center;gap:20px}\n.fztv-user-avatar{height:104px;width:104px;border:3px solid #397df5;border-radius:50%;background:#1e2c40;display:grid;place-items:center;font-size:46px;overflow:hidden;flex-shrink:0;margin-top:-50px;z-index:1;position:relative}\n.fztv-user-avatar img{width:100%;height:100%;object-fit:cover}\n.fztv-profile-head h1{font-size:26px;margin:10px 0 2px;font-weight:950;text-transform:uppercase}\n.fztv-profile-head p{color:#a8b5c7;margin:5px 0;font-size:13px}\n.fztv-profile-stat{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}\n.fztv-profile-stat article{padding:18px;border:1px solid #2a3b51;background:#101720;border-radius:12px;display:flex;gap:12px;align-items:center}\n.fztv-profile-stat b{display:block;font-size:20px}.fztv-profile-stat span{font-size:11px;color:#9dacbd}\n.fztv-profile-tabs{display:flex;gap:12px;border-bottom:1px solid #2b3b50;overflow-x:auto;margin:10px 0 20px}\n.fztv-profile-tabs button{color:#9aafc4;background:none;border:0;padding:14px 12px;cursor:pointer;white-space:nowrap;font-weight:800}\n.fztv-profile-tabs button.active{border-bottom:2px solid #448dff;color:#4a9dff}\n.fztv-profile-panel{display:none}.fztv-profile-panel.active{display:block}\n.fztv-settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}\n.fztv-settings-card{padding:22px;border:1px solid #29384c;background:#101720;border-radius:13px;min-width:0}\n.fztv-settings-card h3{margin:0 0 18px;font-size:17px}\n.fztv-settings-card form{display:grid;gap:12px}\n.fztv-settings-card label{display:grid;gap:7px;font-size:12px;color:#a0b0c2;font-weight:700}\n.fztv-settings-card input:not([type=checkbox]),.fztv-settings-card textarea{width:100%;background:#090e16;border:1px solid #324258;border-radius:5px;padding:12px;color:#e9eef8;font:inherit;box-sizing:border-box}\n.fztv-settings-card textarea{resize:vertical}\n.fztv-settings-card button[type=submit]{justify-self:start;background:#e83438;color:#fff;border:0;border-radius:5px;padding:11px 17px;font-weight:800;cursor:pointer}\n.fztv-settings-card button:disabled{opacity:.6;cursor:wait}\n.fztv-profile-help,.fztv-profile-message{font-size:12px;color:#a7b7c9;line-height:1.5}\n.fztv-profile-message{min-height:19px}\n.fztv-pw-check{display:flex!important;align-items:center;gap:10px!important}\n.fztv-news-comments{border-top:1px solid #29364b;margin-top:20px;padding-top:16px}\n.fztv-news-comments h3{font-size:16px;margin:0 0 12px}\n.fztv-comment{background:#0d141f;border:1px solid #243146;border-radius:9px;padding:12px;margin:9px 0}\n.fztv-comment-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:#aebed3}\n.fztv-comment p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:7px 0 0}\n.fztv-comment-form{display:grid;gap:10px;margin-top:14px}\n.fztv-comment-form textarea{width:100%;background:#080d15;color:#fff;border:1px solid #2f4057;border-radius:7px;padding:12px;resize:vertical;font:inherit;box-sizing:border-box}\n.fztv-comment-form button{justify-self:start;border:0;border-radius:5px;padding:9px 14px;background:#e83438;color:#fff;cursor:pointer;font-weight:800}\n.fztv-comment-delete{background:none!important;color:#fa7980!important;padding:0!important;font-weight:600!important}\n@media(max-width:760px){.fztv-profile-head{padding:0 14px 15px;gap:12px}.fztv-user-avatar{height:78px;width:78px;margin-top:-33px}.fztv-profile-head h1{font-size:19px}.fztv-profile-stat{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fztv-profile-stat article{padding:12px}.fztv-settings-grid{grid-template-columns:1fr}.fztv-cover{height:120px}}\n";
 style.textContent += "\n.fztv-cover[data-banner-color=\"red\"]{background:linear-gradient(120deg,#3c1429,#8b2935 52%,#381325)}\n.fztv-cover[data-banner-color=\"green\"]{background:linear-gradient(120deg,#102c25,#1d7551 55%,#0a2a36)}\n.fztv-cover[data-banner-color=\"purple\"]{background:linear-gradient(120deg,#1c1d45,#713791 55%,#361c55)}\n.fztv-cover[data-banner-color=\"orange\"]{background:linear-gradient(120deg,#3c2032,#ae5825 55%,#57321c)}\n.fztv-cover[data-banner-color=\"cyan\"]{background:linear-gradient(120deg,#11304b,#177d9b 55%,#102a42)}\n.fztv-cover[data-banner-color=\"gold\"]{background:linear-gradient(120deg,#393023,#947128 55%,#4a3029)}\n.fztv-cover[data-banner-color=\"slate\"]{background:linear-gradient(120deg,#0f1621,#35445a 55%,#161d2b)}\n.fztv-banner-options{display:flex;flex-wrap:wrap;gap:9px;margin:11px 0}\n.fztv-banner-choice{height:37px;width:47px;border:2px solid #465369;border-radius:8px;cursor:pointer}\n.fztv-banner-choice:hover{transform:translateY(-2px)}\n.fztv-banner-choice[aria-pressed=\"true\"]{border-color:#fff;box-shadow:0 0 0 2px #468bff}\n";
 style.textContent += '.fztv-founder-mark{display:inline-flex;align-items:center;gap:6px;margin-left:10px;padding:5px 11px;border-radius:6px;border:1px solid #d9ad56;background:linear-gradient(110deg,#6d4a21,#2b241b);color:#ffdf8e;font-size:11px;font-weight:900;vertical-align:middle;letter-spacing:.3px;text-transform:none;white-space:nowrap;box-shadow:0 0 12px #dbad3633}.fztv-founder-description{display:flex;align-items:center;gap:14px;margin:16px 0 0;background:linear-gradient(110deg,#302519,#141a25);border:1px solid #907038;border-radius:12px;padding:13px 18px;color:#f7d993}.fztv-founder-emblem{display:grid;place-items:center;font-size:29px;width:48px;height:48px;border-radius:12px;background:#6e512327}.fztv-founder-description strong{display:block;font-size:13px;letter-spacing:1.2px}.fztv-founder-description small{display:block;font-size:12px;color:#c8ac77;margin-top:4px}@media(max-width:650px){.fztv-founder-mark{display:table;margin:7px 0 0}.fztv-founder-description{margin-top:12px}}';
 document.head.append(style);
}
const dateFmt = iso => iso ? new Date(iso).toLocaleDateString('ru-RU') : '—';
const joinedFmt = iso => {
 if (!iso) return 'дата регистрации неизвестна';
 const d=new Date(iso);
 return Number.isNaN(d.getTime())?'дата регистрации неизвестна':d.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
};
const activityLabel = iso => {
 if (!iso) return '⚪ Не в сети · Последняя активность пока неизвестна';
 const delta=Date.now()-new Date(iso).getTime();
 if (delta>=0 && delta<150000) return '🟢 В сети';
 return '⚪ Не в сети · Последняя активность: '+new Date(iso).toLocaleString('ru-RU',{dateStyle:'medium',timeStyle:'short'});
};
async function showActivity(client,root,uid) {
 const {data,error}=await client.from('fztv_member_activity').select('last_seen').eq('user_id',uid).maybeSingle();
 const label=root.querySelector('[data-fztv-member-activity]');
 if(label && !error)label.textContent=activityLabel(data?.last_seen);
}

export async function mountAccount({client,root,user,onUpdated}){
 if(!root || !user)return;
 initStyle();
 const uid=user.id;
 const avatar=pic(user.avatar_url);
 const initial=esc(String(user.login||'U').slice(0,1).toUpperCase());
 root.innerHTML='<div class="fztv-account"><div class="fztv-cover" data-banner-color="'+esc(['blue','red','green','purple','orange','cyan','gold','slate'].includes(user.banner_color)?user.banner_color:'blue')+'"></div>'+
 '<div class="fztv-profile-head"><div class="fztv-user-avatar" id="fztvMyAvatar">'+(avatar?'<img alt="Аватар" src="'+esc(avatar)+'">':initial)+'</div><div><h1>'+esc(user.login||'Игрок') + founderMark(uid)+'</h1><p>'+esc(user.email||'')+'</p><p><span data-fztv-member-activity>⚪ Статус загружается…</span> · На FragZoneTV с '+esc(joinedFmt(user.created_at))+'</p></div></div>'+
 '<div class="fztv-profile-stat"><article>🛡️ <div><b id="fztvMyTeams">—</b><span>МОИХ КОМАНД</span></div></article><article>💬 <div><b id="fztvMyComments">—</b><span>КОММЕНТАРИЕВ</span></div></article><article>⭐ <div><b>'+esc(user.points||0)+'</b><span>БАЛЛОВ</span></div></article><article>📅 <div><b>'+esc(dateFmt(user.created_at))+'</b><span>ДАТА РЕГИСТРАЦИИ</span></div></article></div>'+
 '<div class="fztv-profile-tabs"><button type="button" data-fztv-tab="overview">Обзор</button><button type="button" data-fztv-tab="teams">Команды</button><button type="button" data-fztv-tab="settings" class="active">Настройки профиля</button></div>'+
 '<section class="fztv-profile-panel" data-fztv-panel="overview">'+founderPanel(uid)+'<div class="fztv-settings-card"><h3>👤 Обо мне</h3><p id="fztvAbout">'+esc(user.bio||'Описание ещё не добавлено.')+'</p><button type="button" data-fztv-tab-open="settings" class="toolbtn">Редактировать профиль</button></div></section>'+
 '<section class="fztv-profile-panel" data-fztv-panel="teams"><div class="fztv-settings-card"><h3>🛡️ Мои команды</h3><div id="fztvMyTeamsList">Загрузка…</div></div></section>'+
 '<section class="fztv-profile-panel active" data-fztv-panel="settings"><div class="fztv-settings-grid">'+
 '<div class="fztv-settings-card"><h3>🖼️ Аватар профиля</h3><form id="fztvAvatarForm"><label>Выберите изображение (JPG, PNG, WebP, до 3 МБ)<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required></label><button type="submit">Сохранить аватарку</button><div class="fztv-profile-message" id="fztvAvatarMessage" role="status"></div></form><hr style="border:0;border-top:1px solid #26364a;margin:20px 0"><h3>🎨 Цвет фона шапки</h3><p class="fztv-profile-help">Выбери цвет фона своего профиля.</p><div class="fztv-banner-options" id="fztvBannerOptions"><button type="button" class="fztv-banner-choice" data-color="blue" style="background:#234d87" aria-label="Цвет blue" aria-pressed="'+(user.banner_color==='blue'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="red" style="background:#8b2935" aria-label="Цвет red" aria-pressed="'+(user.banner_color==='red'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="green" style="background:#1d7551" aria-label="Цвет green" aria-pressed="'+(user.banner_color==='green'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="purple" style="background:#713791" aria-label="Цвет purple" aria-pressed="'+(user.banner_color==='purple'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="orange" style="background:#ae5825" aria-label="Цвет orange" aria-pressed="'+(user.banner_color==='orange'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="cyan" style="background:#177d9b" aria-label="Цвет cyan" aria-pressed="'+(user.banner_color==='cyan'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="gold" style="background:#947128" aria-label="Цвет gold" aria-pressed="'+(user.banner_color==='gold'?'true':'false')+'"></button><button type="button" class="fztv-banner-choice" data-color="slate" style="background:#35445a" aria-label="Цвет slate" aria-pressed="'+(user.banner_color==='slate'?'true':'false')+'"></button></div><div class="fztv-profile-message" id="fztvBannerMessage" role="status"></div><hr style="border:0;border-top:1px solid #26364a;margin:20px 0"><h3>🙋 О себе</h3><form id="fztvBioForm"><label>Никнейм<input name="login" value="'+esc(user.login||'')+'" minlength="3" maxlength="24" pattern="[A-Za-zА-Яа-яЁё0-9_.-]{3,24}" title="От 3 до 24 символов: буквы, цифры, точка, дефис и подчёркивание" autocomplete="nickname" required></label><p class="fztv-profile-help">От 3 до 24 символов. Этот ник увидят другие игроки в комментариях и профиле.</p><label>Описание<textarea name="bio" rows="5" maxlength="500" placeholder="Расскажи о себе">'+esc(user.bio||'')+'</textarea></label><button type="submit">Сохранить описание</button><div class="fztv-profile-message" id="fztvBioMessage" role="status"></div></form></div>'+
 '<div class="fztv-settings-card"><h3>🔒 Смена пароля</h3><p class="fztv-profile-help">Можно установить новый пароль. Старый пароль посмотреть невозможно.</p><form id="fztvPasswordForm"><label>Новый пароль<input type="password" name="password" minlength="8" autocomplete="new-password" required></label><label>Повторите пароль<input type="password" name="confirm" minlength="8" autocomplete="new-password" required></label><label class="fztv-pw-check"><input type="checkbox" id="fztvShowPassword"> Показать вводимый пароль</label><button type="submit">Сохранить пароль</button><div class="fztv-profile-message" id="fztvPasswordMessage" role="status"></div></form><p style="margin-top:24px"><button type="button" class="auth-logout" id="fztvAccountLogout">Выйти из аккаунта</button></p></div></div></section></div>';
 showActivity(client,root,uid);
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
 root.querySelectorAll('#fztvBannerOptions [data-color]').forEach(button=>button.addEventListener('click',async()=>{const color=button.dataset.color;const msg=root.querySelector('#fztvBannerMessage');msg.textContent='Сохранение…';root.querySelectorAll('#fztvBannerOptions button').forEach(b=>b.disabled=true);try{const {error}=await client.from('profiles').update({banner_color:color}).eq('id',uid);if(error)throw error;root.querySelector('.fztv-cover').dataset.bannerColor=color;root.querySelectorAll('#fztvBannerOptions [data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===color)));msg.textContent='Цвет фона сохранён.';}catch(err){msg.textContent='Не удалось сохранить цвет: '+(err.message||'ошибка')}finally{root.querySelectorAll('#fztvBannerOptions button').forEach(b=>b.disabled=false)}}));
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
  try{const bio=form.elements.bio.value.trim(),login=form.elements.login.value.trim();if(!/^[A-Za-zА-Яа-яЁё0-9_.-]{3,24}$/.test(login)){msg.textContent='Ник должен содержать от 3 до 24 символов: буквы, цифры, точку, дефис или подчёркивание.';return}const {data, error}=await client.from('profiles').update({bio,login}).eq('id',uid).select('id,login,bio').single();if(error)throw error;root.querySelector('#fztvAbout').textContent=data.bio||'Описание ещё не добавлено.';const heading=root.querySelector('.fztv-profile-head h1');if(heading)heading.textContent=data.login;msg.textContent='Никнейм и описание сохранены.';if(onUpdated)await onUpdated()}catch(err){msg.textContent=err.message||'Не удалось сохранить профиль.'}finally{btn.disabled=false}
 });
 root.querySelector('#fztvPasswordForm').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,msg=root.querySelector('#fztvPasswordMessage'),btn=form.querySelector('button');
  const password=form.elements.password.value;
  if(password.length<8||password!==form.elements.confirm.value){msg.textContent='Проверьте длину (от 8 символов) и совпадение паролей.';return}
  btn.disabled=true;
  try{const {error}=await client.auth.updateUser({password});if(error)throw error;form.reset();form.querySelectorAll('input[name=password],input[name=confirm]').forEach(x=>x.type='password');msg.textContent='Пароль изменён. Теперь можно войти на другом устройстве.'}catch(err){msg.textContent=err.message||'Не удалось сменить пароль.'}finally{btn.disabled=false}
 });
}


function memberHref(id){
 return /^[-0-9a-f]{36}$/i.test(String(id||''))?'#/member/'+encodeURIComponent(id):'#/players';
}
function authorIdentity(p,name){
 const username=esc(p?.login||name||'Игрок');
 const avatar=pic(p?.avatar_url);
 const icon=avatar?'<img alt="" loading="lazy" src="'+esc(avatar)+'">':esc((p?.login||name||'?').slice(0,1).toUpperCase());
 return '<a class="fztv-comment-author" href="'+memberHref(p?.id)+'" title="Открыть профиль"><span class="fztv-comment-avatar">'+icon+'</span><strong>'+username+'</strong></a>';
}
function commentHtml(item,author,canDelete){
 const identity=authorIdentity(author||{id:item.user_id},item.author_name);
 return '<div class="fztv-comment-head">'+identity+'<span>'+esc(dateFmt(item.created_at))+'</span></div>'+
   '<p>'+esc(item.body)+'</p>'+(canDelete?'<button type="button" class="fztv-comment-delete">Удалить</button>':'');
}
function addAuthorStyles(){
 if(document.getElementById('fztv-comment-author-css'))return;
 const e=document.createElement('style');e.id='fztv-comment-author-css';
 e.textContent='.fztv-comment-author{display:inline-flex;align-items:center;gap:9px;text-decoration:none;color:#e8f0fc;font-weight:750;min-width:0}.fztv-comment-author:hover{color:#6faeff}.fztv-comment-avatar{width:34px;height:34px;flex-shrink:0;display:grid;place-items:center;border-radius:50%;background:#293d59;color:white;font-weight:900;border:1px solid #3d5778;overflow:hidden}.fztv-comment-avatar img{width:100%;height:100%;object-fit:cover}.fztv-comment-head{align-items:center}.fztv-public-profile{max-width:850px;margin:20px auto}.fztv-public-profile .fztv-profile-head{align-items:center}.fztv-public-profile .fztv-public-bio{background:#111923;border:1px solid #29384c;border-radius:12px;padding:20px;margin-top:18px;white-space:pre-wrap;line-height:1.5}';
 document.head.append(e);
}
export async function mountNewsComments({client,root,user}){
 initStyle();addAuthorStyles();
 const mounts=[...root.querySelectorAll('.fztv-comment-mount')];
 if(!mounts.length)return;
 const ids=mounts.map(x=>x.dataset.newsId);
 const {data,error}=await client.from('fztv_news_comments')
  .select('id,news_id,user_id,author_name,body,created_at')
  .in('news_id',ids).order('created_at',{ascending:true}).limit(500);
 if(error){mounts.forEach(x=>x.textContent='Комментарии временно недоступны.');return}
 const comments=data||[];
 const authorIds=[...new Set(comments.map(x=>x.user_id).filter(Boolean).concat(user?.id?[user.id]:[]))];
 let authors=new Map();
 if(authorIds.length){
  const result=await client.from('fztv_public_profiles').select('id,login,avatar_url').in('id',authorIds);
  if(!result.error)authors=new Map((result.data||[]).map(p=>[p.id,p]));
 }
 const makeComment=(item,container,title,adjust)=>{
  const card=document.createElement('div');card.className='fztv-comment';
  const own=!!(user&&item.user_id===user.id);
  card.innerHTML=commentHtml(item,authors.get(item.user_id),own);
  if(own){
   const del=card.querySelector('.fztv-comment-delete');
   del.onclick=async()=>{
    if(!confirm('Удалить комментарий?'))return;
    del.disabled=true;
    const {error}=await client.from('fztv_news_comments').delete().eq('id',item.id).eq('user_id',user.id);
    if(error){del.disabled=false;alert(error.message);return}
    card.remove();adjust(-1);
   };
  }
  container.append(card);
 };
 for(const mount of mounts){
  if(!mount.isConnected)continue;
  const newsId=mount.dataset.newsId;
  const items=comments.filter(x=>x.news_id===newsId);
  const box=document.createElement('div');box.className='fztv-news-comments';
  let count=items.length;
  const title=document.createElement('h3');
  const adjust=n=>{count+=n;title.textContent='💬 Комментарии ('+count+')'};
  adjust(0);box.append(title);
  items.forEach(item=>makeComment(item,box,title,adjust));
  if(user){
   const form=document.createElement('form');form.className='fztv-comment-form';
   form.innerHTML='<textarea name="body" rows="3" maxlength="1500" required placeholder="Оставить комментарий…"></textarea><button type="submit">Отправить комментарий</button><div class="fztv-profile-message" role="status"></div>';
   form.onsubmit=async e=>{
    e.preventDefault();const value=form.elements.body.value.trim();
    const btn=form.querySelector('button'),msg=form.querySelector('[role=status]');
    if(!value||value.length>1500)return;
    btn.disabled=true;msg.textContent='';
    const {data:inserted,error}=await client.from('fztv_news_comments')
     .insert({news_id:newsId,user_id:user.id,author_name:String(user.login||user.email?.split('@')[0]||'Игрок').slice(0,80),body:value})
     .select('id,news_id,user_id,author_name,body,created_at').single();
    if(error){msg.textContent=error.message;btn.disabled=false;return}
    if(!authors.has(user.id))authors.set(user.id,{id:user.id,login:user.login||'Игрок',avatar_url:user.avatar_url});
    makeComment(inserted,box,title,adjust);
    const latest=box.lastElementChild;
    if(latest&&latest!==form)box.insertBefore(latest,form);
    adjust(1);form.reset();btn.disabled=false;
   };
   box.append(form);
  }else{
   const note=document.createElement('p');note.className='fztv-profile-help';
   note.innerHTML='Чтобы оставить комментарий, <a href="#/auth" style="color:#63a9ff">войдите в аккаунт</a>.';
   box.append(note);
  }
  mount.replaceChildren(box);
 }
}
export async function mountPublicMember({client,root,id}){
 initStyle();addAuthorStyles();
 if(!root)return;
 if(!/^[-0-9a-f]{36}$/i.test(id||'')){root.textContent='Неверная ссылка профиля.';return}
 const {data:member,error}=await client.from('fztv_public_profiles')
  .select('id,login,avatar_url,bio,banner_color,created_at').eq('id',id).maybeSingle();
 if(!root.isConnected)return;
 if(error||!member){root.innerHTML='<section class="panel" style="padding:20px">Профиль не найден. <a href="#/news">Вернуться к новостям</a></section>';return}
 const palette=['blue','red','green','purple','orange','cyan','gold','slate'];
 const color=palette.includes(member.banner_color)?member.banner_color:'blue';
 const avatar=pic(member.avatar_url);
 const icon=avatar?'<img alt="Аватар" src="'+esc(avatar)+'">':esc((member.login||'И').slice(0,1).toUpperCase());
 root.innerHTML='<div class="fztv-account fztv-public-profile"><div class="fztv-cover" data-banner-color="'+color+'"></div>'+
  '<div class="fztv-profile-head"><div class="fztv-user-avatar">'+icon+'</div>'+
  '<div><h1>'+esc(member.login||'Игрок')+founderMark(member.id)+'</h1><p>'+(member.id===FZTV_FOUNDER_ID?'Основатель и разработчик FragZoneTV':'Участник FragZoneTV')+'</p><p>На FragZoneTV с '+esc(joinedFmt(member.created_at))+' · <span data-fztv-member-activity>⚪ Статус загружается…</span></p></div></div>'+
   founderPanel(member.id)+
  '<div class="fztv-public-bio"><h3 style="margin:0 0 12px">О себе</h3>'+esc(member.bio||'Пользователь пока ничего о себе не рассказал.')+'</div>'+
  '<p style="margin-top:20px"><a class="toolbtn" href="#/news">← Вернуться к новостям</a></p></div>';
 showActivity(client,root,id);
}
