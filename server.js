const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "good-mobile.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  port INTEGER NOT NULL DEFAULT 7777,
  online INTEGER NOT NULL DEFAULT 0,
  max_online INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'development',
  image TEXT NOT NULL DEFAULT '',
  accent TEXT NOT NULL DEFAULT 'green',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  server_id INTEGER REFERENCES servers(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const defaults = {
  siteName: "Good Mobile",
  heroTitle: "Добро пожаловать в Good Mobile",
  heroText: "Современный мобильный мир, где ты сам выбираешь путь: играй, развивайся, создавай свою историю и находи свою команду.",
  siteDescription: "Good Mobile — игровой портал с серверами, новостями, донатом и поддержкой прямо на сайте.",
  apkUrl: "",
  telegramUrl: "https://t.me/",
  discordUrl: "https://discord.com/",
  vkUrl: "https://vk.com/",
  supportText: "Есть вопрос? Создай тикет — команда поддержки ответит прямо на сайте.",
  donationPaymentUrl: "",
  donationMethods: JSON.stringify(["СБП", "Банковская карта", "Другой способ"]),
  footerText: "© 2026 Good Mobile. Все права защищены.",
  termsText: `1. Общие положения\n\nИспользуя сайт Good Mobile, пользователь принимает настоящие условия.\n\n2. Аккаунт\n\nПользователь отвечает за сохранность своих данных и не должен передавать доступ третьим лицам.\n\n3. Игровой проект\n\nАдминистрация может изменять расписание, функции, правила и состав серверов. Игровые услуги предоставляются в рамках правил проекта.\n\n4. Донаты\n\nПлатежи совершаются добровольно. Перед оплатой пользователь обязан проверить сервер, игровой ник и сумму. Возвраты рассматриваются поддержкой индивидуально.\n\n5. Запрещено\n\nНельзя использовать сайт для мошенничества, вредоносных действий, спама и обхода ограничений проекта.`,
  privacyText: `1. Какие данные мы обрабатываем\n\nПри регистрации сохраняются логин и защищённый хеш пароля. Для работы поддержки и доната могут сохраняться игровые данные, заявки и сообщения.\n\n2. Использование данных\n\nДанные используются для авторизации, работы поддержки, обработки игровых заявок и улучшения сервиса.\n\n3. Безопасность\n\nПароли хранятся только в виде хеша. Сессионные токены хранятся на сервере.\n\n4. Удаление\n\nПользователь может обратиться в поддержку с запросом на удаление аккаунта и связанных с ним данных, если это не противоречит требованиям безопасности и учёта операций.`,
  features: JSON.stringify([
    {title:"Единый аккаунт", text:"Один вход для серверов, доната и поддержки."},
    {title:"Живые сервера", text:"Онлайн и статусы отображаются на главной странице."},
    {title:"Поддержка 24/7", text:"Создавай тикет и следи за ответами прямо в кабинете."},
    {title:"Новости", text:"Все обновления проекта собраны в одном месте."}
  ])
};

const getSetting = (key) => {
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
  return row ? row.value : defaults[key];
};

const setSetting = (key, value) => {
  db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value ?? ""));
};

for (const [key, value] of Object.entries(defaults)) {
  if (!db.prepare("SELECT 1 FROM settings WHERE key=?").get(key)) setSetting(key, value);
}

const adminLogin = "Pitt";
const adminPassword = "danon";
if (!db.prepare("SELECT 1 FROM users WHERE login=?").get(adminLogin)) {
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare("INSERT INTO users(login,password_hash,role) VALUES(?,?,?)").run(adminLogin, hash, "admin");
}

if (db.prepare("SELECT COUNT(*) AS c FROM servers").get().c === 0) {
  const seed = db.prepare("INSERT INTO servers(name,description,ip,port,online,max_online,status,accent,sort_order) VALUES(?,?,?,?,?,?,?,?,?)");
  seed.run("Moscow", "Новый сервер в московской атмосфере. Уникальные локации, квесты и события.", "play.goodmobile.ru", 4444, 0, 100, "development", "green", 1);
  seed.run("Saint Petersburg", "Северная столица с отдельными событиями и большой игровой картой.", "play.goodmobile.ru", 4445, 3, 100, "online", "cyan", 2);
  seed.run("Rostov", "Городской сервер с бонусами для новичков и динамичной экономикой.", "play.goodmobile.ru", 4446, 0, 100, "development", "lime", 3);
}

