/* =========================================================================
   BOKASHI PROSPERE — script de conversão
   Configuração centralizada: altere os valores abaixo para produção.
   ========================================================================= */

const CONFIG = {
  // >>> SUBSTITUA pelo número real da loja (código do país + DDD + número, só dígitos) <<<
  whatsapp: "5531992454244",

  // >>> PÁGINA DE DESTINO (loja / checkout) — onde a venda acontece <<<
  productUrl: "https://especialorquideas.com.br/products/adubo-organico-bokashi-poderoso-para-floracao-raiz-e-crescimento",

  // Mensagens pré-definidas do WhatsApp (canal de suporte)
  msg: {
    compra: "Olá! Tenho dúvidas sobre o Bokashi Prospere (R$ 49,90 no Pix com frete grátis).",
    desconto: "Olá! Vi a oferta do site e quero o Bokashi Prospere com 10% OFF no Pix."
  },

  // Estoque (placeholder). Em produção, substitua por integração com inventário real.
  estoque: { inicial: 23, piso: 5 },

  // Analytics — preencha para ativar (deixe vazio para desativar)
  analytics: {
    ga4: "",          // ex.: "G-XXXXXXXXXX"
    metaPixel: ""     // ex.: "1234567890"
  }
};

/* ----------------------- Utilidades de analytics ----------------------- */
window.dataLayer = window.dataLayer || [];
function track(event, data = {}) {
  window.dataLayer.push({ event, ...data });
  if (window.gtag) window.gtag('event', event, data);
  if (window.fbq && event === 'cta_click') window.fbq('track', 'Lead');
}

/* ----------------------- Links (loja + WhatsApp) ----------------------- */
function waUrl(msg) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
}
function setLinks() {
  // CTAs de compra levam à loja (página de destino)
  const buy = document.getElementById('buyBtn');
  const sticky = document.getElementById('stickyBuy');
  const final = document.getElementById('finalBuy');
  const skip = document.getElementById('modalSkip');
  const float = document.getElementById('whatsFloat');
  if (buy) buy.href = CONFIG.productUrl;
  if (sticky) sticky.href = CONFIG.productUrl;
  if (final) final.href = CONFIG.productUrl;
  if (skip) skip.href = CONFIG.productUrl;
  // WhatsApp permanece como canal de suporte
  if (float) float.href = waUrl(CONFIG.msg.compra);
}

