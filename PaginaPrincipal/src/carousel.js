document.addEventListener('DOMContentLoaded', () => {
  const scrollContainer = document.querySelector('.carousel-scroll');
  const btnLeft = document.querySelector('.flecha.izquierda');
  const btnRight = document.querySelector('.flecha.derecha');

  btnLeft.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
  });

  btnRight.addEventListener('click', () => {
    scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
  });
});
// Seleccionamos elementos del DOM
const trackPostres = document.querySelector('.carrusel-track-postres');
const btnIzquierdaPostres = document.querySelector('.flecha-postre.izquierda');
const btnDerechaPostres = document.querySelector('.flecha-postre.derecha');

// Configuramos el desplazamiento
const scrollAmount = 250;

// Event listeners para las flechas
btnIzquierdaPostres.addEventListener('click', () => {
  trackPostres.scrollLeft -= scrollAmount;
});

btnDerechaPostres.addEventListener('click', () => {
  trackPostres.scrollLeft += scrollAmount;
});