if (db.prepare("SELECT COUNT(*) AS c FROM news").get().c === 0) {
  db.prepare("INSERT INTO news(title,text,published) VALUES(?,?,1)").run(
    "Добро пожаловать в Good Mobile!",
    "Мы начали активную разработку проекта. Следите за новостями, серверами и обновлениями прямо на сайте."
  );
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
    }
  }),
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = [".apk", ".zip", ".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Разрешены APK, ZIP и изображения."), ok);
  }
});

function safeUser(user) {
  return user ? { id:user.id, login:user.login, role:user.role, created_at:user.created_at } : null;
}

function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : req.headers.cookie?.split(";").map(s=>s.trim()).find(s=>s.startsWith("gm_session="))?.split("=")[1];

  if (!token) return next();
  const row = db.prepare(`
    SELECT u.id,u.login,u.role,u.created_at
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token=? AND s.expires_at>?
  `).get(token, Date.now());

  req.user = row || null;
  next();
}

function requireAuth(req,res,next) {
  if (!req.user) return res.status(401).json({error:"Требуется вход."});
  next();
}

function requireAdmin(req,res,next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({error:"Доступ только для администрации."});
  next();
}

app.use(auth);

app.get("/api/me", (req,res)=>res.json({user:safeUser(req.user)}));

app.post("/api/auth/register", (req,res)=>{
  const login = String(req.body.login || "").trim();
  const password = String(req.body.password || "");
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(login)) return res.status(400).json({error:"Логин: 3–24 символа, латиница/цифры/underscore."});
  if (password.length < 6) return res.status(400).json({error:"Пароль должен быть не короче 6 символов."});
  if (db.prepare("SELECT 1 FROM users WHERE login=?").get(login)) return res.status(409).json({error:"Такой логин уже занят."});
  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare("INSERT INTO users(login,password_hash,role) VALUES(?,?,?)").run(login,hash,"user");
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)").run(token,result.lastInsertRowid,Date.now()+SESSION_DAYS*86400000);
  res.setHeader("Set-Cookie", `gm_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS*86400}`);
  res.json({user:safeUser(db.prepare("SELECT id,login,role,created_at FROM users WHERE id=?").get(result.lastInsertRowid))});
});

app.post("/api/auth/login",(req,res)=>{
  const login=String(req.body.login||"").trim();
  const password=String(req.body.password||"");
  const user=db.prepare("SELECT * FROM users WHERE login=?").get(login);
  if(!user || !bcrypt.compareSync(password,user.password_hash)) return res.status(401).json({error:"Неверный логин или пароль."});
  const token=crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)").run(token,user.id,Date.now()+SESSION_DAYS*86400000);
  res.setHeader("Set-Cookie", `gm_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS*86400}`);
  res.json({user:safeUser(user)});
});

