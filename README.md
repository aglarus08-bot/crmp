# Good Mobile Panel — Full Edition

Полноценная компактная админ-панель игрового проекта. **В корне только две папки: `public` и `static`.**

## Возможности

- Авторизация JWT + bcrypt.
- USER / ADMIN / SUPERADMIN.
- Полный CRUD администраторов.
- Должности, приоритеты, цвета и permissions.
- Серверы: количество, адрес, порт, онлайн, игроки, лимит, версия, режим, сортировка.
- Ссылки: URL, иконка, размещение, сортировка, активность, клики.
- Новости: draft/published, slug, категории, изображения, текст, просмотры.
- Заявления: пользователь, контакт, должность, статус, ответственный, заметки.
- Жалобы: приоритет, статус, ответственный, ответ.
- Настройки сайта, hero, логотип, соцсети, показатели, техработы.
- Dashboard.
- Статистика.
- Audit log.
- Уведомления.
- Public API для вывода данных на внешний сайт.
- SQLite с автоматической инициализацией.
- Все mutation API защищены авторизацией; критические настройки/админы — SUPERADMIN.

## Структура

```text
good-mobile-panel/
├── public/
│   └── index.html
├── static/
│   ├── app.js
│   └── style.css
├── server.js
├── package.json
├── README.md
└── good-mobile.db (создаётся автоматически после запуска)
```

## Запуск

```bash
npm install
npm start
```

Открыть `http://localhost:3000`.

Демо:

```text
admin
admin12345
```

Сразу после установки поменяйте пароль и `AUTH_SECRET`.

## API

Основные endpoints:

```text
POST /api/login
GET  /api/me
GET  /api/dashboard
GET/POST/PUT/DELETE /api/positions
GET/POST/PUT/DELETE /api/servers
GET/POST/PUT/DELETE /api/links
GET/POST/PUT/DELETE /api/news
GET/POST/PUT/DELETE /api/applications
GET/POST/PUT/DELETE /api/complaints
GET/POST/PUT/DELETE /api/users
GET/PUT /api/settings
GET /api/audit
GET /api/notifications
GET /api/public
GET /api/health
```

## Важно

Это уже рабочий full-stack проект, но реальные данные онлайна игровых серверов пока вводятся/обновляются через API. Для production можно подключить RCON/Query/API конкретного игрового движка, CDN для изображений и 2FA.
