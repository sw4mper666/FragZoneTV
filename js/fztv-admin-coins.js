/* FZTV secure admin FZ Coins grants */
(()=>{
'use strict';
if(window.__fzAdminCoins)return;window.__fzAdminCoins=true;
const client=()=>typeof sb!=='undefined'?sb:null;
function add(tag,txt){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;return e;}
let pending=false,loading=false;
async function mount(){
 const root=document.getElementById('app'),db=client();
 if(!root||!db||!location.hash.startsWith('#/admin')||!(typeof isAdmin==='function'&&isAdmin()))return;
 if(document.getElementById('fz-admin-coins'))return;
 const panel=add('section');panel.id='fz-admin-coins';panel.className='panel';panel.style.cssText='padding:20px;margin:16px 0;color:#eaf2ff;background:#152238;border:1px solid #415b7e;border-radius:12px';
 panel.append(add('h2','Начисление FZ Coins'));
 const intro=add('p','Выбери зарегистрированного пользователя и укажи количество монет для начисления. Текущий баланс будет увеличен на эту сумму.');intro.style.cssText='font-size:13px;color:#bac9de';panel.append(intro);
 const form=add('form');form.style.cssText='display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:14px 0';
 const label=(text,control)=>{const l=add('label');l.style.cssText='display:flex;flex-direction:column;gap:5px;font-size:12px;color:#bbcee8';l.append(add('span',text),control);return l;};
 const select=add('select'),amount=add('input'),grant=add('button','Начислить монеты');
 const inputStyle='background:#0b172a;color:#fff;border:1px solid #486581;border-radius:7px;padding:10px;box-sizing:border-box;min-width:180px';
 select.style.cssText=inputStyle+';max-width:380px;width:100%';select.required=true;select.disabled=true;
 amount.style.cssText=inputStyle;amount.type='text';amount.inputMode='numeric';amount.pattern='[0-9]+';amount.placeholder='Например, 5000';amount.required=true;amount.maxLength=19;
 grant.type='submit';grant.disabled=true;grant.style.cssText='background:#e13c58;border:0;border-radius:7px;padding:11px 16px;color:white;font-weight:800;cursor:pointer';
 form.append(label('Пользователь',select),label('Сколько FZ Coins добавить',amount),grant);panel.append(form);
 const status=add('p','Загрузка пользователей…');status.setAttribute('role','status');status.style.cssText='font-size:13px;color:#b9d0ef';panel.append(status);
 root.prepend(panel);
 let users=[];
 try{
  const r=await db.rpc('fztv_admin_list_users');
  if(r.error)throw r.error;
  users=Array.isArray(r.data)?r.data:(Array.isArray(r.data?.users)?r.data.users:[]);
  if(!users.length){status.textContent='Зарегистрированных пользователей пока нет.';return;}
  for(const u of users){
   const option=add('option',(u.login||u.email||String(u.id))+(u.email&&u.login?' · '+u.email:''));
   option.value=u.id;select.append(option);
  }
  select.disabled=false;grant.disabled=false;status.textContent='Выбери пользователя и количество монет.';
 }catch(err){status.textContent='Ошибка загрузки пользователей: '+err.message;return;}
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(grant.disabled)return;
  const value=amount.value.trim();
  if(!/^[1-9][0-9]*$/.test(value)){status.textContent='Укажи целое положительное количество монет.';return;}
  let n;
  try{n=BigInt(value);}catch{status.textContent='Некорректная сумма.';return;}
  if(n>9223372036854775807n){status.textContent='Превышен допустимый размер суммы.';return;}
  const u=users.find(x=>x.id===select.value);
  if(!u){status.textContent='Выбери пользователя.';return;}
  if(!window.confirm('Начислить '+n.toLocaleString('ru-RU')+' FZ Coins пользователю '+(u.login||u.email||u.id)+'?'))return;
  grant.disabled=true;status.textContent='Начисление…';
  try{
   const r=await db.rpc('fztv_admin_grant_coins',{p_user_id:u.id,p_amount:n.toString()});
   if(r.error)throw r.error;
   status.textContent='Успешно начислено '+n.toLocaleString('ru-RU')+' FZ Coins. Новый баланс: '+String(r.data)+' FZ Coins.';
   amount.value='';
  }catch(err){status.textContent='Ошибка начисления: '+err.message;}
  finally{grant.disabled=false;}
 });
}
function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;mount().catch(err=>console.error('FZ Coins admin',err));},80);}
const app=document.getElementById('app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:false});
window.addEventListener('hashchange',schedule);
schedule();
})();