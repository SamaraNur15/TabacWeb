  window.addEventListener("load", () => {
    const wppIcon = document.querySelector(".whatsapp-flotante img");
    
    // agrega animación al cargar
    wppIcon.classList.add("animar");

    // la saca cuando termina, así no queda en loop
    wppIcon.addEventListener("animationend", () => {
      wppIcon.classList.remove("animar");
    });
  });

  const cartaBtn = document.querySelector('.nav-carta');

  // cada 10 segundos se agrega la clase .shake
  setInterval(() => {
    cartaBtn.classList.add('shake');

    // la sacamos cuando termina la animación
    setTimeout(() => {
      cartaBtn.classList.remove('shake');
    }, 6000); // un poco más que la duración de la animación
  }, 10000); // cada 10 segundos