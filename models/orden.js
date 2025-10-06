// models/orden.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrdenItemSchema = new Schema({
  producto:  { type: Schema.Types.ObjectId, ref: 'Comidas', required: true },
  nombre:    { type: String, required: true },
  precio:    { type: Number, required: true, min: 0 },
  imagen:    { type: String, default: null },
  categoria: { type: String, default: null },
  cantidad:  { type: Number, required: true, min: 1 }
}, { _id: true });

const OrdenSchema = new Schema({
  user: { type: String, required: true, index: true },

  items:   { type: [OrdenItemSchema], required: true },
  entrega: {
    modo: { type: String, enum: ['retiro','delivery'], default: 'retiro' },
    direccion: { type: String, default: null },
    notas: { type: String, default: null }
  },

  totales: {
    subtotal:   { type: Number, required: true },
    descuentos: { type: Number, required: true },
    delivery:   { type: Number, required: true },
    total:      { type: Number, required: true }
  },

  estado: { type: String, enum: ['creada','pagada','cancelada'], default: 'creada', index: true },
  pago: {
    metodo: { type: String, default: 'simulado' },
    estado: { type: String, enum: ['pendiente','aprobado','rechazado'], default: 'pendiente' },
    transaccionId: { type: String, default: null },
    pagadaEn: { type: Date, default: null }
  },

  numero: { type: String, unique: true } // p.ej. ORD-YYYYMMDD-00001
}, { collection: 'Ordenes', timestamps: true });

module.exports = mongoose.model('Orden', OrdenSchema);
