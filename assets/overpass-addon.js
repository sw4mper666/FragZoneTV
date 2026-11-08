/* FragZoneTV: Overpass map-pool and match-preview extension. Published update trigger. */
(() => {
  'use strict';
  const NAME='Overpass';
  const IMG='assets/overpass.svg';
  const known=/^(Mirage|Dust\s*2|Dust2|Cache|Inferno|Ancient|Nuke|Anubis)$/i;
  const css=document.createElement('style');
  css.textContent=`
  .fztv-overpass-pool{display:flex!important;align-items:center;justify-content:center;min-height:19px;margin:4px 0;padding:3px 10px;color:#fff!important;font-size:12px;font-weight:800;text-align:center;background:linear-gradient(100deg,#487f64,#4eab92 40%,#235749 70%,#31745c);border:1px solid rgba(255,255,255,.18);border-radius:2px;text-shadow:0 1px 2px #111}
  .fztv-map-pool-panel{padding:14px;background:#101824;border:1px solid #334155;border-radius:10px;margin:12px 0 20px}.fztv-map-pool-panel h2{font-weight:900;font-size:15px;margin:0 0 10px}.fztv-map-pool-row{font-size:12px;font-weight:800;text-align:center;padding:5px;margin:4px 0;background:linear-gradient(90deg,color-mix(in srgb,var(--pool-color),#222 20%),var(--pool-color),color-mix(in srgb,var(--pool-color),#222 20%));color:white;text-shadow:0 1px 3px #000}.fztv-overpass-image{display:block;width:100%;height:auto;aspect-ratio:956/465;object-fit:cover;border-radius:5px;margin:6px 0}
  `;document.head.appendChild(css);
  function leaf(el){return el && el.children.length===0 && (el.textContent||'').trim();}
  function addToSelects(root){
    root.querySelectorAll('select').forEach(sel=>{
      if([...sel.options].some(o=>known.test(o.textContent.trim()))&&!([...sel.options].some(o=>o.textContent.trim().toLowerCase()==='overpass'))){
        const o=document.createElement('option');o.value='Overpass';o.textContent=NAME;sel.add(o);
      }
    });
    root.querySelectorAll('[role=listbox], [role=menu]').forEach(list=>{
      if(list.querySelector('[data-fztv-overpass]'))return;
      const items=[...list.children];
      const match=items.find(x=>known.test((x.textContent||'').trim()));
      if(match){let item=match.cloneNode(true);item.textContent=NAME;item.dataset.fztvOverpass='1';list.appendChild(item);}
    });
  }
  function addPool(root){
    const titles=[...root.querySelectorAll('h1,h2,h3,h4,h5,div,span,strong')].filter(e=>{
      const s=(e.textContent||'').trim();
      return s.length<110 && /мап\s*пул|map\s*pool/i.test(s) && !e.closest('[data-fztv-overpass]');
    });
    for(const title of titles){
      let parent=title.parentElement;
      for(let i=0;parent&&i<5;i++,parent=parent.parentElement){
        if(parent.querySelector('[data-fztv-overpass-pool]'))break;
        const children=[...parent.querySelectorAll('*')].filter(x=>leaf(x)&&known.test(x.textContent.trim()));
        if(children.length<3)continue;
        const last=children[children.length-1];
        const row=last.closest('li,[class*=map],[class*=pool]') || last.parentElement;
        const bar=document.createElement('div');bar.className='fztv-overpass-pool';bar.dataset.fztvOverpassPool='1';bar.textContent=NAME;
        if(row&&row!==parent&&row.parentElement)row.insertAdjacentElement('afterend',bar);
        else parent.appendChild(bar);
        break;
      }
    }
  }
  function addMatchImages(root){
    root.querySelectorAll('span,div,strong,b,small').forEach(e=>{
      if(!leaf(e) || !/^overpass$/i.test(e.textContent.trim()))return;
      if(e.closest('[data-fztv-overpass-pool],select,[role=listbox],[role=menu],.fztv-overpass-pool'))return;
      const card=e.closest('[class*=map],[class*=Map],[class*=match],[class*=Match],article,li')||e.parentElement;
      if(!card||card.querySelector('.fztv-overpass-image'))return;
      if(card.textContent.length>1000)return;
      const image=card.querySelector('img');
      if(image&&(!image.alt||/map|cache|mirage|nuke|inferno|ancient|anubis|dust/i.test(image.alt)||/map/i.test(image.src))){
        image.src=IMG;image.alt='Overpass';return;
      }
      if(!/\b\d{1,2}\s*[:\-]\s*\d{1,2}\b/.test(card.textContent))return;
      const im=document.createElement('img');im.src=IMG;im.alt='Overpass';im.className='fztv-overpass-image';
      e.insertAdjacentElement('afterend',im);
    });
  }

  function ensureTournamentPool(){
    if(!/^#\/tournament(?:\/|$)/i.test(location.hash))return;
    const app=document.querySelector('#app')||document.querySelector('main');
    if(!app||app.querySelector('[data-fztv-overpass-tournament]'))return;
    const labels=['Mirage','Dust 2','Cache','Inferno','Ancient','Nuke','Anubis','Overpass'];
    const colors=['#ad64cf','#c4bc55','#56a6cd','#457bc3','#3f998c','#bd5851','#cb5386','#4b9d78'];
    const section=document.createElement('section');
    section.dataset.fztvOverpassTournament='1';
    section.className='fztv-map-pool-panel';
    section.innerHTML='<h2>МАП ПУЛ · ДЕЙСТВУЮЩИЙ</h2>'+labels.map((name,i)=>'<div class="fztv-map-pool-row" style="--pool-color:'+colors[i]+'">'+name+'</div>').join('');
    const original=[...app.querySelectorAll('h1,h2,h3,strong')].find(e=>/мап\s*пул|map\s*pool/i.test(e.textContent.trim()));
    if(original){
      const outer=original.closest('section,article,.panel');
      if(outer){
        if(/\bmirage\b/i.test(outer.textContent)&&/\banubis\b/i.test(outer.textContent)){
          const row=document.createElement('div');row.className='fztv-map-pool-row';row.style.setProperty('--pool-color','#4b9d78');row.textContent='Overpass';
          if(!/\boverpass\b/i.test(outer.textContent)){outer.append(row);}
          outer.dataset.fztvOverpassTournament='1';
          return;
        }
      }
    }
    const title=app.querySelector('.page-title');
    if(title)title.insertAdjacentElement('afterend',section);
    else app.prepend(section);
  }
  function improveMapEntry(){
    document.querySelectorAll('textarea[name="maps"],textarea[placeholder*="Mirage"]').forEach(t=>{
      if(t.dataset.fztvOverpassHint)return;
      t.dataset.fztvOverpassHint='1';
      t.placeholder=(t.placeholder||'Mirage,13,9')+'\nOverpass,13,9';
      const label=t.closest('label');
      if(label){const text=label.firstChild;if(text&&text.nodeType===3)text.textContent=text.textContent.replace('Mirage,13,9','Mirage,13,9 / Overpass,13,9');}
    });
  }

  let busy=false;
  const run=()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;addToSelects(document);addPool(document);addMatchImages(document);ensureTournamentPool();improveMapEntry();});};
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();