import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

const app = express();

// Configuración de CORS robusta para Producción (Vercel)
app.use(cors({
  origin: ['https://margarita-viajes.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Manejo explícito de preflight OPTIONS

app.use(express.json({ limit: '50mb' }));

app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// FunciÃ³n para leer la "base de datos" (archivo JSON)
async function readDB() {
    const defaultDB = {
        hotels: [],
        transfers: [],
        quotes: [],
        reservations: [],
        operations: [],
        users: [],
        config: {}
    };
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return { ...defaultDB, ...parsed };
    } catch (e) {
        return defaultDB;
    }
}

// FunciÃ³n para escribir en la "base de datos"
async function writeDB(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
        console.log("ðŸ’¾ Base de datos guardada correctamente en:", DB_PATH);
    } catch (e) {
        console.error("âŒ Error escribiendo db.json:", e);
    }
}

// --- HOTELES ---
app.get('/api/hotels', async (req, res) => {
    const db = await readDB();
    res.json(db.hotels || []);
});

app.post('/api/admin/hotels', async (req, res) => {
    console.log("ðŸ“¥ Recibido POST hotel:", JSON.stringify(req.body, null, 2).substring(0, 200) + "...");
    const db = await readDB();
    const newHotel = req.body;
    db.hotels.push(newHotel);
    await writeDB(db);
    res.status(201).json(newHotel);
});

app.put('/api/admin/hotels/:id', async (req, res) => {
    console.log("ðŸ“¥ Recibido PUT hotel:", req.params.id);
    const db = await readDB();
    const index = db.hotels.findIndex(h => h.id === req.params.id);
    if (index !== -1) {
        db.hotels[index] = { ...db.hotels[index], ...req.body };
        await writeDB(db);
        res.json(db.hotels[index]);
    } else {
        res.status(404).json({ error: 'Hotel no encontrado' });
    }
});

app.delete('/api/admin/hotels/:id', async (req, res) => {
    const db = await readDB();
    db.hotels = db.hotels.filter(h => h.id !== req.params.id);
    await writeDB(db);
    res.json({ message: 'Hotel eliminado' });
});

// --- TRASLADOS ---
app.get('/api/transfers', async (req, res) => {
    const db = await readDB();
    res.json(db.transfers || []);
});

app.post('/api/admin/transfers', async (req, res) => {
    const db = await readDB();
    const newTransfer = req.body;
    db.transfers.push(newTransfer);
    await writeDB(db);
    res.status(201).json(newTransfer);
});

app.put('/api/admin/transfers/:id', async (req, res) => {
    const db = await readDB();
    const index = db.transfers.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        db.transfers[index] = { ...db.transfers[index], ...req.body };
        await writeDB(db);
        res.json(db.transfers[index]);
    } else {
        res.status(404).json({ error: 'Traslado no encontrado' });
    }
});

app.delete('/api/admin/transfers/:id', async (req, res) => {
    const db = await readDB();
    db.transfers = db.transfers.filter(t => t.id !== req.params.id);
    await writeDB(db);
    res.json({ message: 'Traslado eliminado' });
});

// --- COTIZACIONES ---
app.get('/api/admin/quotes', async (req, res) => {
    const db = await readDB();
    res.json(db.quotes || []);
});

app.post('/api/quotes', async (req, res) => {
    const db = await readDB();
    const newQuote = req.body;
    db.quotes.push(newQuote);
    await writeDB(db);
    res.status(201).json(newQuote);
});

app.put('/api/admin/quotes/:id', async (req, res) => {
    const db = await readDB();
    const index = db.quotes.findIndex(q => String(q.id) === String(req.params.id));
    if (index !== -1) {
        db.quotes[index] = { ...db.quotes[index], ...req.body };
        await writeDB(db);
        res.json(db.quotes[index]);
    } else {
        res.status(404).json({ error: 'CotizaciÃ³n no encontrada' });
    }
});

// --- RESERVAS ---
app.get('/api/admin/reservations', async (req, res) => {
    const db = await readDB();
    res.json(db.reservations || []);
});

app.post('/api/admin/reservations', async (req, res) => {
    console.log("ðŸ“¥ Recibido POST reserva:", req.body.quoteId);
    const db = await readDB();
    const newRes = req.body;
    db.reservations.push(newRes);
    await writeDB(db);
    res.status(201).json(newRes);
});

app.put('/api/admin/reservations/:id', async (req, res) => {
    const db = await readDB();
    const index = db.reservations.findIndex(r => String(r.id) === String(req.params.id));
    if (index !== -1) {
        db.reservations[index] = { ...db.reservations[index], ...req.body };
        await writeDB(db);
        res.json(db.reservations[index]);
    } else {
        res.status(404).json({ error: 'Reserva no encontrada' });
    }
});

// --- OPERACIONES (VENTAS) ---
app.get('/api/admin/operations', async (req, res) => {
    const db = await readDB();
    res.json(db.operations || []);
});

app.post('/api/admin/operations', async (req, res) => {
    const db = await readDB();
    const newOp = req.body;
    db.operations.push(newOp);
    await writeDB(db);
    res.status(201).json(newOp);
});

// Auxiliar para obtener el siguiente ID secuencial de operaciÃ³n
app.get('/api/admin/operation', async (req, res) => {
    const db = await readDB();
    const nextNum = (db.operations.length + 1) + 10000; // Offset simple
    res.json({ nextId: `V${String(nextNum).padStart(10, '0')}` });
});

// --- USUARIOS ---
app.get('/api/admin/users', async (req, res) => {
    const db = await readDB();
    res.json(db.users || []);
});

app.post('/api/admin/users', async (req, res) => {
    const db = await readDB();
    const newUser = { ...req.body, id: Date.now().toString() };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    await writeDB(db);
    res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', async (req, res) => {
    const db = await readDB();
    const index = db.users.findIndex(u => u.id === req.params.id);
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...req.body };
        await writeDB(db);
        res.json(db.users[index]);
    } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const db = await readDB();
    db.users = db.users.filter(u => u.id !== req.params.id);
    await writeDB(db);
    res.json({ message: 'Usuario eliminado' });
});

