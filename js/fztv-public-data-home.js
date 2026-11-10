/* FragZoneTV public data hydration, Nov 2026.
   Restores dynamic news, matches, teams and players hidden by static homepage placeholders.
   Read-only; does not touch auth, admin actions, or database records. */
(() => {
  'use strict';
  if (window.__fztvPublicHydrationV1) return;
  window.__fztvPublicHydrationV1 = true;
  const route = () => (location.hash || '#/home').replace(/^#\/?/,'').split('/')[0] || 'home';
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = { news:null, matches:null, maps:null, stats:null, teams:null, players:null, points:null, error:{} };
  let busy=false, lastRun=0, timer=0, updateScheduled=false, refreshAttempts=0;
  const css=document.createElement('style');
  css.textContent='.fzdb-panel{margin-top:14px;border-radius:10px}.fzdb-panel>.head{padding:13px 16px;border-bottom:1px solid #2b394e}.fzdb-list{padding:3px 15px 12px}.fzdb-row{display:flex;gap:13px;align-items:center;padding:13px 2px;border-bottom:1px solid #28374b;color:#ebf2fc;text-decoration:none}.fzdb-row:last-child{border-bottom:0}.fzdb-row:hover{color:#ff6676}.fzdb-row strong{font-size:13px}.fzdb-row small{display:block;font-size:11px;color:#94a8c2;margin-top:4px}.fzdb-date{font-size:10px;color:#a0b4ce;min-width:70px}.fzdb-empty{color:#9cb0ca;font-size:12px;padding:15px}.fzdb-badge{color:#f1bd62;font-size:12px;font-weight:800;margin-left:auto}.fzdb-mini{padding:8px 14px;font-size:11px}.fzdb-mini a{color:#b9cde9;text-decoration:none;display:block;padding:5px 0;border-top:1px solid #2c3b4b}.fzdb-mini a:hover{color:#fff}.fzdb-info{font-size:10px;color:#9eaec4;margin:8px 15px}.fzdb-tmp{color:#ff9d7e}';
  document.head.append(css);
  const req=async(key,query)=>{try{const {data,error}=await query;if(error)throw error;state[key]=data||[];delete state.error[key];return true}catch(err){state.error[key]=String(err.message||err).slice(0,130);console.warn('FZTV public data '+key+':',err);return false}};
  const fmt=d=>{try{return new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})}catch{return '—'}};
  const linkRow=(url,title,desc,badge='')=>'<a class="fzdb-row" href="'+esc(url)+'"><span style="flex:1;min-width:0"><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span>'+(badge?'<span class="fzdb-badge">'+esc(badge)+'</span>':'')+'</a>';
  function makePanel(id,title,label,html){
    let el=document.getElementById(id);
    const center=document.querySelector('#app .stack.center');
    if(!center)return;
    if(!el){el=document.createElement('section');el.id=id;el.className='panel fzdb-panel';center.append(el);}
    const markup='<div class="head"><h2>'+esc(title)+'</h2><small>'+esc(label)+'</small></div><div class="fzdb-list">'+html+'</div>';
    if(el.dataset.snapshot!==markup){el.innerHTML=markup;el.dataset.snapshot=markup;}
  }
  const rowsForNews=()=>state.news?.length?state.news.filter(n=>n.published===true).slice(0,5).map(n=>linkRow('#/news',n.title,'Опубликовано '+fmt(n.created_at))).join(''):'<div class="fzdb-empty">Опубликованных новостей пока нет</div>';
  const rowsForMatches=()=>state.matches?.length?state.matches.slice(0,5).map(m=>linkRow('#/match/'+encodeURIComponent(m.id),m.team_a+' — '+m.team_b,fmt(m.starts_at)+' · '+(m.status==='finished'?'Матч завершён':'Предстоящий матч'),m.result_overall||'')).join(''):'<div class="fzdb-empty">Матчи пока не опубликованы</div>';
  function livePlayers(){
    if(!state.players)return [];
    const teams=new Map((state.teams||[]).map(t=>[t.id,t.name]));
    const stats=state.stats||[];
    return state.players.filter(p=>teams.has(p.team_id)).map(p=>{
      const slug='team_'+p.id.replace(/-/g,'');
      const records=stats.filter(s=>s.player_slug===slug);
      const kills=records.reduce((a,s)=>a+Number(s.kills||0),0), deaths=records.reduce((a,s)=>a+Number(s.deaths||0),0), assists=records.reduce((a,s)=>a+Number(s.assists||0),0);
      const rating=records.length?(kills+0.5*assists)/Math.max(1,deaths):null;
      return {...p,team_name:teams.get(p.team_id),rating,slug};
    }).sort((a,b)=>(b.rating??-1)-(a.rating??-1)||String(a.nickname).localeCompare(String(b.nickname),'ru'));
  }
  function syncCaches(){
    try{
      if(state.matches && typeof matchesCache!=='undefined') {
        const maps=state.maps||[];
        matchesCache=state.matches.map(m=>({...m,event_name:m.title||'FragZoneTV',maps:maps.filter(x=>x.match_id===m.id).map(x=>({name:x.map_name,a:x.score_a,b:x.score_b})),score_a:Number((m.result_overall||'').split(':')[0])||0,score_b:Number((m.result_overall||'').split(':')[1])||0}));
      }
      if(state.news && typeof newsCache!=='undefined')newsCache=state.news;
      if(state.stats && typeof playerMatchStats!=='undefined')playerMatchStats=state.stats;
      if(state.teams && typeof approvedTeamsCache!=='undefined')approvedTeamsCache=state.teams;
      if(state.players && typeof approvedRosterCache!=='undefined'){
        const groups={};for(const p of state.players)(groups[p.team_id]??=[]).push(p);
        for(const arr of Object.values(groups))arr.sort((a,b)=>(a.lineup_position||99)-(b.lineup_position||99));
        approvedRosterCache=groups;
        if(typeof publicPlayersCache!=='undefined'){
          const teamMap=new Map((state.teams||[]).map(t=>[t.id,t]));
          publicPlayersCache=state.players.filter(p=>teamMap.has(p.team_id)).map(p=>({...p,fztv_teams:{name:teamMap.get(p.team_id).name,status:'approved'}}));
        }
      }
      if(state.points && typeof teamRpCache!=='undefined')teamRpCache=Object.fromEntries(state.points.map(t=>[String(t.name||'').toLowerCase(),Number(t.rp)||0]));
    }catch(err){console.warn('FZTV cache sync:',err)}
  }
  function mount(){
    if(route()!=='home')return;
    const center=document.querySelector('#app .stack.center');if(!center)return;
    if(state.news)makePanel('fzdb-news','НОВОСТИ FRAGZONETV','ИЗ SUPABASE',rowsForNews());
    if(state.matches)makePanel('fzdb-matches','МАТЧИ И РАСПИСАНИЕ','ИЗ SUPABASE',rowsForMatches());
    if(state.players && state.teams){
      const players=livePlayers();
      const ranked=players.filter(p=>p.rating!=null).slice(0,5);
      const rows=ranked.length?ranked.map(p=>linkRow('#/player/'+p.slug,p.nickname,p.team_name,String(Number(p.rating.toFixed(3))))).join(''):'<div class="fzdb-empty">Зарегистрировано '+players.length+' игроков. Рейтинг FZTVR появится после матчей со статистикой.</div>';
      makePanel('fzdb-players','ИГРОКИ И РЕЙТИНГ FZTVR','<a href="#/players">ВСЕ ИГРОКИ</a>',rows);
    }
    const sidebar=document.querySelector('#app .stack.left a.panel-link[href="#/ranking"]');
    if(sidebar&&state.points){
      const woods=state.points.find(t=>String(t.name||'').toLowerCase()==='team woods');
      if(woods){const el=sidebar.querySelector('span:last-child');if(el&&el.textContent.trim()==='FZ')el.previousElementSibling&&(el.previousElementSibling.textContent=String(woods.rp));}
    }
  }
  function scheduleMount(){
    if(updateScheduled)return;
    updateScheduled=true;
    setTimeout(()=>{updateScheduled=false;mount();},80);
  }
  async function refresh(){
    if(busy||typeof sb==='undefined')return;
    busy=true;lastRun=Date.now();
    try{
      await Promise.all([
        req('news',sb.from('fztv_news').select('id,title,content,body,published,created_at').eq('published',true).order('created_at',{ascending:false})),
        req('matches',sb.from('fztv_site_matches').select('*').order('starts_at',{ascending:false})),
        req('maps',sb.from('fztv_match_maps').select('match_id,map_name,map_order,score_a,score_b').order('map_order',{ascending:true})),
        req('stats',sb.from('fztv_player_match_stats').select('player_slug,kills,deaths,assists,match_id')),
        req('teams',sb.from('fztv_teams').select('id,name,tag,country,logo_url,status').eq('status','approved')),
        req('players',sb.from('fztv_team_players').select('id,team_id,nickname,first_name,last_name,country,primary_role,photo_url,lineup_position')),
        req('points',sb.from('fztv_team_rp').select('name,rp'))
      ]);
      syncCaches();
      if(['home','ranking','players','news','matches'].includes(route())&&typeof render==='function')render();
      scheduleMount();
      if(Object.keys(state.error).length && refreshAttempts<3){
        clearTimeout(timer);timer=setTimeout(()=>{refreshAttempts++;refresh();},[4000,8000,16000][refreshAttempts]);
      } else {refreshAttempts=0;}
    }finally{busy=false}
  }
  window.addEventListener('hashchange',()=>{setTimeout(()=>{mount();if(Date.now()-lastRun>25000)refresh();},150)});
  window.addEventListener('online',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRun>30000)refresh();});
  // Respond to legacy render() replacing the entire center with only a static ranking.
  const root=document.getElementById('app');
  if(root){const observer=new MutationObserver(scheduleMount);observer.observe(root,{childList:true,subtree:true});}
  setTimeout(refresh,700);
})();