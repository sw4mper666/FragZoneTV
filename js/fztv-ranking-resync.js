/* FragZoneTV: independently reconcile ranking from the same public Supabase tables as diagnostics.
   Do not overwrite database data or manufacture score/players. */
(() => {
  'use strict';
  if (window.__fztvRankingResyncV1) return;
  window.__fztvRankingResyncV1 = true;
  const route = () => (location.hash || '#/home').replace(/^#\/?/, '').split('/')[0] || 'home';
  const active = () => ['home', 'ranking'].includes(route());
  let pending = false, lastGood = 0, retryCount = 0, retryTimer = null;
  const fetchSafe = async (table, columns, modifier) => {
    let query = sb.from(table).select(columns);
    if (modifier) query = modifier(query);
    const {data, error} = await query;
    if (error) throw new Error(table + ': ' + error.message);
    return data || [];
  };
  async function refresh(force = false) {
    if (!active() || pending || typeof sb === 'undefined' || typeof render !== 'function') return;
    if (!force && Date.now() - lastGood < 25000) return;
    pending = true;
    try {
      const [roster, ratings, teams] = await Promise.all([
        fetchSafe('fztv_roster_players', 'player_slug,nickname,photo_url,age,team_name,lineup_position'),
        fetchSafe('fztv_team_rp', 'name,rp'),
        fetchSafe('fztv_teams', 'id,name,tag,country,logo_url', q => q.eq('status','approved').order('created_at',{ascending:true}))
      ]);
      const ids = teams.map(t => t.id);
      const players = ids.length
        ? await fetchSafe('fztv_team_players','id,team_id,nickname,country,photo_url,lineup_position',q => q.in('team_id',ids))
        : [];
      // Only commit caches after all required requests succeed. Keep current UI on partial failures.
      legacyRosterCache = roster;
      teamRpCache = Object.fromEntries(ratings.map(x => [String(x.name||'').toLowerCase(), Number(x.rp)||0]));
      approvedTeamsCache = teams;
      approvedRosterCache = {};
      for (const player of players) (approvedRosterCache[player.team_id] ||= []).push(player);
      for (const group of Object.values(approvedRosterCache)) group.sort((a,b)=>(a.lineup_position||99)-(b.lineup_position||99));
      lastGood = Date.now();
      retryCount = 0;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      if (active()) render();
    } catch (error) {
      console.warn('FragZoneTV: не удалось синхронизировать рейтинг, сохраняем текущие данные:', error);
      if (retryCount < 3 && active()) {
        const delay = [2500, 5000, 10000][retryCount++];
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => { retryTimer = null; refresh(true); }, delay);
      }
    } finally { pending = false; }
  }
  window.addEventListener('hashchange', () => { if (active()) refresh(true); });
  window.addEventListener('online', () => refresh(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  // Refresh once all legacy initialization has had time to finish.
  setTimeout(() => refresh(true), 1400);
})();