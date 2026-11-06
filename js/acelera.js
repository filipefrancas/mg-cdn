/* MG Peças – Acelera, o assistente do site
   Botão redondo no canto de baixo à direita (acima do WhatsApp) que abre uma conversa curta.
   O Acelera ajuda a achar peça pelo carro ou pelo código, o representante da região e a página certa do site.
   Conversa no Worker mg-depoimentos (rota /acelera). Nada é guardado no servidor: a conversa fica só nesta aba
   (sessionStorage) e some quando a aba fecha.
   Segurança: o texto do servidor entra sempre como texto (nunca HTML); links só para o site da MG e o app MG;
   palavras de venda (preço, frete, desconto...) nunca aparecem (a frase vira "fale com o representante").
   Configuração opcional (Código do selo, antes deste arquivo): window.MG_ACELERA_API = 'https://...'. */
(function () {
  if (window.__mgAcelera) return;
  window.__mgAcelera = 1;

  var API = (window.MG_ACELERA_API || window.MG_CONTATO_API || 'https://mg-depoimentos.filipefrancasilva10.workers.dev') + '/acelera';
  var TURNSTILE_SITEKEY = window.MG_CONTATO_TURNSTILE || '0x4AAAAAAFyjfyGv2JPK5Lw_'; // a mesma do Fale com a MG
  var SITE = 'https://www.mgpecasautomotivas.com.br';
  var HOSTS = ['www.mgpecasautomotivas.com.br', 'mgpecasautomotivas.com.br', 'mgpecasautomotivas.github.io'];
  var CHAVE = 'mg-acelera';
  var MAX_TXT = 500, FALAS = 10, ESPERA_MS = 45000;

  /* nome do assistente: trocar só aqui (e em NOME no Worker) */
  var NOME = 'Assistente MG';
  var T = {
    botao: NOME,
    titulo: NOME,
    sub: 'Ajuda para achar a peça certa',
    abrir: 'Abrir o ' + NOME,
    fechar: 'Fechar o ' + NOME,
    oi: 'Oi! Eu sou o ' + NOME + '. Posso te ajudar a achar uma peça MG pelo seu carro, o representante da sua região ou a página certa do site.',
    chips: ['Achar peça pelo carro', 'Falar com o representante', 'Quero trabalhar na MG'],
    campo: 'Escreva sua pergunta',
    ph: 'Ex.: peças para Gol 2010 1.6',
    enviar: 'Enviar',
    pensando: 'Procurando...',
    rodape: 'O ' + NOME + ' pode errar. Confira a aplicação na página da peça.',
    verPeca: 'Ver a peça',
    voce: 'Você',
    recomecar: 'Começar de novo',
    bloqueado: 'O assistente não está disponível agora. Use a busca do site ou o Fale conosco:',
    pausa: 'O ' + NOME + ' descansou por hoje e volta amanhã. Enquanto isso, estes links ajudam:',
    limite: 'Você mandou muitas mensagens agora. Espere um pouco e tente de novo. Enquanto isso, estes links ajudam:',
    falha: 'Não consegui responder agora. Tente de novo em instantes, ou use estes links:',
    offline: 'Parece que você está sem internet. Sua pergunta continua no campo; tente de novo quando a internet voltar.',
    verificacao: 'Antes de continuar, confirme que você é uma pessoa:',
    verificacaoErro: 'Não deu para confirmar agora. Use estes links:',
    representante: 'A MG vende para distribuidores; fale com o representante da sua região.'
  };
  var LINKS_PADRAO = [
    { titulo: 'Busca por placa ou veículo', url: SITE + '/busca-por-veiculo/' },
    { titulo: 'Representantes', url: SITE + '/representantes/' },
    { titulo: 'Fale com a MG', url: SITE + '/contato/' }
  ];
  var CHIP_LINKS = { 1: { titulo: 'Representantes', url: SITE + '/representantes/' }, 2: { titulo: 'Trabalhe na MG', url: SITE + '/contato/?assunto=trabalhe' } };

  /* mesmas palavras proibidas do Worker: a frase inteira vira a do representante */
  var RE_PROIBIDAS = /(^|[^A-Za-zÀ-ÿ0-9])(comprar|compre|compres|promo[çc][ãa]o|promo[çc][õo]es|descontos?|fretes?|pre[çc]os?|baratos?|baratas?|ofertas?|pix|boletos?|prices?|pricing|discounts?|freight|shipping|precios?|descuentos?)(?![A-Za-zÀ-ÿ0-9])/i;
  /* "pedido" só como venda (fazer/fechar o pedido, pedido mínimo): "pedidos de autoridades" e "esse pedido" ficam */
  var RE_PEDIDO_SA = /(^|[^a-z0-9])((fac[ao]|faz(er|endo|em)?|fech[a-z]*|tir[ae][a-z]*|envi[ae][a-z]*|mand[ae][a-z]*|realiz[a-z]*|coloc[a-z]*|anot[a-z]*)\s+(o\s+|um\s+|seu\s+|sua\s+|teu\s+|o\s+seu\s+|nosso\s+)?pedidos?|pedidos?\s+(minimos?|de\s+(compra|venda|pecas)|pelo\s+(site|whats[a-z]*|zap))|(seu|teu|primeiro)\s+pedido\s+(de\s+)?(compra|pecas))(?![a-z0-9])/;
  /* também sem acento e sem caracteres invisíveis: "preço" com o acento separado (c + U+0327) ou "pre\u200Bço" não escapam */
  var RE_PROIBIDAS_SA = /(^|[^a-z0-9\u00C0-\u024F])(comprar|compre|compres|promocao|promocoes|descontos?|fretes?|precos?|baratos?|baratas?|ofertas?|pix|boletos?|prices?|pricing|discounts?|freight|shipping|precios?|descuentos?)(?![a-z0-9\u00C0-\u024F])/;
  var RE_INVISIVEL = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
  function temVenda(f) {
    var x = String(f || '').replace(RE_INVISIVEL, '');
    if (RE_PROIBIDAS.test(x)) return true;
    if (x.normalize) x = x.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    x = x.toLowerCase();
    return RE_PROIBIDAS_SA.test(x) || RE_PEDIDO_SA.test(x);
  }
  function semVenda(txt) {
    var vistas = {};
    return String(txt || '').split('\n').map(function (linha) {
      var partes = linha.split(/([.!?]+\s+)/), saida = [], i, f;
      for (i = 0; i < partes.length; i += 2) {
        f = partes[i] + (partes[i + 1] || '');
        if (!temVenda(f)) { saida.push(f); continue; }
        if (!vistas.r) { vistas.r = 1; saida.push(T.representante + ' '); }
      }
      return saida.join('').replace(/\s+$/, '');
    }).join('\n');
  }
  function urlOk(u) {
    var a = document.createElement('a'); a.href = u;
    return /^https:$/.test(a.protocol) && HOSTS.indexOf(a.hostname) >= 0 && !a.port && /^https:\/\//.test(u);
  }

  var ICONE = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 5h16v11H9l-5 4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" stroke-width="3"/></svg>';
  var X = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var SETA = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  var CSS = '' +
    '#mg-acelera{--az:#1a73c8;--az2:#155fa6;--azc:#eef6fc;--mar:#000922;--tx:#2b3445;--ci:#5b6576;--bd:#d5deeb;--er:#b3261e;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--tx);font-size:16px;line-height:1.45}' +
    '#mg-acelera *{box-sizing:border-box}#mg-acelera [hidden]{display:none !important}' +
    '#mg-acelera .mga-lanca{position:fixed;right:16px;bottom:96px;z-index:1000;width:64px;height:64px;border-radius:50%;border:0;background:var(--az);color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;box-shadow:0 6px 18px rgba(0,9,34,.28);font:700 11px/1 Inter,system-ui,sans-serif;letter-spacing:.02em;padding:0}' +
    '#mg-acelera .mga-lanca:hover{background:var(--az2)}#mg-acelera .mga-lanca svg{width:24px;height:24px}' +
    '#mg-acelera button:focus-visible,#mg-acelera a:focus-visible,#mg-acelera textarea:focus-visible{outline:3px solid #f2b705;outline-offset:2px}' +
    '#mg-acelera .mga-painel{position:fixed;right:16px;bottom:96px;z-index:1001;width:380px;height:560px;max-height:calc(100vh - 112px);background:#fff;border:1px solid var(--bd);border-radius:16px;box-shadow:0 12px 40px rgba(0,9,34,.25);display:flex;flex-direction:column;overflow:hidden}' +
    '#mg-acelera .mga-cab{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;background:var(--az);color:#fff}' +
    '#mg-acelera .mga-cab-t{flex:1;min-width:0}#mg-acelera .mga-cab h2{margin:0;font:700 18px/1.2 Inter,system-ui,sans-serif;color:#fff}#mg-acelera .mga-cab p{margin:0;font-size:13px;opacity:.92}' +
    '#mg-acelera .mga-ic{width:48px;height:48px;border:0;border-radius:10px;background:transparent;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}#mg-acelera .mga-ic:hover{background:rgba(255,255,255,.16)}' +
    '#mg-acelera .mga-log{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;background:#f6f9fd;overscroll-behavior:contain}' +
    '#mg-acelera .mga-msg{max-width:88%;padding:10px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}' +
    '#mg-acelera .mga-msg p{margin:0}#mg-acelera .mga-msg p+p{margin-top:6px}' +
    '#mg-acelera .mga-a{align-self:flex-start;background:#fff;border:1px solid var(--bd);border-bottom-left-radius:4px}' +
    '#mg-acelera .mga-u{align-self:flex-end;background:var(--az);color:#fff;border-bottom-right-radius:4px}' +
    '#mg-acelera .mga-msg a{color:var(--az2);text-decoration:underline;word-break:break-all}' +
    '#mg-acelera .mga-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '#mg-acelera .mga-chip,#mg-acelera .mga-link{min-height:48px;padding:10px 14px;border-radius:24px;border:1.5px solid var(--az);background:#fff;color:var(--az2);font:600 15px/1.2 Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}' +
    '#mg-acelera .mga-chip:hover,#mg-acelera .mga-link:hover{background:var(--azc)}' +
    '#mg-acelera .mga-links{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:100%}' +
    '#mg-acelera .mga-pecas{list-style:none;margin:0;padding:0;display:grid;gap:8px;align-self:stretch}' +
    '#mg-acelera .mga-peca{background:#fff;border:1px solid var(--bd);border-left:4px solid var(--az);border-radius:10px;padding:10px 12px;display:grid;gap:2px}' +
    '#mg-acelera .mga-cod{font:800 15px/1.2 Inter,system-ui,sans-serif;color:var(--mar)}#mg-acelera .mga-nome{font-weight:600;font-size:15px}' +
    '#mg-acelera .mga-apl{font-size:14px;color:var(--ci)}' +
    '#mg-acelera .mga-ver{justify-self:start;margin-top:4px;min-height:48px;display:inline-flex;align-items:center;padding:0 2px;color:var(--az2);font-weight:700;text-decoration:underline}' +
    '#mg-acelera .mga-pensa{align-self:flex-start;color:var(--ci);font-size:14px;padding:4px 2px}' +
    '#mg-acelera .mga-pensa i{display:inline-block;width:6px;height:6px;margin-left:3px;border-radius:50%;background:var(--ci);animation:mgaP 1s infinite alternate}' +
    '#mg-acelera .mga-pensa i:nth-child(2){animation-delay:.2s}#mg-acelera .mga-pensa i:nth-child(3){animation-delay:.4s}@keyframes mgaP{to{opacity:.2}}' +
    '#mg-acelera .mga-ts{align-self:stretch;background:#fff;border:1px solid var(--bd);border-radius:12px;padding:10px}' +
    '#mg-acelera .mga-form{display:flex;gap:8px;padding:10px 12px 6px;border-top:1px solid var(--bd);background:#fff;align-items:flex-end}' +
    '#mg-acelera .mga-form label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +
    '#mg-acelera textarea{flex:1;min-height:48px;max-height:120px;resize:none;font:16px/1.4 Inter,system-ui,sans-serif;color:var(--tx);border:1.5px solid var(--bd);border-radius:12px;padding:12px}' +
    '#mg-acelera textarea:focus{border-color:var(--az)}' +
    '#mg-acelera .mga-env{width:48px;height:48px;border:0;border-radius:12px;background:var(--az);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}#mg-acelera .mga-env:disabled{opacity:.55;cursor:default}' +
    '#mg-acelera .mga-pe{margin:0;padding:0 12px 10px;background:#fff;font-size:12.5px;color:var(--ci);display:flex;justify-content:space-between;align-items:center;gap:8px}' +
    '#mg-acelera .mga-novo{border:0;background:none;color:var(--az2);text-decoration:underline;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer;min-height:32px;padding:0 4px;flex:none}' +
    '@media (max-width:640px){#mg-acelera .mga-lanca{right:12px;bottom:84px;width:60px;height:60px}' +
    '#mg-acelera .mga-painel{right:0;left:0;bottom:0;top:0;width:auto;height:auto;max-height:none;border-radius:0;border:0}' +
    '#mg-acelera .mga-msg{max-width:92%}}' +
    '@media (prefers-reduced-motion:reduce){#mg-acelera .mga-pensa i{animation:none}}';

  function el(tag, attrs, filhos) {
    var e = document.createElement(tag), k;
    for (k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'svg') e.innerHTML = attrs[k]; /* só os ícones fixos deste arquivo */
      else e.setAttribute(k, attrs[k]);
    }
    (filhos || []).forEach(function (f) { if (f) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
    return e;
  }

  /* ---------- estado (só nesta aba) ---------- */
  var est = { msgs: [], bi: '', aberto: false };
  function le() { try { var j = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); if (j && j.msgs) est = j; } catch (e) { /* ok */ } }
  function grava() { try { sessionStorage.setItem(CHAVE, JSON.stringify({ msgs: est.msgs.slice(-30), bi: est.bi, aberto: est.aberto })); } catch (e) { /* ok */ } }

  var raiz, lanca, painel, log, campo, envBt, ocupado = false, pensaEl = null, tsBox = null, pendente = null;

  /* texto com links do site viram <a> (montado com textContent, nunca HTML) */
  function paragrafos(txt) {
    var frag = document.createDocumentFragment();
    semVenda(txt).split(/\n+/).forEach(function (linha) {
      if (!linha.trim()) return;
      var p = el('p'), re = /https?:\/\/[^\s<>"'()]+/g, ult = 0, m;
      while ((m = re.exec(linha))) {
        var u = m[0].replace(/[.,;:!?]+$/, '');
        p.appendChild(document.createTextNode(linha.slice(ult, m.index)));
        if (urlOk(u)) p.appendChild(el('a', { href: u, text: u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '') }));
        ult = m.index + u.length;
      }
      p.appendChild(document.createTextNode(linha.slice(ult)));
      frag.appendChild(p);
    });
    return frag;
  }
  function cartoes(pecas) {
    var ul = el('ul', { class: 'mga-pecas', 'aria-label': 'Peças encontradas' });
    (pecas || []).slice(0, 12).forEach(function (p) {
      if (!p || !urlOk(p.link)) return;
      ul.appendChild(el('li', { class: 'mga-peca' }, [
        el('span', { class: 'mga-cod', text: String(p.codigo || '') }),
        el('span', { class: 'mga-nome', text: semVenda(p.nome || '') }),
        p.aplicacao ? el('span', { class: 'mga-apl', text: semVenda(p.aplicacao) }) : null,
        el('a', { class: 'mga-ver', href: p.link, text: T.verPeca, 'aria-label': T.verPeca + ' ' + (p.codigo || '') })
      ]));
    });
    return ul.childNodes.length ? ul : null;
  }
  function botoesLinks(links) {
    var d = el('div', { class: 'mga-links' });
    (links || []).slice(0, 4).forEach(function (l) {
      if (!l || !urlOk(l.url)) return;
      d.appendChild(el('a', { class: 'mga-link', href: l.url, text: semVenda(l.titulo || 'Abrir') }));
    });
    return d.childNodes.length ? d : null;
  }
  function pinta(m) {
    if (m.r === 'u') { log.appendChild(el('div', { class: 'mga-msg mga-u' }, [paragrafos(m.t)])); return; }
    var b = el('div', { class: 'mga-msg mga-a' }); b.appendChild(paragrafos(m.t)); log.appendChild(b);
    var c = cartoes(m.pecas); if (c) log.appendChild(c);
    var l = botoesLinks(m.links); if (l) log.appendChild(l);
  }
  function rola() { log.scrollTop = log.scrollHeight; }
  function boasVindas() {
    log.appendChild(el('div', { class: 'mga-msg mga-a' }, [paragrafos(T.oi)]));
    var chips = el('div', { class: 'mga-chips', role: 'group', 'aria-label': 'Sugestões' });
    T.chips.forEach(function (c, i) {
      var b = el('button', { type: 'button', class: 'mga-chip', text: c });
      b.addEventListener('click', function () { manda(c, CHIP_LINKS[i]); });
      chips.appendChild(b);
    });
    log.appendChild(chips);
  }
  function redesenha() {
    log.innerHTML = '';
    boasVindas();
    est.msgs.forEach(pinta);
    rola();
  }

  /* ---------- envio ---------- */
  function pensando(on) {
    if (on && !pensaEl) { pensaEl = el('div', { class: 'mga-pensa', role: 'status' }, [T.pensando, el('i'), el('i'), el('i')]); log.appendChild(pensaEl); rola(); }
    if (!on && pensaEl) { pensaEl.parentNode.removeChild(pensaEl); pensaEl = null; }
  }
  function aviso(txt, links) {
    var m = { r: 'a', t: txt, links: links || LINKS_PADRAO, aviso: 1 };
    pinta(m); rola();
  }
  function manda(txt, linkExtra) {
    txt = String(txt || '').replace(/\s+$/, '').slice(0, MAX_TXT);
    if (!txt.trim() || ocupado) return;
    var m = { r: 'u', t: txt };
    est.msgs.push(m); grava(); pinta(m);
    campo.value = '';
    pede({ linkExtra: linkExtra });
  }
  function pede(o, ts) {
    ocupado = true; envBt.disabled = true; pensando(true);
    var corpo = { msgs: est.msgs.filter(function (m) { return !m.aviso; }).slice(-FALAS).map(function (m) { return { r: m.r, t: m.t }; }) };
    if (est.bi) corpo.bi = est.bi;
    if (ts) corpo.ts = ts;
    var x = new XMLHttpRequest(), fim = false;
    function acaba(status, j) {
      if (fim) return; fim = true;
      ocupado = false; envBt.disabled = false; pensando(false);
      if (status === 200 && j && typeof j.texto === 'string') {
        if (j.bilhete) est.bi = String(j.bilhete);
        var links = j.links || [];
        if (o.linkExtra && !links.some(function (l) { return l.url === o.linkExtra.url; })) links = links.concat([o.linkExtra]);
        var m = { r: 'a', t: j.texto, pecas: j.pecas || [], links: links };
        est.msgs.push(m); grava(); pinta(m); rola();
        return;
      }
      var e = j && j.erro;
      if (e === 'verificacao' && !ts) { verificacao(o); return; }
      if (e === 'verificacao') { aviso(T.verificacaoErro); return; }
      // Bloqueio é do endereço de internet, não do aparelho: só avisa nesta conversa (o servidor decide de novo a cada envio).
      if (e === 'bloqueado') { aviso(T.bloqueado); return; }
      if (e === 'pausa' || e === 'desligado') { aviso(T.pausa); return; }
      if (e === 'limite') { aviso(T.limite); return; }
      if (status === 0 && navigator.onLine === false) { aviso(T.offline, []); return; }
      aviso(T.falha);
    }
    try {
      x.open('POST', API, true);
      x.setRequestHeader('Content-Type', 'application/json');
      x.timeout = ESPERA_MS;
      x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) { /* ok */ } acaba(x.status, j); };
      x.onerror = x.ontimeout = function () { acaba(0, null); };
      x.send(JSON.stringify(corpo));
    } catch (e) { acaba(0, null); }
  }
  /* Turnstile só quando o servidor pede */
  function verificacao(o) {
    if (tsBox) { tsBox.parentNode && tsBox.parentNode.removeChild(tsBox); tsBox = null; }
    tsBox = el('div', { class: 'mga-ts' }, [el('p', { text: T.verificacao, style: 'margin:0 0 8px' })]);
    var alvo = el('div'); tsBox.appendChild(alvo); log.appendChild(tsBox); rola();
    pendente = o;
    function render() {
      try {
        window.turnstile.render(alvo, { sitekey: TURNSTILE_SITEKEY, language: 'pt-br', appearance: 'interaction-only',
          callback: function (tok) { if (tsBox && tsBox.parentNode) tsBox.parentNode.removeChild(tsBox); tsBox = null; var p = pendente; pendente = null; pede(p || {}, tok); },
          'error-callback': function () { aviso(T.verificacaoErro); } });
      } catch (e) { aviso(T.verificacaoErro); }
    }
    if (window.turnstile && window.turnstile.render) { render(); return; }
    var s = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (!s) { s = el('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: '', defer: '' }); document.head.appendChild(s); }
    var n = 0, t = setInterval(function () {
      if (window.turnstile && window.turnstile.render) { clearInterval(t); render(); } else if (++n > 50) { clearInterval(t); aviso(T.verificacaoErro); }
    }, 200);
  }

  /* ---------- abrir, fechar, foco ---------- */
  function focaveis() { return [].slice.call(painel.querySelectorAll('a[href],button:not([disabled]),textarea,iframe,[tabindex]:not([tabindex="-1"])')).filter(function (e) { return e.offsetParent !== null || e === document.activeElement; }); }
  function abre() {
    est.aberto = true; grava();
    painel.hidden = false; lanca.setAttribute('aria-expanded', 'true'); lanca.hidden = window.matchMedia && window.matchMedia('(max-width:640px)').matches;
    redesenha();
    setTimeout(function () { campo.focus(); }, 0);
  }
  function fecha() {
    est.aberto = false; grava();
    painel.hidden = true; lanca.hidden = false; lanca.setAttribute('aria-expanded', 'false');
    lanca.focus();
  }
  function monta() {
    if (!document.getElementById('mga-css')) { var s = el('style', { id: 'mga-css' }); s.textContent = CSS; document.head.appendChild(s); }
    raiz = el('div', { id: 'mg-acelera' });
    lanca = el('button', { type: 'button', class: 'mga-lanca', 'aria-label': T.abrir, 'aria-expanded': 'false', 'aria-controls': 'mga-painel' });
    lanca.appendChild(el('span', { svg: ICONE, 'aria-hidden': 'true', style: 'display:flex' }));
    lanca.appendChild(el('span', { text: T.botao, 'aria-hidden': 'true' }));
    painel = el('div', { id: 'mga-painel', class: 'mga-painel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mga-tit', hidden: '' });
    var x = el('button', { type: 'button', class: 'mga-ic', 'aria-label': T.fechar, svg: X });
    var cab = el('div', { class: 'mga-cab' }, [el('span', { svg: ICONE, 'aria-hidden': 'true', style: 'display:flex' }), el('div', { class: 'mga-cab-t' }, [el('h2', { id: 'mga-tit', text: T.titulo }), el('p', { text: T.sub })]), x]);
    log = el('div', { class: 'mga-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', 'aria-label': 'Conversa com o ' + NOME });
    campo = el('textarea', { id: 'mga-campo', rows: '1', maxlength: String(MAX_TXT), placeholder: T.ph, autocomplete: 'off', enterkeyhint: 'send' });
    envBt = el('button', { type: 'submit', class: 'mga-env', 'aria-label': T.enviar, svg: SETA });
    var form = el('form', { class: 'mga-form', novalidate: '' }, [el('label', { for: 'mga-campo', text: T.campo }), campo, envBt]);
    var novo = el('button', { type: 'button', class: 'mga-novo', text: T.recomecar });
    var pe = el('p', { class: 'mga-pe' }, [el('span', { text: T.rodape }), novo]);
    painel.appendChild(cab); painel.appendChild(log); painel.appendChild(form); painel.appendChild(pe);
    raiz.appendChild(lanca); raiz.appendChild(painel);
    document.body.appendChild(raiz);

    lanca.addEventListener('click', abre);
    x.addEventListener('click', fecha);
    novo.addEventListener('click', function () { if (ocupado) return; est.msgs = []; grava(); redesenha(); campo.focus(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); manda(campo.value); });
    campo.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); manda(campo.value); } });
    campo.addEventListener('input', function () { campo.style.height = 'auto'; campo.style.height = Math.min(120, campo.scrollHeight + 3) + 'px'; });
    /* link do painel (Ver a peça, botões, links do texto) abre a página na mesma aba: o painel não reabre sozinho por cima dela */
    painel.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a && painel.contains(a)) { est.aberto = false; grava(); }
    });
    painel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); fecha(); return; }
      if (e.key !== 'Tab') return;
      var f = focaveis(); if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    le();
    if (est.aberto) abre();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monta); else monta();
})();
