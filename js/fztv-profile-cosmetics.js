// FragZoneTV cosmetic preview on both own and public profiles.
(function(){
'use strict';
if(window.__fztvCosmeticPreview)return;window.__fztvCosmeticPreview=true;
const classes=['fzcos-frame-crimson','fzcos-frame-neon','fzcos-frame-royal','fzcos-bg-ember','fzcos-bg-cyber','fzcos-bg-royal'];
const known={
 frame_crimson:'fzcos-frame-crimson',frame_neon:'fzcos-frame-neon',frame_royal:'fzcos-frame-royal',
 bg_ember:'fzcos-bg-ember',bg_cyber:'fzcos-bg-cyber',bg_royal:'fzcos-bg-royal'
};
const style=document.createElement('style');style.id='fzcos-profile-styles';style.textContent=`
.fztv-account .fztv-user-avatar.fzcos-frame-crimson{border:4px solid #fd345d!important;box-shadow:0 0 0 2px #6e1838,0 0 21px #e82a5c9c!important}
.fztv-account .fztv-user-avatar.fzcos-frame-neon{border:4px solid #61e5ff!important;box-shadow:0 0 0 2px #27489e,0 0 25px #14dfffaf!important}
.fztv-account .fztv-user-avatar.fzcos-frame-royal{border:4px solid #f2c76b!important;box-shadow:0 0 0 2px #7e531e,0 0 25px #e8b84f99!important}
body .fztv-account.fzcos-bg-ember .fztv-cover{background:radial-gradient(circle at 72% 50%,#d32e5b66,transparent 43%),linear-gradient(115deg,#3d101f,#902d44,#161827)!important}
body .fztv-account.fzcos-bg-cyber .fztv-cover{background:repeating-linear-gradient(90deg,#655dd50f 0 2px,transparent 2px 28px),linear-gradient(112deg,#121836,#362c79,#0d2335)!important}
body .fztv-account.fzcos-bg-royal .fztv-cover{background:radial-gradient(circle at 80% 35%,#f6bc4f45,transparent 33%),linear-gradient(120deg,#0d0d16,#463423,#111828)!important}
`;document.head.append(style);
let scheduled=false,lastRoot=null,lastId=null,busy=false;
async function apply(force=false){
 if(busy)return;
 const root=document.querySelector('.fztv-account');
 if(!root)return;
 const route=(location.hash||'').split('/')[1];
 if(!['auth','member'].includes(route))return;
 const client=typeof sb!=='undefined'?sb:null;
 if(!client)return;
 let id=null;
 if(route==='member')id=decodeURIComponent(location.hash.split('/')[2]||'');
 else{const {data:{user}}=await client.auth.getUser();id=user?.id}
 if(!id||!/^[-a-f0-9]{36}$/i.test(id))return;
 if(root===lastRoot&&id===lastId&&!force)return;
 busy=true;
 try{
  const {data,error}=await client.from('fztv_market_equipped').select('frame_id,background_id').eq('user_id',id).maybeSingle();
  if(error||!root.isConnected)return;
  root.classList.remove(...classes);
  root.querySelector('.fztv-user-avatar')?.classList.remove(...classes);
  if(known[data?.background_id])root.classList.add(known[data.background_id]);
  const avatar=root.querySelector('.fztv-user-avatar');
  if(avatar&&known[data?.frame_id])avatar.classList.add(known[data.frame_id]);
  lastRoot=root;lastId=id;
 }finally{busy=false}
}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;apply().catch(console.warn)},120)}
const mo=new MutationObserver(schedule);mo.observe(document.body,{subtree:true,childList:true});
window.addEventListener('hashchange',()=>{lastRoot=null;schedule()});
window.addEventListener('fztv-cosmetics-changed',()=>apply(true).catch(console.warn));
schedule();
})();
