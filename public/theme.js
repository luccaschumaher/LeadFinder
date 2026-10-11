// Aplica o tema claro antes da página aparecer (sem piscar). Só na área logada.
try {
  var p = location.pathname
  if ((p.indexOf('/app') === 0 || p.indexOf('/onboarding') === 0) && localStorage.getItem('lf-theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  }
} catch {
  /* armazenamento indisponível */
}
