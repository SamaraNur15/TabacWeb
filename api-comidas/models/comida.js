// models/Comida.js
const mongoose = require('mongoose');

const slugify = (str = '') =>
  str.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const ComidasSchema = new mongoose.Schema(
  {
    // id público (además del _id de Mongo)
    id: { type: String, unique: true, sparse: true, index: true },

    codigo: { type: String, unique: true, sparse: true, index: true }, // SKU
    nombre: { type: String, required: true, trim: true },
    url_amigable: { type: String, unique: true, sparse: true, index: true },
    categoria: { type: String, required: true, enum: ['dulce', 'salado'], index: true },

    imagen: { type: String, default: null },
    precio: { type: Number, required: true, min: 0 },
    moneda: { type: String, default: 'ARS' },
    precio_anterior: { type: Number, default: null, min: 0 },
    porcentaje_descuento: { type: Number, default: null, min: 0, max: 100 },

    descripcion: { type: String, default: '' },
    unidad: { type: String, default: 'porción' },

    apto_vegetariano: { type: Boolean, default: false },
    picante: { type: Boolean, default: false },
    alergenos: { type: [String], default: [] },
    etiquetas: { type: [String], default: [] },

    stock: { type: Number, default: 0, min: 0 },
    disponible: { type: Boolean, default: true },
    tiempo_preparacion_min: { type: Number, default: 0, min: 0 },

    calificacion: { type: Number, default: null, min: 0, max: 5 },
    cantidad_resenas: { type: Number, default: 0, min: 0 },

    entrega: {
      retiro_en_local: { type: Boolean, default: true },
      envio_a_domicilio: { type: Boolean, default: true }
    }
  },
  {
    collection: 'Comidas',  
    timestamps: {
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    }
  }
);

// Autocompletados y cálculos
ComidasSchema.pre('validate', function (next) {
  if (!this.url_amigable && this.nombre) {
    this.url_amigable = slugify(this.nombre);
  }
  if (!this.codigo && this.nombre) {
    const letters = this.nombre.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
    const num = Math.floor(100 + Math.random() * 900);
    this.codigo = `TAB-${letters}-${num}`;
  }
  if (!this.id && this.nombre) {
    const rand = Math.random().toString(36).slice(2, 8);
    this.id = `prod_${slugify(this.nombre)}_${rand}`;
  }
  if (this.precio_anterior != null && this.precio_anterior > 0 && this.precio >= 0) {
    const pct = Math.round((1 - this.precio / this.precio_anterior) * 100);
    this.porcentaje_descuento = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : null;
  }
  next();
});

module.exports = mongoose.model('Comidas', ComidasSchema);
