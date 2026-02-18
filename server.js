const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Stockage en mémoire (500 logs max)
let logs = [];
const MAX_LOGS = 500;

// Clé secrète pour sécuriser l'envoi (ton Lua l'enverra dans le header)
const SECRET_KEY = process.env.SECRET_KEY || 'district_secret_2026';

// ──────────────────────────────────────────────
// POST /log  → reçoit un log depuis le Lua
// ──────────────────────────────────────────────
app.post('/log', (req, res) => {
    const key = req.headers['x-secret-key'];
    if (key !== SECRET_KEY) return res.status(401).json({ error: 'Unauthorized' });

    const { cat, player, msg, steam, serverId } = req.body;
    if (!cat || !msg) return res.status(400).json({ error: 'Missing fields' });

    const log = {
        id: Date.now() + Math.floor(Math.random() * 9999),
        ts: Date.now(),
        cat: cat || 'unknown',
        player: player || 'Inconnu',
        msg: msg || '',
        steam: steam || 'N/A',
        serverId: serverId || 0,
    };

    logs.unshift(log);
    if (logs.length > MAX_LOGS) logs = logs.slice(0, MAX_LOGS);

    res.json({ ok: true, id: log.id });
});

// ──────────────────────────────────────────────
// GET /logs  → le panel HTML récupère les logs
// ──────────────────────────────────────────────
app.get('/logs', (req, res) => {
    const { cat, limit = 200 } = req.query;
    let result = logs;
    if (cat && cat !== 'all') result = logs.filter(l => l.cat === cat);
    res.json(result.slice(0, parseInt(limit)));
});

// ──────────────────────────────────────────────
// GET /stats  → stats rapides
// ──────────────────────────────────────────────
app.get('/stats', (req, res) => {
    res.json({
        total: logs.length,
        bans: logs.filter(l => ['ban','kick'].includes(l.cat)).length,
        kills: logs.filter(l => l.cat === 'kill').length,
        connexions: logs.filter(l => l.cat === 'connexion').length,
    });
});

// Health check
app.get('/', (req, res) => res.json({ status: 'vLogs API running', logs: logs.length }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`vLogs API démarré sur le port ${PORT}`));
