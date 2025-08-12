// config/database.js
const mongoose = require('mongoose');
require('dotenv').config(); // opcional si ya lo cargas en app.js

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;          // ej: mongodb://localhost:27017
    const dbName = process.env.MONGO_DB || 'tabacweb';

    if (!uri) {
      console.error('❌ Falta la variable de entorno MONGO_URI');
      process.exit(1);
    }

    // En Mongoose 7+ no hace falta useNewUrlParser / useUnifiedTopology
    await mongoose.connect(uri, { dbName });

    console.log(`✅ Conectado a MongoDB (DB: ${dbName})`);
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1); // Termina el proceso si no se puede conectar
  }

  // Logs útiles (opcional)
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Desconectado de MongoDB');
  });
  const db = mongoose.connection.db;
  console.log('DB actual =>', db.databaseName);
  db.collection('Comidas').countDocuments().then(n => console.log('Comidas docs =>', n));
};

module.exports = connectDB;
