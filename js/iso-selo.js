/* MG Peças Automotivas - selo ISO 9001 (RINA)
 * Opção A: faixa no fim da home, logo acima do rodapé.
 * Opção B: selo pequeno no rodapé de todas as páginas.
 * As duas levam a /qualidade/. Aprovada: A (Filipe, 03/11/2026). B fica só se window.MG_ISO_OPCAO = 'B'.
 */
(function () {
  'use strict';
  var SELO = window.MG_ISO_SELO || 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-cdn@d6378b9b62a657c660a5151cd781e54c37b5fc6e/img/selo-rina-iso9001-360.png';
  var ROTULO = 'Fábrica certificada ISO 9001 – saiba mais';
  var opcao = window.MG_ISO_OPCAO || 'A';

  function css() {
    if (document.getElementById('mg-iso-css')) return;
    var s = document.createElement('style');
    s.id = 'mg-iso-css';
    s.textContent =
      /* A: faixa na home */
      '.mg-iso-faixa{display:block;background:#fff;border-top:1px solid #e2e8f0;text-decoration:none;color:#1a3550;font-family:Inter,sans-serif}' +
      '.mg-iso-faixa-in{max-width:1140px;margin:0 auto;padding:18px 16px;display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap}' +
      '.mg-iso-faixa img{height:64px;width:auto;display:block}' +
      '.mg-iso-faixa strong{display:block;font:800 22px/1.1 "Barlow Condensed","Sora",sans-serif;text-transform:uppercase;color:#000922}' +
      '.mg-iso-faixa span{display:block;margin-top:4px;font-size:14px;color:#1a73c8;text-decoration:underline;text-underline-offset:2px}' +
      '@media (hover:hover){.mg-iso-faixa:hover span{color:#155fa6}}' +
      '.mg-iso-faixa:focus-visible{outline:3px solid #000922;outline-offset:-3px}' +
      '@media (max-width:600px){.mg-iso-faixa-in{gap:12px;padding:14px 16px;text-align:center}.mg-iso-faixa img{height:52px}.mg-iso-faixa strong{font-size:19px}}' +
      /* B: selo no rodapé */
      '.mgf-dados a.mg-iso-selo{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 4px;color:inherit;text-decoration:none}' +
      '.mgf-dados a.mg-iso-selo img{height:40px;width:auto;display:block;background:#fff;border-radius:4px}' +
      '.mgf-dados a.mg-iso-selo b{font-weight:600;color:#4a5568}' +
      '@media (hover:hover){.mgf-dados a.mg-iso-selo:hover b{color:#1a73c8;text-decoration:underline}}' +
      '.mgf-dados a.mg-iso-selo:focus-visible{outline:3px solid #000922;outline-offset:2px}';
    document.head.appendChild(s);
  }

  function img(alt) {
    var i = document.createElement('img');
    i.src = SELO;
    i.alt = alt;
    i.width = 360;
    i.height = 232;
    i.loading = 'lazy';
    i.decoding = 'async';
    return i;
  }

  function faixaHome() {
    if (location.pathname !== '/' || document.getElementById('mg-iso-faixa')) return true;
    var mgf = document.querySelector('.mgf');
    if (!mgf) return false;
    var rodape = mgf.closest('footer') || mgf;
    var a = document.createElement('a');
    a.id = 'mg-iso-faixa';
    a.className = 'mg-iso-faixa';
    a.href = '/qualidade/';
    a.setAttribute('aria-label', ROTULO);
    var d = document.createElement('div');
    d.className = 'mg-iso-faixa-in';
    d.appendChild(img('Selo RINA de sistema de gestão certificado ISO 9001'));
    var t = document.createElement('div');
    t.innerHTML = '<strong>Fábrica certificada ISO 9001</strong><span>Saiba o que isso significa →</span>';
    d.appendChild(t);
    a.appendChild(d);
    rodape.parentNode.insertBefore(a, rodape);
    return true;
  }

  function seloRodape() {
    var d = document.querySelector('.mgf-dados');
    if (!d) return false;
    if (d.querySelector('.mg-iso-selo')) return true;
    var a = document.createElement('a');
    a.className = 'mg-iso-selo';
    a.href = '/qualidade/';
    a.setAttribute('aria-label', ROTULO);
    a.appendChild(img(''));
    var b = document.createElement('b');
    b.textContent = 'Fábrica certificada ISO 9001';
    a.appendChild(b);
    d.appendChild(a);
    return true;
  }

  function aplica() {
    css();
    return opcao === 'A' ? faixaHome() : seloRodape();
  }

  if (!aplica()) {
    var mo = new MutationObserver(function () { if (aplica()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 15000);
  }
})();
