window.getUserId = function () {
  const saved = localStorage.getItem('userId');
  if (saved) return saved;
  // Para probar sin sorpresas, fijamos uno estable:
  const nuevo = 'anon-1';
  localStorage.setItem('userId', nuevo);
  return nuevo;
};
