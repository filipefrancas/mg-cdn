/* MG Peças Automotivas - cartões "Trabalhe na MG" e "Fornecedores" no topo do Fale com a MG (/contato/).
 * Clicar no cartão escolhe o assunto no formulário (js/contato.js); sem ele, o link abre /contato/?assunto=...
 * Os cartões somem enquanto um assunto está aberto e voltam ao "Trocar de assunto".
 * Cartão largo "Quer revender peças MG?": dois botões (/representantes/ e a ficha cadastral, /contato/?assunto=ficha).
 */
(function () {
  'use strict';
  if (!/^\/contato\/?$/.test(location.pathname)) return;
  var BASE = window.MG_CARTOES_BASE || 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-cdn@d6378b9b62a657c660a5151cd781e54c37b5fc6e/img/contato/';
  var CARTOES = [
    { assunto: 'trabalhe', rotulo: /Quero trabalhar na MG/i, img: 'card_trabalhe.jpg', alt: 'Quer trabalhar na MG? Envie seu currículo pelo formulário' },
    { assunto: 'fornecedor', rotulo: /Sou fornecedor/i, img: 'card_fornecedor.jpg', alt: 'Quer fornecer para a MG? Envie sua apresentação pelo formulário' }
  ];

  var REV = 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-cdn@67af3c9d007a6f5c4ea00ec78274717dd46fedb3/img/contato/';

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
      '@media (max-width:640px){.mgcc{grid-template-columns:1fr}}' +
      '.mgcc .mgcc-rev{grid-column:1/-1;position:relative;border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,9,34,.12)}' +
      '.mgcc .mgcc-rev img{aspect-ratio:760/270}' +
      '.mgcc .mgcc-rev a{position:absolute;border-radius:10px;box-shadow:none;transform:none}' +
      '.mgcc .mgcc-rev .r1{left:4.5%;top:65%;width:35%;height:20%}.mgcc .mgcc-rev .r2{left:39.5%;top:65%;width:36%;height:20%}' +
      '@media (max-width:640px){.mgcc .mgcc-rev{grid-column:auto}.mgcc .mgcc-rev img{aspect-ratio:760/440}' +
      '.mgcc .mgcc-rev .r1{left:4.5%;top:65%;width:42%;height:14%}.mgcc .mgcc-rev .r2{left:4.5%;top:79%;width:43%;height:13.5%}}';
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
    var r = document.createElement('div');
    r.className = 'mgcc-rev';
    r.innerHTML = '<picture><source media="(max-width:640px)" srcset="' + REV + 'card_revenda_cel.jpg">' +
      '<img src="' + REV + 'card_revenda.jpg" width="760" height="270" decoding="async" alt="Quer revender peças MG? Fale com o representante da sua região ou peça para a MG entrar em contato"></picture>' +
      '<a class="r1" href="/representantes/" aria-label="Falar com o representante"></a>' +
      '<a class="r2" href="/contato/?assunto=ficha" aria-label="Quero que a MG me procure"></a>';
    r.querySelector('.r2').addEventListener('click', function (ev) {
      if (!window.MGContato || !window.MGContato.abrir) return; // sem o formulário, o link abre a ficha
      ev.preventDefault();
      window.MGContato.abrir('ficha');
    });
    w.appendChild(r);
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
