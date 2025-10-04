// routes/carritoRoutes.js
const { Router } = require('express');
const mongoose = require('mongoose');
const Carrito = require('../models/carrito');
const Comida  = require('../models/comida'); // tu modelo de productos

const router = Router();
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


async function getOrCreateCart(userId) {
  return Carrito.findOneAndUpdate(
    { user: String(userId) },
    { $setOnInsert: { user: String(userId), items: [], entrega: { modo: 'retiro' } } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}
const DELIVERY_MIN_FREE = Number(process.env.DELIVERY_MIN_FREE || 12000);
const DELIVERY_FEE      = Number(process.env.DELIVERY_FEE || 1200);

function computeTotals(items = [], entregaModo = 'retiro') {
    const subtotal   = items.reduce((a, it) => a + it.precio * it.cantidad, 0);
  const descuentos = 0; // + tus promos si corresponde
  const base       = subtotal - descuentos;
  const delivery   = entregaModo === 'delivery' && base < DELIVERY_MIN_FREE ? DELIVERY_FEE : 0;
  const total      = base + delivery;

  // 👇 NUEVO: enviamos umbral y fee al front
  return { subtotal, descuentos, delivery, total,
           meta: { deliveryMinFree: DELIVERY_MIN_FREE, deliveryFee: DELIVERY_FEE } };
}


// GET /api/carrito/:userId  -> devuelve carrito + totales
router.get('/:userId', asyncH(async (req, res) => {
  const cart = await getOrCreateCart(req.params.userId);

  const subtotal = cart.items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const descuentos = 0; // acá luego podemos aplicar reglas de promo
  const total = subtotal - descuentos;

  res.json({
    user: cart.user,
    entrega: cart.entrega,
    items: cart.items,
    totales: computeTotals(cart.items, cart.entrega?.modo || 'retiro') // <- aquí
  });
}));

// POST /api/carrito/:userId/items  { productoId, cantidad }
router.post('/:userId/items', asyncH(async (req, res) => {
  const { productoId, cantidad } = req.body;
  const qty = Number(cantidad ?? 1);
  if (!mongoose.Types.ObjectId.isValid(productoId) || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Datos inválidos: productoId y cantidad (>0) requeridos' });
  }

  // Validar que el producto existe y está disponible
  const prod = await Comida.findById(productoId).lean();
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
  if (prod.disponible === false || (typeof prod.stock === 'number' && prod.stock <= 0)) {
    return res.status(409).json({ error: 'Producto sin stock o no disponible' });
  }

  const cart = await getOrCreateCart(req.params.userId);

  // Si ya existe en el carrito, incrementar cantidad; si no, agregar ítem nuevo
  const idx = cart.items.findIndex(it => String(it.producto) === String(prod._id));
  if (idx >= 0) {
    cart.items[idx].cantidad += qty;
  } else {
    cart.items.push({
      producto: prod._id,
      nombre:   prod.nombre,
      precio:   prod.precio,
      imagen:   prod.imagen || null,
      cantidad: qty
    });
  }

  await cart.save();
  res.status(201).json(cart);
}));

// PATCH /api/carrito/:userId/items/:itemId  { cantidad }
router.patch('/:userId/items/:itemId', asyncH(async (req, res) => {
  const { itemId } = req.params;
  const qty = Number(req.body.cantidad);
  if (!Number.isInteger(qty)) return res.status(400).json({ error: 'cantidad debe ser entero' });

  const cart = await getOrCreateCart(req.params.userId);
  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado en el carrito' });

  if (qty <= 0) {
    item.deleteOne(); // si ponen 0 o negativo, lo quitamos
  } else {
    item.cantidad = qty;
  }

  await cart.save();
  res.json(cart);
}));

// DELETE /api/carrito/:userId/items/:itemId  -> quitar ítem
router.delete('/:userId/items/:itemId', asyncH(async (req, res) => {
  const cart = await getOrCreateCart(req.params.userId);
  const item = cart.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Ítem no encontrado en el carrito' });

  item.deleteOne();
  await cart.save();
  res.json(cart);
}));

// DELETE /api/carrito/:userId  -> vaciar carrito
router.delete('/:userId', asyncH(async (req, res) => {
  const cart = await getOrCreateCart(req.params.userId);
  cart.items = [];
  await cart.save();
  res.json(cart);
}));

// PATCH /api/carrito/:userId/entrega  { modo: 'retiro' | 'delivery' }
router.patch('/:userId/entrega', asyncH(async (req, res) => {
  const { modo } = req.body;
  if (!['retiro', 'delivery'].includes(String(modo))) {
    return res.status(400).json({ error: 'modo debe ser "retiro" o "delivery"' });
  }
  const cart = await getOrCreateCart(req.params.userId);
  cart.entrega.modo = modo;
  await cart.save();
  res.json(cart);
}));
// POST /api/carrito/merge  { fromUserId, toUserId, strategy? }
router.post('/merge', asyncH(async (req, res) => {
  const { fromUserId, toUserId, strategy = 'sum' } = req.body || {};
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'fromUserId y toUserId son requeridos' });
  }
  if (String(fromUserId) === String(toUserId)) {
    return res.status(400).json({ error: 'fromUserId y toUserId no pueden ser iguales' });
  }

  const fromCart = await Carrito.findOne({ user: String(fromUserId) });
  const toCart   = await getOrCreateCart(String(toUserId));

  // Si el carrito origen no existe o está vacío, no hay nada que mergear
  if (!fromCart || !Array.isArray(fromCart.items) || fromCart.items.length === 0) {
    return res.json({
      mergedFrom: fromUserId,
      target: toCart.user,
      items: toCart.items,
      totales: {
        subtotal: toCart.items.reduce((a, it) => a + it.precio * it.cantidad, 0),
        descuentos: 0,
        total: toCart.items.reduce((a, it) => a + it.precio * it.cantidad, 0)
      }
    });
  }

  // Unir por producto (mismo ObjectId)
  const byProducto = new Map();
  // Primero, items del carrito destino
  toCart.items.forEach(it => byProducto.set(String(it.producto), it));

  // Luego, sumamos los del carrito origen
  for (const src of fromCart.items) {
    const key = String(src.producto);
    if (byProducto.has(key)) {
      const dst = byProducto.get(key);
      if (strategy === 'sum') {
        dst.cantidad += src.cantidad;
      } else if (strategy === 'prefer-dest') {
        // no cambiamos nada
      } else if (strategy === 'prefer-src') {
        dst.cantidad = src.cantidad;
      } else {
        // default: sum
        dst.cantidad += src.cantidad;
      }
    } else {
      // si no existe en destino, empujamos el snapshot del origen
      toCart.items.push({
        producto: src.producto,
        nombre:   src.nombre,
        precio:   src.precio,
        imagen:   src.imagen || null,
        cantidad: src.cantidad
      });
    }
  }

  await toCart.save();

  // Vaciar/eliminar el carrito origen
  fromCart.items = [];
  await fromCart.save();

  const subtotal = toCart.items.reduce((a, it) => a + it.precio * it.cantidad, 0);
  res.json({
    mergedFrom: fromUserId,
    target: toCart.user,
    items: toCart.items,
    totales: { subtotal, descuentos: 0, total: subtotal }
  });
}));


module.exports = router;
