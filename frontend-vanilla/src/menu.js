const btnAbrir = document.getElementById('abrir-menu');
const btnCerrar = document.getElementById('cerrar-menu');
const menu = document.getElementById('menu-lateral');
const fondo = document.getElementById('fondo-oscuro');

// Función para abrir el menú
btnAbrir.addEventListener('click', () => {
  menu.classList.add('abierto');
  fondo.hidden = false;
  menu.setAttribute('aria-hidden', 'false');
});

// Función para cerrar el menú
const cerrarMenu = () => {
  menu.classList.remove('abierto');
  fondo.hidden = true;
  menu.setAttribute('aria-hidden', 'true');
};

btnCerrar.addEventListener('click', cerrarMenu);
fondo.addEventListener('click', cerrarMenu);

