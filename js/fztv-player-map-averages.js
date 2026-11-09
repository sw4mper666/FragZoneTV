/* FZTV player statistics: each map, average per-map FZTVR. */
(()=>{
'use strict';
if(window.__fztvPerMapProfiles)return;window.__fztvPerMapProfiles=true;
const db=()=>typeof sb!=='undefined'?sb:null;
const css=document.createElement('style');
css.textContent='.fzps-panel{margin:17px 0;padding:17px;background:#122035;border:1px solid #435773;border-radius:12px;color:#e8f2ff}.fzps-panel h3{margin:0 0 12px}.fzps-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:9px;margin-bottom:15px}.fzps-stat{border-radius:8px;background:#1b2e47;padding:11px}.fzps-stat strong{font-size:19px;display:block}.fzps-stat span{font-size:11px;color:#acc0df}.fzps-table{width:100%;border-collapse:collapse;min-width:420px}.fzps-table th,.fzps-table td{padding:9px;border-top:1px solid #32445f;text-align:center;font-size:12px}.fzps-overflow{overflow-x:auto}.fzps-note{font-size:12px;color:#9baec9}';
document.head.append(css);
const fztvr=(p)=>((Number(p.kills||0)+0.5*Number(p.assists||0))/Math.max(1,Number(p.deaths||0)));
const num=n=>String(Math.round(Number(n)));
const ratingLabel=n=>Number(n).toFixed(2);
const el=(tag,t)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=t;return e;};
async function load(){
 const route=location.hash.split('/');if(route[1]!=='player'||route[3]==='stats')return; // unified stats tab renders classic dashboard and map cards
 const root=document.getElementById('app'),client=db(),slug=decodeURIComponent(route[2]||'').toLowerCase();
 if(!root||!client||!slug)return;
 const parent=root.querySelector('.fztv-trophies')||root.querySelector('.fztv-player-profile')||root.querySelector('.tw-profile')||root.querySelector('.detail-card')||root.querySelector('.fztv-player-card');
 if(!parent||root.querySelector('.fzps-panel'))return;
 const q=await client.from('fztv_player_map_stats').select('map_id,match_id,kills,deaths,assists').eq('player_slug',slug);
 if(q.error){console.warn('Map player stats:',q.error);return;}
 const rows=q.data||[];if(!rows.length)return;
 const ids=[...new Set(rows.map(x=>x.map_id))];
 const names=await client.from('fztv_match_maps').select('id,map_name,match_id,map_order').in('id',ids);
 if(names.error)return;
 const mapById=new Map((names.data||[]).map(x=>[x.id,x]));
 const ordered=rows.slice().sort((a,b)=>(mapById.get(a.map_id)?.map_order||0)-(mapById.get(b.map_id)?.map_order||0));
 const totals={kills:0,deaths:0,assists:0},ratings=[];
 for(const r of ordered){totals.kills+=r.kills;totals.deaths+=r.deaths;totals.assists+=r.assists;ratings.push(fztvr(r));}
 const avg=(ratings.reduce((a,b)=>a+b,0)/ratings.length);
 // The match spans three maps: show average per map in the prominent counters,
 // not the full BO3 totals (58 kills from one BO3 is not 58 per map).
 for(const [needle,label,value] of [
  ['Убийств / матч','Убийств / карту',num(totals.kills/rows.length)],
  ['Смертей / матч','Смертей / карту',num(totals.deaths/rows.length)],
  ['Ассистов / матч','Ассистов / карту',num(totals.assists/rows.length)],
  ['Убийства / матч','Убийства / карту',num(totals.kills/rows.length)],
  ['Смерти / матч','Смерти / карту',num(totals.deaths/rows.length)],
  ['Ассисты / матч','Ассисты / карту',num(totals.assists/rows.length)]
 ]){
  const stat=[...root.querySelectorAll('.fztv-stat')].find(e=>e.querySelector('small')?.textContent.trim()===needle);
  if(stat){const number=stat.querySelector('strong'),caption=stat.querySelector('small');if(number)number.textContent=value;if(caption)caption.textContent=label;}
 }

 const panel=el('section');panel.className='fzps-panel';panel.append(el('h3','СТАТИСТИКА ПО КАРТАМ'));
 const summary=el('div');summary.className='fzps-summary';
 const values=[['Средний FZTVR',ratingLabel(avg)],['Карт сыграно',String(rows.length)],['Средние K/D/A',num(totals.kills/rows.length)+' / '+num(totals.deaths/rows.length)+' / '+num(totals.assists/rows.length)],['Общий K/D',num(totals.kills/Math.max(totals.deaths,1))]];
 for(const [label,val] of values){const cell=el('div');cell.className='fzps-stat';cell.append(el('strong',val),el('span',label));summary.append(cell);}panel.append(summary);
 const wrap=el('div');wrap.className='fzps-overflow';const table=el('table');table.className='fzps-table';
 const head=el('tr');for(const title of ['Карта','K','D','A','FZTVR'])head.append(el('th',title));
 const thead=el('thead');thead.append(head);table.append(thead);const tbody=el('tbody');
 for(const r of ordered){const tr=el('tr');for(const v of [mapById.get(r.map_id)?.map_name||'Карта',r.kills,r.deaths,r.assists,ratingLabel(fztvr(r))])tr.append(el('td',String(v)));tbody.append(tr);}
 table.append(tbody);wrap.append(table);panel.append(wrap);
 panel.append(Object.assign(el('p','FZTVR карты = (K + 0,5 × A) / max(D, 1). Средний FZTVR — среднее арифметическое рейтингов всех сыгранных карт.'),{className:'fzps-note'}));
 if(!parent.isConnected||!location.hash.toLowerCase().includes('/player/'+slug))return;
 parent.insertAdjacentElement('afterend',panel);
 const stats=[...root.querySelectorAll('.fztv-stat')].find(x=>x.textContent.includes('FZTVR'));
 if(stats){const strong=stats.querySelector('strong');if(strong)strong.textContent=ratingLabel(avg);}
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;load().catch(console.error);},85);}
const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
window.addEventListener('hashchange',schedule);schedule();
})();