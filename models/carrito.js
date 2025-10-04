// models/carrito.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Item del carrito. Guardamos un "snapshot" del producto (nombre, precio, imagen)
 * para calcular totales aun si luego cambia el precio en la base.
 */
const ItemSchema = new Schema({
  producto: { type: Schema.Types.ObjectId, ref: 'Comidas', required: true }, // <- ref a tu modelo de comidas
  nombre:   { type: String, required: true },
  precio:   { type: Number, required: true, min: 0 },
  imagen:   { type: String, default: null },
  categoria:{ type: String, default: null }, // <- para reglas/promo
  cantidad: { type: Number, required: true, min: 1 }
}, { _id: true });

const CarritoSchema = new Schema({
  // Si tenés auth, podés usar el _id del usuario. Si no, usá un pseudo-id (ej: "anon-123").
  user:  { type: String, required: true, index: true, unique: true },
  items: { type: [ItemSchema], default: [] },
  entrega: {
    modo: { type: String, enum: ['retiro', 'delivery'], default: 'retiro' }
  }
}, {
  collection: 'Carritos',
  timestamps: true
});

module.exports = mongoose.model('Carrito', CarritoSchema);
