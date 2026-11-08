/* FragZoneTV: Overpass map-pool and match-preview extension. Published update trigger. */
(() => {
  'use strict';
  const NAME='Overpass';
  const IMG='assets/overpass.svg';
  const known=/^(Mirage|Dust\s*2|Dust2|Cache|Inferno|Ancient|Nuke|Anubis)$/i;
  const css=document.createElement('style');
  css.textContent=`
  .fztv-overpass-pool{display:flex!important;align-items:center;justify-content:center;min-height:19px;margin:4px 0;padding:3px 10px;color:#fff!important;font-size:12px;font-weight:800;text-align:center;background:linear-gradient(100deg,#487f64,#4eab92 40%,#235749 70%,#31745c);border:1px solid rgba(255,255,255,.18);border-radius:2px;text-shadow:0 1px 2px #111}
  .fztv-overpass-image{display:block;width:100%;height:auto;aspect-ratio:956/465;object-fit:cover;border-radius:5px;margin:6px 0}
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
  let busy=false;
  const run=()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;addToSelects(document);addPool(document);addMatchImages(document);});};
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();