app.post("/api/auth/logout",(req,res)=>{
  const cookie=req.headers.cookie?.split(";").map(s=>s.trim()).find(s=>s.startsWith("gm_session="));
  const token=cookie?.split("=")[1];
  if(token) db.prepare("DELETE FROM sessions WHERE token=?").run(token);
  res.setHeader("Set-Cookie","gm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ok:true});
});

app.get("/api/site", (req,res)=>{
  const settings={};
  for(const key of Object.keys(defaults)) settings[key]=getSetting(key);
  settings.features=JSON.parse(settings.features||"[]");
  settings.donationMethods=JSON.parse(settings.donationMethods||"[]");
  settings.user=safeUser(req.user);
  res.json({settings});
});

app.get("/api/servers",(req,res)=>{
  res.json({servers:db.prepare("SELECT * FROM servers ORDER BY sort_order ASC,id DESC").all()});
});

app.get("/api/news",(req,res)=>{
  const all=req.user?.role==="admin";
  res.json({news:db.prepare(`SELECT * FROM news ${all?"":"WHERE published=1"} ORDER BY id DESC`).all()});
});

app.get("/api/donations",requireAuth,(req,res)=>{
  const rows=req.user.role==="admin"
    ? db.prepare(`SELECT d.*,s.name server_name,u.login user_login FROM donations d LEFT JOIN servers s ON s.id=d.server_id LEFT JOIN users u ON u.id=d.user_id ORDER BY d.id DESC`).all()
    : db.prepare(`SELECT d.*,s.name server_name FROM donations d LEFT JOIN servers s ON s.id=d.server_id WHERE d.user_id=? ORDER BY d.id DESC`).all(req.user.id);
  res.json({donations:rows});
});

app.post("/api/donations",requireAuth,(req,res)=>{
  const nickname=String(req.body.nickname||"").trim();
  const amount=Number(req.body.amount);
  const serverId=req.body.serverId ? Number(req.body.serverId) : null;
  const method=String(req.body.method||"").trim();
  const comment=String(req.body.comment||"").trim().slice(0,500);
  if(!nickname || !Number.isInteger(amount) || amount<50 || amount>500000) return res.status(400).json({error:"Укажите сумму от 50 до 500 000 ₽ и игровой ник."});
  if(!method) return res.status(400).json({error:"Выберите способ оплаты."});
  const result=db.prepare("INSERT INTO donations(user_id,nickname,server_id,amount,method,comment) VALUES(?,?,?,?,?,?)").run(req.user.id,nickname,serverId,amount,method,comment);
  const paymentUrl=getSetting("donationPaymentUrl");
  res.json({id:result.lastInsertRowid,paymentUrl:paymentUrl||null,message:"Заявка на донат создана. После оплаты сохраните номер заявки."});
});

app.get("/api/tickets",requireAuth,(req,res)=>{
  const tickets=req.user.role==="admin"
    ? db.prepare(`SELECT t.*,u.login FROM tickets t JOIN users u ON u.id=t.user_id ORDER BY t.updated_at DESC`).all()
    : db.prepare(`SELECT * FROM tickets WHERE user_id=? ORDER BY updated_at DESC`).all(req.user.id);
  res.json({tickets});
});

app.get("/api/tickets/:id",requireAuth,(req,res)=>{
  const id=Number(req.params.id);
  const ticket=db.prepare("SELECT t.*,u.login FROM tickets t JOIN users u ON u.id=t.user_id WHERE t.id=?").get(id);
  if(!ticket) return res.status(404).json({error:"Тикет не найден."});
  if(req.user.role!=="admin" && ticket.user_id!==req.user.id) return res.status(403).json({error:"Нет доступа."});
  const messages=db.prepare(`SELECT m.*,u.login FROM ticket_messages m LEFT JOIN users u ON u.id=m.user_id WHERE ticket_id=? ORDER BY m.id ASC`).all(id);
  res.json({ticket,messages});
});

app.post("/api/tickets",requireAuth,(req,res)=>{
  const subject=String(req.body.subject||"").trim().slice(0,120);
  const message=String(req.body.message||"").trim().slice(0,2000);
  if(!subject||!message) return res.status(400).json({error:"Заполните тему и сообщение."});
  const result=db.prepare("INSERT INTO tickets(user_id,subject) VALUES(?,?)").run(req.user.id,subject);
  db.prepare("INSERT INTO ticket_messages(ticket_id,user_id,message) VALUES(?,?,?)").run(result.lastInsertRowid,req.user.id,message);
  res.json({id:result.lastInsertRowid});
});

app.post("/api/tickets/:id/messages",requireAuth,(req,res)=>{
  const id=Number(req.params.id);
  const ticket=db.prepare("SELECT * FROM tickets WHERE id=?").get(id);
  if(!ticket) return res.status(404).json({error:"Тикет не найден."});
  if(req.user.role!=="admin" && ticket.user_id!==req.user.id) return res.status(403).json({error:"Нет доступа."});
  const message=String(req.body.message||"").trim().slice(0,2000);
  if(!message) return res.status(400).json({error:"Сообщение пустое."});
  db.prepare("INSERT INTO ticket_messages(ticket_id,user_id,message) VALUES(?,?,?)").run(id,req.user.id,message);
  db.prepare("UPDATE tickets SET updated_at=CURRENT_TIMESTAMP, status=? WHERE id=?").run(req.user.role==="admin"?"answered":"open",id);
  res.json({ok:true});
});

app.post("/api/upload",requireAdmin,(req,res)=>{
  upload.single("file")(req,res,(err)=>{
    if(err) return res.status(400).json({error:err.message});
    if(!req.file) return res.status(400).json({error:"Файл не выбран."});
    const url=`/uploads/${req.file.filename}`;
    setSetting("apkUrl", url);
    res.json({url,name:req.file.originalname,size:req.file.size});
  });
});

app.put("/api/admin/settings",requireAdmin,(req,res)=>{
  const allowed=Object.keys(defaults);
  for(const key of allowed) if(req.body[key]!==undefined) {
    let value=req.body[key];
    if(["features","donationMethods"].includes(key) && typeof value!=="string") value=JSON.stringify(value);
    setSetting(key,value);
  }
  res.json({ok:true});
});

app.post("/api/admin/servers",requireAdmin,(req,res)=>{
  const data=req.body;
  const r=db.prepare(`INSERT INTO servers(name,description,ip,port,online,max_online,status,image,accent,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(String(data.name||"Новый сервер"),String(data.description||""),String(data.ip||""),Number(data.port||7777),Number(data.online||0),Number(data.max_online||100),String(data.status||"development"),String(data.image||""),String(data.accent||"green"),Number(data.sort_order||0));
  res.json({id:r.lastInsertRowid});
});

app.put("/api/admin/servers/:id",requireAdmin,(req,res)=>{
  const d=req.body;
  db.prepare(`UPDATE servers SET name=?,description=?,ip=?,port=?,online=?,max_online=?,status=?,image=?,accent=?,sort_order=? WHERE id=?`)
    .run(String(d.name||""),String(d.description||""),String(d.ip||""),Number(d.port||7777),Number(d.online||0),Number(d.max_online||100),String(d.status||"development"),String(d.image||""),String(d.accent||"green"),Number(d.sort_order||0),Number(req.params.id));
  res.json({ok:true});
});

app.delete("/api/admin/servers/:id",requireAdmin,(req,res)=>{
  db.prepare("DELETE FROM servers WHERE id=?").run(Number(req.params.id));
  res.json({ok:true});
});

app.post("/api/admin/news",requireAdmin,(req,res)=>{
  const d=req.body;
  const r=db.prepare("INSERT INTO news(title,text,image,published) VALUES(?,?,?,?)").run(String(d.title||"Без названия"),String(d.text||""),String(d.image||""),d.published?1:0);
  res.json({id:r.lastInsertRowid});
});

app.put("/api/admin/news/:id",requireAdmin,(req,res)=>{
  const d=req.body;
  db.prepare("UPDATE news SET title=?,text=?,image=?,published=? WHERE id=?").run(String(d.title||""),String(d.text||""),String(d.image||""),d.published?1:0,Number(req.params.id));
  res.json({ok:true});
});

app.delete("/api/admin/news/:id",requireAdmin,(req,res)=>{
  db.prepare("DELETE FROM news WHERE id=?").run(Number(req.params.id));
  res.json({ok:true});
});

app.put("/api/admin/donations/:id",requireAdmin,(req,res)=>{
  const status=String(req.body.status||"pending");
  if(!["pending","paid","cancelled"].includes(status)) return res.status(400).json({error:"Неверный статус."});
  db.prepare("UPDATE donations SET status=? WHERE id=?").run(status,Number(req.params.id));
  res.json({ok:true});
});

app.put("/api/admin/tickets/:id",requireAdmin,(req,res)=>{
  const status=String(req.body.status||"open");
  if(!["open","answered","closed"].includes(status)) return res.status(400).json({error:"Неверный статус."});
  db.prepare("UPDATE tickets SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,Number(req.params.id));
  res.json({ok:true});
});

app.get("/admin",(_,res)=>res.sendFile(path.join(ROOT,"public","admin.html")));
app.get("/{*splat}",(req,res)=>{
  if(req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return res.status(404).end();
  res.sendFile(path.join(ROOT,"public","index.html"));
});

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:"Внутренняя ошибка сервера."});
});

app.listen(PORT,()=>console.log(`Good Mobile: http://localhost:${PORT}`));
