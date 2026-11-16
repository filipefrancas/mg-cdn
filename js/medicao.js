/* MG Peças – medição do site (Google Analytics 4, propriedade G-L8JSM0XDWY)
   Religa o que estava no Google Tag Manager até 05/11/2026: a tag base do GA4 e os eventos de clique.
   Só Google Analytics. Não carrega Google Ads nem pixel de rede social.

   Como convive com o que já existe na página:
   - a Nuvemshop já carrega o gtag.js para OUTRA propriedade, com a fila window.dataLayerTN;
   - o GTM usa a fila window.dataLayer;
   - este arquivo usa uma fila só dele, window.mgDataLayer, e uma função local (mgtag). Não cria, não lê e não
     troca window.dataLayer, window.dataLayerTN nem window.gtag.
   Fila com outro nome, pela documentação do gtag.js ("Rename the data layer"): o endereço do gtag.js leva
   &l=NOME, a fila window[NOME] é criada antes, e a função que alimenta a fila tem de empurrar o próprio objeto
   "arguments" (não uma lista comum): function gtag(){ NOME.push(arguments); }. A função pode ter qualquer nome;
   o gtag.js lê a fila, não a função.

   O que é medido:
   - visualização de página (page_view padrão do "config"). A medição aprimorada da propriedade (rolagem, cliques
     de saída, arquivos baixados, pesquisa no site, formulários) volta sozinha com a tag base.
   - cliques. O clique é anotado na fase de captura e DECIDIDO no fim do caminho dele (janela, fase de bolha),
     depois dos ouvintes da página: assim já se sabe se a página cancelou o clique e qual é o endereço final do
     link (há link que nasce com "#" e só recebe o endereço no próprio clique). Se alguém interromper a
     propagação, a decisão é feita logo em seguida. Ouvintes passivos: nada segura nem atrasa o clique.
       download_catalog  {file_url}         link cujo endereço (domínio + caminho) contém "catalogo": na prática,
                                            links para a página /catalogo/. É o que a definição antiga contava;
                                            o nome e o sentido ficam iguais para a série histórica continuar.
                                            Não conta: âncora da própria página, link de WhatsApp, nem "catalogo"
                                            que só aparece depois do "?". file_url só leva o caminho quando o
                                            link é do próprio site; para outro domínio vai só "https://dominio/".
       download_catalogo_arquivo {file_url, tipo}   os dois botões de baixar o catálogo, tipo "windows" ou "pdf".
                                            Evento novo. Não conta o clique que a página cancelou (no celular,
                                            "Baixar para Windows" abre um aviso em vez de baixar).
       click_whatsapp    {page_location}    link http(s) para wa.me ou api.whatsapp.com COM destinatário
                                            (número ou código no endereço). Link de compartilhar (wa.me/?text=,
                                            sem destinatário) não conta. page_location leva só o caminho da
                                            página (como na definição antiga).
       clique_varejo_ml  {}                 link cujo texto contém "lojas parceiras".
       clique_atacado_rep {tipo}            texto contém "Sou distribuidor"; tipo "link" (como antes) ou "botao"
                                            (o botão da página de contato, que antes não era contado).
       clique_app        {}                 link para o app MG (mgpecasautomotivas.github.io). Evento novo.
   Dado pessoal: nenhum parâmetro NOSSO leva número de telefone, texto de mensagem, texto digitado ou nome. O
   endereço do link do WhatsApp não é enviado em parâmetro nosso (a medição aprimorada do próprio GA4, "cliques
   de saída", registra por conta dela o endereço dos links de saída). file_url vai sem "?..." e sem "#...".

   Não roda: dentro de iframe (prévia do editor do tema, por exemplo), fora do domínio do site, nem em endereços
   de conta, checkout ou painel. Se o gtag.js for bloqueado (bloqueador de anúncios), nada quebra: a fila só
   fica guardada na memória da página. */
