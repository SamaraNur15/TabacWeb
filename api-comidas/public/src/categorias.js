
// Activar visualmente el chip y disparar filtro (usa tu lógica de filtrado)
document.querySelectorAll('.chip').forEach(chip => {
chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('is-active');
    c.setAttribute('aria-selected','false');
    });
    chip.classList.add('is-active');
    chip.setAttribute('aria-selected','true');

    const filtro = chip.dataset.filter;  // "salado", "dulce", etc.
    // TODO: acá llamás a tu función que muestra/oculta cards por data-categoria
    // filtrarPorCategoria(filtro);
});
});

// Scroll con flechas
const rail = document.querySelector('.chips');
const prev = document.querySelector('.chips-prev');
const next = document.querySelector('.chips-next');

const step = () => Math.max(rail.clientWidth * 0.6, 200); // cuánto scrollea

prev?.addEventListener('click', () => rail.scrollBy({left: -step(), behavior: 'smooth'}));
next?.addEventListener('click', () => rail.scrollBy({left:  step(), behavior: 'smooth'}));

// Soporte teclado: ← → para moverse entre chips
rail.addEventListener('keydown', (e) => {
const chips = [...rail.querySelectorAll('.chip')];
const i = chips.findIndex(c => c.getAttribute('aria-selected') === 'true');
if (e.key === 'ArrowRight') {
    const n = chips[Math.min(i + 1, chips.length - 1)];
    n?.focus(); n?.click();
    rail.scrollBy({left: 100, behavior: 'smooth'});
}
if (e.key === 'ArrowLeft') {
    const p = chips[Math.max(i - 1, 0)];
    p?.focus(); p?.click();
    rail.scrollBy({left: -100, behavior: 'smooth'});
}
});

