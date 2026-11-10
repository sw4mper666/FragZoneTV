/* FragZoneTV: independent recovery of Team Woods roster and FZ Points.
   One failed optional query must not discard already loaded public team data. */
(() => {
  'use strict';
  if (window.__fztvRankingResyncV2) return;
  window.__fztvRankingResyncV2 = true;
  const route = () => (location.hash || '#/home').replace(/^#\/?/, '').split('/')[0] || 'home';
  const active = () => ['home','ranking','team'].includes(route());
  const safelyQuery = async (table, columns, builder) => {
    let request = sb.from(table).select(columns);
    if (builder) request = builder(request);
    const {data,error} = await request;
    if(error) throw new Error(table + ': ' + error.message);
    return data || [];
  };
  let inFlight = false;
  let lastGood = 0;
  let failureCount = 0;
  let retryTimer;
  function renderIfCurrent() {
    if (!active() || typeof render !== 'function') return;
    try { render(); }
    catch(e) { console.warn('FragZoneTV ranking render:',e); }
  }
  async function refresh(force=false) {
    if(!active() || inFlight || typeof sb === 'undefined') return;
    if(!force && Date.now()-lastGood < 20000) return;
    inFlight=true;
    let changed=false, hadError=false;
    // Independent queries. The public team card only depends on these two.
    const responses=await Promise.allSettled([
      safelyQuery('fztv_roster_players','player_slug,nickname,photo_url,age,team_name,lineup_position'),
      safelyQuery('fztv_team_rp','name,rp'),
      safelyQuery('fztv_teams','id,name,tag,country,logo_url',q=>q.eq('status','approved').order('created_at',{ascending:true}))
    ]);
    try {
      if(responses[0].status==='fulfilled'){
        const newRoster=responses[0].value;
        if(Array.isArray(newRoster) && newRoster.some(x=>String(x.team_name||'').toLowerCase()==='team woods')){
          legacyRosterCache=newRoster;
          changed=true;
        }
      } else { hadError=true; console.warn('FragZoneTV roster:',responses[0].reason); }
      if(responses[1].status==='fulfilled'){
        const values=responses[1].value;
        if(values.some(x=>String(x.name||'').toLowerCase()==='team woods')){
          teamRpCache=Object.fromEntries(values.map(x=>[String(x.name||'').toLowerCase(),Number(x.rp)||0]));
          changed=true;
        }
      } else { hadError=true; console.warn('FragZoneTV points:',responses[1].reason); }
      if(responses[2].status==='fulfilled'){
        approvedTeamsCache=responses[2].value;
        // Only include optional approved players when that query succeeds.
        const ids=approvedTeamsCache.map(t=>t.id);
        if(ids.length){
          try {
            const players=await safelyQuery('fztv_team_players','id,team_id,nickname,country,photo_url,lineup_position',q=>q.in('team_id',ids));
            const groups={};
            for(const item of players)(groups[item.team_id] ||= []).push(item);
            approvedRosterCache=groups;
            changed=true;
          } catch(err) {hadError=true; console.warn('FragZoneTV approved team players:',err);}
        }
      } else { hadError=true; console.warn('FragZoneTV teams:',responses[2].reason); }
      if(changed){
        lastGood=Date.now();
        renderIfCurrent();
      }
      if(hadError){
        if(failureCount < 4){
          const delay=[2000,4000,8000,15000][failureCount++];
          clearTimeout(retryTimer);
          retryTimer=setTimeout(()=>refresh(true),delay);
        }
      } else {
        failureCount=0;
        clearTimeout(retryTimer);
      }
    } finally { inFlight=false; }
  }
  window.addEventListener('hashchange',()=>{if(active())refresh(true);});
  window.addEventListener('online',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true);});
  // One retry after initial render handles the race with legacy async loading.
  setTimeout(()=>refresh(true),600);
  setTimeout(()=>refresh(true),4500);
})();
