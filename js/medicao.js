/* MG — medição própria do site (substitui o GTM da agência, desligado em 05/11/2026).
 * Carrega o Google Analytics 4 da propriedade "PP - MG Peças Automotivas" (fluxo G-L8JSM0XDWY) e manda:
 *  - page_view (automático) + medição otimizada do GA (rolagem, cliques externos, downloads, busca, vídeo);
 *  - clique_whatsapp  : clique em link de WhatsApp (wa.me / api.whatsapp.com / whatsapp://);
 *  - clique_telefone  : clique em link tel:;
 *  - clique_email     : clique em link mailto:;
 *  - generate_lead    : mensagem/ficha enviada com sucesso pelo formulário do site (tela "enviada" do contato.js).
 * Não manda nome, e-mail, telefone nem texto digitado. Usa o dataLayer padrão (a Nuvemshop usa o dataLayerTN dela, separado).
 * Carrega uma vez só, mesmo que o arquivo entre duas vezes na página. */
(function () {
  'use strict';
  var ID = 'G-L8JSM0XDWY';
  if (window.__mgMedicao) return;
  window.__mgMedicao = 1;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.mgGtag = gtag;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  (document.head || document.documentElement).appendChild(s);

  gtag('js', new Date());
  gtag('config', ID);

  function ev(nome, extra) {
    var p = { send_to: ID, page_path: location.pathname };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k];
    gtag('event', nome, p);
  }

  /* cliques em WhatsApp, telefone e e-mail (captura: funciona mesmo com link criado depois) */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var onde = a.closest('#mg-acelera') ? 'assistente' : a.closest('footer, .js-footer') ? 'rodape' : 'pagina';
    if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\b|^whatsapp:/i.test(h)) ev('clique_whatsapp', { local: onde });
    else if (/^tel:/i.test(h)) ev('clique_telefone', { local: onde });
    else if (/^mailto:/i.test(h)) ev('clique_email', { local: onde });
  }, true);

  /* formulário do site: a tela de sucesso (.mgf-ok com "enviada") aparece só quando o servidor confirmou o envio */
  var vistos = typeof WeakSet === 'function' ? new WeakSet() : null;
  function confere(no) {
    if (!no || no.nodeType !== 1) return;
    var oks = no.classList && no.classList.contains('mgf-ok') ? [no] : no.querySelectorAll ? no.querySelectorAll('.mgf-ok') : [];
    for (var i = 0; i < oks.length; i++) {
      var ok = oks[i];
      if (vistos ? vistos.has(ok) : ok.__mg) continue;
      if (vistos) vistos.add(ok); else ok.__mg = 1;
      var tit = (ok.querySelector('h2') || ok).textContent || '';
      if (/enviad/i.test(tit)) ev('generate_lead', { forma: /ficha/i.test(tit) ? 'ficha' : 'formulario' });
    }
  }
  function observa() {
    if (!document.body || typeof MutationObserver !== 'function') return;
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) confere(ms[i].addedNodes[j]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) observa(); else document.addEventListener('DOMContentLoaded', observa);
})();
