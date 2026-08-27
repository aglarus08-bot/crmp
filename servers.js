const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'clonerbypitt', resave: false, saveUninitialized: true }));

// Логин (имитация)
app.post('/login', (req, res) => {
    const { login, password } = req.body;
    if (login && password) {
        req.session.user = login;
        res.json({ success: true, username: login });
    } else {
        res.json({ success: false, error: 'Неверные данные' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ПОЛУЧЕНИЕ СЕРВЕРОВ — ИСПРАВЛЕНО
app.post('/get-guilds', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.json({ error: 'Токен обязателен' });
    try {
        // Для пользовательского токена используем просто "token" (без Bot/ Bearer — но Bearer работает)
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get('https://discord.com/api/v10/users/@me/guilds', { headers });
        res.json({ success: true, guilds: response.data });
    } catch (e) {
        res.json({ error: e.response?.data?.message || e.message });
    }
});

// Получение структуры
app.post('/get-guild-structure', async (req, res) => {
    const { token, guildId } = req.body;
    if (!token || !guildId) return res.json({ error: 'Токен и ID сервера нужны' });
    try {
        const headers = { Authorization: `Bearer ${token}` };
        const [guild, channels, roles] = await Promise.all([
            axios.get(`https://discord.com/api/v10/guilds/${guildId}`, { headers }),
            axios.get(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers }),
            axios.get(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers })
        ]);
        res.json({
            success: true,
            guild: guild.data,
            channels: channels.data,
            roles: roles.data
        });
    } catch (e) {
        res.json({ error: e.response?.data?.message || e.message });
    }
});

// Клонирование
app.post('/clone', async (req, res) => {
    const { token, sourceId, targetId, options } = req.body;
    if (!token || !sourceId || !targetId) return res.json({ error: 'Не все данные' });
    try {
        const headers = { Authorization: `Bearer ${token}` };
        const [sourceGuild, sourceChannels, sourceRoles, sourceEmojis] = await Promise.all([
            axios.get(`https://discord.com/api/v10/guilds/${sourceId}`, { headers }),
            axios.get(`https://discord.com/api/v10/guilds/${sourceId}/channels`, { headers }),
            axios.get(`https://discord.com/api/v10/guilds/${sourceId}/roles`, { headers }),
            axios.get(`https://discord.com/api/v10/guilds/${sourceId}/emojis`, { headers })
        ]);

        if (options.settings) {
            await axios.patch(`https://discord.com/api/v10/guilds/${targetId}`, {
                name: sourceGuild.data.name + '-clone',
                icon: sourceGuild.data.icon ? `data:image/png;base64,${sourceGuild.data.icon}` : null,
                verification_level: sourceGuild.data.verification_level,
                default_message_notifications: sourceGuild.data.default_message_notifications,
                explicit_content_filter: sourceGuild.data.explicit_content_filter,
                preferred_locale: sourceGuild.data.preferred_locale,
                afk_channel_id: sourceGuild.data.afk_channel_id,
                afk_timeout: sourceGuild.data.afk_timeout,
                system_channel_id: sourceGuild.data.system_channel_id
            }, { headers });
        }

        if (options.roles) {
            const sortedRoles = sourceRoles.data.sort((a,b) => a.position - b.position);
            for (const role of sortedRoles) {
                if (role.name === '@everyone') continue;
                await axios.post(`https://discord.com/api/v10/guilds/${targetId}/roles`, {
                    name: role.name,
                    permissions: role.permissions,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    position: role.position
                }, { headers });
            }
        }

        const categories = sourceChannels.data.filter(c => c.type === 4);
        const textChannels = sourceChannels.data.filter(c => c.type === 0);
        const voiceChannels = sourceChannels.data.filter(c => c.type === 2);

        if (options.categories) {
            for (const cat of categories) {
                await axios.post(`https://discord.com/api/v10/guilds/${targetId}/channels`, {
                    name: cat.name,
                    type: 4,
                    position: cat.position,
                    permission_overwrites: cat.permission_overwrites
                }, { headers });
            }
        }

        if (options.textChannels) {
            for (const ch of textChannels) {
                await axios.post(`https://discord.com/api/v10/guilds/${targetId}/channels`, {
                    name: ch.name,
                    type: 0,
                    topic: ch.topic || '',
                    nsfw: ch.nsfw || false,
                    rate_limit_per_user: ch.rate_limit_per_user || 0,
                    position: ch.position,
                    parent_id: ch.parent_id || null,
                    permission_overwrites: ch.permission_overwrites
                }, { headers });
            }
        }

        if (options.voiceChannels) {
            for (const ch of voiceChannels) {
                await axios.post(`https://discord.com/api/v10/guilds/${targetId}/channels`, {
                    name: ch.name,
                    type: 2,
                    bitrate: ch.bitrate || 64000,
                    user_limit: ch.user_limit || 0,
                    position: ch.position,
                    parent_id: ch.parent_id || null,
                    permission_overwrites: ch.permission_overwrites
                }, { headers });
            }
        }

        if (options.emojis) {
            for (const emoji of sourceEmojis.data) {
                await axios.post(`https://discord.com/api/v10/guilds/${targetId}/emojis`, {
                    name: emoji.name,
                    image: `data:image/png;base64,${emoji.image}`
                }, { headers });
            }
        }

        res.json({ success: true, message: 'Клонирование завершено' });
    } catch (e) {
        res.json({ error: e.response?.data?.message || e.message });
    }
});

app.listen(port, () => console.log(`Cloner by Pitt запущен на http://localhost:${port}`));