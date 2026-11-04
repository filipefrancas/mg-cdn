/* Catálogo MG: contador de downloads ao vivo, registro dos downloads, aviso no celular e
   "copiar o link". Usado na página /catalogo/ e na faixa do catálogo da home: atua em todo
   elemento com data-mgcat-api. Se algo aqui falhar, os botões de download continuam
   funcionando normalmente (são links diretos para os arquivos). */
(function () {
  'use strict';
  if (window.__mgcatPronto) return;
  window.__mgcatPronto = true;

  var raizes = [].slice.call(document.querySelectorAll('[data-mgcat-api]'));
  if (!raizes.length) return;

  var API = (raizes[0].getAttribute('data-mgcat-api') || '').replace(/\/+$/, '');
  var CHAVE = 'mgcat-contador-v1';
  var JANELA_MS = 6 * 3600 * 1000;      // igual ao Worker: 1 download de cada tipo por visitante a cada 6 h
  var ATUALIZA_MS = 60 * 1000;          // busca o número de novo a cada 1 min com a página aberta
  var MAX_ATUALIZACOES = 30;
  var ua = navigator.userAgent || '';
  var movel = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var reduz = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function ler(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function gravar(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
  function fmt(n) { return String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function valido(d) {
    return !!d && typeof d.total === 'number' && d.total > 0 &&
      typeof d.windows === 'number' && d.windows > 0 && typeof d.pdf === 'number' && d.pdf > 0;
  }
  function dentro(el) {
    for (var i = 0; i < raizes.length; i++) if (raizes[i].contains(el)) return true;
    return false;
  }
  function todos(sel) {
    var lista = [];
    raizes.forEach(function (r) { lista = lista.concat([].slice.call(r.querySelectorAll(sel))); });
    return lista;
  }

  /* ---------- contador ---------- */
  var alvos = todos('[data-mgcat-contador]');
  var dados = null;
  function campo(el) { return el.getAttribute('data-mgcat-contador') || 'total'; }

  function escrever(el, n) { el._mgv = n; el.textContent = fmt(n); }
  function piscar(el) {
    if (reduz) return;
    el.classList.remove('mgcat-subiu');
    void el.offsetWidth;
    el.classList.add('mgcat-subiu');
  }
  function animar(el, de, para, dur) {
    if (reduz || de === para || !window.requestAnimationFrame) { escrever(el, para); return; }
    var id = (el._mganim || 0) + 1, t0 = null;
    el._mganim = id;
    function passo(t) {
      if (el._mganim !== id) return;
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var v = de + (para - de) * (1 - Math.pow(1 - p, 4));
      if (p < 1) { el._mgv = v; el.textContent = fmt(v); window.requestAnimationFrame(passo); }
      else escrever(el, para);
    }
    window.requestAnimationFrame(passo);
  }

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (itens) {
    itens.forEach(function (it) {
      var el = it.target;
      el._mgvisivel = it.isIntersecting;
      if (it.isIntersecting && el._mgpendente && dados) {
        el._mgpendente = false;
        animar(el, 0, dados[campo(el)], 1800);
      }
    });
  }, { threshold: 0.6 }) : null;
  if (io) alvos.forEach(function (el) { io.observe(el); });

  // deCache: número guardado da visita anterior (aparece na hora, sem animação)
  function aplicar(d, deCache) {
    var novo = { total: d.total, windows: d.windows, pdf: d.pdf };
    if (dados) {
      // nunca anda para trás na mesma visita (o servidor guarda até 1 min em cache)
      novo.total = Math.max(novo.total, dados.total);
      novo.windows = Math.max(novo.windows, dados.windows);
      novo.pdf = Math.max(novo.pdf, dados.pdf);
    }
    dados = novo;
    alvos.forEach(function (el) {
      var v = dados[campo(el)];
      if (!(v > 0)) return;
      if (typeof el._mgv === 'number') {
        if (v > Math.round(el._mgv)) { animar(el, el._mgv, v, 900); piscar(el); }
        return;
      }
      if (el._mgpendente) return; // vai contar quando aparecer na tela
      if (deCache || reduz || !io) { escrever(el, v); return; }
      if (el._mgvisivel) animar(el, 0, v, 1800);
      else el._mgpendente = true;
    });
  }

  var buscas = 0, ultimaBusca = 0;
  function buscar() {
    if (!API || !window.fetch || buscas >= MAX_ATUALIZACOES) return;
    buscas++;
    ultimaBusca = Date.now();
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    fetch(API + '/contador', { mode: 'cors', credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!valido(d)) return;
        // grava sempre o que o servidor mandou: se um número for corrigido para baixo, a próxima visita já mostra o certo
        gravar(CHAVE, { total: d.total, windows: d.windows, pdf: d.pdf, em: Date.now() });
        aplicar(d, false);
      })
      .catch(function () { /* fica o número que já está na tela */ })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  var guardado = ler(CHAVE);
  if (valido(guardado)) aplicar(guardado, true);
  buscar();
  setInterval(function () { if (!document.hidden) buscar(); }, ATUALIZA_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && Date.now() - ultimaBusca > ATUALIZA_MS) buscar();
  });

  /* ---------- registrar o download ---------- */
  function avisarWorker(tipo) {
    if (!API) return;
    var url = API + '/baixou?tipo=' + encodeURIComponent(tipo);
    try {
      if (window.fetch) {
        fetch(url, { method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true }).catch(function () {});
        return;
      }
    } catch (e) { /* tenta o beacon */ }
    try { if (navigator.sendBeacon) navigator.sendBeacon(url); } catch (e) { /* sem contagem, download segue */ }
  }

  function registrar(tipo) {
    var k = 'mgcat-baixou-' + tipo, ultimo = ler(k);
    if (typeof ultimo === 'number' && Date.now() - ultimo < JANELA_MS) return; // já contou esta visita
    gravar(k, Date.now());
    avisarWorker(tipo);
    if (!dados) return;
    dados.total += 1;
    dados[tipo] += 1;
    alvos.forEach(function (el) {
      var c = campo(el);
      if ((c !== 'total' && c !== tipo) || typeof el._mgv !== 'number') return;
      animar(el, el._mgv, dados[c], 700);
      piscar(el);
    });
  }

  function lidarClique(ev) {
    if (ev.type === 'auxclick' && ev.button !== 1) return;
    var a = ev.target && ev.target.closest ? ev.target.closest('[data-mgcat-baixar]') : null;
    if (!a || !dentro(a)) return;
    var tipo = a.getAttribute('data-mgcat-baixar');
    if (tipo !== 'pdf' && tipo !== 'windows') return;
    if (tipo === 'windows' && movel && ev.type === 'click' && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
      ev.preventDefault();
      abrirAviso(a.href);
      return;
    }
    registrar(tipo);
  }
  document.addEventListener('click', lidarClique);
  document.addEventListener('auxclick', lidarClique);

  /* ---------- copiar o link ---------- */
  function copiarAntigo(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try { ta.setSelectionRange(0, texto.length); } catch (e) { /* ok */ }
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  // feito(true) = copiou; feito(false) = não deu, mostra o link para copiar à mão
  function copiar(texto, feito) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(copiarAntigo(texto)); });
    } else feito(copiarAntigo(texto));
  }
  function mostrarLink(depoisDe, texto) {
    garantirCss();
    var prox = depoisDe.nextElementSibling;
    if (prox && prox.className === 'mgcat-aviso-link') { prox.focus(); prox.select(); return; }
    var campoLink = document.createElement('input');
    campoLink.className = 'mgcat-aviso-link';
    campoLink.type = 'text';
    campoLink.readOnly = true;
    campoLink.value = texto;
    campoLink.setAttribute('aria-label', 'Link do instalador');
    depoisDe.parentNode.insertBefore(campoLink, depoisDe.nextSibling);
    campoLink.focus();
    campoLink.select();
  }

  var linkExe = (todos('[data-mgcat-baixar="windows"]')[0] || {}).href || '';
  var linkPdf = (todos('[data-mgcat-baixar="pdf"]')[0] || {}).href || '';

  todos('[data-mgcat-copiar]').forEach(function (b) {
    var original = b.textContent;
    b.addEventListener('click', function () {
      if (!linkExe) return;
      copiar(linkExe, function (ok) {
        if (!ok) { mostrarLink(b.parentNode, linkExe); return; }
        b.textContent = 'Link copiado!';
        setTimeout(function () { b.textContent = original; }, 2500);
      });
    });
  });

  /* ---------- aviso no celular ao tocar em "Baixar para Windows" ---------- */
  var CSS_AVISO = '.mgcat-aviso{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:480px;margin:0 auto;padding:18px 18px 16px;border-radius:14px;background:#fff;color:#000922;border-top:4px solid #3498db;box-shadow:0 18px 50px rgba(0,9,34,.35);font:15px/1.45 "Barlow",system-ui,Arial,sans-serif;box-sizing:border-box;text-align:left;animation:mgcat-sobe .25s ease-out}' +
    '.mgcat-aviso *{box-sizing:border-box}' +
    '.mgcat-aviso p{margin:0 28px 12px 0;font:inherit;color:inherit}' +
    '.mgcat-aviso p b{display:block;margin-bottom:2px;font:700 17px/1.15 "Barlow Condensed","Barlow",sans-serif;text-transform:uppercase;letter-spacing:.03em}' +
    '.mgcat-aviso .mgcat-aviso-acoes{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.mgcat-aviso .mgcat-aviso-acoes button,.mgcat-aviso .mgcat-aviso-acoes a{display:flex;align-items:center;justify-content:center;min-height:46px;margin:0;padding:0 12px;border-radius:8px;border:2px solid #3498db;background:#3498db;color:#fff;font:700 14px/1.1 "Barlow Condensed","Barlow",sans-serif;text-transform:uppercase;letter-spacing:.05em;text-decoration:none;text-align:center;cursor:pointer}' +
    '.mgcat-aviso .mgcat-aviso-acoes .sec{background:#fff;color:#2a7fbf}' +
    '.mgcat-aviso .mgcat-aviso-ok{margin:10px 0 0;font-size:14px;color:#1d6aa8;font-weight:600}' +
    '.mgcat-aviso-link{display:block;width:100%;margin:10px 0 0;padding:8px 10px;border:1px solid #d9e1ea;border-radius:6px;font:13px/1.3 ui-monospace,Consolas,monospace;color:#000922;background:#f5f8fb}' +
    '.mgcat-aviso .mgcat-aviso-mesmo{display:inline-block;margin-top:10px;font-size:13px;color:#5b6472;text-decoration:underline}' +
    '.mgcat-aviso .mgcat-aviso-x{position:absolute;top:8px;right:8px;width:36px;height:36px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#5b6472;font:400 26px/1 Arial,sans-serif;cursor:pointer}' +
    '@keyframes mgcat-sobe{0%{transform:translateY(16px);opacity:0}100%{transform:none;opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.mgcat-aviso{animation:none}}';
  function garantirCss() {
    if (document.getElementById('mgcat-aviso-css')) return;
    var st = document.createElement('style');
    st.id = 'mgcat-aviso-css';
    st.textContent = CSS_AVISO;
    document.head.appendChild(st);
  }

  var aviso = null, focoAntes = null;
  function fecharAviso() {
    if (!aviso) return;
    if (aviso.parentNode) aviso.parentNode.removeChild(aviso);
    aviso = null;
    document.removeEventListener('keydown', teclaAviso);
    if (focoAntes && focoAntes.focus) { try { focoAntes.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
  }
  function teclaAviso(ev) { if (ev.key === 'Escape') fecharAviso(); }
  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
  }
  function abrirAviso(href) {
    fecharAviso();
    garantirCss();
    focoAntes = document.activeElement;
    aviso = criar('div', 'mgcat-aviso');
    aviso.setAttribute('role', 'dialog');
    aviso.setAttribute('aria-modal', 'false');
    aviso.setAttribute('aria-label', 'Catálogo MG para Windows');

    var p = criar('p');
    p.appendChild(criar('b', '', 'Este é o catálogo para computador'));
    p.appendChild(document.createTextNode('O instalador funciona no Windows. Mande o link para o computador do balcão ou baixe o PDF para ver no celular.'));
    aviso.appendChild(p);

    var acoes = criar('div', 'mgcat-aviso-acoes');
    var podeEnviar = typeof navigator.share === 'function';
    var bEnviar = criar('button', '', podeEnviar ? 'Enviar o link' : 'Copiar o link');
    bEnviar.type = 'button';
    acoes.appendChild(bEnviar);
    if (linkPdf) {
      var aPdf = criar('a', 'sec', 'Baixar o PDF');
      aPdf.href = linkPdf;
      aPdf.target = '_blank';
      aPdf.rel = 'noopener';
      aPdf.addEventListener('click', function () { registrar('pdf'); fecharAviso(); });
      acoes.appendChild(aPdf);
    }
    aviso.appendChild(acoes);

    var ok = criar('p', 'mgcat-aviso-ok');
    ok.hidden = true;
    ok.setAttribute('role', 'status');
    aviso.appendChild(ok);

    var mesmo = criar('a', 'mgcat-aviso-mesmo', 'Baixar o instalador mesmo assim');
    mesmo.href = href;
    mesmo.rel = 'noopener';
    mesmo.addEventListener('click', function () { registrar('windows'); fecharAviso(); });
    aviso.appendChild(mesmo);

    var x = criar('button', 'mgcat-aviso-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Fechar');
    x.addEventListener('click', fecharAviso);
    aviso.appendChild(x);

    function confirmar(texto) { ok.textContent = texto; ok.hidden = false; }
    bEnviar.addEventListener('click', function () {
      if (podeEnviar) {
        navigator.share({ title: 'Catálogo MG para Windows', text: 'Instalador do catálogo MG Peças Automotivas para Windows:', url: href })
          .then(function () { confirmar('Pronto. Abra o link no computador para instalar.'); }, function () { /* cancelou */ });
        return;
      }
      copiar(href, function (copiou) {
        if (copiou) confirmar('Link copiado. Mande para o computador (WhatsApp Web ou e-mail) e abra lá para baixar.');
        else mostrarLink(acoes, href);
      });
    });
    document.addEventListener('keydown', teclaAviso);

    document.body.appendChild(aviso);
    try { bEnviar.focus({ preventScroll: true }); } catch (e) { bEnviar.focus(); }
  }

  /* ---------- tela do notebook (página do catálogo): se a imagem não carregar, usa a capa ---------- */
  var tela = todos('[data-mgcat-tela]')[0];
  function reserva() {
    if (!tela || tela._mgres) return;
    tela._mgres = true;
    var capa = todos('.mgcat-capa img')[0];
    if (!capa) return;
    tela.src = capa.currentSrc || capa.src;
    tela.parentNode.classList.add('mgcat-note-capa');
  }
  if (tela) {
    tela.addEventListener('error', reserva);
    if (tela.complete && tela.getAttribute('src') && tela.naturalWidth === 0) reserva();
  }
})();
