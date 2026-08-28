const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.AUTH_SECRET || "CHANGE_ME_GOOD_MOBILE_SECRET";
const ROOT = __dirname;
const DB = new Database(path.join(ROOT, "good-mobile.db"));
DB.pragma("journal_mode = WAL");
DB.pragma("foreign_keys = ON");

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(ROOT,"public")));
app.use("/static", express.static(path.join(ROOT,"static")));

DB.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL, name TEXT NOT NULL, role TEXT DEFAULT 'USER',
 position_id INTEGER, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS positions(
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
 description TEXT DEFAULT '', color TEXT DEFAULT '#8b5cf6',
 priority INTEGER DEFAULT 0, permissions TEXT DEFAULT '[]', active INTEGER DEFAULT 1,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE,
 server_scope TEXT DEFAULT 'all', notes TEXT DEFAULT '',
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS servers(
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, address TEXT NOT NULL,
 port INTEGER DEFAULT 7777, online INTEGER DEFAULT 1, players INTEGER DEFAULT 0,
 max_players INTEGER DEFAULT 1000, version TEXT DEFAULT '1.0', mode TEXT DEFAULT 'RP',
 sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS links(
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, url TEXT NOT NULL,
 icon TEXT DEFAULT 'link', placement TEXT DEFAULT 'header', sort_order INTEGER DEFAULT 0,
 active INTEGER DEFAULT 1, clicks INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS news(
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT UNIQUE,
 excerpt TEXT DEFAULT '', content TEXT DEFAULT '', image TEXT DEFAULT '',
 category TEXT DEFAULT 'Новости', author_id INTEGER, status TEXT DEFAULT 'DRAFT',
 views INTEGER DEFAULT 0, published_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS applications(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT NOT NULL, contact TEXT DEFAULT '',
 position_id INTEGER, message TEXT DEFAULT '', status TEXT DEFAULT 'NEW',
 assigned_id INTEGER, admin_note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(position_id) REFERENCES positions(id) ON DELETE SET NULL,
 FOREIGN KEY(assigned_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS complaints(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT NOT NULL, contact TEXT DEFAULT '',
 subject TEXT NOT NULL, message TEXT DEFAULT '', status TEXT DEFAULT 'NEW',
 assigned_id INTEGER, response TEXT DEFAULT '', priority TEXT DEFAULT 'NORMAL',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(assigned_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS settings(
 id INTEGER PRIMARY KEY CHECK(id=1), project_name TEXT DEFAULT 'Good Mobile',
 tagline TEXT DEFAULT 'ТВОЙ НОВЫЙ ИГРОВОЙ МИР',
 hero_text TEXT DEFAULT 'Присоединяйся к нашему проекту и окунись в мир уникальных возможностей!',
 logo TEXT DEFAULT '', hero_image TEXT DEFAULT '',
 game_url TEXT DEFAULT '', discord_url TEXT DEFAULT '', telegram_url TEXT DEFAULT '',
 youtube_url TEXT DEFAULT '', tiktok_url TEXT DEFAULT '', support_url TEXT DEFAULT '',
 online_players INTEGER DEFAULT 1248, today_players INTEGER DEFAULT 87, active_players INTEGER DEFAULT 342,
 maintenance INTEGER DEFAULT 0, maintenance_text TEXT DEFAULT 'Технические работы',
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT NOT NULL,
 entity TEXT DEFAULT '', entity_id INTEGER, details TEXT DEFAULT '', ip TEXT DEFAULT '',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS notifications(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT NOT NULL,
 message TEXT DEFAULT '', type TEXT DEFAULT 'INFO', read INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS server_stats(
 id INTEGER PRIMARY KEY AUTOINCREMENT, server_id INTEGER, players INTEGER DEFAULT 0,
 recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(server_id) REFERENCES servers(id) ON DELETE CASCADE
);
`);

const count = (t)=>DB.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
if(!count("settings")) DB.prepare(`INSERT INTO settings(id) VALUES(1)`).run();

if(!count("positions")){
 const p=[
  ["Руководство проекта","Полный контроль проекта","#f4c542",100,["dashboard","admins","positions","servers","links","news","applications","complaints","settings","audit"]],
  ["Команда проекта","Управление основными разделами","#a855f7",90,["dashboard","servers","links","news","applications","complaints"]],
  ["Куратор сервера","Контроль конкретного сервера","#22c55e",60,["dashboard","servers","applications","complaints"]],
  ["Старший администратор","Старший состав администрации","#f59e0b",40,["dashboard","applications","complaints","news"]],
  ["Администратор","Основной состав администрации","#94a3b8",10,["dashboard","applications","complaints"]]
 ];
 const s=DB.prepare(`INSERT INTO positions(name,description,color,priority,permissions) VALUES(?,?,?,?,?)`);
 p.forEach(x=>s.run(x[0],x[1],x[2],x[3],JSON.stringify(x[4])));
}
if(!count("servers")){
 const s=DB.prepare(`INSERT INTO servers(name,address,port,players,max_players,sort_order) VALUES(?,?,?,?,?,?)`);
 [["Good Mobile #1","play.goodmobile.ru",7777,342,1000,1],["Good Mobile #2","play.goodmobile.ru",7778,228,1000,2],["Good Mobile #3","play.goodmobile.ru",7779,194,1000,3],["Good Mobile #4","play.goodmobile.ru",7780,173,1000,4],["Good Mobile #5","play.goodmobile.ru",7781,156,1000,5],["Good Mobile #6","play.goodmobile.ru",7782,155,1000,6]].forEach(x=>s.run(...x));
}
if(!count("links")){
 const s=DB.prepare(`INSERT INTO links(title,url,icon,placement,sort_order) VALUES(?,?,?,?,?)`);
 [["Discord","https://discord.com","discord","header",1],["Telegram","https://telegram.org","telegram","header",2],["YouTube","https://youtube.com","youtube","footer",3],["TikTok","https://tiktok.com","music","footer",4]].forEach(x=>s.run(...x));
}
if(!count("users")){
 const pos=DB.prepare(`SELECT id FROM positions ORDER BY priority DESC LIMIT 1`).get().id;
 DB.prepare(`INSERT INTO users(login,password,name,role,position_id) VALUES(?,?,?,?,?)`)
   .run("admin",bcrypt.hashSync("admin12345",12),"God Mobile","SUPERADMIN",pos);
 const uid=DB.prepare(`SELECT id FROM users WHERE login='admin'`).get().id;
 DB.prepare(`INSERT INTO admins(user_id) VALUES(?)`).run(uid);
}

function token(user){ return jwt.sign({id:user.id},SECRET,{expiresIn:"7d"}); }
function me(req){
 const h=req.headers.authorization||"";
 if(!h.startsWith("Bearer ")) return null;
 try{return DB.prepare(`SELECT u.*,p.name position,p.permissions FROM users u LEFT JOIN positions p ON p.id=u.position_id WHERE u.id=?`).get(jwt.verify(h.slice(7),SECRET).id)}catch{return null}
}
function auth(req,res,next){const u=me(req);if(!u||!u.active)return res.status(401).json({error:"Требуется авторизация"});req.user=u;next()}
function superadmin(req,res,next){if(req.user.role!=="SUPERADMIN")return res.status(403).json({error:"Недостаточно прав"});next()}
function audit(req,action,entity,id,details=""){DB.prepare(`INSERT INTO audit(user_id,action,entity,entity_id,details,ip) VALUES(?,?,?,?,?,?)`).run(req.user.id,action,entity,id,details,req.ip)}
function clean(obj){const o={};for(const [k,v] of Object.entries(obj||{})){if(typeof v==="string"&&v.length>100000)continue;o[k]=v}return o}
function crud(table, columns, opts={}){
 app.get(`/api/${table}`,auth,(req,res)=>{
  let sql=`SELECT * FROM ${table}`;
  if(req.query.search){sql+=` WHERE ${columns.filter(x=>x!=="id").map(x=>`${x} LIKE @s`).join(" OR ")}`; }
  sql+=` ORDER BY ${opts.order||"id DESC"}`;
  const rows=DB.prepare(sql).all({s:`%${req.query.search||""}%`});
  res.json({items:rows,total:rows.length});
 });
 app.post(`/api/${table}`,auth,(req,res)=>{
  try{const d=clean(req.body), keys=columns.filter(k=>k!=="id"&&d[k]!==undefined);
   if(!keys.length)return res.status(400).json({error:"Нет данных"});
   const vals=keys.map(k=>d[k]);const q=`INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map(()=>"?").join(",")})`;
   const r=DB.prepare(q).run(...vals);audit(req,"CREATE",table,r.lastInsertRowid,`Создана запись`);res.json({id:r.lastInsertRowid});
  }catch(e){res.status(400).json({error:e.message})}
 });
 app.put(`/api/${table}/:id`,auth,(req,res)=>{
  try{const d=clean(req.body), keys=columns.filter(k=>k!=="id"&&d[k]!==undefined);if(!keys.length)return res.status(400).json({error:"Нет данных"});
   const r=DB.prepare(`UPDATE ${table} SET ${keys.map(k=>`${k}=?`).join(",")} WHERE id=?`).run(...keys.map(k=>d[k]),req.params.id);
   audit(req,"UPDATE",table,req.params.id,"Изменена запись");res.json({ok:r.changes>0});
  }catch(e){res.status(400).json({error:e.message})}
 });
 app.delete(`/api/${table}/:id`,auth,(req,res)=>{
  try{DB.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);audit(req,"DELETE",table,req.params.id,"Удалена запись");res.json({ok:true})}catch(e){res.status(400).json({error:e.message})}
 });
}

crud("positions",["id","name","description","color","priority","permissions","active"],{order:"priority DESC"});
crud("servers",["id","name","address","port","online","players","max_players","version","mode","sort_order","active"],{order:"sort_order ASC"});
crud("links",["id","title","url","icon","placement","sort_order","active","clicks"],{order:"sort_order ASC"});
crud("news",["id","title","slug","excerpt","content","image","category","status","views","published_at"],{order:"created_at DESC"});
crud("applications",["id","user_name","contact","position_id","message","status","assigned_id","admin_note"],{order:"created_at DESC"});
crud("complaints",["id","user_name","contact","subject","message","status","assigned_id","response","priority"],{order:"created_at DESC"});

app.post("/api/login",(req,res)=>{
 const u=DB.prepare(`SELECT * FROM users WHERE login=?`).get(req.body.login||"");
 if(!u||!u.active||!bcrypt.compareSync(req.body.password||"",u.password))return res.status(401).json({error:"Неверный логин или пароль"});
 const t=token(u);audit({user:u,ip:req.ip},"LOGIN","auth",u.id,"Вход в панель");res.json({token:t,user:{id:u.id,login:u.login,name:u.name,role:u.role}});
});
app.get("/api/me",auth,(req,res)=>res.json({user:req.user}));
app.get("/api/dashboard",auth,(req,res)=>{
 const s=DB.prepare(`SELECT * FROM settings WHERE id=1`).get();
 const stats={
  users:count("users"),admins:count("admins"),positions:count("positions"),
  servers:DB.prepare(`SELECT COUNT(*) c FROM servers WHERE active=1`).get().c,
  links:DB.prepare(`SELECT COUNT(*) c FROM links WHERE active=1`).get().c,
  applications:DB.prepare(`SELECT COUNT(*) c FROM applications WHERE status='NEW'`).get().c,
  complaints:DB.prepare(`SELECT COUNT(*) c FROM complaints WHERE status='NEW'`).get().c,
  news:count("news")
 };
 res.json({stats,settings:s,servers:DB.prepare(`SELECT * FROM servers WHERE active=1 ORDER BY sort_order`).all()});
});
app.get("/api/users",auth,(req,res)=>res.json({items:DB.prepare(`SELECT u.id,u.login,u.name,u.role,u.active,u.created_at,p.name position FROM users u LEFT JOIN positions p ON p.id=u.position_id ORDER BY u.id DESC`).all()}));
app.post("/api/users",auth,superadmin,(req,res)=>{
 try{
  const b=req.body;const hash=bcrypt.hashSync(b.password||"admin12345",12);
  const r=DB.prepare(`INSERT INTO users(login,password,name,role,position_id,active) VALUES(?,?,?,?,?,?)`).run(b.login,bcrypt.hashSync(b.password,12),b.name,b.role||"ADMIN",b.position_id||null,b.active===false?0:1);
  DB.prepare(`INSERT INTO admins(user_id,server_scope,notes) VALUES(?,?,?)`).run(r.lastInsertRowid,b.server_scope||"all",b.notes||"");
  audit(req,"CREATE","users",r.lastInsertRowid,"Создан администратор");res.json({id:r.lastInsertRowid});
 }catch(e){res.status(400).json({error:e.message})}
});
app.put("/api/users/:id",auth,superadmin,(req,res)=>{
 const b=req.body;const keys=["name","role","position_id","active"].filter(k=>b[k]!==undefined);
 if(b.password) {keys.push("password");b.password=bcrypt.hashSync(b.password,12)}
 if(!keys.length)return res.json({ok:true});
 DB.prepare(`UPDATE users SET ${keys.map(k=>`${k}=?`).join(",")} WHERE id=?`).run(...keys.map(k=>b[k]),req.params.id);audit(req,"UPDATE","users",req.params.id,"Обновлён администратор");res.json({ok:true});
});
app.delete("/api/users/:id",auth,superadmin,(req,res)=>{if(+req.params.id===req.user.id)return res.status(400).json({error:"Нельзя удалить себя"});DB.prepare(`DELETE FROM users WHERE id=?`).run(req.params.id);audit(req,"DELETE","users",req.params.id,"Удалён администратор");res.json({ok:true})});

app.get("/api/settings",auth,(req,res)=>res.json({item:DB.prepare(`SELECT * FROM settings WHERE id=1`).get()}));
app.put("/api/settings",auth,superadmin,(req,res)=>{
 const b=req.body;const allowed=["project_name","tagline","hero_text","logo","hero_image","game_url","discord_url","telegram_url","youtube_url","tiktok_url","support_url","online_players","today_players","active_players","maintenance","maintenance_text"];
 const keys=allowed.filter(k=>b[k]!==undefined);if(!keys.length)return res.json({ok:true});
 DB.prepare(`UPDATE settings SET ${keys.map(k=>`${k}=?`).join(",")},updated_at=CURRENT_TIMESTAMP WHERE id=1`).run(...keys.map(k=>b[k]));audit(req,"UPDATE","settings",1,"Обновлены настройки");res.json({ok:true});
});

app.get("/api/audit",auth,(req,res)=>res.json({items:DB.prepare(`SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500`).all()}));
app.get("/api/notifications",auth,(req,res)=>res.json({items:DB.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100`).all(req.user.id)}));
app.put("/api/notifications/:id/read",auth,(req,res)=>{DB.prepare(`UPDATE notifications SET read=1 WHERE id=? AND user_id=?`).run(req.params.id,req.user.id);res.json({ok:true})});

app.get("/api/public",(_,res)=>{
 const settings=DB.prepare(`SELECT * FROM settings WHERE id=1`).get();
 res.json({settings,links:DB.prepare(`SELECT * FROM links WHERE active=1 ORDER BY sort_order`).all(),servers:DB.prepare(`SELECT * FROM servers WHERE active=1 ORDER BY sort_order`).all(),news:DB.prepare(`SELECT * FROM news WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 20`).all()});
});

app.get("/api/health",(_,res)=>res.json({ok:true,time:new Date().toISOString()}));
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));

app.listen(PORT,()=>console.log(`Good Mobile Panel: http://localhost:${PORT}`));