/* ----------------------- Header scroll --------------------------------- */
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ----------------------- Menu mobile ----------------------------------- */
function toggleMenu() {
  const nav = document.getElementById('mobileNav');
  const btn = document.querySelector('.mobile-menu');
  const open = nav.hasAttribute('hidden');
  if (open) { nav.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
  else { nav.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
}
window.toggleMenu = toggleMenu;

/* ----------------------- Countdown (oferta do dia) --------------------- */
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    let diff = Math.max(0, Math.floor((midnight - now) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ----------------------- Estoque (persistido) -------------------------- */
function initStock() {
  const el = document.getElementById('stock');
  if (!el) return;
  const KEY = 'bokashi_stock_v1';
  const SEEN = 'bokashi_stock_seen';
  try {
    let val = parseInt(localStorage.getItem(KEY), 10);
    if (!val || isNaN(val)) {
      val = CONFIG.estoque.inicial;
    } else if (!sessionStorage.getItem(SEEN) && val > CONFIG.estoque.piso) {
      val -= 1; // decrementa no máximo 1x por sessão de navegação
    }
    val = Math.max(CONFIG.estoque.piso, val);
    localStorage.setItem(KEY, val);
    sessionStorage.setItem(SEEN, '1');
    el.textContent = val;
  } catch (e) {
    el.textContent = CONFIG.estoque.inicial; // fallback se storage bloqueado
  }
}

/* ----------------------- CTA sticky mobile ----------------------------- */
function initStickyCta() {
  const bar = document.getElementById('stickyCta');
  const oferta = document.getElementById('oferta');
  if (!bar || !oferta) return;
  const mq = window.matchMedia('(max-width: 900px)');
  function update() {
    if (!mq.matches) { bar.setAttribute('hidden', ''); return; }
    const rect = oferta.getBoundingClientRect();
    const show = window.scrollY > 500 && rect.top > window.innerHeight * 0.6;
    if (show) bar.removeAttribute('hidden'); else bar.setAttribute('hidden', '');
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ----------------------- Modal */
let lastFocused = null;
function openModal() {
  const m = document.getElementById('leadModal');
  if (!m) return;
  lastFocused = document.activeElement;
  m.removeAttribute('hidden');
  const input = document.getElementById('leadEmail');
  if (input) setTimeout(() => input.focus(), 50);
  document.addEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  const m = document.getElementById('leadModal');
  if (m) m.setAttribute('hidden', '');
  document.removeEventListener('keydown', escClose);
  try { localStorage.setItem('bokashi_lead_dismiss', Date.now()); } catch (e) {}
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
window.closeModal = closeModal;

async function sha256(str) {
  try {
    if (!crypto || !crypto.subtle) return null;
    const b = new TextEncoder().encode(str);
    const h = await crypto.subtle.digest('SHA-256', b);
    return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch (e) { return null; }
}

function initLeadModal() {
  const modal = document.getElementById('leadModal');
  const form = document.getElementById('leadForm');
  const email = document.getElementById('leadEmail');
  const consent = document.getElementById('leadConsent');
  const err = document.getElementById('modalErr');
  if (!modal || !form) return;

  // Fechar ao clicar fora do diálogo
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Não exibir de novo por 7 dias após dispensa/envio
  let dismissed = null;
  try { dismissed = localStorage.getItem('bokashi_lead_dismiss'); } catch (e) {}
  const recently = dismissed && (Date.now() - parseInt(dismissed, 10) < 7 * 864e5);

  let triggered = false;
  function trigger() {
    if (triggered || recently) return;
    triggered = true;
    openModal();
    track('lead_modal_view');
  }
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && e.clientY < 10) trigger();
  });
  setTimeout(trigger, 25000);
  window.addEventListener('scroll', () => {
    if ((window.scrollY + window.innerHeight) / document.body.scrollHeight > 0.6) trigger();
  }, { passive: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const cons = consent ? consent.checked : true;
    if (!ok || !cons) { err.hidden = false; if (!ok) email.focus(); return; }
    err.hidden = true;
    const hash = await sha256(v);
    track('lead_capture', hash ? { email_hash: hash } : {}); // nunca envia e-mail em texto puro
    closeModal();
    window.location.href = CONFIG.productUrl;
  });
}

/* ----------------------- Tracking de cliques em CTA --------------------- */
function initCtaTracking() {
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      track('cta_click', { location: el.getAttribute('data-cta') });
    });
  });
}

/* ----------------------- Reveal on scroll ------------------------------ */
function initReveal() {
  const targets = document.querySelectorAll('.benef, .prob-card, .step, .depo-card, .uso, .spec, .bokashi-card, .dor-card, .pf-col, .dt-card, .ad-col, .custo-nao-item');
  if (!('IntersectionObserver' in window) || !targets.length) return;
  targets.forEach((t) => t.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  targets.forEach((t) => io.observe(t));
}

/* ----------------------- Analytics load (se configurado) --------------- */
function initAnalytics() {
  const { ga4, metaPixel } = CONFIG.analytics;
  if (ga4) {
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', ga4);
  }
  if (metaPixel) {
    /* Meta Pixel — descomente se usar
    !function(f,b,e,v,n,t,s){...}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', metaPixel); fbq('track','PageView');
    */
  }
}

/* ----------------------- Init ------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  setLinks();
  initHeader();
  initCountdown();
  initStock();
  initStickyCta();
  initLeadModal();
  initCtaTracking();
  initReveal();
  initAnalytics();
  track('page_view', { page: 'landing_bokashi' });
});
