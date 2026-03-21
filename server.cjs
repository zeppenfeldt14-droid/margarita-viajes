const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const SECRET_KEY = "margarita_viajes_secret_key_2024";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error leyendo data.json:", err);
  }
  return {
    hotels: [],
    transfers: [],
    quotes: [],
    reservations: [],
    config: {},
    users: []
  };
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Error escribiendo data.json:", err);
    return false;
  }
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.post("/api/auth/login", (req, res) => {
  const { alias, password, username } = req.body;
  const loginName = alias || username;
  
  const data = readData();
  const user = data.users?.find(u => (u.alias === loginName || u.username === loginName) && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username || user.alias }, SECRET_KEY, { expiresIn: "24h" });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      username: user.username || user.alias, 
      name: user.name || user.username || user.alias,
      level: user.level || 3,
      modules: user.modules || {}
    } 
  });
});

app.get("/api/hotels", (req, res) => {
  const data = readData();
  res.json(data.hotels || []);
});

app.get("/api/hotels/:id", (req, res) => {
  const data = readData();
  const hotel = data.hotels?.find(h => h.id === req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  res.json(hotel);
});

app.post("/api/hotels", authenticate, (req, res) => {
  const data = readData();
  const newHotel = { ...req.body };
  
  if (!newHotel.id) {
    newHotel.id = require("crypto").randomUUID();
  }
  
  if (!data.hotels) data.hotels = [];
  data.hotels.push(newHotel);
  
  if (writeData(data)) {
    res.status(201).json(newHotel);
  } else {
    res.status(500).json({ error: "Error al guardar hotel" });
  }
});

app.put("/api/hotels/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.hotels?.findIndex(h => h.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Hotel no encontrado" });
  }
  
  data.hotels[index] = { ...data.hotels[index], ...req.body };
  
  if (writeData(data)) {
    res.json(data.hotels[index]);
  } else {
    res.status(500).json({ error: "Error al actualizar hotel" });
  }
});

app.delete("/api/hotels/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.hotels?.findIndex(h => h.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Hotel no encontrado" });
  }
  
  data.hotels.splice(index, 1);
  
  if (writeData(data)) {
    res.json({ message: "Hotel eliminado" });
  } else {
    res.status(500).json({ error: "Error al eliminar hotel" });
  }
});

app.get("/api/transfers", (req, res) => {
  const data = readData();
  res.json(data.transfers || []);
});

app.get("/api/transfers/:id", authenticate, (req, res) => {
  const data = readData();
  const transfer = data.transfers?.find(t => t.id === req.params.id);
  if (!transfer) return res.status(404).json({ error: "Transfer no encontrado" });
  res.json(transfer);
});

app.post("/api/transfers", authenticate, (req, res) => {
  const data = readData();
  const newTransfer = { ...req.body };
  
  if (!newTransfer.id) {
    newTransfer.id = require("crypto").randomUUID();
  }
  
  if (!data.transfers) data.transfers = [];
  data.transfers.push(newTransfer);
  
  if (writeData(data)) {
    res.status(201).json(newTransfer);
  } else {
    res.status(500).json({ error: "Error al guardar transfer" });
  }
});

app.put("/api/transfers/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.transfers?.findIndex(t => t.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Transfer no encontrado" });
  }
  
  data.transfers[index] = { ...data.transfers[index], ...req.body };
  
  if (writeData(data)) {
    res.json(data.transfers[index]);
  } else {
    res.status(500).json({ error: "Error al actualizar transfer" });
  }
});

app.delete("/api/transfers/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.transfers?.findIndex(t => t.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Transfer no encontrado" });
  }
  
  data.transfers.splice(index, 1);
  
  if (writeData(data)) {
    res.json({ message: "Transfer eliminado" });
  } else {
    res.status(500).json({ error: "Error al eliminar transfer" });
  }
});