// --- AUTENTICACIÃ“N ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({
            token: 'mock-staff-token-123',
            user: { username: 'admin', role: 'LEVEL_1' }
        });
    } else {
        res.status(401).json({ error: 'Usuario o contraseÃ±a incorrectos' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { alias, password } = req.body;
    const db = await readDB();
    
    // Usuario maestro siempre disponible (o si no hay usuarios)
    if (alias === 'admin' || alias === 'admin@margaritaviajes.com' || !db.users || db.users.length === 0) {
        if ((alias === 'admin@margaritaviajes.com' || alias === 'admin') && password === 'admin123') {
            return res.json({
                token: 'master-token-xyz',
                user: { 
                    id: 'master', 
                    name: 'Administrador Maestro', 
                    alias: 'admin',
                    level: 1,
                    modules: { 
                        inventory: true, quotes: true, bookings: true, operations: true, 
                        users: true, customers: true, marketing: true, webconfig: true 
                    }
                }
            });
        }
    }

    const user = db.users?.find(u => 
        (u.alias === alias || u.email === alias) && 
        (u.password === password || (!u.password && password === 'admin123'))
    );

    if (user && user.status !== false) {
        res.json({
            token: `token-${user.id}`,
            user: { id: user.id, name: user.name, alias: user.alias, email: user.email }
        });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo' });
    }
});

// Endpoint para tracking de conexiÃ³n
app.put('/api/admin/users/:id/track-connection', async (req, res) => {
    const { hours } = req.body;
    const { id } = req.params;
    const db = await readDB();
    const userIndex = db.users?.findIndex(u => u.id === id);

    if (userIndex !== -1 && db.users) {
        const today = new Date().toISOString().split('T')[0];
        const user = db.users[userIndex];
        
        if (!user.connectionLogs) user.connectionLogs = [];
        
        const logIndex = user.connectionLogs.findIndex(l => l.date === today);
        if (logIndex !== -1) {
            user.connectionLogs[logIndex].connectedHours = (user.connectionLogs[logIndex].connectedHours || 0) + hours;
        } else {
            user.connectionLogs.push({ date: today, connectedHours: hours });
        }
        
        await writeDB(db);
        res.json({ success: true, logs: user.connectionLogs });
    } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

// --- CONFIGURACIÃ“N ---
app.get('/api/config', async (req, res) => {
    const db = await readDB();
    res.json(db.config || {});
});

app.get('/api/admin/config', async (req, res) => {
    const db = await readDB();
    res.json(db.config || {});
});

app.post('/api/admin/config', async (req, res) => {
    const db = await readDB();
    db.config = req.body;
    await writeDB(db);
    res.json({ message: 'ConfiguraciÃ³n guardada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`ðŸš€ Servidor Margarita Viajes encendido`);
    console.log(`ðŸ“ Ruta: http://localhost:${PORT}`);
    console.log(`ðŸ“‚ Persistencia: ${DB_PATH}`);
});
