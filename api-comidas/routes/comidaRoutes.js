const { Router } = require('express');
const mongoose = require('mongoose');
const Comida = require('../models/comida'); // <- coincide con el archivo "Comida.js"

const router = Router();

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET todas (con ?categoria=)
router.get('/', asyncH(async (req, res) => {
  const { categoria } = req.query;
  const filter = {};
  if (categoria) filter.categoria = String(categoria).toLowerCase();
  const items = await Comida.find(filter).lean();
  res.json(items);
}));

// GET por categoría
router.get('/categoria/:cat', asyncH(async (req, res) => {
  const cat = String(req.params.cat).toLowerCase();
  if (!['dulce', 'salado'].includes(cat)) {
    return res.status(400).json({ error: 'Categoría inválida. Usa "dulce" o "salado".' });
  }
  const items = await Comida.find({ categoria: cat }).lean();
  res.json(items);
}));

// GET uno (por _id / id / codigo / url_amigable)
router.get('/:id', asyncH(async (req, res) => {
  const key = req.params.id;
  let item = null;

  if (mongoose.Types.ObjectId.isValid(key)) {
    item = await Comida.findById(key).lean();
  }
  if (!item) {
    item = await Comida.findOne({ $or: [{ id: key }, { codigo: key }, { url_amigable: key }] }).lean();
  }

  if (!item) return res.status(404).json({ error: 'Comida no encontrada' });
  res.json(item);
}));

// POST crear
router.post('/', asyncH(async (req, res) => {
  const payload = { ...req.body };

  if (!payload.nombre || !payload.categoria || typeof payload.precio !== 'number') {
    return res.status(400).json({
      error: 'Campos requeridos: nombre (string), categoria ("dulce"|"salado"), precio (number)'
    });
  }
  payload.categoria = String(payload.categoria).toLowerCase();
  if (!['dulce', 'salado'].includes(payload.categoria)) {
    return res.status(400).json({ error: 'categoria debe ser "dulce" o "salado"' });
  }

  const created = await Comida.create(payload);
  res.status(201).json(created);
}));

// PUT actualizar
router.put('/:id', asyncH(async (req, res) => {
  const key = req.params.id;

  let doc = null;
  if (mongoose.Types.ObjectId.isValid(key)) {
    doc = await Comida.findById(key);
  }
  if (!doc) {
    doc = await Comida.findOne({ $or: [{ id: key }, { codigo: key }, { url_amigable: key }] });
  }
  if (!doc) return res.status(404).json({ error: 'Comida no encontrada' });

  const allowed = [
    'id','codigo','nombre','url_amigable','categoria','imagen','precio','moneda',
    'precio_anterior','porcentaje_descuento','descripcion','unidad','apto_vegetariano',
    'picante','alergenos','etiquetas','stock','disponible','tiempo_preparacion_min',
    'calificacion','cantidad_resenas','entrega'
  ];
  for (const k of allowed) if (k in req.body) doc[k] = req.body[k];

  if (doc.categoria && !['dulce', 'salado'].includes(String(doc.categoria).toLowerCase())) {
    return res.status(400).json({ error: 'categoria debe ser "dulce" o "salado"' });
  }

  await doc.save();
  res.json(doc);
}));

// DELETE borrar
router.delete('/:id', asyncH(async (req, res) => {
  const key = req.params.id;

  let doc = null;
  if (mongoose.Types.ObjectId.isValid(key)) {
    doc = await Comida.findById(key);
  }
  if (!doc) {
    doc = await Comida.findOne({ $or: [{ id: key }, { codigo: key }, { url_amigable: key }] });
  }
  if (!doc) return res.status(404).json({ error: 'Comida no encontrada' });

  await doc.deleteOne();
  res.json({ eliminada: doc._id, id_publico: doc.id, codigo: doc.codigo });
}));

module.exports = router;
