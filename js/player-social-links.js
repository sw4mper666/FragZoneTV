(()=>{
const types=[['steam_url','Steam','◉','steamcommunity.com'],['tiktok_url','TikTok','♪','tiktok.com'],['instagram_url','Instagram','◎','instagram.com'],['faceit_url','FACEIT','F','faceit.com']];
const style=document.createElement('style');style.textContent='.fztv-socials{position:absolute;top:14px;right:16px;display:flex;gap:8px;z-index:5}.fztv-socials a{display:grid;place-items:center;width:38px;height:38px;border-radius:7px;background:#102033;border:1px solid #40516a;color:white;font-size:18px;text-decoration:none}.fztv-socials a:hover{border-color:#ef344e}.fztv-social-editor{margin-top:15px;padding:12px;background:#142235;border-radius:8px}.fztv-social-editor input{background:#0e1929;color:white;border:1px solid #40516a;border-radius:5px;padding:8px;width:100%;box-sizing:border-box}.fztv-social-editor label{display:block;margin:8px 0;font-size:12px}@media(max-width:700px){.fztv-socials{position:static;margin:10px 0}}';document.head.append(style);
const valid=(v,host)=>{try{let u=new URL(v);return u.protocol==='https:'&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:null}catch{return null}};
async function mount(){
if(!location.hash.startsWith('#/player/'))return;
const main=document.querySelector('#app .fztv-player-main');if(!main||main.dataset.socialMounted)return;main.dataset.socialMounted='1';
const slug=decodeURIComponent(location.hash.split('/')[2]).toLowerCase();
let legacy=false;
let {data:p}=await sb.from('fztv_team_players').select('id,nickname,team_id,steam_url,tiktok_url,instagram_url,faceit_url,fztv_teams(owner_id)').ilike('nickname',slug).maybeSingle();
if(!p){legacy=true;const r=await sb.from('fztv_legacy_player_profiles').select('player_slug,steam_url,tiktok_url,instagram_url,faceit_url').eq('player_slug',slug).maybeSingle();p=r.data}
if(!main.isConnected)return;p=p||{};
const bar=document.createElement('div');bar.className='fztv-socials';main.append(bar);
function draw(){bar.replaceChildren();for(const [field,name,symbol,host] of types){const url=valid(p[field],host);if(!url)continue;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.title=name;a.textContent=symbol;bar.append(a)}}draw();
const {data:auth}=await sb.auth.getUser();
const allowed=!!auth?.user&&(p.fztv_teams?.owner_id===auth.user.id||typeof isAdmin==='function'&&isAdmin());if(!allowed)return;
const form=document.createElement('form');form.className='fztv-social-editor';form.append(document.createTextNode('Социальные сети игрока'));
const inputs={};for(const [field,name] of types){const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='url';input.value=p[field]||'';input.placeholder='https://';inputs[field]=input;label.append(input);form.append(label)}
const button=document.createElement('button');button.className='toolbtn';button.textContent='Сохранить';const msg=document.createElement('span');msg.style.marginLeft='10px';form.append(button,msg);
form.onsubmit=async e=>{e.preventDefault();const vals={};for(const [field,name,symbol,host] of types){const v=inputs[field].value.trim();if(v&&!valid(v,host)){msg.textContent='Неверная ссылка: '+name;return}vals[field]=v||null}button.disabled=true;const query=legacy?sb.from('fztv_legacy_player_profiles').upsert({player_slug:slug,...vals},{onConflict:'player_slug'}):sb.from('fztv_team_players').update(vals).eq('id',p.id).select('id');const {data,error}=await query;msg.textContent=error?error.message:(!legacy&&!data?.length?'Нет прав':'Сохранено');if(!error&&(legacy||data?.length)){Object.assign(p,vals);draw()}button.disabled=false};
main.querySelector('.fztv-player-facts')?.after(form);
}
const app=document.getElementById('app');if(app)new MutationObserver(()=>setTimeout(mount,100)).observe(app,{childList:true,subtree:false});window.addEventListener('hashchange',()=>setTimeout(mount,150));setTimeout(mount,200);
})();