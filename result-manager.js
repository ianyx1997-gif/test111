/* =========================================================
   ZEBRA TUR — result-manager.js
   Injecteaza automat:
   1) Panoul "Solicita oferta personalizata" deasupra butonului
      "Incarca mai multe oferte" din motorul otpusk.
   2) Butonul CTA in starea "Nu s-au gasit oferte".
   3) Modal de contact manager cu formular.

   Include: <script src="result-manager.js" defer></script>
   DUPA scripturile otpusk.
   ========================================================= */

(function () {
  'use strict';

  // -------- CONFIG --------
  var CFG = {
    phone: '+37360000000',           // TODO: inlocuieste cu nr real
    whatsapp: '37360000000',         // fara +, fara spatii
    telegram: 'zebratur_md',         // username telegram
    managerName: 'Echipa Zebra Tur',
    // URL unde se trimit cererile (opțional; daca lipseste => mailto)
    submitUrl: '',
    email: 'office@zebratour.md'
  };

  // -------- SELECTORI otpusk cunoscuti --------
  var LOAD_MORE_SELECTORS = [
    '.os-r-list-more',
    '.os-load-more',
    '.os-more',
    '.os-r-more',
    '.os-btn-more',
    '[data-os-more]'
  ].join(',');

  var EMPTY_SELECTORS = [
    '.os-r-empty',
    '.os-empty',
    '.os-r-nothing',
    '.os-r-nofound',
    '.os-r-no-results'
  ].join(',');

  var RESULT_CONTAINER_SELECTORS = [
    '#os-result',
    '.os-result',
    '.os-r',
    '.os-r-wrap'
  ].join(',');

  // Lista de rezultate (cardurile de tour)
  var RESULT_LIST_SELECTORS = [
    '.os-r-list',
    '.os-r-tours',
    '.os-tours-list'
  ].join(',');

  // Pozitia procentuala unde inseram panoul intre rezultate (60%)
  var INSERT_AT_PERCENT = 0.6;
  // Numar minim de carduri pentru ca insertia in lista sa aiba sens
  var MIN_CARDS_FOR_INLINE = 4;

  // -------- HTML TEMPLATES --------
  function iconSVG(name) {
    var icons = {
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.2.2-.4.1-.2 0-.3 0-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.6 2.4 3.8 3.4 2.2 1 2.2.7 2.6.6.4 0 1.4-.5 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.2zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3 1.2 4.7 1.2h.2c5.5 0 10-4.5 10-10s-4.5-9.9-10-9.9zm0 18h-.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/></svg>',
      tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'
    };
    return icons[name] || '';
  }

  function buildManagerPanel(asListItem) {
    var wrap = document.createElement(asListItem ? 'li' : 'div');
    wrap.className = 'zt-manager-panel';
    wrap.setAttribute('data-zt-manager-panel', '1');
    wrap.innerHTML = [
      '<div class="zt-manager-panel__avatar" aria-hidden="true"></div>',
      '<div class="zt-manager-panel__content">',
      '  <h3 class="zt-manager-panel__title">Prea multe optiuni?</h3>',
      '  <p class="zt-manager-panel__desc">Managerul nostru iti trimite 3 variante potrivite in 15 minute.</p>',
      '</div>',
      '<div class="zt-manager-panel__actions">',
      '  <a class="zt-btn-contact zt-btn-contact--whatsapp" href="https://wa.me/' + CFG.whatsapp + '" target="_blank" rel="noopener">' + iconSVG('wa') + '<span>WhatsApp</span></a>',
      '  <a class="zt-btn-contact zt-btn-contact--telegram" href="https://t.me/' + CFG.telegram + '" target="_blank" rel="noopener">' + iconSVG('tg') + '<span>Telegram</span></a>',
      '</div>'
    ].join('');
    return wrap;
  }

  function buildEmptyCTA() {
    var wrap = document.createElement('div');
    wrap.className = 'zt-empty-state__actions';
    wrap.setAttribute('data-zt-empty-actions', '1');
    wrap.innerHTML = [
      '<button type="button" class="zt-btn-manager zt-empty-cta" data-zt-open-modal>',
         iconSVG('chat'),
      '  <span>Primeste oferta de la manager</span>',
      '</button>',
      '<a class="zt-btn-contact zt-btn-contact--whatsapp" href="https://wa.me/' + CFG.whatsapp + '" target="_blank" rel="noopener">' + iconSVG('wa') + ' WhatsApp</a>',
      '<a class="zt-btn-contact" href="tel:' + CFG.phone + '">' + iconSVG('phone') + ' ' + CFG.phone + '</a>'
    ].join('');
    return wrap;
  }

  function buildModal() {
    if (document.querySelector('.zt-modal-backdrop')) return;
    var m = document.createElement('div');
    m.className = 'zt-modal-backdrop';
    m.innerHTML = [
      '<div class="zt-modal" role="dialog" aria-modal="true" aria-labelledby="zt-modal-title">',
      '  <button type="button" class="zt-modal__close" aria-label="Inchide" data-zt-close-modal>&times;</button>',
      '  <h3 class="zt-modal__title" id="zt-modal-title">Oferta personalizata</h3>',
      '  <p class="zt-modal__desc">Completeaza datele de mai jos — un manager Zebra Tur iti raspunde in scurt timp cu cele mai bune variante.</p>',
      '  <form class="zt-modal__form" data-zt-form>',
      '    <div class="zt-modal__field">',
      '      <label class="zt-modal__label" for="zt-f-name">Nume</label>',
      '      <input class="zt-modal__input" id="zt-f-name" name="name" required placeholder="Ex: Ion Popescu">',
      '    </div>',
      '    <div class="zt-modal__field">',
      '      <label class="zt-modal__label" for="zt-f-phone">Telefon</label>',
      '      <input class="zt-modal__input" id="zt-f-phone" name="phone" required placeholder="+373 ..." type="tel">',
      '    </div>',
      '    <div class="zt-modal__field">',
      '      <label class="zt-modal__label" for="zt-f-msg">Ce cauti? (destinatie, buget, date)</label>',
      '      <textarea class="zt-modal__textarea" id="zt-f-msg" name="message" placeholder="Ex: Turcia all inclusive, 2 adulti + 1 copil, 15-25 iulie, buget 1500 EUR/persoana"></textarea>',
      '    </div>',
      '    <button type="submit" class="zt-modal__submit">Trimite cererea</button>',
      '  </form>',
      '</div>'
    ].join('');
    document.body.appendChild(m);

    // close handlers
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.matches('[data-zt-close-modal]')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // submit
    var form = m.querySelector('[data-zt-form]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
        source: window.location.href
      };
      sendLead(data, form);
    });
  }

  function openModal() {
    var m = document.querySelector('.zt-modal-backdrop');
    if (!m) { buildModal(); m = document.querySelector('.zt-modal-backdrop'); }
    m.classList.add('is-open');
    setTimeout(function () {
      var first = m.querySelector('input, textarea');
      if (first) first.focus();
    }, 100);
  }

  function closeModal() {
    var m = document.querySelector('.zt-modal-backdrop');
    if (m) m.classList.remove('is-open');
  }

  function sendLead(data, form) {
    var btn = form.querySelector('.zt-modal__submit');
    btn.disabled = true;
    btn.textContent = 'Se trimite...';

    if (CFG.submitUrl) {
      fetch(CFG.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        btn.textContent = r.ok ? 'Cerere trimisa ✓' : 'Eroare, incearca din nou';
        if (r.ok) setTimeout(closeModal, 1400);
      }).catch(function () {
        btn.textContent = 'Eroare, incearca din nou';
      }).finally(function () {
        setTimeout(function () { btn.disabled = false; btn.textContent = 'Trimite cererea'; }, 2500);
      });
    } else {
      // fallback: mailto
      var subj = encodeURIComponent('Cerere oferta personalizata — ' + data.name);
      var body = encodeURIComponent(
        'Nume: ' + data.name + '\n' +
        'Telefon: ' + data.phone + '\n' +
        'Mesaj: ' + data.message + '\n\n' +
        'Sursa: ' + data.source
      );
      window.location.href = 'mailto:' + CFG.email + '?subject=' + subj + '&body=' + body;
      btn.textContent = 'Cerere trimisa ✓';
      setTimeout(function () { closeModal(); btn.disabled = false; btn.textContent = 'Trimite cererea'; }, 1400);
    }
  }

  // -------- INJECTIE --------
  // Strategia 1 (preferata): insereaza panoul IN lista de rezultate
  // pe pozitia ~60% si pe rand intreg (grid-column: 1 / -1).
  // Strategia 2 (fallback): inainte de butonul "Load more".
  function injectManagerPanel() {
    var inserted = injectInsideResultsList();
    if (!inserted) inserted = injectBeforeLoadMore();
    return inserted;
  }

  function injectInsideResultsList() {
    var list = document.querySelector(RESULT_LIST_SELECTORS);
    if (!list) return false;

    // Numara doar cardurile reale de tour (nu panoul nostru)
    var cards = Array.prototype.filter.call(
      list.children,
      function (el) { return !el.hasAttribute('data-zt-manager-panel'); }
    );
    if (cards.length < MIN_CARDS_FOR_INLINE) return false;

    // Daca panoul exista deja in lista, doar repozitioneaza-l la 60%
    var existing = list.querySelector(':scope > [data-zt-manager-panel]');
    var target = cards[Math.max(0, Math.min(cards.length - 1, Math.floor(cards.length * INSERT_AT_PERCENT)))];

    if (existing) {
      // Daca e deja imediat dupa target, nu mai facem nimic
      if (target && target.nextElementSibling === existing) return true;
      list.removeChild(existing);
    }

    var panel = buildManagerPanel(true); // ca <li>
    if (target && target.nextSibling) {
      list.insertBefore(panel, target.nextSibling);
    } else {
      list.appendChild(panel);
    }
    return true;
  }

  function injectBeforeLoadMore() {
    var loadMoreBtn = document.querySelector(LOAD_MORE_SELECTORS);
    if (!loadMoreBtn) return false;
    var prev = loadMoreBtn.previousElementSibling;
    if (prev && prev.hasAttribute('data-zt-manager-panel')) return true;
    var panel = buildManagerPanel(false);
    loadMoreBtn.parentNode.insertBefore(panel, loadMoreBtn);
    return true;
  }

  function injectEmptyCTA() {
    var emptyEl = document.querySelector(EMPTY_SELECTORS);
    if (!emptyEl) return false;
    if (emptyEl.querySelector('[data-zt-empty-actions]')) return true;
    emptyEl.appendChild(buildEmptyCTA());
    return true;
  }

  function bindModalTriggers() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-zt-open-modal]');
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });
  }

  // -------- OBSERVER — reruleaza la re-render otpusk --------
  function startObserver() {
    var target = document.querySelector(RESULT_CONTAINER_SELECTORS) || document.body;
    var obs = new MutationObserver(function () {
      injectManagerPanel();
      injectEmptyCTA();
    });
    obs.observe(target, { childList: true, subtree: true });
  }

  // -------- BOOT --------
  function boot() {
    buildModal();
    bindModalTriggers();
    injectManagerPanel();
    injectEmptyCTA();
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // API public (opțional)
  window.ZTManager = {
    open: openModal,
    close: closeModal,
    config: CFG
  };
})();
