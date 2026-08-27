let currentUser = null;

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
            localStorage.setItem('username', data.username);
            window.location.href = '/dashboard.html';
        } else alert('Ошибка входа: ' + data.error);
    });
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab')[1].classList.add('active');
}
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab')[0].classList.add('active');
}

function logout() {
    fetch('/logout', { method: 'POST' }).then(() => {
        localStorage.removeItem('discordToken');
        localStorage.removeItem('username');
        window.location.href = '/';
    });
}

function saveToken() {
    const token = document.getElementById('discordToken').value.trim();
    if (!token) return alert('Введите токен');
    localStorage.setItem('discordToken', token);
    window.location.href = '/clone.html';
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        document.getElementById('userDisplay').textContent = localStorage.getItem('username') || 'гость';
        document.getElementById('username').textContent = localStorage.getItem('username') || 'гость';
    }
});

// Просмотр структуры по ID (без списка серверов)
function previewStructure() {
    const guildId = document.getElementById('sourceId').value.trim();
    const token = localStorage.getItem('discordToken');
    if (!guildId) return alert('Введите ID сервера-источника');
    if (!token) return alert('Токен не найден');
    
    fetch('/get-guild-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, guildId })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(`Сервер: ${data.guild.name}\nКаналов: ${data.channels.length}\nРолей: ${data.roles.length}`);
        } else {
            alert('Ошибка: ' + (data.error || 'неизвестно'));
        }
    })
    .catch(err => alert('Сетевая ошибка: ' + err.message));
}

// Клонирование по ID из полей
function startClone() {
    const sourceId = document.getElementById('sourceId').value.trim();
    const targetId = document.getElementById('targetId').value.trim();
    const token = localStorage.getItem('discordToken');
    
    if (!sourceId) return alert('Введите ID сервера-источника');
    if (!targetId) return alert('Введите ID сервера-копии');
    if (!token) return alert('Токен не найден');

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
        else if (label.includes('Каналов')) options.channels = cb.checked;
    });

    document.getElementById('stats').innerHTML = '⏳ Клонирование началось...';
    
    fetch('/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sourceId, targetId, options })
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById('stats').innerHTML = data.success ? '✅ Клонирование завершено' : '❌ Ошибка: ' + (data.error || 'неизвестно');
    })
    .catch(err => {
        document.getElementById('stats').innerHTML = '❌ Сетевая ошибка: ' + err.message;
    });
}