const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const S={token:localStorage.gm_token||"",user:null,page:"dashboard",search:"",cache:{}};
const icons={dashboard:"⌂",admins:"♙",positions:"♕",servers:"▤",links:"↗",news:"▣",applications:"☷",complaints:"⚠",settings:"⚙",statistics:"▥",audit:"≡"};
const labels={name:"Название",description:"Описание",color:"Цвет",priority:"Приоритет",permissions:"Права",active:"Активен",address:"Адрес",port:"Порт",online:"Онлайн",players:"Игроки",max_players:"Лимит",version:"Версия",mode:"Режим",sort_order:"Порядок",title:"Заголовок",url:"URL",icon:"Иконка",placement:"Размещение",clicks:"Переходы",slug:"Slug",excerpt:"Краткое описание",content:"Содержание",image:"Изображение",category:"Категория",status:"Статус",published_at:"Дата публикации",user_name:"Игрок",contact:"Контакт",position_id:"Должность",message:"Сообщение",assigned_id:"Ответственный",admin_note:"Заметка",subject:"Тема",response:"Ответ",entity:"Раздел",entity_id:"ID",action:"Действие",details:"Подробности",created_at:"Создано"};
const cfg={
 positions:{title:"Должности и права",desc:"Настройка уровней администрации и разрешений",fields:["name","description","color","priority","permissions","active"]},
 servers:{title:"Серверы",desc:"Управление количеством серверов, статусами и игровыми слотами",fields:["name","address","port","online","players","max_players","version","mode","sort_order","active"]},
 links:{title:"Управление ссылками",desc:"Все ссылки, кнопки и социальные сети проекта",fields:["title","url","icon","placement","sort_order","active"]},
 news:{title:"Новости",desc:"Публикации проекта, статусы и контент",fields:["title","slug","excerpt","content","image","category","status","published_at"]},
 applications:{title:"Заявления",desc:"Приём, назначение и обработка заявлений",fields:["user_name","contact","position_id","message","status","assigned_id","admin_note"]},
 complaints:{title:"Жалобы",desc:"Обращения игроков, приоритеты и ответы",fields:["user_name","contact","subject","message","status","assigned_id","response","priority"]}
};
async function api(url,opt={}){
 opt.headers={...(opt.headers||{}),...(S.token?{Authorization:"Bearer "+S.token}:{})};
 if(!(opt.body instanceof FormData)) opt.headers["Content-Type"]="application/json";
 const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}
 if(r.status===401){logout(false);throw Error(d.error||"Сессия закончилась")}
 if(!r.ok)throw Error(d.error||"Ошибка запроса");
 return d;
}
function toast(m){const e=document.createElement("div");e.className="toast";e.textContent=m;$("#toast-root").append(e);setTimeout(()=>e.remove(),2800)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function logout(back=true){S.token="";S.user=null;localStorage.removeItem("gm_token");if(back)location.hash="#login";render()}
function can(p){if(S.user?.role==="SUPERADMIN")return true;try{return JSON.parse(S.user?.permissions||"[]").includes(p)}catch{return false}}
function date(v){if(!v)return"—";try{return new Date(v.replace(" ","T")+"Z").toLocaleString("ru-RU")}catch{return v}}
function iconFor(x){return {discord:"◉",telegram:"➤",youtube:"▶",music:"♪",server:"▤",users:"♟"}[x]||"◆"}

async function render(){
 let h=location.hash.replace("#","")||"home";S.page=h;
 if(h==="home")return publicHome();
 if(h==="login")return login();
 if(h==="register")return register();
 if(!S.user){try{S.user=(await api("/api/me")).user}catch{return login()}}
 return panel(h);
}
window.addEventListener("hashchange",render);

async function publicHome(){
 try{
  const d=await api("/api/public");
  const s=d.settings;
  const roles=["Руководство проекта","Команда проекта","Помощник куратора проекта","Специальный администратор","Куратор сервера","Заместитель куратора сервера","Старший администратор","Куратор гос.орг (8+)","Куратор ОПГ (4+)","Администратор"];
  document.title=s.project_name||"Good Mobile";
  $("#app").innerHTML=`<header class="topbar"><div class="container" style="display:flex;width:100%;align-items:center"><div class="brand"><img class="brand-img" src="/brand-logo.png" alt="Good Mobile"><div><div class="brand-title">GOOD MOBILE</div><div class="brand-sub">PANEL MANAGEMENT</div></div></div><nav class="topnav"><a class="active" href="#home">⌂ &nbsp;Главная</a><a href="#home">▣ &nbsp;Новости</a><a href="#home">◉ &nbsp;О проекте</a><a href="#home">▥ &nbsp;Статистика</a><a href="#home">⚙ &nbsp;Поддержка</a></nav><div class="top-actions"><a class="btn" href="${d.apk.available?"/download/game":esc(s.game_url||"#")}" ${d.apk.available?"":"aria-disabled=\"true\""}>🎮 &nbsp;Начать играть</a><a class="social" href="${esc(s.discord_url||"#")}">◉</a><a class="social" href="${esc(s.telegram_url||"#")}">➤</a></div></div></header>
 <main class="page"><div class="container"><div class="top-public-grid"><section class="card hero glow"><div class="city"></div><div class="hero-content"><div class="eyebrow">Good Mobile Project</div><h1>GOOD <span>MOBILE</span></h1><div class="tag">${esc(s.tagline||"ТВОЙ НОВЫЙ ИГРОВОЙ МИР")}</div><p>${esc(s.hero_text||"Присоединяйся к нашему проекту и окунись в мир уникальных возможностей!")}</p><div class="actions"><a class="btn" href="${d.apk.available?"/download/game":esc(s.game_url||"#")}" ${d.apk.available?"":"aria-disabled=\"true\""}>🎮 &nbsp;Начать играть</a><a class="btn ghost" href="#login">Панель управления</a></div><div class="hero-stats"><div class="mini-stat"><span class="muted tiny">Онлайн игроков</span><br><b>${Number(s.online_players||0).toLocaleString("ru-RU")}</b></div><div class="mini-stat"><span class="muted tiny">Серверов</span><br><b>${d.servers.length}</b></div></div></div><div class="hero-car">🏎</div></section></div><aside><section class="card login-side"><div class="section-title"><h2>♛ Вход в аккаунт</h2></div><form id="home-login"><label class="field"><span>Логин</span><input class="input" name="login" placeholder="Логин" required></label><label class="field"><span>Пароль</span><input class="input" name="password" type="password" placeholder="Пароль" required></label><button class="btn">Войти</button></form><a class="side-link" href="#login"><span><b>Регистрация</b><small class="muted" style="display:block">Создай свой аккаунт</small></span><b>→</b></a></section>
 <section class="card pad" style="margin-top:14px"><div class="section-title"><h2>▤ Серверы</h2></div>${d.servers.map(v=>`<div style="padding:9px 0;border-bottom:1px solid #ffffff09"><b>${esc(v.name)}</b><div class="tiny muted">${esc(v.address)}:${v.port}</div><div class="tiny ${v.online?"green":"red"}">${v.online?"● Онлайн":"● Оффлайн"} · ${v.players}/${v.max_players}</div></div>`).join("")}</section>
 <section class="card pad" style="margin-top:14px"><div class="section-title"><h2>◉ Информация</h2></div><div class="project-info"><div class="logo-box">♛<br><small>GOOD</small></div><div class="info-list"><div><span>Название</span><b>${esc(s.project_name)}</b></div><div><span>Жанр</span><b>Role Play</b></div><div><span>Платформа</span><b>Android / iOS</b></div><div><span>Статус</span><b class="green">Онлайн</b></div></div></div></section></aside></div>
 <div class="public-grid"><div><div class="grid g4" style="margin-top:20px">${[
 ["Всего игроков",s.online_players,"♟","+12 за сегодня"],["Серверов",d.servers.length,"▤","+1 за сегодня"],["Активных игроков",s.active_players,"♙","+8 за сегодня"],["Онлайн сегодня",s.today_players,"▣","+5 за час"]].map(x=>`<div class="card stat"><span class="stat-icon">${x[2]}</span><div class="stat-label">${x[0]}</div><div class="stat-num">${Number(x[1]).toLocaleString("ru-RU")}</div><div class="trend">◆ ${x[3]}</div></div>`).join("")}</div>
 <div class="grid g2" style="margin-top:20px"><section class="card pad"><div class="section-title"><h2>♛ Должности администратора</h2></div>${roles.map((r,i)=>`<div class="role-card"><i class="role-dot" style="color:${["#f8c84d","#b64cff","#3f8cff","#ff27a8","#23e989","#16cfff","#ff9c38","#ff3f57","#a54cff","#a9a0bf"][i]}"></i><div><b>${r}</b><small>${i===0?"Полный контроль над проектом":i===4?"Контроль и порядок на сервере":"Помощь в управлении проектом"}</small></div></div>`).join("")}</section>
 <section class="card pad"><div class="section-title"><h2>▣ Последние новости</h2><span class="purple tiny">Все новости →</span></div>${(d.news||[]).length?d.news.slice(0,4).map(n=>`<div class="news-item"><div class="news-thumb">▣</div><div><b>${esc(n.title)}</b><div class="muted tiny">${esc(n.excerpt||"Новая публикация проекта")}</div><small class="dim">${date(n.published_at)}</small></div></div>`).join(""):`<div class="empty">Новостей пока нет</div>`}</section></div></div>
 </div></div></main><footer class="footer"><div class="container footer-inner"><b>♛ GOOD MOBILE</b><span>© 2024. Все права защищены.</span><span>◉ &nbsp;➤ &nbsp;▶ &nbsp;♪</span></div></footer>`;
  $("#home-login").onsubmit=async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});S.token=d.token;localStorage.gm_token=S.token;S.user=d.user;location.hash="#dashboard";render()}catch(e){toast(e.message)}}
 }catch(e){$("#app").innerHTML=`<div class="login-screen"><div class="card login-box"><h2>Good Mobile</h2><p class="red">${esc(e.message)}</p></div></div>`}
}

function login(){
 $("#app").innerHTML=`<main class="login-screen"><form id="login-form" class="card login-box"><div class="login-logo"><img class="login-brand-img" src="/brand-logo.png" alt="Good Mobile"><div class="brand-sub">PANEL MANAGEMENT</div></div><h2>Вход в панель</h2><p class="muted">Авторизуйтесь для управления проектом</p><label class="field"><span>Игровой логин</span><input class="input" name="login" autocomplete="username" required></label><label class="field"><span>Пароль</span><input class="input" type="password" name="password" autocomplete="current-password" required></label><button class="btn" style="width:100%;margin-top:7px">Войти в панель</button><div style="text-align:center;margin-top:16px"><a class="purple tiny" href="#register">Создать аккаунт</a> · <a class="purple tiny" href="#home">← Вернуться на сайт</a></div></form></main>`;
 $("#login-form").onsubmit=async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});S.token=d.token;localStorage.gm_token=S.token;S.user=d.user;location.hash="#dashboard";render()}catch(e){toast(e.message)}}
}

function register(){
 $("#app").innerHTML=`<main class="login-screen"><form id="register-form" class="card login-box"><div class="login-logo"><img class="login-brand-img" src="/brand-logo.png" alt="Good Mobile"></div><h2>Регистрация</h2><p class="muted">Создайте игровой аккаунт.</p><label class="field"><span>Игровой логин</span><input class="input" name="login" autocomplete="username" required></label><label class="field"><span>Имя</span><input class="input" name="name" required></label><label class="field"><span>Пароль</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="10" required></label><button class="btn" style="width:100%">Зарегистрироваться</button><div style="text-align:center;margin-top:16px"><a class="purple tiny" href="#login">← Войти</a></div></form></main>`;
 $("#register-form").onsubmit=async e=>{e.preventDefault();try{await api("/api/register",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast("Аккаунт создан");location.hash="#login"}catch(e){toast(e.message)}}
}
async function panel(page){
 const allowed=navAllowed(page);if(!allowed)return location.hash="#dashboard";
 const data=await panelContent(page);
 const pending=(data.pending||0);
 $("#app").innerHTML=`<header class="topbar"><div class="container" style="display:flex;width:100%;align-items:center"><div class="brand"><img class="brand-img" src="/brand-logo.png" alt="Good Mobile"><div><div class="brand-title">GOOD MOBILE</div><div class="brand-sub">PANEL MANAGEMENT</div></div></div><div class="top-actions"><span class="badge">♛ ${esc(S.user?.name||"Admin")}</span><a class="social" href="#notifications">♧</a><button class="social" id="logout">⇥</button></div></div></header>
 <div class="panel-layout"><aside class="sidebar">${["Основное","Управление"].map((x,i)=>`<div class="side-section">${x}</div>`)[i]||""}${nav().map(n=>`<a class="side-nav ${page===n[0]?"active":""}" href="#${n[0]}"><span>${n[1]}</span>${n[0]==="applications"&&pending?`<span class="count">${pending}</span>`:""}${n[0]==="complaints"&&data.complaints?`<span class="count">${data.complaints}</span>`:""}</a>`).join("")}<div class="side-project"><b>♛ Good Mobile</b><div class="muted tiny">Официальная панель проекта</div></div></aside><main class="panel-main">${data.html}</main></div>`;
 $("#logout").onclick=()=>logout();
 bindPanel(data);
}
function navAllowed(p){return p==="dashboard"||p==="login"||p==="home"||can(p)}
function nav(){return Object.entries(icons).filter(([k])=>k!=="login"&&(k==="dashboard"||can(k))).map(([k,v])=>[k,v,{dashboard:"Главная",admins:"Администраторы",positions:"Должности",servers:"Серверы",links:"Ссылки",news:"Новости",applications:"Заявления",complaints:"Жалобы",settings:"Настройки",statistics:"Статистика",audit:"Аудит"}[k]])}
async function panelContent(page){
 if(page==="dashboard")return dashboard();
 if(page==="statistics")return statistics();
 if(page==="admins")return admins();
 if(page==="settings")return settings();
 if(page==="audit")return auditPage();
 if(cfg[page])return crud(page);
 return dashboard();
}
function head(t,d,button=""){return `<div class="panel-head"><div><h1 class="panel-title">${t}</h1><div class="subline">${d}</div></div>${button}</div><div class="purple-rule"></div>`}
async function dashboard(){
 const d=await api("/api/dashboard"),s=d.settings;
 const stats=[["♟","Всего игроков",s.online_players,"+12 за сегодня"],["▤","Серверов",d.stats.servers,"+1 за сегодня"],["♙","Активных игроков",s.active_players,"+8 за сегодня"],["▣","Онлайн сегодня",s.today_players,"+5 за час"]];
 const html=head("Панель управления","Обзор проекта и быстрый доступ")+`<div class="grid g4">${stats.map(x=>`<div class="card stat"><span class="stat-icon">${x[0]}</span><div class="stat-label">${x[1]}</div><div class="stat-num">${Number(x[2]).toLocaleString("ru-RU")}</div><div class="trend">◆ ${x[3]}</div></div>`).join("")}</div>
 <div class="grid g2" style="margin-top:15px"><section class="card pad"><div class="section-title"><h2>Серверы</h2><a class="purple tiny" href="#servers">Управление →</a></div>${d.servers.map(s=>`<div style="padding:12px 0;border-bottom:1px solid #ffffff09"><div style="display:flex;justify-content:space-between"><b>${esc(s.name)}</b><span class="${s.online?"green":"red"}">${s.online?"● Онлайн":"● Оффлайн"}</span></div><div class="muted tiny">${esc(s.address)}:${s.port} · ${esc(s.mode)} · ${esc(s.version)}</div><div style="margin-top:8px;height:7px;border-radius:10px;background:#ffffff0a;overflow:hidden"><i style="display:block;width:${Math.min(100,s.players/s.max_players*100)}%;height:100%;background:linear-gradient(90deg,#6e22ef,#d35aff)"></i></div><div class="tiny muted" style="margin-top:4px">${s.players} / ${s.max_players} игроков</div></div>`).join("")}</section>
 <section class="card pad"><div class="section-title"><h2>Быстрые действия</h2></div><div class="grid g2">${[["admins","Создать администратора","♙"],["positions","Добавить должность","♕"],["servers","Настроить серверы","▤"],["links","Изменить ссылки","↗"],["news","Опубликовать новость","▣"],["settings","Настройки проекта","⚙"]].filter(x=>can(x[0])).map(x=>`<a class="role-card" href="#${x[0]}"><span class="stat-icon">${x[2]}</span><div><b>${x[1]}</b><small>Открыть раздел →</small></div></a>`).join("")}</div></section></div>`;
 return {html};
}
async function statistics(){
 const d=await api("/api/dashboard"),s=d.settings;
 const html=head("Статистика","Мониторинг ключевых показателей")+`<div class="grid g4">${[["Онлайн игроков",s.online_players,"♟"],["Активных",s.active_players,"♙"],["Сегодня",s.today_players,"▣"],["Серверов",d.stats.servers,"▤"],["Администраторов",d.stats.admins,"♕"],["Заявлений",d.stats.applications,"☷"],["Жалоб",d.stats.complaints,"⚠"],["Новостей",d.stats.news,"▣"]].map(x=>`<div class="card stat"><span class="stat-icon">${x[2]}</span><div class="stat-label">${x[0]}</div><div class="stat-num">${Number(x[1]).toLocaleString("ru-RU")}</div></div>`).join("")}</div><div class="card pad" style="margin-top:15px"><div class="section-title"><h2>Нагрузка серверов</h2></div><div class="grid g2">${d.servers.map(v=>`<div class="panel"><div style="display:flex;justify-content:space-between"><b>${esc(v.name)}</b><span>${v.players}/${v.max_players}</span></div><div style="height:13px;background:#fff1;border-radius:9px;margin-top:11px;overflow:hidden"><i style="display:block;width:${Math.min(100,v.players/v.max_players*100)}%;height:100%;background:linear-gradient(90deg,#7222ee,#d255ff)"></i></div></div>`).join("")}</div></div>`;
 return {html};
}
async function admins(){
 const d=await api("/api/users"),p=await api("/api/positions");
 const html=head("Список администраторов","Состав администрации и управление доступом",`<button class="btn" id="new-admin">♙ &nbsp;Создать администратора</button>`)+`<div class="toolbar"><input id="adm-search" class="input search" placeholder="Поиск по логину, имени..." value="${esc(S.search)}"><span class="muted tiny">${d.items.length} администраторов</span></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Логин</th><th>Имя</th><th>Должность</th><th>Роль</th><th>Статус</th><th>Создан</th><th></th></tr></thead><tbody>${d.items.filter(x=>(x.login+" "+x.name).toLowerCase().includes(S.search.toLowerCase())).map(x=>`<tr><td><b>${esc(x.login)}</b></td><td>${esc(x.name)}</td><td><span class="badge">${esc(x.position||"—")}</span></td><td>${esc(x.role)}</td><td><span class="${x.active?"green":"red"}"><i class="dot ${x.active?"on":""}"></i>${x.active?"Активен":"Отключён"}</span></td><td>${date(x.created_at)}</td><td><div class="actions"><button class="btn sm ghost edit-admin" data-id="${x.id}">Изменить</button><button class="btn sm danger del-admin" data-id="${x.id}">Удалить</button></div></td></tr>`).join("")||`<tr><td colspan="7"><div class="empty">Ничего не найдено</div></td></tr>`}</tbody></table></div></div>`;
 return {html,positions:p.items};
}
async function settings(){
 const d=await api("/api/settings"),x=d.item;
 const fields=[["project_name","Название проекта"],["tagline","Слоган"],["hero_text","Текст главного блока"],["logo","URL логотипа"],["hero_image","URL hero-изображения"],["game_url","Ссылка игры"],["discord_url","Discord"],["telegram_url","Telegram"],["youtube_url","YouTube"],["tiktok_url","TikTok"],["support_url","Поддержка"],["online_players","Онлайн игроков"],["today_players","Сегодня игроков"],["active_players","Активных игроков"],["maintenance_text","Текст техработ"]];
 const html=head("Настройки проекта","Полное управление публичной частью сайта")+`<section class="card pad" style="margin-bottom:15px"><div class="section-title"><div><h2>📦 APK игры</h2><div class="muted tiny">Кнопка «Начать играть» автоматически скачивает загруженный APK.</div></div></div><div class="apk-box"><div><b>${x.apk_name?esc(x.apk_name):"APK не загружен"}</b><div class="muted tiny">${x.apk_name?`${(Number(x.apk_size||0)/1048576).toFixed(2)} MB · скачиваний: ${Number(x.apk_downloads||0)}`:"Загрузите Android APK до 300 MB"}</div></div><div class="panel-actions"><label class="btn">Выбрать APK<input id="apk-file" type="file" accept=".apk,application/vnd.android.package-archive" hidden></label>${x.apk_name?`<button class="btn danger" id="delete-apk" type="button">Удалить APK</button>`:""}</div></div><div id="apk-progress" class="muted tiny" style="margin-top:10px"></div></section><form id="settings-form" class="card pad modal-grid">${fields.map(([n,l])=>`<label class="${n==="hero_text"?"full":""}"><span>${l}</span>${n==="hero_text"?`<textarea class="input" name="${n}">${esc(x[n]||"")}</textarea>`:`<input class="input" name="${n}" value="${esc(x[n]??"")}" ${n.includes("players")?'type="number"':""}>`}</label>`).join("")}<label><span>Технические работы</span><select class="input" name="maintenance"><option value="0" ${!x.maintenance?"selected":""}>Выключены</option><option value="1" ${x.maintenance?"selected":""}>Включены</option></select></label><div class="full modal-footer"><button class="btn">Сохранить настройки</button></div></form>`;
 return {html};
}
async function auditPage(){
 const d=await api("/api/audit");
 const html=head("Журнал действий","История операций администраторов")+`<div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Дата</th><th>Администратор</th><th>Действие</th><th>Раздел</th><th>ID</th><th>Подробности</th></tr></thead><tbody>${d.items.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.name||"System")}</td><td><span class="badge">${esc(x.action)}</span></td><td>${esc(x.entity)}</td><td>${x.entity_id||"—"}</td><td>${esc(x.details)}</td></tr>`).join("")}</tbody></table></div></div>`;
 return {html};
}
async function crud(name){
 const c=cfg[name],d=await api(`/api/${name}?search=${encodeURIComponent(S.search)}`);
 const rows=d.items;
 const html=head(c.title,c.desc,`<button class="btn" id="new-record">＋ &nbsp;Добавить</button>`)+`<div class="toolbar"><div class="toolbar-left"><input id="crud-search" class="input search" placeholder="Поиск..." value="${esc(S.search)}"><select id="status-filter" class="select"><option value="">Все статусы</option><option>NEW</option><option>IN_PROGRESS</option><option>APPROVED</option><option>REJECTED</option><option>PUBLISHED</option><option>DRAFT</option><option>CLOSED</option></select></div><span class="muted tiny">${rows.length} записей</span></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr>${c.fields.map(f=>`<th>${labels[f]||f}</th>`).join("")}<th>Действия</th></tr></thead><tbody>${rows.map(r=>`<tr>${c.fields.map(f=>`<td>${cell(f,r[f])}</td>`).join("")}<td><div class="actions"><button class="btn sm ghost edit-record" data-id="${r.id}">Изменить</button><button class="btn sm danger del-record" data-id="${r.id}">Удалить</button></div></td></tr>`).join("")||`<tr><td colspan="${c.fields.length+1}"><div class="empty"><div class="big">◆</div>Записей пока нет</div></td></tr>`}</tbody></table></div></div>`;
 return {html,rows};
}
function cell(f,v){if(f==="active"||f==="online")return `<span class="${v?"green":"red"}"><i class="dot ${v?"on":""}"></i>${v?"Да":"Нет"}</span>`;if(f==="status"||f==="priority"||f==="role")return `<span class="badge">${esc(v)}</span>`;if(f==="permissions")return `<span class="badge">${esc(v)}</span>`;if(f.includes("created")||f.includes("published"))return date(v);return esc(v)}
function bindPanel(data){
 $("#adm-search")?.addEventListener("input",e=>{S.search=e.target.value;clearTimeout(window.searchT);window.searchT=setTimeout(()=>render(),250)});
 $("#crud-search")?.addEventListener("input",e=>{S.search=e.target.value;clearTimeout(window.searchT);window.searchT=setTimeout(()=>render(),250)});
 $("#new-admin")?.addEventListener("click",()=>adminModal(null,data.positions));
 $("#new-record")?.addEventListener("click",()=>recordModal(S.page,null));
 $$(".edit-admin").forEach(b=>b.onclick=()=>adminModal(data.items?.find(x=>x.id==b.dataset.id),data.positions));
 $$(".del-admin").forEach(b=>b.onclick=async()=>{if(confirm("Удалить администратора?")){try{await api("/api/users/"+b.dataset.id,{method:"DELETE"});toast("Администратор удалён");render()}catch(e){toast(e.message)}}});
 $$(".edit-record").forEach(b=>b.onclick=()=>recordModal(S.page,data.rows.find(x=>x.id==b.dataset.id)));
 $$(".del-record").forEach(b=>b.onclick=async()=>{if(confirm("Удалить запись?")){try{await api(`/api/${S.page}/${b.dataset.id}`,{method:"DELETE"});toast("Запись удалена");render()}catch(e){toast(e.message)}}});
 $("#apk-file")?.addEventListener("change",async e=>{
   const file=e.target.files[0]; if(!file)return;
   if(!/\.apk$/i.test(file.name)){toast("Нужен файл APK");return}
   const fd=new FormData(); fd.append("apk",file);
   const p=$("#apk-progress"); p.textContent="Загрузка APK…";
   try{const r=await api("/api/upload/apk",{method:"POST",body:fd});p.textContent=`Загружено: ${r.name}`;toast("APK загружен");setTimeout(render,500)}
   catch(err){p.textContent="";toast(err.message)}
 });
 $("#delete-apk")?.addEventListener("click",async()=>{if(confirm("Удалить APK?")){try{await api("/api/upload/apk",{method:"DELETE"});toast("APK удалён");render()}catch(e){toast(e.message)}}});
 $("#settings-form")?.addEventListener("submit",async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));["online_players","today_players","active_players","maintenance"].forEach(k=>b[k]=+b[k]);try{await api("/api/settings",{method:"PUT",body:JSON.stringify(b)});toast("Настройки сохранены")}catch(e){toast(e.message)}});
}
function adminModal(x,positions){
 openModal(`<h2>${x?"Изменение администратора":"Создание администратора"}</h2><div class="subline">Настройте игровой логин, должность и права доступа.</div><form id="admin-form" class="modal-grid"><label><span>Игровой логин</span><input class="input" name="login" value="${esc(x?.login||"")}" ${x?"disabled":"required"}></label><label><span>Имя</span><input class="input" name="name" value="${esc(x?.name||"")}" required></label><label><span>Пароль</span><input class="input" type="password" name="password" placeholder="${x?"Оставьте пустым без изменений":"Пароль"}" ${x?"":"required"}></label><label><span>Системная роль</span><select class="input" name="role"><option value="ADMIN" ${x?.role!=="SUPERADMIN"?"selected":""}>ADMIN</option><option value="SUPERADMIN" ${x?.role==="SUPERADMIN"?"selected":""}>SUPERADMIN</option></select></label><label><span>Должность</span><select class="input" name="position_id">${positions.map(p=>`<option value="${p.id}" ${x?.position_id==p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label><label><span>Статус</span><select class="input" name="active"><option value="1" ${x?.active!==0?"selected":""}>Активен</option><option value="0" ${x?.active===0?"selected":""}>Отключён</option></select></label><div class="full modal-footer"><button type="button" class="btn ghost close">Отмена</button><button class="btn">Сохранить</button></div></form>`);
 $("#admin-form").onsubmit=async e=>{e.preventDefault();let b=Object.fromEntries(new FormData(e.target));b.active=+b.active;b.position_id=+b.position_id;if(!b.password)delete b.password;try{await api(x?"/api/users/"+x.id:"/api/users",{method:x?"PUT":"POST",body:JSON.stringify(b)});closeModal();toast("Администратор сохранён");render()}catch(e){toast(e.message)}};
}
function recordModal(name,x){
 const fields=cfg[name].fields;
 const html=fields.map(f=>{
  let val=x?.[f]??"";
  if(["active","online"].includes(f))return `<label><span>${labels[f]}</span><select class="input" name="${f}"><option value="1" ${val?"selected":""}>Да</option><option value="0" ${x&&!val?"selected":""}>Нет</option></select></label>`;
  if(["content","message","description","excerpt","permissions","response","admin_note"].includes(f))return `<label class="full"><span>${labels[f]}</span><textarea class="input" name="${f}">${esc(val)}</textarea></label>`;
  if(f==="status"){let opts=["NEW","IN_PROGRESS","APPROVED","REJECTED","PUBLISHED","DRAFT","CLOSED"];return `<label><span>${labels[f]}</span><select class="input" name="${f}">${opts.map(o=>`<option ${val===o?"selected":""}>${o}</option>`).join("")}</select></label>`}
  if(f==="priority"&&name==="complaints")return `<label><span>Приоритет</span><select class="input" name="${f}">${["LOW","NORMAL","HIGH","CRITICAL"].map(o=>`<option ${val===o?"selected":""}>${o}</option>`).join("")}</select></label>`;
  const type=["priority","port","players","max_players","sort_order","position_id","assigned_id"].includes(f)?"number":"text";
  return `<label><span>${labels[f]||f}</span><input class="input" name="${f}" type="${type}" value="${esc(val)}"></label>`;
 }).join("");
 openModal(`<h2>${x?"Изменение":"Создание"} — ${cfg[name].title}</h2><div class="subline">Все изменения сохраняются в базе и попадают в журнал аудита.</div><form id="record-form" class="modal-grid">${html}<div class="full modal-footer"><button type="button" class="btn ghost close">Отмена</button><button class="btn">Сохранить</button></div></form>`);
 $("#record-form").onsubmit=async e=>{e.preventDefault();let b=Object.fromEntries(new FormData(e.target));["active","online","port","players","max_players","sort_order","position_id","assigned_id","priority"].forEach(k=>{if(b[k]!==undefined&&b[k]!=="")b[k]=+b[k]});try{await api(`/api/${name}${x?"/"+x.id:""}`,{method:x?"PUT":"POST",body:JSON.stringify(b)});closeModal();toast("Сохранено");render()}catch(e){toast(e.message)}};
}
function openModal(html){$("#modal-root").innerHTML=`<div class="modal-back"><div class="card modal">${html}</div></div>`;$(".close")?.addEventListener("click",closeModal);$(".modal-back").addEventListener("click",e=>{if(e.target.classList.contains("modal-back"))closeModal()})}
function closeModal(){$("#modal-root").innerHTML=""}
render();