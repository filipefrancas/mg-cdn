/* MG — selo, código e caixa OEM (substitui a tag "MG site - produto e lista" do GTM da agência, cópia de 16/11/2026).
 * Faz exatamente o que a tag fazia:
 *  1) nas listas: "Código: MGxxxx" abaixo do nome do produto (.mg-codigo);
 *  2) no produto: selo .mg-badge com o código, título dividido (nome / montadora em .mg-sub), caixa .mg-oem com
 *     OEM e Embalagem tirados da descrição, botão .mg-btn (fica oculto pelo tema), esconde "preço sob consulta",
 *     classe .mg-desc na descrição com a tabela de aplicação;
 *  3) texto de ajuda da busca: "Busque por código MG, carro ou OEM".
 * seo.js, avaliacoes.js e mg-lista.js dependem de .mg-badge / .mg-sub / .mg-oem.
 * Seguro rodar junto com a tag antiga: o h1 marcado com data-mg e o .mg-codigo já inserido não são refeitos. */
(function () {
  'use strict';
  if (window.__mgProdutoLista) return;
  window.__mgProdutoLista = 1;

  var CSS = [
    '.mg-codigo{font-size:13px;color:#777;margin-top:4px}',
    '.mg-desc h2:first-child{display:none}',
    '.mg-desc{font-size:16px;color:#222}',
    '.mg-desc h3{font-size:18px;text-transform:uppercase;letter-spacing:.5px;margin:6px 0 8px}',
    '.mg-desc table{border-collapse:collapse;width:100%;font-size:15px}',
    '.mg-desc th{background:#1d3557;color:#fff;text-align:left;padding:8px 10px;font-size:13px;text-transform:uppercase}',
    '.mg-desc td{border-bottom:1px solid #e3e3e3;padding:9px 10px;text-transform:uppercase;font-weight:600}',
    '.mg-desc tr:nth-child(even) td{background:#f8f9fb}',
    '.mg-desc ul{padding-left:0;list-style:none;margin:0}',
    '.mg-desc li{border-bottom:1px solid #e3e3e3;padding:9px 10px;text-transform:uppercase;font-weight:600}',
    '.mg-desc li:nth-child(even){background:#f8f9fb}',
    '.mg-desc p:last-child{font-size:13px;color:#777;margin-top:14px}',
    '.mg-badge{display:inline-block;background:#1d3557;color:#fff;font-weight:bold;font-size:20px;padding:6px 14px;border-radius:6px;letter-spacing:1px;margin-bottom:10px}',
    '.mg-sub{color:#666;font-size:15px;margin:4px 0 14px}',
    '.mg-oem{background:#f4f7fa;border-left:4px solid #1a8fe3;padding:10px 14px;border-radius:4px;font-size:15px;margin:0 0 16px}',
    '.mg-oem b{color:#1d3557}',
    '.mg-btn{display:inline-block;text-align:center;padding:14px 28px;border-radius:6px;font-weight:bold;font-size:14px;text-transform:uppercase;color:#1a8fe3;border:2px solid #1a8fe3;text-decoration:none;margin:0 0 20px}',
    '.mg-btn:hover{background:#1a8fe3;color:#fff}',
    '.mg-oculto{display:none !important}'
  ].join('\n');

  var COD = /\s[-–]\s(MG[A-Z0-9-]+)\s*$/i;
  var REP = 'https://mgpecasautomotivas.my.canva.site/';
  var MONT = /\b(Audi|BMW|Chery|Chevrolet|Citro[eë]n|Dodge|Fiat|Ford|GM|Honda|Hyundai|Iveco|Jeep|Kia|Land Rover|Mercedes|Mitsubishi|Nissan|Peugeot|Renault|Seat|Suzuki|Toyota|Volkswagen|VW|Volvo)\b/;

  function estilo() {
    if (document.getElementById('mg-produto-lista-css')) return;
    var st = document.createElement('style');
    st.id = 'mg-produto-lista-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* 1) listas */
  function listas() {
    var ns = document.querySelectorAll('.item-name, .js-item-name, .item-title, .product-item-name, .js-product-name');
    for (var i = 0; i < ns.length; i++) {
      var a = ns[i];
      if (a.nextElementSibling && a.nextElementSibling.classList.contains('mg-codigo')) continue;
      var m = (a.textContent || '').trim().match(COD);
      if (!m) continue;
      var d = document.createElement('div');
      d.className = 'mg-codigo';
      d.textContent = 'Código: ' + m[1].toUpperCase();
      a.insertAdjacentElement('afterend', d);
    }
  }

  /* 2) página do produto */
  function produto() {
    var h = document.querySelector('h1');
    if (!h || h.dataset.mg) return;
    var m = (h.textContent || '').trim().match(COD);
    if (!m) return;
    h.dataset.mg = '1';
    var cod = m[1].toUpperCase();
    var t = h.textContent.trim().replace(COD, '');
    var f = t.match(MONT), nome = t, carro = '';
    if (f && f.index > 0) { nome = t.slice(0, f.index).trim(); carro = t.slice(f.index).trim(); }
    var badge = document.createElement('div');
    badge.className = 'mg-badge';
    badge.textContent = cod;
    h.parentNode.insertBefore(badge, h);
    h.textContent = nome;
    var sub = null;
    if (carro) { sub = document.createElement('div'); sub.className = 'mg-sub'; sub.textContent = carro; h.insertAdjacentElement('afterend', sub); }

    var h3 = document.querySelectorAll('h3'), desc = null;
    for (var i = 0; i < h3.length; i++) if (/aplica/i.test(h3[i].textContent)) { desc = h3[i].parentNode; break; }
    if (!desc) return;
    desc.classList.add('mg-desc');
    var partes = [], ps = desc.querySelectorAll('p');
    for (var j = 0; j < ps.length; j++) {
      var tx = ps[j].textContent || '';
      if (/OEM|Embalagem/i.test(tx) && tx.length < 200) { partes.push(ps[j].innerHTML); ps[j].classList.add('mg-oculto'); }
    }
    var ref = sub || h;
    if (partes.length) {
      var oem = document.createElement('div');
      oem.className = 'mg-oem';
      oem.innerHTML = partes.join(' &nbsp;·&nbsp; '); // mesmo HTML que já está na descrição do produto
      ref.insertAdjacentElement('afterend', oem);
      ref = oem;
    }
    var bt = document.createElement('a');
    bt.className = 'mg-btn';
    bt.href = REP;
    bt.textContent = 'Encontrar representante';
    ref.insertAdjacentElement('afterend', bt);
    var els = document.querySelectorAll('a, button, span, div');
    for (var k = 0; k < els.length; k++) {
      var e = els[k];
      if (e.children.length === 0 && /pre[çc]o sob consulta/i.test(e.textContent)) (e.closest('a, button') || e).classList.add('mg-oculto');
    }
  }

  /* 3) texto de ajuda da busca */
  function busca() {
    var ph = window.innerWidth < 768 ? 'Código MG, carro ou OEM' : 'Busque por código MG, carro ou OEM';
    var is = document.querySelectorAll('.js-search-input, input[name="q"]');
    for (var i = 0; i < is.length; i++) is[i].setAttribute('placeholder', ph);
  }

  function inicia() {
    estilo(); listas(); produto(); busca();
    window.addEventListener('resize', busca);
    if (typeof MutationObserver === 'function') new MutationObserver(listas).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) inicia(); else document.addEventListener('DOMContentLoaded', inicia);
})();
