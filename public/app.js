const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let site={settings:null,servers:[],news:[]};

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Ошибка");return d}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
document.addEventListener("click",e=>{if(e.target.matches("[data-close]"))closeModal()});

function socialIcon(type){
  if(type==="telegram") return `<svg class="social-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 3.2 18.4 20c-.25 1.19-.9 1.48-1.82.92l-5-3.68-2.41 2.32c-.27.27-.5.5-1.03.5l.37-5.1 9.27-8.37c.4-.36-.09-.56-.62-.2L5.7 13.78.75 12.23c-1.08-.34-1.1-1.08.23-1.6L20.3 3.08c.9-.33 1.69.2 1.4.12Z"/></svg>`;
  if(type==="discord") return `<svg class="social-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.54 5.2A16.2 16.2 0 0 0 15.56 4l-.5 1.03a14.2 14.2 0 0 0-6.12 0L8.44 4a16.2 16.2 0 0 0-3.98 1.2C1.95 9.08 1.27 12.86 1.61 16.59a16.4 16.4 0 0 0 4.9 2.47l1.19-1.63c-.66-.24-1.3-.54-1.9-.89l.47-.36c3.67 1.72 7.64 1.72 11.27 0l.48.36c-.61.35-1.25.65-1.91.9l1.18 1.62a16.4 16.4 0 0 0 4.91-2.47c.4-4.32-.68-8.07-2.66-11.39ZM8.5 14.45c-1.08 0-1.96-1-1.96-2.23S7.4 10 8.5 10s1.98 1 1.96 2.22c0 1.23-.87 2.23-1.96 2.23Zm7 0c-1.08 0-1.96-1-1.96-2.23s.87-2.22 1.96-2.22 1.98 1 1.96 2.22c0 1.23-.87 2.23-1.96 2.23Z"/></svg>`;
  if(type==="vk") return `<span class="vk-icon">VK</span>`;
  return `<span class="social-arrow">↗</span>`;
}
function renderSocial(){
  const s=site.settings;
  const items=[["telegramUrl","telegram","Telegram"],["discordUrl","discord","Discord"],["vkUrl","vk","VK"]].filter(x=>s[x[0]]);
  const html=items.map(([key,type,label])=>`<a class="social-icon" title="${label}" href="${escapeAttr(s[key])}" target="_blank" rel="noopener">${socialIcon(type)}</a>`).join("");
  $("#socialMini").innerHTML=html;
  $("#socialFooter").innerHTML=items.map(([key,type,label])=>`<a href="${escapeAttr(s[key])}" target="_blank" rel="noopener">${socialIcon(type)} ${label}</a>`).join("");
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escapeAttr(v=""){return escapeHtml(v).replace(/javascript:/gi,"")}

function render(){
  const s=site.settings;
  $("#heroTitle").innerHTML=escapeHtml(s.heroTitle).replace(/Good Mobile/g,"<span>Good Mobile</span>");
  $("#heroText").textContent=s.heroText;
  $("#siteDescription").textContent=s.siteDescription;
  $("#supportText").textContent=s.supportText;
  $("#footerText").textContent=s.footerText;
  $("#featuresGrid").innerHTML=s.features.map(f=>`<div class="feature-card"><b>${escapeHtml(f.title)}</b><p>${escapeHtml(f.text)}</p></div>`).join("");
  $("#serverCount").textContent=site.servers.length;
  const total=site.servers.reduce((a,b)=>a+Number(b.online||0),0);$("#totalOnline").textContent=total;
  $("#serversGrid").innerHTML=site.servers.map(serverCard).join("");
  $("#donateServer").innerHTML=`<option value="">Выберите сервер</option>`+site.servers.map(x=>`<option value="${x.id}">${escapeHtml(x.name)}</option>`).join("");
  $("#donateMethod").innerHTML=site.settings.donationMethods.map(x=>`<option>${escapeHtml(x)}</option>`).join("");
  $("#newsGrid").innerHTML=site.news.slice(0,6).map(n=>`<article class="news-card"><div class="news-date">${new Date(n.created_at.replace(" ","T")+"Z").toLocaleDateString("ru-RU")}</div><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.text)}</p></article>`).join("");
  renderSocial();
}
function serverCard(s){
  const pct=Math.min(100,Math.max(0,Number(s.online)/Math.max(1,Number(s.max_online))*100));
  const live=s.status==="online";
  return `<article class="server-card"><div class="server-head"><div class="server-name">${escapeHtml(s.name)}</div><span class="badge ${live?"":"red"}">${live?"ОНЛАЙН":"В РАЗРАБОТКЕ"}</span></div><p class="server-desc">${escapeHtml(s.description)}</p><div class="online-row"><span>👥 Онлайн</span><span class="online-num">${s.online} / ${s.max_online}</span></div><div class="progress"><i style="width:${pct}%"></i></div><div class="ip-row"><span>${escapeHtml(s.ip)}:${s.port}</span><button class="copy-btn" data-copy="${escapeAttr(s.ip+":"+s.port)}">Копировать</button></div></article>`
}
async function load(){
  const [a,b,c]=await Promise.all([api("/api/site"),api("/api/servers"),api("/api/news")]);
  site.settings=a.settings;site.servers=b.servers;site.news=c.news;render();
  const me=site.settings.user;
  $("#accountBtn").textContent=me?`👤 ${me.login}`:"Войти";
  $("#accountBtn").onclick=()=>me?accountModal(me):authModal();
}
function authModal(mode="login"){
  openModal(`<div class="eyebrow">АККАУНТ</div><h2>${mode==="login"?"Вход":"Регистрация"}</h2><div class="switch-row"><button class="btn ${mode==="login"?"btn-green":""}" id="loginSwitch">Войти</button><button class="btn ${mode==="register"?"btn-green":""}" id="regSwitch">Регистрация</button></div><form id="authForm" class="modal-form"><label>Логин<input name="login" autocomplete="username" required></label><label>Пароль<input name="password" type="password" autocomplete="${mode==="login"?"current-password":"new-password"}" required></label><button class="btn btn-green btn-lg">${mode==="login"?"Войти":"Создать аккаунт"}</button></form>`);
  $("#loginSwitch").onclick=()=>authModal("login");$("#regSwitch").onclick=()=>authModal("register");
  $("#authForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);try{await api(`/api/auth/${mode}`,{method:"POST",body:JSON.stringify(Object.fromEntries(fd))});toast("Готово");closeModal();await load()}catch(err){toast(err.message)}}
}
function accountModal(me){
  openModal(`<div class="eyebrow">ЛИЧНЫЙ КАБИНЕТ</div><h2>${escapeHtml(me.login)}</h2><p>Роль: ${me.role==="admin"?"Администратор":"Игрок"}</p><div class="switch-row"><button class="btn btn-green" id="openTickets">Поддержка</button>${me.role==="admin"?'<a class="btn btn-dark" href="/admin.html">Админ-панель</a>':""}</div><button class="btn btn-dark" id="logout">Выйти</button>`);
  $("#logout").onclick=async()=>{await api("/api/auth/logout",{method:"POST"});closeModal();load()};
  $("#openTickets").onclick=()=>{closeModal();$("#support").scrollIntoView({behavior:"smooth"})};
}
$$("[data-copy]").forEach(()=>{});
document.addEventListener("click",e=>{const b=e.target.closest("[data-copy]");if(b){navigator.clipboard?.writeText(b.dataset.copy);toast("IP скопирован")}});

$("#playBtn").onclick=()=>{
  const url=String(site.settings.apkUrl||"").trim();
  if(!url){toast("APK пока не загружен администратором");return}
  const a=document.createElement("a");a.href=url;a.download="Good-Mobile.apk";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();
};
$("#ticketBtn").onclick=async()=>{const me=site.settings.user;if(!me)return authModal();ticketModal()};
$("#myTicketsBtn").onclick=async()=>{if(!site.settings.user)return authModal();const d=await api("/api/tickets");openTicketsModal(d.tickets)};
function ticketModal(){
  openModal(`<div class="eyebrow">ПОДДЕРЖКА</div><h2>Новый тикет</h2><form id="ticketForm" class="modal-form"><label>Тема<input name="subject" required maxlength="120" placeholder="Например: не могу войти"></label><label>Сообщение<textarea name="message" rows="6" required maxlength="2000"></textarea></label><button class="btn btn-green btn-lg">Отправить</button></form>`);
  $("#ticketForm").onsubmit=async e=>{e.preventDefault();try{await api("/api/tickets",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast("Тикет создан");closeModal()}catch(err){toast(err.message)}}
}
function openTicketsModal(tickets){
  openModal(`<div class="eyebrow">ПОДДЕРЖКА</div><h2>Мои обращения</h2><div class="ticket-list">${tickets.length?tickets.map(t=>`<div class="ticket-item" data-ticket="${t.id}"><span><b>#${t.id} ${escapeHtml(t.subject)}</b><small>${t.status}</small></span><span>›</span></div>`).join(""):"<p>Обращений пока нет.</p>"}</div>`);
  $$(".ticket-item").forEach(x=>x.onclick=()=>openTicket(x.dataset.ticket));
}
async function openTicket(id){
  const d=await api("/api/tickets/"+id);
  openModal(`<div class="eyebrow">ТИКЕТ #${d.ticket.id}</div><h2>${escapeHtml(d.ticket.subject)}</h2><div>${d.messages.map(m=>`<div class="message ${m.user_id===site.settings.user?.id?"mine":""}"><small>${escapeHtml(m.login||"Система")}</small><div>${escapeHtml(m.message)}</div></div>`).join("")}</div><form id="replyForm" class="modal-form"><textarea name="message" rows="3" placeholder="Ваш ответ..." required></textarea><button class="btn btn-green">Отправить</button></form>`);
  $("#replyForm").onsubmit=async e=>{e.preventDefault();try{await api(`/api/tickets/${id}/messages`,{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});openTicket(id)}catch(err){toast(err.message)}}
}
$("#donateForm").onsubmit=async e=>{e.preventDefault();if(!site.settings.user)return authModal();try{const d=await api("/api/donations",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast(`Заявка #${d.id} создана`);if(d.paymentUrl)window.open(d.paymentUrl,"_blank");e.target.reset()}catch(err){toast(err.message)}};

$$("[data-doc]").forEach(b=>b.onclick=()=>openModal(`<div class="eyebrow">ДОКУМЕНТ</div><h2>${b.dataset.doc==="terms"?"Условия пользования":"Политика конфиденциальности"}</h2><div class="doc-text">${escapeHtml(b.dataset.doc==="terms"?site.settings.termsText:site.settings.privacyText)}</div>`));
load().catch(err=>toast(err.message));
