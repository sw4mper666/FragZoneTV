/* FragZoneTV connection diagnostics: no secrets, passwords, tokens or user identifiers. */
(() => {
  'use strict';
  const route = () => (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const results = [];
  let runId = 0;
  const withTimeout = (promise, ms = 12000) => Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Тайм-аут ' + Math.round(ms / 1000) + ' с')), ms))
  ]);
  async function run() {
    if (route() !== 'diagnostics') return;
    const token = ++runId;
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<section style="max-width:850px;margin:35px auto;padding:25px;border:1px solid #33445e;border-radius:14px;background:#101925;color:#e9f0fa;font:14px/1.6 system-ui"><h1>Диагностика FragZoneTV</h1><p>Проверяем соединение с сервером, вход и загрузку команд. Пароли, токены и данные аккаунта не показываются.</p><div id="fzdiag-log">Проверка…</div><button type="button" id="fzdiag-retry" style="padding:10px 16px;margin-top:16px;background:#ed304c;border:0;border-radius:7px;color:#fff;cursor:pointer">Повторить</button> <button type="button" id="fzdiag-copy" style="padding:10px 16px;background:#283750;border:0;border-radius:7px;color:#fff;cursor:pointer">Копировать результат</button></section>';
    const list = document.getElementById('fzdiag-log');
    results.length = 0;
    function add(label, status, detail) {
      if (runId !== token || !list) return;
      results.push({label, status, detail});
      list.innerHTML = results.map(x => '<div style="border-top:1px solid #2c3d55;padding:9px 0"><strong style="color:'+ (x.status==='OK'?'#71ddb0':x.status==='ERROR'?'#ff7482':'#e6bd76') +'">'+esc(x.status)+'</strong> — '+esc(x.label)+' <span style="color:#a5b5c8">'+esc(x.detail)+'</span></div>').join('');
    }
    document.getElementById('fzdiag-retry').onclick = run;
    document.getElementById('fzdiag-copy').onclick = async () => {
      const report = 'FragZoneTV diagnostics\n'+results.map(x => x.status+' | '+x.label+' | '+x.detail).join('\n');
      try { await navigator.clipboard.writeText(report); alert('Результат скопирован'); }
      catch { window.prompt('Скопируй результат:', report); }
    };
    add('Адрес сайта', 'OK', location.origin);
    add('Библиотека Supabase', typeof window.supabase === 'object'?'OK':'ERROR', typeof window.supabase === 'object'?'Загружена':'Не загрузилась');
    const client = typeof sb !== 'undefined' ? sb : null;
    if (!client) {add('Клиент Supabase','ERROR','Не инициализирован');return;}
    const measures = [
      ['Сеанс входа', async () => {
        const {data,error} = await client.auth.getSession();
        if(error)throw error;
        return {status:data?.session?'OK':'INFO', detail:data?.session?'Сессия обнаружена':'Пользователь не вошёл'};
      }],
      ['Проверка пользователя', async () => {
        const {data,error}=await client.auth.getUser();
        if(error)throw error;
        return {status:data?.user?'OK':'INFO',detail:data?.user?'Сервер подтвердил авторизацию':'Сервер не видит вход'};
      }],
      ['Состав команды', async () => {
        const {data,error}=await client.from('fztv_roster_players').select('player_slug,team_name');
        if(error)throw error;
        return {status:'OK',detail:'Получено игроков: '+(data?.length??0)+', Team Woods: '+(data||[]).filter(x=>String(x.team_name||'').toLowerCase()==='team woods').length};
      }],
      ['Рейтинг FZ Points', async () => {
        const {data,error}=await client.from('fztv_team_rp').select('name,rp').eq('name','Team Woods');
        if(error)throw error;
        return {status:'OK',detail:data?.length?'Team Woods: '+data[0].rp+' FZ':'Ответ получен, Team Woods не найден'};
      }],
      ['Список команд', async () => {
        const {data,error}=await client.from('fztv_teams').select('id').eq('status','approved');
        if(error)throw error;
        return {status:'OK',detail:'Одобренных команд: '+(data?.length??0)};
      }]
    ];
    for (const [label,test] of measures) {
      if (runId !== token || route() !== 'diagnostics') return;
      const start=performance.now();
      try {
        const value=await withTimeout(test());
        add(label,value.status,value.detail+' ('+Math.round(performance.now()-start)+' мс)');
      } catch(e) {add(label,'ERROR',String(e?.message||e).slice(0,180));}
    }
    add('Проверка завершена','OK','Скопируй результат и отправь в чат. Никаких паролей или ключей нет.');
  }
  window.addEventListener('hashchange',()=>{if(route()==='diagnostics')setTimeout(run,0);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(route()==='diagnostics')run();});
  else if(route()==='diagnostics')run();
})();