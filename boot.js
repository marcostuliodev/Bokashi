/* =========================================================================
   BOOT — scripts essenciais do <head>
   Mantidos em arquivo externo para permitir CSP `script-src 'self'`
   sem 'unsafe-inline' (ver vercel.json).
   ========================================================================= */

/* Marca que JS está ativo (controla fallbacks de UI com .js no <html>) */
document.documentElement.classList.add('js');

/* Stub exigido pelo Vercel Web Analytics antes de carregar o script */
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

/* Fallback de imagens via fase de captura.
   Captura o evento error mesmo durante o parse do HTML (antes do DOMContentLoaded),
   substituindo os antigos atributos inline onerror="..." que violavam a CSP. */
window.addEventListener('error', function (event) {
  var el = event.target;
  if (!el || el.tagName !== 'IMG') return;
  if (el.dataset && el.dataset.fallback && !el.dataset.fallbackApplied) {
    el.dataset.fallbackApplied = '1';
    el.src = el.dataset.fallback;
  } else if (el.hasAttribute && el.hasAttribute('data-hide-on-error')) {
    el.style.display = 'none';
  }
}, true);
