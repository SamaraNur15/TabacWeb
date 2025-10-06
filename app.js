const express = require('express');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();

// Middlewares para leer JSON y formularios URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch(err => console.error("❌ Error al conectar MongoDB:", err));

// Rutas de API
const authRoutes = require('./routes/authRoutes');
const comidaRoutes = require('./routes/comidaRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pagoRoutes = require('./routes/pagoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/comidas', comidaRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pagos', pagoRoutes);
    
// Página inicial (productos)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'productos.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));