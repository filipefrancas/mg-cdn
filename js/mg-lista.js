/* MG Peças – "Minha lista" no site (a mesma ideia do app)
   Carregado em todas as páginas pelo "Código do selo" do Rodapé (jsDelivr fixo por commit).
   - Página de produto: botão secundário pequeno "Adicionar à lista" logo abaixo do código/OEM.
   - Ícone de lista no cabeçalho (no lugar do carrinho das lojas), com o número de peças, só quando a lista tem itens; abre a gaveta.
   - A lista fica só no aparelho (localStorage "mg-lista-site"); dá para enviar pelo WhatsApp
     (sem número de destino), copiar o texto ou limpar. Sem preço, sem pedido, sem contato da MG.
   O CSS (css/mg-lista.css) é carregado do mesmo commit deste arquivo. */
(function () {
  if (window.__mgLista) return;
  window.__mgLista = 1;

  var CHAVE = 'mg-lista-site';
  var SITE = 'https://mgpecasautomotivas.com.br';
  var COD = /\bMG-?[A-Z]?\d+[A-Z]?\b/i;
  var eu = document.currentScript && document.currentScript.src;

  /* ---------- dados ---------- */
  function le() {
    try {
      var l = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      return Array.isArray(l) ? l.filter(function (i) { return i && i.c && i.q > 0; }) : [];
    } catch (e) { return []; }
  }
  function grava(l) {
    try { localStorage.setItem(CHAVE, JSON.stringify(l)); } catch (e) {}
    pinta();
  }
  function total(l) { return l.reduce(function (s, i) { return s + i.q; }, 0); }
  function acha(l, c) { for (var k = 0; k < l.length; k++) if (l[k].c === c) return k; return -1; }

  function texto(l) {
    var d = new Date();
    var dia = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    var linhas = ['Lista de peças MG · ' + dia, ''];
    l.forEach(function (i) { linhas.push(i.q + ' un. · ' + i.c + (i.n ? ' · ' + i.n : '')); });
    linhas.push('', 'Catálogo MG Peças Automotivas', SITE);
    return linhas.join('\n');
  }

  /* ---------- utilidades ---------- */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function txt(e) { return (e && e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function meta(p) { var e = document.querySelector('meta[property="' + p + '"],meta[name="' + p + '"]'); return e ? e.content : ''; }
  var ICO = {
    lista: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
    mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    menos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    lixo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true" class="mgl-cheio"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    copia: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>'
  };

  /* ---------- CSS ---------- */
  function css() {
    if (!eu || document.getElementById('mg-lista-css')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.id = 'mg-lista-css';
    l.href = eu.replace(/js\/mg-lista(\.min)?\.js(\?.*)?$/, 'css/mg-lista.css');
    document.head.appendChild(l);
  }

  /* ---------- aviso (toast) ---------- */
  var toastEl, toastT;
  function aviso(msg, acao, fn, ms) {
    if (!toastEl) {
      toastEl = el('div', 'mgl-toast');
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '';
    toastEl.appendChild(el('span', 'mgl-toast-msg', msg));
    if (acao) {
      var b = el('button', 'mgl-toast-acao', acao);
      b.type = 'button';
      b.addEventListener('click', function () { esconde(); fn(); });
      toastEl.appendChild(b);
    }
    toastEl.style.bottom = (aberta() ? 150 : acimaCookies() + 16) + 'px';
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(esconde, ms || (acao ? 6000 : 2500));
    function esconde() { toastEl.classList.remove('on'); }
  }

  /* ---------- produto: botão "Adicionar à minha lista" ---------- */
  var prod = null, caixaProd = null;
  function lerProduto() {
    var h = document.querySelector('h1.js-product-name');
    if (!h) return null;
    var badge = h.querySelector('.mg-badge') || document.querySelector('.mg-badge');
    var og = meta('og:title') || txt(h);
    var c = txt(badge).match(COD);
    c = (c && c[0]) || (og.match(/\s[-–]\s(MG[A-Z0-9-]+)\s*$/i) || [])[1] || (og.match(COD) || [''])[0];
    if (!c) return null;
    c = c.toUpperCase();
    var tit = h.querySelector('.mg-h1-tit');
    var n = txt(tit) || og.replace(/\s[-–]\s*MG[A-Z0-9-]+\s*$/i, '').trim();
    var f = meta('og:image:secure_url') || meta('og:image');
    f = f ? f.replace(/^http:/, 'https:').replace(/-\d+-\d+\.(webp|jpe?g|png)(\?.*)?$/i, '-240-0.$1') : '';
    var u = ((document.querySelector('link[rel="canonical"]') || {}).href || location.href).split(/[?#]/)[0];
    return { c: c, n: n, f: f, u: u };
  }

  function botaoProduto() {
    if (caixaProd || !/^\/produtos\/[^/]+\/?$/.test(location.pathname)) return !!caixaProd;
    var h = document.querySelector('h1.js-product-name');
    if (!h) return false;
    /* espera o selo do código (GTM) por até 6 s; depois usa o og:title */
    if (!h.querySelector('.mg-badge') && Date.now() - inicio < 6000) return false;
    prod = lerProduto();
    if (!prod) return true;
    caixaProd = el('div', 'mgl-add');
    var b = el('button', 'mgl-add-btn');
    b.type = 'button';
    b.innerHTML = ICO.lista + '<span>Adicionar à lista</span>';
    b.addEventListener('click', function () {
      var l = le(), k = acha(l, prod.c);
      if (k < 0) l.push({ c: prod.c, n: prod.n, f: prod.f, u: prod.u, q: 1 });
      else { l[k].q += 1; l[k].n = l[k].n || prod.n; l[k].f = prod.f || l[k].f; l[k].u = prod.u; }
      grava(l);
      aviso('Na lista · ' + prod.c, 'Ver lista', abre, 3000);
    });
    var info = el('p', 'mgl-add-info');
    var ver = el('button', 'mgl-link', 'Ver lista');
    ver.type = 'button';
    ver.addEventListener('click', abre);
    caixaProd.appendChild(b);
    caixaProd.appendChild(info);
    caixaProd.__info = info;
    caixaProd.__ver = ver;
    var ref = document.querySelector('.mg-oem') || h;
    ref.parentNode.insertBefore(caixaProd, ref.nextSibling);
    pinta();
    return true;
  }

  /* ---------- ícone no cabeçalho (onde as lojas põem o carrinho) + gaveta ---------- */
  var cab, cabN, gaveta, fundo, corpo, vazio, ultimoFoco, desfaz;
  function monta() {
    cab = el('button', 'mgl-cab');
    cab.type = 'button';
    cab.innerHTML = ICO.lista;
    cabN = el('span', 'mgl-cab-n');
    cab.appendChild(cabN);
    cab.addEventListener('click', abre);

    fundo = el('div', 'mgl-fundo');
    fundo.addEventListener('click', fecha);
    gaveta = el('aside', 'mgl-gaveta');
    gaveta.setAttribute('role', 'dialog');
    gaveta.setAttribute('aria-modal', 'true');
    gaveta.setAttribute('aria-labelledby', 'mgl-titulo');
    gaveta.tabIndex = -1;
    var topo = el('div', 'mgl-topo');
    var t = el('h2', 'mgl-titulo', 'Minha lista');
    t.id = 'mgl-titulo';
    var x = el('button', 'mgl-fechar');
    x.type = 'button';
    x.setAttribute('aria-label', 'Fechar a lista');
    x.innerHTML = ICO.x;
    x.addEventListener('click', fecha);
    topo.appendChild(t);
    topo.appendChild(x);
    var nota = el('p', 'mgl-nota', 'Fica salva só neste aparelho. Envie pelo WhatsApp para quem você quiser.');
    corpo = el('ul', 'mgl-itens');
    vazio = el('p', 'mgl-vazio', 'Sua lista está vazia. Na página de uma peça, toque em "Adicionar à minha lista".');
    var acoes = el('div', 'mgl-acoes');
    var wa = el('a', 'mgl-b mgl-b-wa');
    wa.innerHTML = ICO.wa + '<span>Enviar pelo WhatsApp</span>';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.href = '#';
    wa.addEventListener('click', function (e) {
      var l = le();
      if (!l.length) { e.preventDefault(); return; }
      wa.href = 'https://wa.me/?text=' + encodeURIComponent(texto(l));
    });
    var cp = el('button', 'mgl-b mgl-b-sec');
    cp.type = 'button';
    cp.innerHTML = ICO.copia + '<span>Copiar texto</span>';
    cp.addEventListener('click', copiar);
    var lp = el('button', 'mgl-b mgl-b-limpa');
    lp.type = 'button';
    lp.innerHTML = ICO.lixo + '<span>Limpar lista</span>';
    lp.addEventListener('click', function () {
      var antes = le();
      if (!antes.length) return;
      grava([]);
      aviso('Lista limpa', 'Desfazer', function () { grava(antes); });
    });
    acoes.appendChild(wa);
    acoes.appendChild(cp);
    acoes.appendChild(lp);
    gaveta.appendChild(topo);
    gaveta.appendChild(nota);
    gaveta.appendChild(corpo);
    gaveta.appendChild(vazio);
    gaveta.appendChild(acoes);
    gaveta.addEventListener('keydown', teclas);
    posCab();
    document.body.appendChild(fundo);
    document.body.appendChild(gaveta);
  }

  function copiar() {
    var t = texto(le());
    function ok() { aviso('Texto copiado'); }
    function velho() {
      var a = el('textarea');
      a.value = t;
      a.setAttribute('readonly', '');
      a.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      gaveta.appendChild(a);
      a.select();
      try { document.execCommand('copy'); ok(); } catch (e) { aviso('Não deu para copiar'); }
      a.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, velho);
    else velho();
  }

  function itemEl(i) {
    var li = el('li', 'mgl-item');
    li.dataset.c = i.c;
    var a = el('a', 'mgl-foto');
    a.href = i.u || ('/produtos/' + i.c.toLowerCase() + '/');
    a.tabIndex = -1;
    a.setAttribute('aria-hidden', 'true');
    if (i.f) {
      var img = el('img');
      img.src = i.f;
      img.alt = '';
      img.width = 56;
      img.height = 56;
      img.loading = 'lazy';
      img.onerror = function () { img.remove(); };
      a.appendChild(img);
    }
    var tx = el('div', 'mgl-tx');
    var lk = el('a', 'mgl-cod', i.c);
    lk.href = a.href;
    tx.appendChild(lk);
    if (i.n) tx.appendChild(el('span', 'mgl-nome', i.n));
    var qt = el('div', 'mgl-qtd');
    var me = el('button', 'mgl-q');
    me.type = 'button';
    me.innerHTML = ICO.menos;
    me.setAttribute('aria-label', 'Tirar 1 de ' + i.c);
    me.disabled = i.q <= 1;
    var n = el('span', 'mgl-n', String(i.q));
    n.setAttribute('aria-label', i.q + ' unidades');
    var ma = el('button', 'mgl-q');
    ma.type = 'button';
    ma.innerHTML = ICO.mais;
    ma.setAttribute('aria-label', 'Pôr mais 1 de ' + i.c);
    me.addEventListener('click', function () { muda(i.c, -1); });
    ma.addEventListener('click', function () { muda(i.c, 1); });
    qt.appendChild(me);
    qt.appendChild(n);
    qt.appendChild(ma);
    var rm = el('button', 'mgl-rm');
    rm.type = 'button';
    rm.innerHTML = ICO.x;
    rm.setAttribute('aria-label', 'Remover ' + i.c + ' da lista');
    rm.addEventListener('click', function () { remove(i.c); });
    li.appendChild(a);
    li.appendChild(tx);
    li.appendChild(qt);
    li.appendChild(rm);
    return li;
  }

  function muda(c, d) {
    var l = le(), k = acha(l, c);
    if (k < 0) return;
    l[k].q = Math.max(1, Math.min(999, l[k].q + d));
    grava(l);
    foca('[data-c="' + c + '"] .mgl-q:' + (d > 0 ? 'last-of-type' : 'first-of-type'));
  }
  function remove(c) {
    var l = le(), k = acha(l, c);
    if (k < 0) return;
    desfaz = { i: l[k], k: k };
    l.splice(k, 1);
    grava(l);
    foca('.mgl-rm') || foca('.mgl-fechar');
    aviso(c + ' removido', 'Desfazer', function () {
      var m = le();
      if (!desfaz || acha(m, desfaz.i.c) >= 0) return;
      m.splice(Math.min(desfaz.k, m.length), 0, desfaz.i);
      grava(m);
    });
  }
  function foca(sel) {
    var e = gaveta && gaveta.querySelector(sel);
    if (e && !e.disabled) { e.focus(); return true; }
    return false;
  }

  function pinta() {
    var l = le(), n = total(l);
    if (cab) {
      cabN.textContent = l.length > 99 ? '99+' : String(l.length);
      cab.setAttribute('aria-label', 'Minha lista: ' + l.length + (l.length === 1 ? ' peça' : ' peças') + ', ' + n + ' un.');
      document.documentElement.classList.toggle('mgl-tem', l.length > 0);
    }
    if (corpo) {
      corpo.innerHTML = '';
      l.forEach(function (i) { corpo.appendChild(itemEl(i)); });
      vazio.style.display = l.length ? 'none' : '';
      gaveta.classList.toggle('mgl-sem', !l.length);
    }
    if (caixaProd && prod) {
      var k = acha(l, prod.c), info = caixaProd.__info;
      info.innerHTML = '';
      if (k >= 0) {
        info.appendChild(document.createTextNode('Na sua lista: ' + l[k].q + ' un. · '));
        info.appendChild(caixaProd.__ver);
      }
    }
  }

  /* altura ocupada embaixo pelo aviso de cookies (o aviso da lista fica acima dele) */
  function acimaCookies() {
    var ck = document.querySelector('.js-notification-cookie-private');
    if (!ck || !ck.offsetHeight || getComputedStyle(ck).display === 'none') return 0;
    var r = ck.getBoundingClientRect();
    return r.top < innerHeight ? innerHeight - r.top : 0;
  }

  /* PC: dentro da caixa da busca, à direita (o campo encolhe o mesmo tanto, o menu não se mexe); celular: canto direito, na altura do menu */
  function posCab() {
    var menu = document.querySelector('.menu-container .header-icon');
    var celular = menu && menu.offsetWidth > 0;
    var busca = document.querySelector('.js-head-main .js-search-container');
    var linha = document.querySelector('.js-head-main .head-row');
    var alvo = celular ? linha : busca;
    if (!alvo) { if (cab.parentNode !== document.body) document.body.appendChild(cab); cab.classList.add('mgl-cab-solto'); return; }
    cab.classList.remove('mgl-cab-solto');
    cab.classList.toggle('mgl-cab-cel', !!celular);
    if (celular) { if (cab.parentNode !== linha) linha.appendChild(cab); }
    else if (cab.parentNode !== busca) busca.appendChild(cab);
  }
  function aberta() { return gaveta && gaveta.classList.contains('on'); }
  function abre() {
    if (!gaveta) return;
    ultimoFoco = document.activeElement;
    pinta();
    gaveta.classList.add('on');
    fundo.classList.add('on');
    document.documentElement.classList.add('mgl-trava');
    setTimeout(function () { (gaveta.querySelector('.mgl-fechar') || gaveta).focus(); }, 30);
  }
  function fecha() {
    if (!aberta()) return;
    gaveta.classList.remove('on');
    fundo.classList.remove('on');
    document.documentElement.classList.remove('mgl-trava');
    pinta();
    if (ultimoFoco && ultimoFoco.focus && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); fecha(); return; }
    if (e.key !== 'Tab') return;
    var f = [].filter.call(gaveta.querySelectorAll('a[href],button:not([disabled])'), function (x) { return x.offsetParent && x.tabIndex >= 0; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  /* ---------- início ---------- */
  var inicio = Date.now();
  function inicia() {
    css();
    monta();
    pinta();
    if (!botaoProduto()) {
      var mo = new MutationObserver(function () { if (botaoProduto()) mo.disconnect(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { botaoProduto(); mo.disconnect(); }, 6500);
    }
    window.addEventListener('storage', function (e) { if (e.key === CHAVE) pinta(); });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(posCab, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
