// FragZoneTV home-page ranking decoration. Independent of the legacy page renderer.
(() => {
  if (window.__fztvHomeRankingPolish) return;
  window.__fztvHomeRankingPolish = true;
  const css = document.createElement('style');
  css.id = 'fztv-home-ranking-polish-css';
  css.textContent = [
    '.fztv-home-top-1{border:2px solid #eec35a!important;box-shadow:0 0 0 1px #8b6927,0 0 25px #e3aa392e!important}',
    '.fztv-home-top-2{border:2px solid #b8c6db!important;box-shadow:0 0 0 1px #6e7f95,0 0 20px #aebdcc30!important}',
    '.fztv-home-top-3{border:2px solid #c78c69!important;box-shadow:0 0 0 1px #78513c,0 0 20px #ae6e4730!important}',
    '.fztv-home-top-1,.fztv-home-top-2,.fztv-home-top-3{transition:border-color .2s,box-shadow .2s}'
  ].join('');
  document.head.append(css);
  const TEAM = {1:'Team Woods',2:'Taykans',3:'Woods Academy'};
  const decorate = () => {
    if (!document.body) return;
    // Match only exact position labels, not statistics or text containing #1.
    const labels = [...document.querySelectorAll('body *')].filter(el =>
      el.children.length === 0 && /^#[123]$/.test((el.textContent || '').trim())
    );
    for (const [position, teamName] of Object.entries(TEAM)) {
      const label = labels.find(el => (el.textContent || '').trim() === '#' + position);
      if (!label) continue;
      let candidate = null;
      for (let node = label.parentElement, depth = 0; node && depth < 10; node = node.parentElement, depth++) {
        const rect = node.getBoundingClientRect();
        const text = node.textContent || '';
        if (rect.width < 200 || rect.height < 42 || rect.height > 700 || text.length > 3500) continue;
        if (!text.includes(teamName) || !text.includes('FZ')) continue;
        if (Object.keys(TEAM).some(other => other !== position &&
            text.includes('#' + other + ' '))) continue;
        candidate = node;
        // Prefer the narrowest enclosing box of the entire team entry.
        if (rect.width > 500 && rect.height > 55) break;
      }
      if (candidate) candidate.classList.add('fztv-home-top-' + position);
    }
  };
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; decorate(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  window.addEventListener('hashchange',schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
