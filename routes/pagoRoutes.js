// routes/pagoRoutes.js
const { Router } = require('express');
const Carrito = require('../models/carrito');
const Orden   = require('../models/orden');
const Comida  = require('../models/comida'); 
const crypto = require('crypto');


const router = Router();
const asyncH = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

// Reglas idénticas a las del carrito
const DELIVERY_MIN_FREE = Number(process.env.DELIVERY_MIN_FREE || 12000);
const DELIVERY_FEE      = Number(process.env.DELIVERY_FEE || 1200);
const PREVIEW_TTL_MS = Number(process.env.CHECKOUT_PREVIEW_TTL_MS || 10 * 60 * 1000); // 10 min

// Idempotencia simple en memoria (dev). En prod: Redis/DB.
const IDEM_TTL_MS = Number(process.env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000);
const idemStore = new Map(); // key -> { data, expiresAt }

function normalizeItems(items = []) {
  // Solo lo necesario para firmar: id, precio y cantidad, ordenados
  return items
    .map(it => ({
      producto: String(it.producto),
      precio: Number(it.precio),
      cantidad: Number(it.cantidad)
    }))
    .sort((a, b) => a.producto.localeCompare(b.producto));
}

function buildPreview(items, entregaModo, computeTotals) {
  const totales = computeTotals(items, entregaModo);
  const ts = Date.now();
  const normalized = normalizeItems(items);
  const payload = { items: normalized, entregaModo, totales, ts };
  const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const expiresAt = new Date(ts + PREVIEW_TTL_MS).toISOString();
  return { items, entrega: { modo: entregaModo }, totales, preview: { hash, ts, expiresAt } };
}
function computeTotals(items = [], entregaModo = 'retiro') {
  const subtotal = items.reduce((a, it) => a + it.precio * it.cantidad, 0);

  // (si tenés promos, replicalas aquí; ejemplo 3x2 bebidas lo podés sumar luego)
  const descuentos = 0;

  const base = subtotal - descuentos;
  const delivery = entregaModo === 'delivery' && base < DELIVERY_MIN_FREE ? DELIVERY_FEE : 0;
  const total = base + delivery;

  return { subtotal, descuentos, delivery, total,
           meta: { deliveryMinFree: DELIVERY_MIN_FREE, deliveryFee: DELIVERY_FEE } };
}

