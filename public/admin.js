const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let state={servers:[],news:[],donations:[],tickets:[],settings:null};

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Ошибка");return d}
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function modal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
function close(){ $("#modal").classList.add("hidden") }
document.addEventListener("click",e=>{if(e.target.matches("[data-close]"))close()});

async function boot(){
  const me=(await api("/api/me")).user;
  if(!me||me.role!=="admin"){location.href="/";return}
  $("#adminUser").textContent=`${me.login} · ADMIN`;
  await refreshAll();
}
async function refreshAll(){
  const [site,servers,news,donations,tickets]=await Promise.all([api("/api/site"),api("/api/servers"),api("/api/news"),api("/api/donations"),api("/api/tickets")]);
  state={settings:site.settings,servers:servers.servers,news:news.news,donations:donations.donations,tickets:tickets.tickets};
  renderOverview();renderServers();renderNews();renderSettings();renderDonations();renderTickets();
}
function renderOverview(){
  $("#overviewCards").innerHTML=[["Сервера",state.servers.length],["Онлайн",state.servers.reduce((a,s)=>a+Number(s.online||0),0)],["Новостей",state.news.length],["Заявок доната",state.donations.length],["Тикетов",state.tickets.filter(x=>x.status!=="closed").length]].slice(0,4).map(x=>`<div class="stat-card"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
}
function renderServers(){
  $("#serversAdmin").innerHTML=`<table class="admin-table"><thead><tr><th>Сервер</th><th>IP</th><th>Онлайн</th><th>Статус</th><th>Действия</th></tr></thead><tbody>${state.servers.map(s=>`<tr><td><b>${esc(s.name)}</b><br><small>${esc(s.description)}</small></td><td>${esc(s.ip)}:${s.port}</td><td>${s.online}/${s.max_online}</td><td>${esc(s.status)}</td><td><div class="row-actions"><button class="btn mini btn-dark" data-edit-server="${s.id}">Изменить</button><button class="btn mini danger" data-del-server="${s.id}">Удалить</button></div></td></tr>`).join("")}</tbody></table>`;
}
function renderNews(){
  $("#newsAdmin").innerHTML=`<table class="admin-table"><thead><tr><th>Новость</th><th>Опубликована</th><th>Дата</th><th>Действия</th></tr></thead><tbody>${state.news.map(n=>`<tr><td><b>${esc(n.title)}</b><br><small>${esc(n.text).slice(0,120)}</small></td><td>${n.published?"Да":"Нет"}</td><td>${esc(n.created_at)}</td><td><div class="row-actions"><button class="btn mini btn-dark" data-edit-news="${n.id}">Изменить</button><button class="btn mini danger" data-del-news="${n.id}">Удалить</button></div></td></tr>`).join("")}</tbody></table>`;
}
function renderSettings(){
  const s=state.settings;const f=$("#settingsForm");
  Object.keys(s).forEach(k=>{const el=f.elements[k];if(el)el.value=Array.isArray(s[k])?s[k].join(", "):s[k]});
  const status=$("#apkStatus");
  if(status){
    status.innerHTML=s.apkUrl
      ? `<span class="apk-ok">✓ APK загружен</span><small>${esc(s.apkUrl)}</small>`
      : `<span>APK ещё не загружен</span>`;
  }
}
function renderDonations(){
  $("#donationsAdmin").innerHTML=`<table class="admin-table"><thead><tr><th>#</th><th>Игрок</th><th>Сервер</th><th>Сумма</th><th>Метод</th><th>Статус</th></tr></thead><tbody>${state.donations.map(d=>`<tr><td>${d.id}</td><td><b>${esc(d.nickname)}</b><br>${esc(d.user_login||"")}</td><td>${esc(d.server_name||"—")}</td><td>${d.amount.toLocaleString("ru-RU")} ₽</td><td>${esc(d.method)}</td><td><select class="status-select" data-donation="${d.id}"><option value="pending" ${d.status==="pending"?"selected":""}>Ожидает</option><option value="paid" ${d.status==="paid"?"selected":""}>Оплачен</option><option value="cancelled" ${d.status==="cancelled"?"selected":""}>Отменён</option></select></td></tr>`).join("")}</tbody></table>`;
}
function renderTickets(){
  $("#ticketsAdmin").innerHTML=`<div class="ticket-list">${state.tickets.length?state.tickets.map(t=>`<div class="ticket-item" data-admin-ticket="${t.id}"><span><b>#${t.id} ${esc(t.subject)}</b><br><small>${esc(t.login)} · ${esc(t.status)}</small></span><span>›</span></div>`).join(""):"<p>Тикетов нет.</p>"}</div>`;
}
function serverForm(s={}){
  modal(`<div class="eyebrow">SERVER CONTROL</div><h2>${s.id?"Изменить сервер":"Новый сервер"}</h2><form id="serverForm" class="modal-form"><label>Название<input name="name" value="${esc(s.name||"")}" required></label><label>Описание<textarea name="description" rows="3">${esc(s.description||"")}</textarea></label><label>IP / hostname<input name="ip" value="${esc(s.ip||"")}" required></label><label>Порт<input name="port" type="number" value="${s.port||7777}"></label><label>Онлайн<input name="online" type="number" value="${s.online||0}"></label><label>Максимум<input name="max_online" type="number" value="${s.max_online||100}"></label><label>Статус<select name="status"><option value="online" ${s.status==="online"?"selected":""}>online</option><option value="development" ${s.status!=="online"?"selected":""}>development</option></select></label><label>Сортировка<input name="sort_order" type="number" value="${s.sort_order||0}"></label><label>Обложка URL<input name="image" value="${esc(s.image||"")}" placeholder="/uploads/..."></label><button class="btn btn-green btn-lg">Сохранить</button></form>`);
  $("#serverForm").onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));try{await api(s.id?`/api/admin/servers/${s.id}`:"/api/admin/servers",{method:s.id?"PUT":"POST",body:JSON.stringify(data)});close();await refreshAll();toast("Сервер сохранён")}catch(err){toast(err.message)}}
}
function newsForm(n={}){
  modal(`<div class="eyebrow">NEWS CONTROL</div><h2>${n.id?"Изменить новость":"Новая новость"}</h2><form id="newsForm" class="modal-form"><label>Заголовок<input name="title" value="${esc(n.title||"")}" required></label><label>Текст<textarea name="text" rows="8" required>${esc(n.text||"")}</textarea></label><label>Изображение URL<input name="image" value="${esc(n.image||"")}" placeholder="/uploads/image.jpg"></label><label>Опубликована<select name="published"><option value="1" ${n.published!==0?"selected":""}>Да</option><option value="0" ${n.published===0?"selected":""}>Нет</option></select></label><button class="btn btn-green btn-lg">Сохранить</button></form>`);
  $("#newsForm").onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));data.published=data.published==="1";try{await api(n.id?`/api/admin/news/${n.id}`:"/api/admin/news",{method:n.id?"PUT":"POST",body:JSON.stringify(data)});close();await refreshAll();toast("Новость сохранена")}catch(err){toast(err.message)}}
}
$("#addServerBtn").onclick=()=>serverForm();
$("#addNewsBtn").onclick=()=>newsForm();
document.addEventListener("click",async e=>{
  const es=e.target;
  if(es.dataset.editServer){serverForm(state.servers.find(x=>x.id==es.dataset.editServer));}
  if(es.dataset.delServer){if(confirm("Удалить сервер?")){await api(`/api/admin/servers/${es.dataset.delServer}`,{method:"DELETE"});refreshAll()}}
  if(es.dataset.editNews){newsForm(state.news.find(x=>x.id==es.dataset.editNews));}
  if(es.dataset.delNews){if(confirm("Удалить новость?")){await api(`/api/admin/news/${es.dataset.delNews}`,{method:"DELETE"});refreshAll()}}
  if(es.dataset.adminTicket){openAdminTicket(es.dataset.adminTicket)}
});
$$(".tab").forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
$$("[data-switch]").forEach(b=>b.onclick=()=>switchTab(b.dataset.switch));
function switchTab(name){$$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));$$(".admin-section").forEach(x=>x.classList.toggle("active",x.id==="tab-"+name))}
$("#settingsForm").onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.donationMethods=d.donationMethods.split(",").map(x=>x.trim()).filter(Boolean);try{await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(d)});await refreshAll();toast("Настройки сохранены")}catch(err){toast(err.message)}};
$("#apkFile").onchange=async e=>{
  const file=e.target.files[0];
  if(!file)return;
  const fd=new FormData();
  fd.append("file",file);
  try{
    $("#uploadResult").innerHTML=`<div class="notice">Загрузка <b>${esc(file.name)}</b>…</div>`;
    const r=await fetch("/api/upload",{method:"POST",body:fd});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error);
    state.settings.apkUrl=d.url;
    renderSettings();
    $("#uploadResult").innerHTML=`<div class="notice">✓ APK <b>${esc(d.name)}</b> загружен. Путь сохранён автоматически.</div>`;
    e.target.value="";
    toast("APK загружен");
  }catch(err){
    $("#uploadResult").innerHTML="";
    toast(err.message);
  }
};
$$("[data-close]").forEach(x=>x.onclick=close);
document.addEventListener("change",async e=>{if(e.target.dataset.donation){try{await api(`/api/admin/donations/${e.target.dataset.donation}`,{method:"PUT",body:JSON.stringify({status:e.target.value})});toast("Статус обновлён")}catch(err){toast(err.message)}}});
$("#refreshDonations").onclick=refreshAll;$("#refreshTickets").onclick=refreshAll;
$("#logoutBtn").onclick=async()=>{await api("/api/auth/logout",{method:"POST"});location.href="/"};
async function openAdminTicket(id){
  const d=await api("/api/tickets/"+id);
  $("#ticketViewer").innerHTML=`<div class="admin-card-head"><div><div class="eyebrow">TICKET #${d.ticket.id}</div><h3>${esc(d.ticket.subject)}</h3></div><select class="status-select" id="ticketStatus"><option value="open" ${d.ticket.status==="open"?"selected":""}>Открыт</option><option value="answered" ${d.ticket.status==="answered"?"selected":""}>Отвечен</option><option value="closed" ${d.ticket.status==="closed"?"selected":""}>Закрыт</option></select></div><div>${d.messages.map(m=>`<div class="message"><small>${esc(m.login||"Система")}</small><div>${esc(m.message)}</div></div>`).join("")}</div><form id="adminReply" class="modal-form"><textarea name="message" rows="4" required placeholder="Ответ пользователю..."></textarea><button class="btn btn-green">Ответить</button></form>`;
  $("#ticketStatus").onchange=async e=>{await api(`/api/admin/tickets/${id}`,{method:"PUT",body:JSON.stringify({status:e.target.value})});toast("Статус тикета обновлён");refreshAll()};
  $("#adminReply").onsubmit=async e=>{e.preventDefault();try{await api(`/api/tickets/${id}/messages`,{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});openAdminTicket(id);refreshAll()}catch(err){toast(err.message)}}
}
boot().catch(err=>toast(err.message));
