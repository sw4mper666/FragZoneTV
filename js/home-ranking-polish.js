// FragZoneTV homepage ranking — actual markup from enhanceRankingLayout().
(() => {
  if (window.__fztvHomeRankingPolishV3) return;
  window.__fztvHomeRankingPolishV3 = true;
  const css = document.createElement('style');
  css.id = 'fztv-home-ranking-polish-v3';
  css.textContent = [
    '.fztv-unified-rank-list > .fztv-unified-team:nth-child(1){border:2px solid #f6c659!important;box-shadow:0 0 23px #d8aa3850!important}',
    '.fztv-unified-rank-list > .fztv-unified-team:nth-child(2){border:2px solid #b7c8e0!important;box-shadow:0 0 20px #b7c8e033!important}',
    '.fztv-unified-rank-list > .fztv-unified-team:nth-child(3){border:2px solid #c88965!important;box-shadow:0 0 20px #c8896533!important}',
    '.fztv-igl-crown-live{margin-left:5px;display:inline!important;font-size:14px;vertical-align:middle}'
  ].join('');
  document.head.append(css);
  let captainNames = new Set();
  let busy = false;
  const apply = () => {
    busy = false;
    if (!captainNames.size) return;
    document.querySelectorAll('.fztv-unified-rank-list .fztv-unified-player > b').forEach(el => {
      const name=(el.firstChild?.textContent||'').trim().toLowerCase();
      if (!captainNames.has(name) || el.querySelector('.fztv-igl-crown-live')) return;
      const crown=document.createElement('span');
      crown.className='fztv-igl-crown-live';
      crown.title='Капитан — IGL';
      crown.textContent=' 👑';
      el.append(crown);
    });
  };
  const schedule=()=>{
    if (busy) return;
    busy=true;
    requestAnimationFrame(apply);
  };
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);
  const connect = () => {
    // The legacy index script declares sb in the same global lexical environment.
    const client = typeof sb !== 'undefined' ? sb : null;
    if (!client) return;
    Promise.all([
      client.from('fztv_team_players').select('nickname,primary_role'),
      client.from('fztv_legacy_player_profiles').select('player_slug,primary_role'),
      client.from('fztv_roster_players').select('player_slug,nickname')
    ]).then(([team,legacy,roster])=>{
      const names=new Map((roster.data||[]).map(x=>[x.player_slug,String(x.nickname||x.player_slug)]));
      captainNames=new Set([
        ...(team.data||[]).filter(p=>String(p.primary_role||'').trim().toUpperCase()==='IGL').map(p=>String(p.nickname).toLowerCase()),
        ...(legacy.data||[]).filter(p=>String(p.primary_role||'').trim().toUpperCase()==='IGL').map(p=>String(names.get(p.player_slug)||p.player_slug).toLowerCase())
      ]);
      schedule();
    }).catch(console.warn);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});
  else connect();
  schedule();
})();