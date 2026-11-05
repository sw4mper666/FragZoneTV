// Live FZTV CUP #1 registration and participant slots.
export async function mountTournamentRegistration({client,root}){
 const {data:tournaments,error:te}=await client.from('tournaments').select('id,name,status,max_teams,registration_opens_at,starts_at').eq('name','FZTV CUP #1').limit(1);
 if(te||!tournaments?.length)return;
 const tournament=tournaments[0];
 const slots=root.querySelector('.fztv-slots');if(!slots)return;
 if(!root.querySelector('#fztv-square-slots-style')){const style=document.createElement('style');style.id='fztv-square-slots-style';style.textContent=`.fztv-slots{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important}.fztv-slots .fztv-slot{box-sizing:border-box!important;aspect-ratio:1/1!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:7px!important;text-align:center!important;padding:12px!important;border:1px solid #364961!important;border-radius:10px!important;background:#172338!important;overflow:hidden!important}.fztv-slots .fztv-slot>img{width:56%!important;height:56%!important;max-height:110px!important;object-fit:contain!important;border-radius:8px!important}.fztv-slots .fztv-slot>strong{font-size:clamp(11px,1.3vw,16px)!important;line-height:1.2!important;overflow-wrap:anywhere!important}.fztv-slots .fztv-slot>span{font-size:clamp(28px,4vw,52px)!important;line-height:1!important}.fztv-slots .fztv-slot>small{color:#f5c36b;font-size:11px!important}.fztv-slots .fztv-slot-filled{border-color:#507bb4!important;background:#1c304a!important}@media(max-width:650px){.fztv-slots{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.fztv-slots .fztv-slot{padding:8px!important}}`;root.append(style);}
 const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;};
 root.querySelector('.fztv-tournament-registration')?.remove();const controls=el('div');controls.className='fztv-tournament-registration';
 const title=el('h3','РЕГИСТРАЦИЯ КОМАНД');controls.append(title);
 const status=el('p');status.setAttribute('role','status');
 const {data:{user}}=await client.auth.getUser();
 const now=Date.now(),opens=new Date(tournament.registration_opens_at).getTime(),starts=tournament.starts_at?new Date(tournament.starts_at).getTime():Infinity;
 const open=tournament.status==='registration'&&now>=opens&&now<starts;
 const {data:approved,error:ae}=await client.from('fztv_tournament_applications').select('team_id,status').eq('tournament_id',tournament.id).in('status',['approved','pending']);
 const ids=(approved||[]).map(a=>a.team_id);
 let teams=[];
 if(ids.length){const {data,error:teamError}=await client.from('fztv_teams').select('id,name,tag,logo_url').in('id',ids);if(teamError)console.warn('Tournament teams:',teamError.message);const byId=new Map((data||[]).map(t=>[t.id,t]));teams=ids.map(id=>byId.get(id)).filter(Boolean);}
 const capacity=tournament.max_teams||8;
 slots.replaceChildren();
 for(let i=0;i<capacity;i++){
 const team=teams[i],slot=el('div');slot.className='fztv-slot';
 if(team){slot.classList.add('fztv-slot-filled');if(team.logo_url){const img=el('img');img.src=team.logo_url;img.alt='';img.width=35;img.height=35;img.style.cssText='width:35px;height:35px;object-fit:cover;border-radius:7px';slot.append(img);}slot.append(el('strong',team.name));const registration=(approved||[]).find(a=>a.team_id===team.id);if(registration?.status==='pending')slot.append(el('small','На проверке'));}
 else{slot.append(el('span','♟'),el('strong','СВОБОДНО'));}
 slots.append(slot);
 }
 const count=[...root.querySelectorAll('h2,h3,h4')].find(n=>n.textContent.includes('УЧАСТНИКИ'));if(count)count.textContent='УЧАСТНИКИ ('+teams.length+'/'+capacity+')';
 const info=[...root.querySelectorAll('.info-box')].find(x=>x.textContent.includes('УЧАСТНИКИ'));if(info){const b=info.querySelector('b');if(b)b.textContent=teams.length+' / '+capacity+' команд';}
 if(ae)status.textContent='Не удалось загрузить участников: '+ae.message;
 if(!user){controls.append(el('p','Войди в аккаунт, чтобы зарегистрировать команду.'));const a=el('a','Войти');a.href='#/auth';controls.append(a);}
 else{
 const {data:owned,error:oe}=await client.from('fztv_teams').select('id,name').eq('owner_id',user.id).eq('status','approved');
 const {data:mine}=await client.from('fztv_tournament_applications').select('team_id,status').eq('tournament_id',tournament.id).eq('owner_id',user.id);
 const available=(owned||[]).filter(t=>!(mine||[]).some(a=>a.team_id===t.id));
 if(oe)controls.append(el('p','Ошибка загрузки команд: '+oe.message));
 else if(!owned?.length){controls.append(el('p','Для участия нужно создать команду и дождаться одобрения.'));const a=el('a','Создать команду');a.href='#/teams';controls.append(a);}
 else{
 for(const a of mine||[]){const t=owned.find(x=>x.id===a.team_id);if(t)controls.append(el('p',t.name+': '+({pending:'заявка на рассмотрении',approved:'участие подтверждено',rejected:'заявка отклонена'}[a.status]||a.status)));}
 if(available.length){const select=el('select');for(const t of available){const option=el('option',t.name);option.value=t.id;select.append(option);}controls.append(select);
 const btn=el('button','Зарегистрировать команду');btn.type='button';btn.className='toolbtn';btn.disabled=!open||teams.length>=capacity;
 if(!open)controls.append(el('p',now<opens?'Регистрация ещё не открыта.':'Регистрация закрыта.'));
 btn.onclick=async()=>{btn.disabled=true;const {error}=await client.from('fztv_tournament_applications').insert({tournament_id:tournament.id,team_id:select.value,owner_id:user.id,status:'pending'});if(error){status.textContent='Ошибка: '+error.message;btn.disabled=false;}else{status.textContent='Команда зарегистрирована и заняла слот.';btn.remove();select.remove();await mountTournamentRegistration({client,root});}};
 controls.append(btn);
 }
 }
 }
 controls.append(status);
 slots.insertAdjacentElement('beforebegin',controls);
}
