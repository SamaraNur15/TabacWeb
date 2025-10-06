// api-comidas/public/src/carrusel.js

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const pctDesc = (p) => {
  if (p?.porcentaje_descuento != null) return p.porcentaje_descuento;
  if (p?.precio_anterior > 0 && p?.precio >= 0) {
    return Math.round((1 - p.precio / p.precio_anterior) * 100);
  }
  return null;
};

// ----- templates -----
const cardProductoHTML = (p) => {
  const img = p.imagen || '/img/placeholder.png';
  const pct = pctDesc(p);
  const precioAnterior = p.precio_anterior && p.precio_anterior > p.precio ? fmtARS(p.precio_anterior) : '';
  const off = pct && pct > 0 ? `${pct}% OFF` : '';

  return `
    <div class="card-producto">
      <img src="${img}" alt="${p.nombre}">
      <div class="contenido-card">
        <h3>${p.nombre}</h3>
        <p class="precio">
          ${fmtARS(p.precio)}
          ${precioAnterior ? `<span class="precio-anterior">${precioAnterior}</span>` : ''}
        </p>
        ${off ? `<p class="descuento">${off}</p>` : ''}
      </div>
    </div>
  `;
};

const cardPostreHTML = (p) => {
  const img = p.imagen || '/img/placeholder.png';
  const pct = pctDesc(p);
  const precioAnterior = p.precio_anterior && p.precio_anterior > p.precio ? fmtARS(p.precio_anterior) : '';
  const off = pct && pct > 0 ? `${pct}% OFF` : '';

  return `
    <div class="card-postre">
      <img src="${img}" alt="${p.nombre}">
      <div class="info">
        <h3>${p.nombre}</h3>
        <p class="precio">
          <span class="actual">${fmtARS(p.precio)}</span>
          ${precioAnterior ? `<span class="tachado">${precioAnterior}</span>` : ''}
          ${off ? `<span class="descuento">${off}</span>` : ''}
        </p>
        ${p.descripcion ? `<p class="desc">${p.descripcion}</p>` : ''}
      </div>
    </div>
  `;
};

// ----- cargar carouseles -----
async function cargarCategoria(categoria, selectorContenedor, templateFn, opciones = {}) {
  const cont = document.querySelector(selectorContenedor);
  if (!cont) return;

  cont.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const r = await fetch(`/api/comidas?categoria=${encodeURIComponent(categoria)}`);
    const data = await r.json();

    // filtros opcionales
    let items = data;
    if (opciones.soloDisponibles) {
      items = items.filter((p) => p.disponible !== false);
    }
    if (opciones.stockMayorACero) {
      items = items.filter((p) => p.stock == null || p.stock > 0);
    }
    if (opciones.max && Number.isFinite(opciones.max)) {
      items = items.slice(0, opciones.max);
    }

    cont.innerHTML = items.map(templateFn).join('') || '<div class="empty">Sin productos</div>';
  } catch (err) {
    console.error('Error cargando categoría', categoria, err);
    cont.innerHTML = '<div class="error">No se pudo cargar. Reintenta más tarde.</div>';
  }
}

// ----- flechas -----
function initFlechas() {
  const scrollContainer = document.querySelector('.carousel-scroll');
  const btnLeft = document.querySelector('.flecha.izquierda');
  const btnRight = document.querySelector('.flecha.derecha');
  const trackPostres = document.querySelector('.carrusel-track-postres');
  const btnIzqPostres = document.querySelector('.flecha-postre.izquierda');
  const btnDerPostres = document.querySelector('.flecha-postre.derecha');

  const step = 300;

  if (btnLeft && scrollContainer) {
    btnLeft.addEventListener('click', () => scrollContainer.scrollBy({ left: -step, behavior: 'smooth' }));
  }
  if (btnRight && scrollContainer) {
    btnRight.addEventListener('click', () => scrollContainer.scrollBy({ left: step, behavior: 'smooth' }));
  }
  if (btnIzqPostres && trackPostres) {
    btnIzqPostres.addEventListener('click', () => (trackPostres.scrollLeft -= 250));
  }
  if (btnDerPostres && trackPostres) {
    btnDerPostres.addEventListener('click', () => (trackPostres.scrollLeft += 250));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Salados -> especialidades
  cargarCategoria('salado', '.carousel-scroll', cardProductoHTML, {
    soloDisponibles: true,
    stockMayorACero: false,
    max: 12,
  });

  // Dulces -> postres
  cargarCategoria('dulce', '.carrusel-track-postres', cardPostreHTML, {
    soloDisponibles: true,
    stockMayorACero: false,
    max: 12,
  });

  initFlechas();
});
