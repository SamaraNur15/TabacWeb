const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

// Conexión a MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

const path = require('path');

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));


// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Rutas
const comidaRoutes = require('./routes/comidaRoutes'); // <- nombre correcto
app.use('/api/comidas', comidaRoutes);                 // <- montar el router acá

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API Tabac Web funcionando 🚀');
});

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 Servidor corriendo en http://localhost:${PORT}`);
});
