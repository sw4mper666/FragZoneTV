const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));

export async function mount({client,root}){
 if (!root || root.querySelector('#fztv-ac-admin')) return;
 const panel=document.createElement('section');
 panel.id='fztv-ac-admin';
 panel.className='panel';
 panel.style.cssText='padding:20px;margin:16px 0;border:1px solid #30445b';
 panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h2>🛡️ Античит · FZTV AC 1.0</h2><p style="color:#9fb2ca">Клиент Windows 10/11 · Counter-Strike 2</p></div><button type="button" class="toolbtn" id="ac-refresh">Обновить</button></div><p id="ac-summary" style="margin:16px 0;color:#b5c7db">Загрузка…</p><div id="ac-players" style="overflow:auto"></div><p style="font-size:12px;color:#91a6c0;margin-top:12px">Статус «Подключён» означает, что клиент отправлял данные за последние 90 секунд. Это не подтверждение отсутствия читов и не защищённая проверка целостности игры.</p>';
 root.prepend(panel);
 let busy=false;
 async function reload(){
  if(busy || !panel.isConnected)return;
  busy=true;const button=panel.querySelector('#ac-refresh');
  button.disabled=true;
  try{
   const [users,states]=await Promise.all([
    client.from('profiles').select('id,login,username,email').order('created_at',{ascending:false}).limit(500),
    client.from('fztv_ac_status').select('user_id,client_version,platform,running,cs2_running,last_seen').limit(500)
   ]);
   if(users.error)throw users.error;
   if(states.error)throw states.error;
   const lookup=new Map((states.data||[]).map(x=>[x.user_id,x]));
   const now=Date.now();
   let active=0,offline=0;
   const rows=(users.data||[]).map(u=>{
    const ac=lookup.get(u.id);
    const online=!!(ac&&ac.running&&(now-new Date(ac.last_seen).getTime()<90000));
    if(online)active++;else offline++;
    const label=online?'🟢 Подключён':ac?'⚪ Отключён':'— Не установлен';
    const game=online?(ac.cs2_running?'🎮 CS2 запущена':'CS2 не запущена'):'—';
    return '<tr><td>'+escapeHtml(u.login||u.username||u.email||u.id)+'</td><td>'+label+'</td><td>'+escapeHtml(game)+'</td><td>'+escapeHtml(ac?.client_version||'—')+'</td><td>'+escapeHtml(ac?.last_seen?new Date(ac.last_seen).toLocaleString('ru-RU'):'—')+'</td></tr>';
   }).join('');
   panel.querySelector('#ac-summary').textContent='Игроков: '+(users.data||[]).length+' · На связи: '+active+' · Не подключены: '+offline;
   panel.querySelector('#ac-players').innerHTML='<table style="width:100%;min-width:650px;border-collapse:collapse;text-align:left;font-size:13px"><thead><tr><th>Игрок</th><th>Античит</th><th>Игра</th><th>Версия</th><th>Последний сигнал</th></tr></thead><tbody>'+rows+'</tbody></table>';
   panel.querySelectorAll('td,th').forEach(c=>c.style.cssText='padding:11px 9px;border-bottom:1px solid #293950');
  }catch(e){
   panel.querySelector('#ac-summary').textContent='Ошибка загрузки античита: '+(e.message||String(e));
  }finally{button.disabled=false;busy=false}
 }
 panel.querySelector('#ac-refresh').onclick=reload;
 await reload();
 // Periodic refresh while this admin section remains mounted.
 const timer=setInterval(()=>{if(!panel.isConnected){clearInterval(timer);return}reload()},30000);
}
