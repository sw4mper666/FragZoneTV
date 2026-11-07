// FragZoneTV current visitors — Supabase Realtime Presence.
// Anonymous and logged-in visitors count alike. Deduplicates tabs in same browser.
export function startSitePresence({client}){
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