(function () {
  'use strict';
  if (window.__mgMedicao) return;                 /* arquivo incluído duas vezes: vale a primeira */
  window.__mgMedicao = 1;

  var ID = 'G-L8JSM0XDWY';
  var FILA = 'mgDataLayer';
  var HOST_APP = 'mgpecasautomotivas.github.io';
  var HOST_CATALOGO = 'filescloud3.ideia2001.com.br';
  var DOMINIO = /(^|\.)mgpecasautomotivas\.com\.br$/i;

  try { if (window.top !== window.self) return; } catch (e) { return; }
  if (!DOMINIO.test(location.hostname)) return;
  if (/^\/(checkout|admin|account)(\/|$)/i.test(location.pathname)) return;

  var fila = window[FILA] = window[FILA] || [];
  function mgtag() { fila.push(arguments); }

  mgtag('js', new Date());
  /* transport_type "beacon": pede o envio que sobrevive à troca de página (no GA4 já é o padrão) */
  mgtag('config', ID, { transport_type: 'beacon' });

  try {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID + '&l=' + FILA;
    s.onerror = function () { /* bloqueado: segue sem medir */ };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) { /* medir nunca atrapalha a página */ }

  function evento(nome, dados) {
    dados = dados || {};
    dados.send_to = ID;
    mgtag('event', nome, dados);
  }

  /* sobe do elemento clicado até achar a tag pedida */
  function sobe(alvo, tag) {
    for (var el = alvo, i = 0; el && el !== document && i < 15; el = el.parentNode, i++) {
      if (el.tagName && el.tagName.toLowerCase() === tag) return el;
    }
    return null;
  }
  function texto(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  function clique(e) {
    var a = sobe(e.target, 'a');
    var bt = sobe(e.target, 'button');
    var href = a && typeof a.href === 'string' ? a.href : '';
    var web = !!href && /^https?:$/.test(a.protocol);
    var host = web ? String(a.hostname).toLowerCase() : '';
    var limpo = web ? a.protocol + '//' + a.host + a.pathname : '';      /* sem ?... e sem #... */
    var proprio = web && DOMINIO.test(host);
    var zap = web && (/(^|\.)wa\.me$/.test(host) || host === 'api.whatsapp.com');
    /* âncora da própria página (href="#", "#topo"): não leva a lugar nenhum */
    var ancora = web && a.host === location.host && a.pathname === location.pathname && a.search === location.search &&
      (!!a.hash || /#$/.test(href));

    /* os dois arquivos do catálogo: só quando o clique vai mesmo adiante */
    if (web && host === HOST_CATALOGO && /\.exe$/i.test(a.pathname)) {
      if (!e.defaultPrevented) evento('download_catalogo_arquivo', { file_url: limpo, tipo: 'windows' });
    } else if (web && host === HOST_CATALOGO && /\.pdf$/i.test(a.pathname)) {
      if (!e.defaultPrevented) evento('download_catalogo_arquivo', { file_url: limpo, tipo: 'pdf' });
    } else if (web && !zap && !ancora && (host + a.pathname).indexOf('catalogo') >= 0) {
      /* como antes: link cujo endereço contém "catalogo" (link para a página do catálogo) */
      evento('download_catalog', { file_url: proprio ? limpo : a.protocol + '//' + a.host + '/' });
    }

    /* WhatsApp com destinatário (representante). Sem destinatário é compartilhar e não conta; whatsapp:// não é http */
    if (zap && (host === 'api.whatsapp.com' ? /[?&]phone=[^&]/.test(a.search) : a.pathname.length > 1)) {
      evento('click_whatsapp', { page_location: location.pathname });
    }

    if (a && texto(a).indexOf('lojas parceiras') >= 0) evento('clique_varejo_ml');

    if (a && texto(a).indexOf('Sou distribuidor') >= 0) evento('clique_atacado_rep', { tipo: 'link' });
    else if (bt && texto(bt).indexOf('Sou distribuidor') >= 0) evento('clique_atacado_rep', { tipo: 'botao' });

    if (web && host === HOST_APP) evento('clique_app');
  }

  /* cliques anotados na captura e ainda não decididos */
  var espera = [];
  function decide(e) {
    var i = espera.indexOf(e);
    if (i < 0) return;
    espera.splice(i, 1);
    try { clique(e); } catch (x) { /* ignora */ }
  }
  try {
    window.addEventListener('click', function (e) {
      espera.push(e);
      setTimeout(function () { decide(e); }, 0);      /* só age se a propagação foi interrompida no caminho */
    }, { capture: true, passive: true });
    window.addEventListener('click', decide, { passive: true });
  } catch (e) { /* ignora */ }
})();
