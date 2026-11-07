// Ranking enhancements are applied to the actual home-page team cards, not only
// to the standalone player leaderboard component.
function decorateTeamRanking(client){
  if(document.getElementById('fztv-ranking-2026-css'))return;
  const style=document.createElement('style');
  style.id='fztv-ranking-2026-css';
  style.textContent='.fztv-home-podium-1{border:2px solid #e8bb45!important;box-shadow:0 0 20px #e8bb452b!important}.fztv-home-podium-2{border:2px solid #aebdcc!important;box-shadow:0 0 18px #aebdcc25!important}.fztv-home-podium-3{border:2px solid #bb7953!important;box-shadow:0 0 18px #bb795325!important}.fztv-igl-crown{margin-left:5px;font-size:14px;vertical-align:middle}';
  document.head.append(style);
  let igls=new Set(),pending=false;
  const findCard=(node,rank)=>{
    let p=node.parentElement;
    for(let n=0;p&&n<7;n++,p=p.parentElement){
      const t=p.innerText||'';
      if(t.length>9000)break;
      if(t.includes('Team Woods')&&rank===1&&t.includes('Профиль команды')&&!t.includes('#2'))return p;
      if(rank>1&&t.length<1600&&t.includes('#'+rank)&&t.includes(rank===2?'Taykans':'Woods Academy')&&!t.includes('#'+(rank+1)))return p;
    }
    return null;
  };
  const decorate=()=>{
    pending=false;
    if(!location.hash||location.hash==='#/'||location.hash==='#/home'){
      const rankTexts=[...document.querySelectorAll('span,strong,b,div')].filter(n=>n.children.length===0&&/^#[123]$/.test((n.textContent||'').trim()));
      for(const rank of [1,2,3]){
        const rankNode=rankTexts.find(n=>n.textContent.trim()==='#'+rank);
        const card=rankNode&&findCard(rankNode,rank);
        if(card)card.classList.add('fztv-home-podium-'+rank);
      }
    }
    if(!igls.size)return;
    const names=[...document.querySelectorAll('b,strong,span,small,a,h1,h2,h3')];
    for(const el of names){
      if(el.children.length||el.closest('script,style'))continue;
      const name=(el.textContent||'').trim().toLowerCase();
      if(!igls.has(name)||el.querySelector('.fztv-igl-crown'))continue;
      if(el.closest('.fztv-home-podium-1,.fztv-home-podium-2,.fztv-home-podium-3')||location.hash.startsWith('#/player/')||location.hash.startsWith('#/team/')){
        const crown=document.createElement('span');crown.className='fztv-igl-crown';crown.textContent='👑';crown.title='Капитан команды · IGL';el.append(crown);
      }
    }
  };
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(decorate)};
  const observer=new MutationObserver(schedule);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',schedule);
  Promise.all([
    client.from('fztv_team_players').select('nickname,primary_role'),
    client.from('fztv_legacy_player_profiles').select('player_slug,primary_role'),
    client.from('fztv_roster_players').select('player_slug,nickname')
  ]).then(([team,legacy,roster])=>{
    const nicks=new Map((roster.data||[]).map(x=>[x.player_slug,x.nickname]));
    igls=new Set([
      ...(team.data||[]).filter(x=>String(x.primary_role||'').toUpperCase()==='IGL').map(x=>x.nickname.toLowerCase()),
      ...(legacy.data||[]).filter(x=>String(x.primary_role||'').toUpperCase()==='IGL').map(x=>String(nicks.get(x.player_slug)||x.player_slug).toLowerCase())
    ]);
    schedule();
  }).catch(()=>{});
  schedule();
}

// FragZoneTV current visitors — Supabase Realtime Presence.
// Anonymous and logged-in visitors count alike. Deduplicates tabs in same browser.
export function startSitePresence({client}){
  if(client)decorateTeamRanking(client);
  const node=document.getElementById('fztv-online-count');
  const stateNode=document.getElementById('fztv-online-state');
  if(!node||!client)return;
  let visitorId;
  try{
    visitorId=localStorage.getItem('fztv-visitor-key-v1');
    if(!visitorId){
      visitorId=crypto.randomUUID();
      localStorage.setItem('fztv-visitor-key-v1',visitorId);
    }
  }catch(_){
    visitorId=crypto.randomUUID();
  }
  const tabId=crypto.randomUUID();
  const channel=client.channel('fztv-site-online-v1',{config:{presence:{key:tabId}}});
  let subscribed=false;

  const update=()=>{
    const presences=channel.presenceState();
    const visitorIds=new Set();
    for(const items of Object.values(presences)){
      for(const entry of items){
        if(entry.visitor)visitorIds.add(entry.visitor);
      }
    }
    node.textContent=String(visitorIds.size);
    if(stateNode)stateNode.title='Активные посетители сайта. Несколько вкладок одного браузера считаются одним посетителем.';
  };
  const track=()=>{
    if(!subscribed)return;
    if(document.visibilityState==='visible'){
      channel.track({visitor:visitorId}).catch(()=>{});
    }else{
      channel.untrack().catch(()=>{});
    }
  };
  channel.on('presence',{event:'sync'},update)
    .subscribe(status=>{
      if(status==='SUBSCRIBED'){
        subscribed=true;
        track();
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        subscribed=false;
        node.textContent='—';
      }
    });
  // Keep a private, ownership-checked heartbeat for signed-in members.
  // A member is "online" only if a heartbeat was received recently.
  let activityTimer;
  const heartbeat=async()=>{
    if(document.visibilityState!=='visible')return;
    try {
      const {data:{user}}=await client.auth.getUser();
      if(!user)return;
      await client.from('fztv_member_activity').upsert({
        user_id:user.id,last_seen:new Date().toISOString()
      },{onConflict:'user_id'});
    } catch(_) { /* presence should not block the rest of the site */ }
  };
  heartbeat();
  activityTimer=window.setInterval(heartbeat,60000);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')heartbeat();
  });
  window.addEventListener('pagehide',()=>window.clearInterval(activityTimer),{once:true});
  document.addEventListener('visibilitychange',track);
  window.addEventListener('pagehide',()=>{
    channel.untrack().catch(()=>{});
    client.removeChannel(channel);
  },{once:true});
}