async function getOrCreateCart(userId) {
  return Carrito.findOneAndUpdate(
    { user: String(userId) },
    { $setOnInsert: { user: String(userId), items: [], entrega: { modo: 'retiro' } } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function orderNumber(seq = 1) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const da = String(d.getDate()).padStart(2,'0');
  return `ORD-${y}${m}${da}-${String(seq).padStart(5,'0')}`;
}

// POST /api/pagos/checkout/:userId   -> crea Orden desde el carrito
router.post('/checkout/:userId', asyncH(async (req, res) => {
  const userId = String(req.params.userId);
  // 👇 agrega "preview" en el body
  const { direccion=null, notas=null, metodo='simulado', preview } = req.body || {};

  const cart = await getOrCreateCart(userId);
  if (!cart.items.length) return res.status(400).json({ error: 'El carrito está vacío' });

  // snapshot del carrito
  const items = cart.items.map(it => ({
    producto: it.producto, nombre: it.nombre, precio: it.precio,
    imagen: it.imagen || null, categoria: it.categoria || null, cantidad: it.cantidad
  }));

  const entregaModo = cart.entrega?.modo || 'retiro';
  const totales = computeTotals(items, entregaModo);

  // ======== VALIDACIÓN DE PREVIEW (AQUÍ VA EL BLOQUE NUEVO) ========
  if (preview?.hash && preview?.ts) {
    const age = Date.now() - Number(preview.ts);
    if (age > PREVIEW_TTL_MS) {
      // preview vencida -> devolvemos uno fresco
      const fresh = buildPreview(items, entregaModo, computeTotals);
      return res.status(409).json({ error: 'Preview expirada', ...fresh });
    }
    const normalized = normalizeItems(items);
    const expectedHash = crypto.createHash('sha256')
      .update(JSON.stringify({ items: normalized, entregaModo, totales, ts: Number(preview.ts) }))
      .digest('hex');

    if (expectedHash !== preview.hash) {
      // el carrito cambió -> devolvemos preview actualizado
      const fresh = buildPreview(items, entregaModo, computeTotals);
      return res.status(409).json({ error: 'El carrito cambió; vuelve a confirmar', ...fresh });
    }
  }
  // ======== FIN BLOQUE NUEVO ========

  // numeración simple (en prod usar contador dedicado)
  const count = await Orden.countDocuments();
  const numero = orderNumber(count + 1);

  const orden = await Orden.create({
    user: userId,
    items,
    entrega: { modo: entregaModo, direccion, notas },
    totales,
    estado: 'creada',
    pago: { metodo, estado: 'pendiente' },
    numero
  });

  res.status(201).json(orden);
}));

// GET /api/pagos/checkout/:userId/preview
router.get('/checkout/:userId/preview', asyncH(async (req, res) => {
  const userId = String(req.params.userId);
  const cart = await getOrCreateCart(userId);
  if (!cart.items.length) return res.status(400).json({ error: 'El carrito está vacío' });

  // snapshot mínimo
  const items = cart.items.map(it => ({
    producto: it.producto,
    nombre: it.nombre,
    precio: it.precio,
    imagen: it.imagen || null,
    categoria: it.categoria || null,
    cantidad: it.cantidad
  }));

  const entregaModo = cart.entrega?.modo || 'retiro';
  const prev = buildPreview(items, entregaModo, computeTotals);
  res.json(prev);
}));

// ============================================================
// GET /api/pagos/usuario/:userId  -> historial del usuario
// ============================================================
router.get('/usuario/:userId', asyncH(async (req, res) => {
  const list = await Orden.find({ user: String(req.params.userId) })
                          .sort({ createdAt: -1 })
                          .limit(50);
  res.json(list);
}));
// GET /api/pagos/:ordenId/resumen  -> datos mínimos para "Gracias por tu compra"
router.get('/:ordenId/resumen', asyncH(async (req, res) => {
  const ord = await Orden.findById(req.params.ordenId);
  if (!ord) return res.status(404).json({ error: 'Orden no encontrada' });

  const items = (ord.items || []).map(it => ({
    nombre: it.nombre,
    cantidad: it.cantidad,
    precio: it.precio,
    importe: it.precio * it.cantidad
  }));

  res.json({
    numero: ord.numero,
    estado: ord.estado,
    createdAt: ord.createdAt,
    pagadaEn: ord.pago?.pagadaEn || null,
    entrega: { modo: ord.entrega?.modo, direccion: ord.entrega?.direccion || null },
    totales: ord.totales,
    items
  });
}));    
// ============================================================
// GET /api/pagos/:ordenId         -> detalle de la orden
// ============================================================
router.get('/:ordenId', asyncH(async (req, res) => {
  const ord = await Orden.findById(req.params.ordenId);
  if (!ord) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(ord);
}));

// ============================================================
// POST /api/pagos/:ordenId/pagar  -> simula aprobar el pago
// - Verifica stock y descuenta
// - Marca orden como pagada
// - Vacía el carrito del usuario
// ============================================================
router.post('/:ordenId/pagar', asyncH(async (req, res) => {
    const idemKey = req.get('Idempotency-Key');
    if (idemKey) {
    const cached = idemStore.get(idemKey);
    if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.data);
    } else if (cached) {
        idemStore.delete(idemKey); // vencido
    }
    }
  const ord = await Orden.findById(req.params.ordenId);
  if (!ord) return res.status(404).json({ error: 'Orden no encontrada' });
  if (ord.estado === 'pagada') return res.json(ord);
  if (ord.estado === 'cancelada') return res.status(409).json({ error: 'La orden está cancelada' });

  // 1) verificar stock
  for (const it of ord.items) {
    const prod = await Comida.findById(it.producto).lean();
    if (!prod) return res.status(404).json({ error: `Producto no encontrado: ${it.nombre}` });
    if (typeof prod.stock === 'number' && prod.stock < it.cantidad) {
      return res.status(409).json({ error: `Stock insuficiente para ${it.nombre}`, disponible: prod.stock });
    }
  }

  // 2) descontar stock
  for (const it of ord.items) {
    // si no hay campo stock, no descuenta (se asume infinito)
    await Comida.updateOne(
      { _id: it.producto, stock: { $type: 'number' } },
      { $inc: { stock: -it.cantidad } }
    );
  }

  // 3) marcar como pagada
  ord.estado = 'pagada';
  ord.pago.estado = 'aprobado';
  ord.pago.transaccionId = `SIM-${Date.now()}`;
  ord.pago.pagadaEn = new Date();
  await ord.save();

  // 4) vaciar carrito del user
  await Carrito.updateOne({ user: ord.user }, { $set: { items: [] } });
  
  // [IDEMP] 2) justo antes de responder
  const payload = ord.toObject ? ord.toObject() : ord;
  if (idemKey) {
    idemStore.set(idemKey, { data: payload, expiresAt: Date.now() + IDEM_TTL_MS });
  }

  return res.json(payload); 
}));

// ============================================================
// POST /api/pagos/:ordenId/cancelar -> cancela si no está pagada
// ============================================================
router.post('/:ordenId/cancelar', asyncH(async (req, res) => {
  const ord = await Orden.findById(req.params.ordenId);
  if (!ord) return res.status(404).json({ error: 'Orden no encontrada' });
  if (ord.estado === 'pagada') {
    return res.status(409).json({ error: 'No se puede cancelar: ya está pagada' });
  }
  ord.estado = 'cancelada';
  ord.pago.estado = 'rechazado';
  await ord.save();
  res.json(ord);
}));


module.exports = router;
