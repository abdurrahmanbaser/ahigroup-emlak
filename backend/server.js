const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Veritabanı bağlantısı
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_nCQHRkv1LSb8@ep-rapid-salad-aghprsjm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require", 
    ssl: { rejectUnauthorized: false }
});

// Ara yazılımlar
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer (Dosya Yükleme) ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Oturum ve Giriş Kontrolü
app.use(session({ secret: 'cok-gizli-bir-anahtar', resave: false, saveUninitialized: true }));
const requireLogin = (req, res, next) => { if (req.session.loggedIn) next(); else res.redirect('/login'); };
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'admin', 'login.html')));
app.get('/admin', requireLogin, (req, res) => res.sendFile(path.join(__dirname, '..', 'admin', 'index.html')));
app.get('/admin-script.js', requireLogin, (req, res) => res.sendFile(path.join(__dirname, '..', 'admin', 'admin-script.js')));
const ADMIN_USER = 'admin'; const ADMIN_PASS = '12345';
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) { req.session.loggedIn = true; res.sendStatus(200); } else { res.sendStatus(401); }
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => { res.redirect('/login'); });
});


// =========================================================================
// --- CRUD API ROTALARI (SON VE TAM HALİ) ---
// =========================================================================

// GET: Tüm ilanları resimleriyle ve DOĞRU SÜTUN ADIYLA getir
app.get('/api/ilanlar', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.id, i.baslik, i.fiyat, i.konum, i.tip, 
                i.odasayisi AS "odaSayisi",
                i.metrekare, i.banyo, i.aciklama,
                COALESCE(json_agg(r.resim_url) FILTER (WHERE r.id IS NOT NULL), '[]') as resimler
            FROM ilanlar i
            LEFT JOIN resimler r ON i.id = r.ilan_id
            GROUP BY i.id
            ORDER BY i.id DESC
        `);
        res.json(result.rows);
    } catch (err) { 
        console.error("İlanlar getirilirken hata:", err.message);
        res.status(500).send("Sunucu Hatası"); 
    }
});

// POST: Yeni bir ilan ve resimlerini ekle
app.post('/api/ilanlar', requireLogin, upload.array('resimler', 10), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { baslik, fiyat, konum, tip, odaSayisi, metrekare, banyo, aciklama } = req.body;
        const ilanResult = await client.query( "INSERT INTO ilanlar (baslik, fiyat, konum, tip, odaSayisi, metrekare, banyo, aciklama) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id", [baslik, fiyat, konum, tip, odaSayisi, metrekare, banyo, aciklama]);
        const yeniIlanId = ilanResult.rows[0].id;
        if (req.files) {
            for (const file of req.files) {
                const resimUrl = `uploads/${file.filename}`;
                await client.query("INSERT INTO resimler (ilan_id, resim_url) VALUES ($1, $2)", [yeniIlanId, resimUrl]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ id: yeniIlanId, ...req.body });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("İlan eklenirken hata:", err);
        res.status(500).send("Sunucu Hatası");
    } finally {
        client.release();
    }
});

// PUT: Mevcut ilanı güncelle (bu daha sonra geliştirilecek)
app.put('/api/ilanlar/:id', requireLogin, upload.array('resimler', 10), async (req, res) => {
    // Şimdilik sadece metin bilgilerini güncelleyelim. Resim güncelleme daha karmaşık.
    try {
        const { id } = req.params;
        const { baslik, fiyat, konum, tip, odaSayisi, metrekare, banyo, aciklama } = req.body;
        const guncellenenIlan = await pool.query("UPDATE ilanlar SET baslik = $1, fiyat = $2, konum = $3, tip = $4, odaSayisi = $5, metrekare = $6, banyo = $7, aciklama = $8 WHERE id = $9 RETURNING *", [baslik, fiyat, konum, tip, odaSayisi, metrekare, banyo, aciklama, id]);
        // Yeni resimler eklendiyse onları da buraya ekleme mantığı yazılabilir.
        res.json(guncellenenIlan.rows[0]);
    } catch(err) {
        console.error("İlan güncellenirken hata:", err);
        res.status(500).send("Sunucu Hatası");
    }
});


// DELETE: Bir ilanı ve resimlerini sil
app.delete('/api/ilanlar/:id', requireLogin, async (req, res) => {
    try {
        // ON DELETE CASCADE sayesinde sadece ilanı silmemiz yeterli, resimler otomatik silinecek.
        const result = await pool.query("DELETE FROM ilanlar WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Silinecek ilan bulunamadı' });
        }
        res.sendStatus(204);
    } catch (err) { res.status(500).send("Sunucu Hatası"); }
});

app.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} adresinde başlatıldı.`));