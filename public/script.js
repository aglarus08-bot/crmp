let currentUser = null;
let discordToken = null;
let guildsList = [];

function login() {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            currentUser = data.username;
            window.location.href = '/dashboard.html';
        } else alert('Ошибка входа');
    });
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function logout() {
    fetch('/logout', { method: 'POST' }).then(() => window.location.href = '/');
}

function saveToken() {
    const token = document.getElementById('discordToken').value;
    if (!token) return alert('Введите токен');
    discordToken = token;
    localStorage.setItem('discordToken', token);
    window.location.href = '/clone.html';
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('clone.html')) {
        const token = localStorage.getItem('discordToken');
        if (!token) return alert('Токен не найден');
        fetch('/get-guilds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                guildsList = data.guilds;
                const src = document.getElementById('sourceGuild');
                const tgt = document.getElementById('targetGuild');
                guildsList.forEach(g => {
                    src.innerHTML += `<option value="${g.id}">${g.name}</option>`;
                    tgt.innerHTML += `<option value="${g.id}">${g.name}</option>`;
                });
            } else alert('Ошибка загрузки серверов: ' + data.error);
        });
    }
});

function previewStructure() {
    const guildId = document.getElementById('sourceGuild').value;
    const token = localStorage.getItem('discordToken');
    fetch('/get-guild-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, guildId })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(`Сервер: ${data.guild.name}\nКаналов: ${data.channels.length}\nРолей: ${data.roles.length}`);
        } else alert('Ошибка: ' + data.error);
    });
}

function startClone() {
    const sourceId = document.getElementById('sourceGuild').value;
    const targetId = document.getElementById('targetGuild').value;
    const token = localStorage.getItem('discordToken');
    const checkboxes = document.querySelectorAll('.options input[type="checkbox"]');
    const options = {};
    checkboxes.forEach(cb => {
        const label = cb.parentElement.textContent.trim();
        if (label.includes('Ролей')) options.roles = cb.checked;
        else if (label.includes('Категории')) options.categories = cb.checked;
        else if (label.includes('Текстовые')) options.textChannels = cb.checked;
        else if (label.includes('Голосовые')) options.voiceChannels = cb.checked;
        else if (label.includes('Настройки')) options.settings = cb.checked;
        else if (label.includes('Эмодзи')) options.emojis = cb.checked;
        else if (label.includes('Стикеры')) options.stickers = cb.checked;
        else if (label.includes('Звуки')) options.sounds = cb.checked;
        else if (label.includes('Права')) options.permissions = cb.checked;
        else if (label.includes('Форум')) options.forum = cb.checked;
    });

    fetch('/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sourceId, targetId, options })
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById('stats').innerHTML = data.success ? '✅ Клонирование завершено' : '❌ ' + data.error;
    });
}