app.get("/api/config", (req, res) => {
  const data = readData();
  res.json(data.config || {});
});

app.get("/api/admin/config", authenticate, (req, res) => {
  const data = readData();
  res.json(data.config || {});
});

app.post("/api/admin/config", authenticate, (req, res) => {
  const data = readData();
  
  if (!data.config) data.config = {};
  // Accept the full config object and merge it
  data.config = { ...data.config, ...req.body };
  
  if (writeData(data)) {
    res.json(data.config);
  } else {
    res.status(500).json({ error: "Error al guardar configuración" });
  }
});

app.get("/api/admin/quotes", authenticate, (req, res) => {
  const data = readData();
  res.json(data.quotes || []);
});

app.post("/api/quotes/calculate", (req, res) => {
  const { roomId, checkIn, checkOut, pax, hotelType, transferId } = req.body;
  
  const data = readData();
  const hotels = data.hotels || [];
  const transfers = data.transfers || [];
  
  let foundHotel = null;
  let foundRoom = null;
  let foundSeason = null;
  
  for (const hotel of hotels) {
    const room = hotel.rooms?.find(r => r.id === roomId);
    if (room) {
      foundHotel = hotel;
      foundRoom = room;
      
      const checkInDate = new Date(checkIn);
      foundSeason = hotel.seasons?.find(s => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        return checkInDate >= start && checkInDate <= end;
      });
      
      break;
    }
  }
  
  if (!foundHotel || !foundRoom) {
    return res.status(404).json({ error: "Habitación no encontrada" });
  }
  
  if (!foundSeason) {
    return res.status(400).json({ error: "No hay temporada configurada para estas fechas" });
  }
  
  let totalAmount = 0;
  let pricePerUnit = 0;
  let nights = 1;
  
  if (hotelType === 'full-day' || hotelType === 'package') {
    pricePerUnit = foundSeason.roomPrices[foundRoom.id] || 0;
    totalAmount = pricePerUnit * parseInt(pax || 1);
  } else {
    pricePerUnit = foundSeason.roomPrices[foundRoom.id] || 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut || checkIn);
    nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    totalAmount = pricePerUnit * nights * parseInt(pax || 1);
  }
  
  let transferPrice = 0;
  if (transferId) {
    const transfer = transfers.find(t => t.id === transferId);
    if (transfer) {
      transferPrice = transfer.salePrice || 0;
      totalAmount += transferPrice;
    }
  }
  
  res.json({
    roomId,
    hotelId: foundHotel.id,
    hotelName: foundHotel.name,
    roomName: foundRoom.name,
    season: foundSeason.type,
    pricePerUnit,
    nights,
    pax: parseInt(pax || 1),
    transferPrice,
    totalAmount
  });
});

app.post("/api/quotes", (req, res) => {
  const data = readData();
  
  const { originalQuoteId } = req.body;
  
  let newId;
  if (originalQuoteId) {
    newId = `${originalQuoteId}-01`;
  } else {
    const lastQuote = data.quotes?.[data.quotes.length - 1];
    let nextNum = 10001;
    if (lastQuote && typeof lastQuote.id === 'string') {
      const match = lastQuote.id.match(/^C(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    newId = `C${nextNum}`;
  }
  
  const newQuote = { 
    ...req.body,
    id: newId,
    originalQuoteId: originalQuoteId || null,
    discount: req.body.discount || null,
    discountAmount: req.body.discountAmount || null,
    finalAmount: req.body.finalAmount || null,
    date: new Date().toISOString().split("T")[0],
    status: "Nuevo"
  };
  
  if (!data.quotes) data.quotes = [];
  data.quotes.push(newQuote);
  
  if (writeData(data)) {
    res.status(201).json(newQuote);
  } else {
    res.status(500).json({ error: "Error al guardar cotización" });
  }
});

app.put("/api/admin/quotes/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.quotes?.findIndex(q => q.id == req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Cotización no encontrada" });
  }
  
  data.quotes[index] = { ...data.quotes[index], ...req.body };
  
  if (writeData(data)) {
    res.json(data.quotes[index]);
  } else {
    res.status(500).json({ error: "Error al actualizar cotización" });
  }
});

