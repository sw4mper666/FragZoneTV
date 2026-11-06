const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Date(v).toLocaleString('ru-RU'):'—';
const severity=v=>v==='high'?'🔴 Высокое':v==='medium'?'🟠 Проверить':v==='low'?'🟡 Информация':'—';
export async function mount({client,root}){
 if(!root || root.querySelector('#fztv-ac-admin'))return;
 const panel=document.createElement('section');panel.id='fztv-ac-admin';
 panel.className='panel';panel.style.cssText='padding:20px;margin:16px 0;border:1px solid #30445b';
 panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h2>🛡️ FZTV Anti-Cheat 2.0</h2><p style="color:#9fb2ca">Windows 10/11 · CS2 · Диагностика клиента</p></div><button class="toolbtn" type="button" id="ac-refresh">Обновить</button></div><p id="ac-summary" style="color:#bdc9d7;margin:16px 0">Загрузка…</p><div id="ac-players" style="overflow:auto"></div><div id="ac-history" style="display:none;margin-top:22px;border-top:1px solid #35445b;padding-top:14px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h3 id="ac-history-heading">История событий</h3><button id="ac-history-close" type="button" class="toolbtn">Закрыть</button></div><p style="font-size:12px;color:#9fadc2">Предупреждения требуют ручной проверки. Это не доказательства использования читов.</p><div id="ac-history-list"></div></div><p style="font-size:12px;line-height:1.6;color:#91a6c0;margin-top:12px">Статус «На связи» означает, что клиент отправлял сигнал менее 90 секунд назад. Отчёты клиента можно подделать — автоматические блокировки не применяются.</p>';
 root.prepend(panel);
 let busy=false,shown=null,people=new Map();
 async function history(id){
  shown=id;const panelHistory=panel.querySelector('#ac-history');panelHistory.style.display='block';
  panel.querySelector('#ac-history-heading').textContent='История: '+(people.get(id)||id);
  const target=panel.querySelector('#ac-history-list');target.textContent='Загрузка…';
  const {data,error}=await client.from('fztv_ac_events').select('id,severity,title,details,created_at').eq('user_id',id).order('created_at',{ascending:false}).limit(100);
  if(shown!==id||!target.isConnected)return;
  if(error){target.textContent='Ошибка: '+error.message;return}
  if(!data?.length){target.textContent='Событий пока нет.';return}
  target.innerHTML=data.map(e=>'<div style="padding:12px 0;border-bottom:1px solid #293950"><strong>'+severity(e.severity)+' · '+esc(e.title)+'</strong><small style="margin-left:12px">'+esc(date(e.created_at))+'</small><p style="color:#9fb0c6;margin:7px 0 0;font-size:12px">'+esc(e.details)+'</p></div>').join('');
 }
 async function reload(){
  if(busy||!panel.isConnected)return;
  busy=true;const btn=panel.querySelector('#ac-refresh');btn.disabled=true;
  try{
   const [users,states]=await Promise.all([
    client.from('profiles').select('id,login,username,email').order('created_at',{ascending:false}).limit(500),
    client.from('fztv_ac_status').select('user_id,client_version,running,cs2_running,last_seen,process_check,integrity_check,warning_level,warning_count').limit(500)]);
   if(users.error)throw users.error;if(states.error)throw states.error;
   people=new Map((users.data||[]).map(u=>[u.id,u.login||u.username||u.email||'Игрок']));
   const byId=new Map((states.data||[]).map(s=>[s.user_id,s]));
   let active=0,offline=0,warnings=0;
   const html=(users.data||[]).map(u=>{
    const s=byId.get(u.id),online=!!(s?.running&&(Date.now()-new Date(s.last_seen).getTime()<90000));
    if(online)active++;else offline++;
    if(s?.warning_level&&s.warning_level!=='none')warnings++;
    const state=online?'🟢 На связи':s?'⚪ Отключён':'— Не установлен';
    const game=online?(s.cs2_running?'🎮 CS2 запущена':'CS2 не запущена'):'—';
    const processes=s?.process_check==='review'?'🟠 Проверить':s?.process_check==='ok'?'✅ Готово':'—';
    return '<tr><td>'+esc(people.get(u.id))+'</td><td>'+state+'</td><td>'+game+'</td><td>'+processes+'</td><td>'+esc(s?.integrity_check||'—')+'</td><td>'+severity(s?.warning_level)+'</td><td>'+esc(s?.client_version||'—')+'</td><td>'+esc(date(s?.last_seen))+'</td><td><button type="button" class="toolbtn" data-ac-history="'+esc(u.id)+'">История</button></td></tr>';
   }).join('');
   panel.querySelector('#ac-summary').textContent='Игроков: '+(users.data||[]).length+' · На связи: '+active+' · Не подключены: '+offline+' · С предупреждениями: '+warnings;
   panel.querySelector('#ac-players').innerHTML='<table style="width:100%;min-width:1060px;border-collapse:collapse;font-size:12px;text-align:left"><thead><tr><th>Игрок</th><th>Клиент</th><th>CS2</th><th>Процессы</th><th>Целостность</th><th>Предупреждение</th><th>Версия</th><th>Последний сигнал</th><th>Журнал</th></tr></thead><tbody>'+html+'</tbody></table>';
   panel.querySelectorAll('th,td').forEach(c=>c.style.cssText='padding:11px 9px;border-bottom:1px solid #293950;white-space:nowrap');
   panel.querySelectorAll('[data-ac-history]').forEach(b=>b.onclick=()=>history(b.dataset.acHistory));
  }catch(e){panel.querySelector('#ac-summary').textContent='Ошибка античита: '+(e.message||String(e))}
  finally{busy=false;btn.disabled=false}
 }
 panel.querySelector('#ac-refresh').onclick=reload;
 panel.querySelector('#ac-history-close').onclick=()=>{shown=null;panel.querySelector('#ac-history').style.display='none'};
 await reload();
 const timer=setInterval(()=>{if(!panel.isConnected){clearInterval(timer);return}reload()},30000);
}
