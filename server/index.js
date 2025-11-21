require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- HELPER FUNCTIONS ---
function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- API ROUTES ---

// 1. Health Check
app.get('/healthz', (req, res) => {
    res.status(200).json({ ok: true, version: "1.0" });
});

// 2. Create Link (POST /api/links)
app.post('/api/links', async (req, res) => {
    const { url, shortCode } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let code = shortCode;
    if (code) {
        // Custom code validation
        if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
            return res.status(400).json({ error: "Short code must be 6-8 alphanumeric characters." });
        }
    } else {
        code = generateShortCode();
    }

    try {
        const result = await pool.query(
            'INSERT INTO links (original_url, short_code) VALUES ($1, $2) RETURNING *',
            [url, code]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "Short code already exists." });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// 3. List All Links (GET /api/links)
app.get('/api/links', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM links ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 4. Get Single Link Stats (GET /api/links/:code)
app.get('/api/links/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('SELECT * FROM links WHERE short_code = $1', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Link not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 5. Delete Link (DELETE /api/links/:code)
app.delete('/api/links/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('DELETE FROM links WHERE short_code = $1 RETURNING *', [code]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Link not found" });
        }
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- REDIRECT ROUTE (Must be last) ---
// 6. Redirect /:code
app.get('/:code', async (req, res) => {
    const { code } = req.params;
    try {
        // Find the link
        const result = await pool.query('SELECT * FROM links WHERE short_code = $1', [code]);
        
        if (result.rows.length === 0) {
            return res.status(404).send("Link not found");
        }

        const link = result.rows[0];

        // Increment click count asynchronously
        pool.query(
            'UPDATE links SET click_count = click_count + 1, last_clicked_at = NOW() WHERE id = $1',
            [link.id]
        );

        // Redirect
        res.redirect(link.original_url);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});