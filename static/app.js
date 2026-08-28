const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let token=localStorage.gm_token||"", user=null, toastTimer;
const state={page:"dashboard",search:"",items:[],edit:null};

async function api(url,opt={}){
 opt.headers={...(opt.headers||{}),"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})};
 const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}
 if(r.status===401){token="";localStorage.removeItem("gm_token");renderLogin();throw Error(d.error||"Авторизация")}
 if(!r.ok)throw Error(d.error||"Ошибка");
 return d;
}
function toast(x){clearTimeout(toastTimer);let e=document.createElement("div");e.className="toast";e.textContent=x;document.body.append(e);toastTimer=setTimeout(()=>e.remove(),2500)}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function icon(x){return ({discord:"◉",telegram:"➤",youtube:"▶",music:"♪",link:"↗",server:"◈",users:"♟",shield:"♜"}[x]||"◆")}
function renderLogin(){
 $("#app").innerHTML=`<main class="login"><form class="card loginbox" id="login"><div class="center"><div class="crown">♛</div><h1>GOOD MOBILE</h1><p class="sub">PANEL MANAGEMENT</p></div><label>Логин<input class="input" name="login" value="admin" required></label><br><label>Пароль<input class="input" type="password" name="password" value="admin12345" required></label><br><button class="btn" style="width:100%">Войти в панель</button><p class="sub center" style="margin-top:15px">Демо: admin / admin12345</p></form></main>`;
 $("#login").onsubmit=async e=>{e.preventDefault();try{let d=await api("/api/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});token=d.token;localStorage.gm_token=token;user=d.user;render()}catch(e){toast(e.message)}}
}
const nav=[
 ["dashboard","⌂","Главная"],["admins","♟","Администраторы"],["positions","♜","Должности"],["servers","◈","Серверы"],["links","↗","Ссылки"],["news","▣","Новости"],["applications","☷","Заявления"],["complaints","⚠","Жалобы"],["settings","⚙","Настройки"],["statistics","▥","Статистика"],["audit","≡","Аудит"]
];
function shell(content){
 $("#app").innerHTML=`<header class="top"><div class="brand"><span class="crown">♛</span><div><b>GOOD MOBILE</b><small>PANEL MANAGEMENT</small></div></div><div class="actions"><span class="badge">${esc(user?.name||"Admin")} · ${esc(user?.role||"")}</span><button class="btn secondary" id="logout">Выйти</button></div></header><div class="layout"><aside class="side">${nav.map(n=>`<a class="nav ${state.page===n[0]?"active":""}" href="#${n[0]}"><span>${n[1]}</span>${n[2]}</a>`).join("")}</aside><main class="content">${content}</main></div>`;
 $("#logout").onclick=()=>{token="";localStorage.removeItem("gm_token");renderLogin()};
}
async function render(){
 if(!user){try{user=(await api("/api/me")).user}catch{return renderLogin()}}
 const page=location.hash.slice(1)||state.page;state.page=page;await pageRender(page);
}
window.addEventListener("hashchange",render);
function title(t,s){return `<h1>${t}</h1><div class="sub">${s}</div>`}
async function pageRender(page){
 try{
 if(page==="dashboard")return dashboard();
 if(page==="statistics")return statistics();
 if(page==="admins")return admins();
 if(page==="settings")return settings();
 if(page==="audit")return listPage("audit","Журнал действий","Аудит действий администраторов",["action","entity","entity_id","details","name","created_at"],false);
 const cfg={
 positions:["Должности","Уровни администрации и разрешения",["name","description","color","priority","permissions","active"]],
 servers:["Серверы","Управление количеством серверов, онлайном и параметрами",["name","address","port","online","players","max_players","version","mode","sort_order","active"]],
 links:["Ссылки","Все внешние ссылки проекта",["title","url","icon","placement","sort_order","active","clicks"]],
 news:["Новости","Публикации и контент проекта",["title","slug","excerpt","content","image","category","status","published_at"]],
 applications:["Заявления","Приём и обработка заявлений",["user_name","contact","position_id","message","status","assigned_id","admin_note"]],
 complaints:["Жалобы","Модерация обращений игроков",["user_name","contact","subject","message","status","assigned_id","response","priority"]]
 };
 if(cfg[page])return crudPage(page,...cfg[page]);
 return dashboard();
 }catch(e){shell(`<div class="card"><h2>Ошибка</h2><p class="bad">${esc(e.message)}</p></div>`)}
}
async function dashboard(){
 const d=await api("/api/dashboard"),s=d.settings;
 const cards=[["Пользователи",d.stats.users,"♟"],["Администраторы",d.stats.admins,"♜"],["Должности",d.stats.positions,"◆"],["Серверы",d.stats.servers,"◈"],["Активные ссылки",d.stats.links,"↗"],["Новые заявления",d.stats.applications,"☷"],["Новые жалобы",d.stats.complaints,"⚠"],["Новости",d.stats.news,"▣"]];
 shell(title("Главная","Центр управления Good Mobile")+
 `<div class="grid g4">${cards.map(x=>`<div class="card stat"><span class="icon">${x[2]}</span><div class="label">${x[0]}</div><div class="num">${x[1]}</div></div>`).join("")}</div>
 <div class="grid two" style="margin-top:15px"><div class="card"><h2>Показатели проекта</h2><div class="grid g3">${[["Онлайн",s.online_players],["Сегодня",s.today_players],["Активных",s.active_players]].map(x=>`<div class="panel"><div class="sub" style="margin:0">${x[0]}</div><b style="font-size:25px">${x[1]}</b></div>`).join("")}</div></div>
 <div class="card"><h2>Быстрые действия</h2><div class="actions"><a href="#admins" class="btn">+ Администратор</a><a href="#links" class="btn secondary">Ссылки</a><a href="#servers" class="btn secondary">Серверы</a><a href="#settings" class="btn secondary">Настройки</a></div></div></div>
 <div class="card" style="margin-top:15px"><h2>Серверы</h2><div class="grid g3">${d.servers.map(x=>`<div class="panel"><b>${esc(x.name)}</b><div class="${x.online?"ok":"bad"}">${x.online?"● Онлайн":"● Оффлайн"}</div><div style="margin-top:9px">${x.players} / ${x.max_players}</div><div class="serverbar"><i style="width:${Math.min(100,x.players/x.max_players*100)}%"></i></div><small class="sub">${esc(x.address)}:${x.port}</small></div>`).join("")}</div></div>`);
}
async function statistics(){
 const d=await api("/api/dashboard");shell(title("Статистика","Сводка по проекту")+
 `<div class="grid g3">${Object.entries(d.stats).map(([k,v])=>`<div class="card stat"><div class="label">${k}</div><div class="num">${v}</div><div class="serverbar"><i style="width:${Math.min(100,v*7)}%"></i></div></div>`).join("")}</div>
 <div class="card" style="margin-top:15px"><h2>Онлайн серверов</h2><div class="grid g3">${d.servers.map(s=>`<div class="panel"><b>${esc(s.name)}</b><div style="font-size:28px;font-weight:900;margin-top:8px">${s.players}</div><div class="sub">${s.max_players} slots · ${s.online?"online":"offline"}</div></div>`).join("")}</div></div>`);
}
async function admins(){
 const d=await api("/api/users"),p=await api("/api/positions");
 shell(title("Администраторы","Управление составом администрации")+
 `<div class="toolbar"><input id="adminSearch" class="input" style="max-width:420px" placeholder="Поиск по логину или имени"><button class="btn" id="addAdmin">+ Создать администратора</button></div>
 <div class="card tablewrap"><table class="table"><thead><tr><th>Логин</th><th>Имя</th><th>Должность</th><th>Роль</th><th>Статус</th><th></th></tr></thead><tbody>${d.items.map(x=>`<tr><td>${esc(x.login)}</td><td>${esc(x.name)}</td><td><span class="badge">${esc(x.position||"—")}</span></td><td>${esc(x.role)}</td><td class="${x.active?"ok":"bad"}">${x.active?"Активен":"Отключён"}</td><td><button class="btn small secondary editadmin" data-id="${x.id}">Изменить</button> <button class="btn small danger deladmin" data-id="${x.id}">Удалить</button></td></tr>`).join("")}</tbody></table></div>`);
 $("#addAdmin").onclick=()=>adminModal(null,p.items);
 $$(".editadmin").forEach(b=>b.onclick=()=>adminModal(d.items.find(x=>x.id==b.dataset.id),p.items));
 $$(".deladmin").forEach(b=>b.onclick=async()=>{if(confirm("Удалить администратора?")){await api("/api/users/"+b.dataset.id,{method:"DELETE"});toast("Удалено");admins()}});
}
function adminModal(x,positions){
 modal(`<h2>${x?"Редактирование":"Создание администратора"}</h2><form id="adminform" class="formgrid">
 <label>Логин<input class="input" name="login" value="${esc(x?.login||"")}" ${x?"disabled":"required"}></label>
 <label>Имя<input class="input" name="name" value="${esc(x?.name||"")}" required></label>
 <label>Пароль<input class="input" name="password" type="password" ${x?"":"required"} placeholder="${x?"Оставьте пустым":"Минимум 6 символов"}"></label>
 <label>Роль<select class="input" name="role"><option ${x?.role==="ADMIN"?"selected":""}>ADMIN</option><option ${x?.role==="SUPERADMIN"?"selected":""}>SUPERADMIN</option></select></label>
 <label>Должность<select class="input" name="position_id">${positions.map(p=>`<option value="${p.id}" ${x?.position_id==p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label>
 <label>Активен<select class="input" name="active"><option value="1" ${x?.active!==0?"selected":""}>Да</option><option value="0" ${x?.active===0?"selected":""}>Нет</option></select></label>
 <div class="full actions"><button class="btn">Сохранить</button><button type="button" class="btn secondary closemodal">Отмена</button></div></form>`);
 $("#adminform").onsubmit=async e=>{e.preventDefault();let b=Object.fromEntries(new FormData(e.target));b.active=+b.active;b.position_id=+b.position_id;if(!b.password)delete b.password;try{await api(x?"/api/users/"+x.id:"/api/users",{method:x?"PUT":"POST",body:JSON.stringify(b)});closeModal();toast("Сохранено");admins()}catch(e){toast(e.message)}}
}
async function settings(){
 const d=await api("/api/settings"),x=d.item;
 const fields=[["project_name","Название проекта"],["tagline","Слоган"],["hero_text","Текст главного блока"],["logo","URL логотипа"],["hero_image","URL hero-изображения"],["game_url","Ссылка игры"],["discord_url","Discord"],["telegram_url","Telegram"],["youtube_url","YouTube"],["tiktok_url","TikTok"],["support_url","Поддержка"],["online_players","Онлайн игроков"],["today_players","Сегодня игроков"],["active_players","Активных игроков"],["maintenance_text","Текст техработ"]];
 shell(title("Настройки","Полное управление конфигурацией проекта")+
 `<form id="settings" class="card formgrid">${fields.map(([n,l])=>`<label class="${n==="hero_text"?"full":""}">${l}${n==="hero_text"?`<textarea class="input" name="${n}">${esc(x[n]||"")}</textarea>`:`<input class="input" name="${n}" type="${n.includes("players")?"number":"text"}" value="${esc(x[n]??"")}">`}</label>`).join("")}
 <label>Технические работы<select class="input" name="maintenance"><option value="0" ${!x.maintenance?"selected":""}>Нет</option><option value="1" ${x.maintenance?"selected":""}>Да</option></select></label>
 <div class="full actions"><button class="btn">Сохранить настройки</button></div></form>`);
 $("#settings").onsubmit=async e=>{e.preventDefault();let b=Object.fromEntries(new FormData(e.target));["online_players","today_players","active_players","maintenance"].forEach(k=>b[k]=+b[k]);try{await api("/api/settings",{method:"PUT",body:JSON.stringify(b)});toast("Настройки сохранены")}catch(e){toast(e.message)}}
}
async function listPage(name,t,s,cols,canAdd){
 const d=await api("/api/"+name);shell(title(t,s)+`<div class="card tablewrap"><table class="table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${d.items.map(x=>`<tr>${cols.map(c=>`<td>${esc(x[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
}
const labels={id:"ID",name:"Название",description:"Описание",color:"Цвет",priority:"Приоритет",permissions:"Права",active:"Активен",address:"Адрес",port:"Порт",online:"Онлайн",players:"Игроки",max_players:"Лимит",version:"Версия",mode:"Режим",sort_order:"Порядок",title:"Заголовок",url:"URL",icon:"Иконка",placement:"Размещение",clicks:"Переходы",slug:"Slug",excerpt:"Описание",content:"Содержание",image:"Изображение",category:"Категория",status:"Статус",published_at:"Дата публикации",user_name:"Пользователь",contact:"Контакт",position_id:"ID должности",message:"Сообщение",assigned_id:"Ответственный",admin_note:"Заметка",subject:"Тема",response:"Ответ",priority:"Приоритет"};
const forms={
 positions:["name","description","color","priority","permissions","active"],servers:["name","address","port","online","players","max_players","version","mode","sort_order","active"],links:["title","url","icon","placement","sort_order","active"],news:["title","slug","excerpt","content","image","category","status","published_at"],applications:["user_name","contact","position_id","message","status","assigned_id","admin_note"],complaints:["user_name","contact","subject","message","status","assigned_id","response","priority"]
};
async function crudPage(name,t,cols){
 let d=await api("/api/"+name+"?search="+encodeURIComponent(state.search));let rows=d.items;
 shell(title(t,{"positions":"Уровни администрации и права","servers":"Количество серверов, онлайн и технические параметры","links":"Ссылки проекта","news":"Контент и публикации","applications":"Обработка заявлений","complaints":"Работа с жалобами"}[name]||"Управление данными")+
 `<div class="toolbar"><input id="search" class="input" style="max-width:450px" placeholder="Поиск..." value="${esc(state.search)}"><button class="btn" id="add">+ Добавить</button></div>
 <div class="card tablewrap"><table class="table"><thead><tr>${cols.map(c=>`<th>${labels[c]||c}</th>`).join("")}<th>Действия</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${c==="active"||c==="online"?`<span class="${r[c]?"ok":"bad"}">${r[c]?"Да":"Нет"}</span>`:c==="permissions"?`<span class="badge">${esc(r[c])}</span>`:esc(r[c])}</td>`).join("")}<td><button class="btn small secondary edit" data-id="${r.id}">Изменить</button> <button class="btn small danger del" data-id="${r.id}">Удалить</button></td></tr>`).join("")}</tbody></table></div>`);
 $("#search").oninput=e=>{state.search=e.target.value;clearTimeout(window.st);window.st=setTimeout(()=>crudPage(name,t,cols),300)};
 $("#add").onclick=()=>crudModal(name,cols,null);
 $$(".edit").forEach(b=>b.onclick=()=>crudModal(name,cols,rows.find(r=>r.id==b.dataset.id)));
 $$(".del").forEach(b=>b.onclick=async()=>{if(confirm("Удалить запись?")){await api(`/api/${name}/${b.dataset.id}`,{method:"DELETE"});toast("Удалено");crudPage(name,t,cols)}})
}
function crudModal(name,cols,x){
 const skip=["id","clicks"];const html=cols.filter(c=>!skip.includes(c)).map(c=>{
  if(["active","online"].includes(c))return `<label>${labels[c]}<select class="input" name="${c}"><option value="1" ${x?.[c]?"selected":""}>Да</option><option value="0" ${x&&!x[c]?"selected":""}>Нет</option></select></label>`;
  if(c==="content"||c==="message"||c==="description"||c==="excerpt"||c==="permissions"||c==="response"||c==="admin_note")return `<label class="full">${labels[c]}<textarea class="input" name="${c}">${esc(x?.[c]||"")}</textarea></label>`;
  const type=["priority","port","players","max_players","sort_order","position_id","assigned_id"].includes(c)?"number":"text";
  return `<label>${labels[c]}<input class="input" name="${c}" type="${type}" value="${esc(x?.[c]??"")}"></label>`;
 }).join("");
 modal(`<h2>${x?"Изменение":"Добавление"}: ${labels[cols[0]]||name}</h2><form id="crudform" class="formgrid">${html}<div class="full actions"><button class="btn">Сохранить</button><button type="button" class="btn secondary closemodal">Отмена</button></div></form>`);
 $("#crudform").onsubmit=async e=>{e.preventDefault();let b=Object.fromEntries(new FormData(e.target));["active","online"].forEach(k=>{if(b[k]!==undefined)b[k]=+b[k]});["priority","port","players","max_players","sort_order","position_id","assigned_id"].forEach(k=>{if(b[k]!==undefined&&b[k]!=="")b[k]=+b[k]});try{await api(`/api/${name}${x?"/"+x.id:""}`,{method:x?"PUT":"POST",body:JSON.stringify(b)});closeModal();toast("Сохранено");crudPage(name,({positions:"Должности",servers:"Серверы",links:"Ссылки",news:"Новости",applications:"Заявления",complaints:"Жалобы"})[name],cols)}catch(e){toast(e.message)}}
}
function modal(html){let e=document.createElement("div");e.className="modal";e.innerHTML=`<div class="modalbox card">${html}</div>`;document.body.append(e);$$(".closemodal").forEach(b=>b.onclick=closeModal)}
function closeModal(){$$(".modal").forEach(x=>x.remove())}
(async()=>{if(token)try{user=(await api("/api/me")).user}catch{}render()})();