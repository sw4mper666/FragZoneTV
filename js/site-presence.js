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
  document.addEventListener('visibilitychange',track);
  window.addEventListener('pagehide',()=>{
    channel.untrack().catch(()=>{});
    client.removeChannel(channel);
  },{once:true});
}
