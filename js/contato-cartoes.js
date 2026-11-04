/* MG Peças Automotivas - cartões "Trabalhe na MG" e "Fornecedores" no topo do Fale com a MG (/contato/).
 * Clicar no cartão escolhe o assunto no formulário (js/contato.js); sem ele, o link abre /contato/?assunto=...
 * Os cartões somem enquanto um assunto está aberto e voltam ao "Trocar de assunto".
 */
(function () {
  'use strict';
  if (!/^\/contato\/?$/.test(location.pathname)) return;
  var BASE = window.MG_CARTOES_BASE || 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-site-arquivos@18d33acebdaae9ce510c82bf009d5c87573ccf11/img/contato/';
  var CARTOES = [
    { assunto: 'trabalhe', rotulo: /Quero trabalhar na MG/i, img: 'card_trabalhe.jpg', alt: 'Quer trabalhar na MG? Envie seu currículo pelo formulário' },
    { assunto: 'fornecedor', rotulo: /Sou fornecedor/i, img: 'card_fornecedor.jpg', alt: 'Quer fornecer para a MG? Envie sua apresentação pelo formulário' }
  ];

  function css() {
    if (document.getElementById('mgcc-css')) return;
    var s = document.createElement('style');
    s.id = 'mgcc-css';
    s.textContent =
      '.mgcc{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:6px 0 22px;max-width:760px}' +
      '.mgcc a{display:block;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,9,34,.12);transition:transform .15s,box-shadow .15s}' +
      '.mgcc img{display:block;width:100%;height:auto;aspect-ratio:760/440}' +
      '@media (hover:hover){.mgcc a:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,9,34,.18)}}' +
      '.mgcc a:focus-visible{outline:3px solid #000922;outline-offset:3px}' +
      '@media (max-width:640px){.mgcc{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function intro() {
    return [].filter.call(document.querySelectorAll('p,div,span'), function (e) {
      return /^Escolha o assunto/.test((e.textContent || '').trim());
    }).sort(function (a, b) { return a.textContent.length - b.textContent.length; })[0];
  }

  function botaoAssunto(re) {
    return [].filter.call(document.querySelectorAll('button'), function (b) { return re.test(b.textContent || ''); })[0];
  }

  function monta() {
    if (document.getElementById('mgcc')) return true;
    var alvo = intro();
    if (!alvo || !alvo.parentNode) return false;
    css();
    var w = document.createElement('div');
    w.id = 'mgcc';
    w.className = 'mgcc';
    CARTOES.forEach(function (c) {
      var a = document.createElement('a');
      a.href = '/contato/?assunto=' + c.assunto;
      var i = document.createElement('img');
      i.src = BASE + c.img; i.alt = c.alt; i.width = 760; i.height = 440; i.decoding = 'async';
      a.appendChild(i);
      a.addEventListener('click', function (ev) {
        var b = botaoAssunto(c.rotulo);
        if (!b) return;
        ev.preventDefault();
        b.click();
      });
      w.appendChild(a);
    });
    alvo.parentNode.insertBefore(w, alvo);
    return true;
  }

  // esconde os cartões enquanto um assunto está aberto (o formulário mostra "Trocar de assunto")
  function sincroniza() {
    var w = document.getElementById('mgcc');
    if (!w) return;
    var esconde = [].some.call(document.querySelectorAll('button'), function (b) {
      return /Trocar de assunto/i.test(b.textContent || '') && b.offsetParent !== null;
    });
    if (w.hidden !== esconde) w.hidden = esconde; // só mexe quando muda, para não realimentar o observador
  }

  function tenta() { if (monta()) sincroniza(); }
  tenta();
  var mo = new MutationObserver(function () { tenta(); sincroniza(); });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  document.addEventListener('click', function () { setTimeout(sincroniza, 0); }, true);
})();