app.post("/api/admin/reservations", authenticate, (req, res) => {
  const { quoteId, clientName, email, whatsapp, hotelId, hotelName, checkIn, checkOut, roomType, pax, children, infants, totalAmount, status } = req.body;
  const data = readData();
  
  const lastRes = data.reservations?.[data.reservations.length - 1];
  let nextNum = 10001;
  if (lastRes && typeof lastRes.quoteId === 'string') {
    const match = lastRes.quoteId.match(/^V(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1]) + 1;
    }
  }
  
  const finalQuoteId = quoteId ? quoteId.replace(/^V/, 'C') : `C${nextNum}`;
  const finalVId = `V${nextNum}`;
  
  const newReservation = {
    id: require("crypto").randomUUID(),
    quoteId: finalVId,
    originalQuoteId: finalQuoteId,
    clientName,
    email,
    whatsapp,
    hotelId,
    hotelName,
    checkIn,
    checkOut,
    roomType,
    pax,
    children: children || 0,
    infants: infants || 0,
    totalAmount,
    status: status || 'Confirmada',
    createdAt: new Date().toISOString()
  };
  
  if (!data.reservations) data.reservations = [];
  data.reservations.push(newReservation);
  
  if (writeData(data)) {
    res.status(201).json(newReservation);
  } else {
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

app.get("/api/admin/reservations", authenticate, (req, res) => {
  const data = readData();
  res.json(data.reservations || []);
});

app.put("/api/admin/reservations/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.reservations?.findIndex(r => r.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }
  
  data.reservations[index] = { ...data.reservations[index], ...req.body };
  
  if (writeData(data)) {
    res.json(data.reservations[index]);
  } else {
    res.status(500).json({ error: "Error al actualizar reserva" });
  }
});

app.post("/api/admin/operations", authenticate, (req, res) => {
  const { quoteId, clientName, email, whatsapp, hotelId, hotelName, checkIn, checkOut, roomType, pax, children, infants, totalAmount, companions, technicalSheet, status } = req.body;
  const data = readData();
  
  const lastOp = data.operations?.[data.operations.length - 1];
  let nextNum = 10001;
  if (lastOp && typeof lastOp.quoteId === 'string') {
    const match = lastOp.quoteId.match(/^V(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1]) + 1;
    }
  }
  
  const finalQuoteId = quoteId ? String(quoteId).replace(/^C/, 'V') : `V${nextNum}`;
  
  const newOperation = {
    id: require("crypto").randomUUID(),
    quoteId: finalQuoteId,
    clientName,
    email,
    whatsapp,
    hotelId,
    hotelName,
    checkIn,
    checkOut,
    roomType,
    pax,
    children: children || 0,
    infants: infants || 0,
    totalAmount,
    companions: companions || [],
    technicalSheet: technicalSheet || {},
    status: status || 'Confirmada',
    createdAt: new Date().toISOString()
  };
  
  if (!data.operations) data.operations = [];
  data.operations.push(newOperation);
  
  if (writeData(data)) {
    res.status(201).json(newOperation);
  } else {
    res.status(500).json({ error: "Error al crear operación" });
  }
});

app.get("/api/admin/operations", authenticate, (req, res) => {
  const data = readData();
  res.json(data.operations || []);
});

app.put("/api/admin/operations/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.operations?.findIndex(o => o.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Operación no encontrada" });
  }
  
  data.operations[index] = { ...data.operations[index], ...req.body };
  
  if (writeData(data)) {
    res.json(data.operations[index]);
  } else {
    res.status(500).json({ error: "Error al actualizar operación" });
  }
});

