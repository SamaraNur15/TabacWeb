const express = require('express');
const cors = require('cors');
const path = require('path');
// lee el .env que está al lado de app.js, sin importar desde dónde ejecutes node
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('DEBUG ENV MONGO_URI:', process.env.MONGO_URI);
console.log('DEBUG ENV MONGO_DB:', process.env.MONGO_DB);
const connectDB = require('./config/database');

const app = express();

// Conexión a MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());



// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));


// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'carta.html'));
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
