// FragZoneTV: virtual FZ Coins bank and cosmetic market; all mutations via secured Supabase RPC.
let currentMount = 0;
const e=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const num=x=>Number(x||0).toLocaleString('ru-RU',{maximumFractionDigits:0});
const money=n=>num(n)+' FZ';
const catalogStyle={
 frame_crimson:'fzcos-frame-crimson',frame_neon:'fzcos-frame-neon',frame_royal:'fzcos-frame-royal',
 bg_ember:'fzcos-bg-ember',bg_cyber:'fzcos-bg-cyber',bg_royal:'fzcos-bg-royal'
};
export const cosmeticClasses=catalogStyle;
function ensureStyles(){
 if(document.getElementById('fz-finance-css'))return;
 const style=e('style');style.id='fz-finance-css';
 style.textContent=`
.fzfin{max-width:1050px;margin:20px auto 54px;color:#eef4ff;font-size:14px}
.fzfin *{box-sizing:border-box}
.fzfin-crumb{font-size:12px;color:#8ba3c2;margin-bottom:15px}.fzfin-crumb a{color:#a2b6d6}
.fzfin-hero{background:linear-gradient(118deg,#311b27,#1a283c 73%);border:1px solid #693c48;border-radius:13px;padding:26px 28px;margin-bottom:16px}
.fzfin-eyebrow{color:#ff627a;font-size:11px;letter-spacing:2px;font-weight:900}
.fzfin-hero h1{font-size:30px;line-height:1.1;margin:13px 0 9px}
.fzfin-hero p{font-size:12px;color:#b2bdd0}.fzfin-balance{font-size:36px;font-weight:950;letter-spacing:.5px;margin-top:13px}.fzfin-balance small{font-size:13px;color:#ff5e78}
.fzfin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.fzfin-panel{background:#111a26;border:1px solid #2a3b52;border-radius:11px;padding:20px;min-height:178px}
.fzfin-panel h2{margin:0 0 16px;font-size:15px}.fzfin-big{font-size:24px;font-weight:950;line-height:1.2}.fzfin-panel p{font-size:12px;color:#9bb2cd;line-height:1.55}
.fzfin-input{display:block;width:100%;margin:12px 0 9px;padding:13px 12px;border-radius:8px;background:#070d17;color:#e7efff;border:1px solid #374b66;font-size:15px}
.fzfin-btn{border:0;border-radius:8px;padding:12px 16px;background:#f02a46;color:#fff;font-weight:850;font-size:13px;cursor:pointer}
.fzfin-btn.secondary{background:#23364c;border:1px solid #55718d}.fzfin-btn:disabled{opacity:.5;cursor:not-allowed}
.fzfin-note{margin:12px 0;color:#a9bdd7;font-size:12px}.fzfin-note.error{color:#ff8d9d}.fzfin-note.success{color:#7cf0bc}
.fzfin-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.fzfin-links a{background:#233149;border:1px solid #3a5270;padding:10px 14px;border-radius:8px;font-size:13px}
.fzfin-history{margin-top:15px;background:#111a26;border:1px solid #2a3b52;border-radius:11px;padding:20px}
.fzfin-history h2{margin:0 0 12px;font-size:15px}.fzfin-history-row{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #2b3a50;font-size:12px}.fzfin-history-row small{display:block;color:#8fa5bf;margin-top:5px}
.fzfin-products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
.fzfin-product{border:1px solid #31435b;border-radius:11px;background:#111a27;overflow:hidden}
.fzfin-preview{height:160px;display:grid;place-items:center;background:linear-gradient(125deg,#0b111b,#283047)}
.fzfin-preview .fzfin-avatar{width:83px;height:83px;border-radius:50%;display:grid;place-items:center;background:#1b293c;color:#eff5ff;font-size:29px;font-weight:950;border:3px solid #4a6384}
.fzfin-product-info{padding:16px}.fzfin-product-info h3{font-size:16px;margin:0 0 5px}.fzfin-product-info p{color:#a4b7d2;font-size:12px;min-height:35px}.fzfin-price{font-weight:950;color:#f5cb73;margin:10px 0 12px;font-size:17px}
.fzfin-product .fzfin-btn{width:100%}.fzfin-status{margin:12px 0}
.fzcos-frame-crimson{border:4px solid #fd345d!important;box-shadow:0 0 0 2px #6e1838,0 0 21px #e82a5c9c!important}
.fzcos-frame-neon{border:4px solid #61e5ff!important;box-shadow:0 0 0 2px #27489e,0 0 25px #14dfffaf!important}
.fzcos-frame-royal{border:4px solid #f2c76b!important;box-shadow:0 0 0 2px #7e531e,0 0 25px #e8b84f99!important}
.fzcos-bg-ember{background:radial-gradient(circle at 72% 50%,#d32e5b66,transparent 43%),linear-gradient(115deg,#3d101f,#902d44,#161827)!important}
.fzcos-bg-cyber{background:repeating-linear-gradient(90deg,#655dd50f 0 2px,transparent 2px 28px),linear-gradient(112deg,#121836,#362c79,#0d2335)!important}
.fzcos-bg-royal{background:radial-gradient(circle at 80% 35%,#f6bc4f45,transparent 33%),linear-gradient(120deg,#0d0d16,#463423,#111828)!important}
.fzfin-preview.fzcos-bg-ember,.fzfin-preview.fzcos-bg-cyber,.fzfin-preview.fzcos-bg-royal{background-size:cover!important}
@media(max-width:750px){.fzfin-grid{grid-template-columns:1fr}.fzfin-products{grid-template-columns:repeat(2,minmax(0,1fr))}.fzfin-hero{padding:19px}.fzfin-hero h1{font-size:25px}.fzfin-balance{font-size:29px}}
@media(max-width:490px){.fzfin-products{grid-template-columns:1fr}}
`;
 document.head.append(style);
}
function status(node,text,isError=false){node.textContent=text;node.className='fzfin-note '+(isError?'error':'success');}
async function userOf(client){const {data:{user},error}=await client.auth.getUser();if(error)throw error;return user;}
function guard(root,token){return root.isConnected&&token===currentMount}
function layout(root,kind){
 root.replaceChildren();
 const shell=e('div','fzfin');root.append(shell);
 const crumb=e('div','fzfin-crumb');const home=e('a','','Главная');home.href='#/home';crumb.append(home,document.createTextNode(' / '+(kind==='bank'?'Банк':'FZ Market')));shell.append(crumb);
 return shell;
}
function header(shell,title,description){
 const hero=e('section','fzfin-hero');hero.append(e('div','fzfin-eyebrow','FRAGZONE TV · ВИРТУАЛЬНАЯ ЭКОНОМИКА'),e('h1','',title),e('p','',description));shell.append(hero);return hero;
}
function panel(grid,title){const card=e('section','fzfin-panel');card.append(e('h2','',title));grid.append(card);return card}
const inp=(min,max,placeholder)=>{const input=e('input','fzfin-input');input.type='number';input.min=String(min);input.max=String(max);input.step='1';input.placeholder=placeholder;input.inputMode='numeric';return input};
async function mountBank(client,root,token){
 const shell=layout(root,'bank'),hero=header(shell,'Банк FZTV','Баланс твоего счёта и виртуальные кредиты FZTV.');
 const badge=e('div','fzfin-balance','Загрузка…');hero.append(badge);
 const grid=e('div','fzfin-grid');shell.append(grid);
 const cash=panel(grid,'💳 ТВОЙ СЧЁТ'),cashValue=e('div','fzfin-big','—');cash.append(cashValue,e('p','','FZ Coins — внутренняя валюта сайта, не рейтинг FZ Points.'));
 const credit=panel(grid,'🏦 КРЕДИТ FZTV');
 credit.append(e('div','fzfin-big','100–10 000 FZ'),e('p','','Один активный кредит одновременно. 1% в день, сложный процент с округлением до целого коина вверх.'));
 const loanInput=inp(100,10000,'Сумма от 100 до 10 000'),loanButton=e('button','fzfin-btn','ВЗЯТЬ КРЕДИТ');credit.append(loanInput,loanButton);
 const debtPanel=panel(grid,'📉 ТЕКУЩИЙ ДОЛГ'),debtValue=e('div','fzfin-big','—');
 const repayInput=inp(1,10000000,'Сумма погашения'),repayButton=e('button','fzfin-btn','ПОГАСИТЬ ДОЛГ');
 debtPanel.append(debtValue,e('p','','Проценты начисляются после каждого полного дня непогашенного кредита.'),repayInput,repayButton);
 const rules=panel(grid,'ℹ️ УСЛОВИЯ БАНКА');
 rules.append(e('p','','• Сумма кредита: 100–10 000 FZ Coins\n• Процент: 1% за полный день, сложный\n• Проценты округляются до целого FZ вверх\n• Досрочное и частичное погашение\n• Повторный кредит — после полного погашения предыдущего.'));
 rules.querySelector('p').style.whiteSpace='pre-line';
 const message=e('p','fzfin-note');shell.append(message);
 const links=e('div','fzfin-links'),market=e('a','','🛒 Перейти в FZ Market');market.href='#/market';links.append(market);shell.append(links);
 const history=e('section','fzfin-history');history.append(e('h2','','История операций'));const rows=e('div');history.append(rows);shell.append(history);
 let busy=false,bank=null;
 async function redraw(){
  const result=await client.rpc('fztv_my_bank');
  if(!guard(root,token))return;
  if(result.error){status(message,'Ошибка банка: '+result.error.message,true);return;}
  bank=result.data?.[0]||{balance:0,debt:0};
  badge.replaceChildren(document.createTextNode(money(bank.balance)+' '));
  badge.append(e('small','','FZ COINS'));
  cashValue.textContent=money(bank.balance);debtValue.textContent=money(bank.debt);
  loanButton.disabled=Number(bank.debt)>0;
  loanButton.textContent=Number(bank.debt)>0?'КРЕДИТ УЖЕ АКТИВЕН':'ВЗЯТЬ КРЕДИТ';
  repayButton.disabled=Number(bank.debt)<=0;
  const tx=await client.from('fztv_coins_ledger').select('id,delta,operation,description,created_at').order('created_at',{ascending:false}).limit(12);
  if(!guard(root,token))return;
  rows.replaceChildren();
  if(tx.error){rows.append(e('p','fzfin-note','История недоступна.'));return;}
  if(!tx.data?.length){rows.append(e('p','fzfin-note','Операций пока нет.'));return;}
  for(const x of tx.data){const row=e('div','fzfin-history-row'),left=e('div');left.append(e('strong','',x.description),e('small','',new Date(x.created_at).toLocaleString('ru-RU')));row.append(left,e('strong','',Number(x.delta)>0?'+'+money(x.delta):money(x.delta)));rows.append(row)}
 }
 async function transact(method,amount){
  if(busy)return;
  if(!Number.isInteger(amount)||amount<1){status(message,'Укажи целое число FZ Coins.',true);return}
  if(method==='fztv_take_loan'&&(amount<100||amount>10000)){status(message,'Кредит от 100 до 10 000 FZ Coins.',true);return}
  if(method==='fztv_repay_loan'&&(!bank||amount>Math.min(Number(bank.balance),Number(bank.debt)))){status(message,'Сумма превышает доступный баланс или долг.',true);return}
  if(!window.confirm(method==='fztv_take_loan'?'Взять кредит '+money(amount)+' под 1% в день?':'Погасить '+money(amount)+'?'))return;
  busy=true;loanButton.disabled=true;repayButton.disabled=true;status(message,'Выполняется операция…');
  const result=await client.rpc(method,{p_amount:amount});
  if(!guard(root,token))return;
  if(result.error)status(message,result.error.message,true);
  else status(message,method==='fztv_take_loan'?'Кредит зачислен.':'Долг погашен частично или полностью.');
  await redraw();busy=false;
 }
 loanButton.onclick=()=>transact('fztv_take_loan',Number(loanInput.value));
 repayButton.onclick=()=>transact('fztv_repay_loan',Number(repayInput.value));
 await redraw();
}
async function mountMarket(client,root,token){
 const shell=layout(root,'market'),hero=header(shell,'FZ Market','Уникальные рамки аватара и фоны профиля за FZ Coins.');
 const balance=e('div','fzfin-balance','Загрузка…');hero.append(balance);
 const link=e('div','fzfin-links'),banklink=e('a','','🏦 Банк FZTV');banklink.href='#/bank';link.append(banklink);hero.append(link);
 const msg=e('p','fzfin-note');shell.append(msg);
 const list=e('div','fzfin-products');shell.append(list);
 let items=[],inventory=new Set(),equipped={};let busy=false;
 async function redraw(){
  const [w,c,inv,eq]=await Promise.all([
   client.rpc('fztv_my_bank'),
   client.from('fztv_market_items').select('id,kind,name,description,price').eq('available',true).order('sort_order'),
   client.from('fztv_market_inventory').select('item_id'),
   client.from('fztv_market_equipped').select('frame_id,background_id').eq('user_id',(await userOf(client)).id).maybeSingle()
  ]);
  if(!guard(root,token))return;
  if(w.error||c.error||inv.error||eq.error){status(msg,'Ошибка загрузки магазина: '+(w.error||c.error||inv.error||eq.error).message,true);return;}
  balance.textContent=money(w.data?.[0]?.balance||0);
  items=c.data||[];inventory=new Set((inv.data||[]).map(x=>x.item_id));equipped=eq.data||{};
  list.replaceChildren();
  items.forEach(item=>{
   const card=e('article','fzfin-product');
   const preview=e('div','fzfin-preview'+(item.kind==='background'?' '+(catalogStyle[item.id]||''):'')),avatar=e('div','fzfin-avatar','FZ');
   if(item.kind==='frame'&&catalogStyle[item.id])avatar.classList.add(catalogStyle[item.id]);
   preview.append(avatar);
   const info=e('div','fzfin-product-info');
   info.append(e('h3','',item.name),e('p','',item.description),e('div','fzfin-price',money(item.price)));
   const owned=inventory.has(item.id),active=equipped[item.kind==='frame'?'frame_id':'background_id']===item.id;
   const btn=e('button','fzfin-btn'+(owned?' secondary':''),!owned?'КУПИТЬ':active?'СНЯТЬ':'ПРИМЕНИТЬ');
   btn.disabled=busy;btn.onclick=async()=>{
    if(busy)return;
    if(!owned&&!window.confirm('Купить '+item.name+' за '+money(item.price)+'?'))return;
    busy=true;btn.disabled=true;status(msg,'Обработка операции…');
    const result=owned
     ?await client.rpc('fztv_equip_market_item',{p_kind:item.kind,p_item_id:active?null:item.id})
     :await client.rpc('fztv_buy_market_item',{p_item_id:item.id});
    if(!guard(root,token))return;
    if(result.error)status(msg,result.error.message,true);
    else {status(msg,owned?(active?'Оформление снято.':'Оформление применено к профилю.'):'Предмет куплен! Теперь нажми «Применить».');window.dispatchEvent(new Event('fztv-cosmetics-changed'))}
    busy=false;await redraw();
   };
   info.append(btn);card.append(preview,info);list.append(card);
  });
 }
 await redraw();
}
export async function mountFinance({client,root,route}){
 if(!client||!root)return;
 ensureStyles();
 const token=++currentMount;
 const user=await userOf(client);
 if(!guard(root,token))return;
 if(!user){root.replaceChildren();const box=e('section','fzfin');box.append(e('h1','','Войдите в аккаунт'),e('p','','Банк и FZ Market доступны зарегистрированным пользователям.'));const a=e('a','','Войти / Регистрация');a.href='#/auth';box.append(a);root.append(box);return;}
 if(route==='bank')return mountBank(client,root,token);
 if(route==='market')return mountMarket(client,root,token);
}