app.get("/api/admin/users", authenticate, (req, res) => {
  const data = readData();
  res.json(data.users || []);
});

app.post("/api/admin/users", authenticate, (req, res) => {
  const data = readData();
  if (!data.users) data.users = [];
  
  const newUser = {
    ...req.body,
    id: require("crypto").randomUUID(),
    createdAt: new Date().toISOString()
  };

  if (!newUser.username && !newUser.alias) {
    return res.status(400).json({ error: "Username o Alias es requerido" });
  }

  const exists = data.users.find(u => 
    (newUser.username && u.username === newUser.username) || 
    (newUser.alias && u.alias === newUser.alias)
  );
  
  if (exists) {
    return res.status(400).json({ error: "Usuario o Alias ya existe" });
  }
  
  data.users.push(newUser);
  
  if (writeData(data)) {
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } else {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

app.put("/api/admin/users/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.users?.findIndex(u => u.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  
  data.users[index] = { ...data.users[index], ...req.body };
  
  if (writeData(data)) {
    const { password: _, ...userWithoutPassword } = data.users[index];
    res.json(userWithoutPassword);
  } else {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

app.delete("/api/admin/users/:id", authenticate, (req, res) => {
  const data = readData();
  const index = data.users?.findIndex(u => u.id === req.params.id);
  
  if (index === -1 || index === undefined) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  
  data.users.splice(index, 1);
  
  if (writeData(data)) {
    res.json({ message: "Usuario eliminado" });
  } else {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

const defaultData = {
  hotels: [],
  transfers: [],
  quotes: [],
  reservations: [],
  operations: [],
  config: {
    colorFranja: "#ffffff",
    colorTitulo: "#0B132B",
    colorSubtitulo: "#616365",
    colorFuentesSub: "#ea580c"
  },
  users: [
    {
      id: "admin-001",
      username: "admin",
      alias: "admin",
      password: "admin123",
      role: "admin",
      level: 1
    }
  ]
};

if (!fs.existsSync(DATA_FILE)) {
  writeData(defaultData);
  console.log("data.json creado con datos iniciales");
} else {
  // Asegurar que siempre haya un usuario admin si la lista está vacía
  const data = readData();
  if (!data.users || data.users.length === 0) {
    data.users = defaultData.users;
    writeData(data);
    console.log("Se ha restaurado el usuario administrador por defecto");
  }
}

// Route to check recent quotes for duplicate prevention
app.get("/api/quotes/check", async (req, res) => {
  try {
    const { client, hotel, checkIn } = req.query;
    const data = readData();
    const quotes = data.quotes || [];
    const recent = quotes.filter(q => {
      const sameClient = q.clientName?.toLowerCase() === (client || "").toString().toLowerCase();
      const sameHotel = q.hotelName?.toLowerCase() === (hotel || "").toString().toLowerCase();
      const sameDate = q.checkIn === checkIn;
      if (!sameClient || !sameHotel || !sameDate) return false;
      const qDate = new Date(q.date);
      const now = new Date();
      const diffHours = (now - qDate) / (1000 * 60 * 60);
      return diffHours < 24;
    });
    res.json(recent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error checking quotes" });
  }
});

// Route to send email with quote PDF (placeholder implementation)
app.post("/api/email/send", authenticate, async (req, res) => {
  try {
    const { quoteId } = req.body;
    const data = readData();
    const quote = data.quotes?.find(q => q.id === quoteId);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    // Configure transporter (use env vars or fallback to Ethereal)
    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Generate test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    // Simple email content
    const mailOptions = {
      from: "no-reply@margaritaviajes.com",
      to: quote.email,
      subject: `Cotización ${quote.id}`,
      text: `Estimado ${quote.clientName}, adjuntamos su cotización.`
      // attachments could be added here with PDF generation
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    res.json({ message: "Email sent", info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error sending email" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Usando archivo: ${DATA_FILE}`);
});
