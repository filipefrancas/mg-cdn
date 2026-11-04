/* MG Peças – SEO no navegador (dados estruturados e títulos)
   Carregado no fim de todas as páginas pelo "Código do selo" do Rodapé.
   1. Produto: JSON-LD Product (nome completo, código MG, OEM, aplicação, foto, marca; nota das avaliações do ML se AVAL).
      Sem offers/preço: a MG não vende pelo site.
   2. Listas (home, categorias, busca): tira os Product que o tema gera com preço "0".
   3. Produto: o H1 volta a ter código + nome + carro (o GTM "MG site - produto e lista" separa em selo / título / subtítulo;
      aqui o selo e o subtítulo entram dentro do H1, com a mesma aparência).
   4. Catálogo e Avaliações: o título do bloco vira H2 (fica 1 H1 por página, o do tema).
   5. Busca do cabeçalho visível sem aria-hidden (leitor de tela alcança a busca).
   6. Página 404 e busca sem resultado ganham caminhos (placa, veículo, produtos, catálogo).
   7. Tira " - comprar online" do texto alternativo das fotos e "Compre online" do título de /produtos/.
   8. Produto: o H3 "Aplicação" passa a nível 2 para leitor de tela (aria-level), sem mudar a aparência.
   9. Rodapé: o endereço vira link "Como chegar" para o Google Maps. */
(function () {
  if (window.__mgSeo) return;
  window.__mgSeo = 1;
  /* VER = commit dos dados de avaliações (o mesmo do avaliacoes.js) */
  var VER = 'd6378b9b62a657c660a5151cd781e54c37b5fc6e';
  var DADOS_PROD = 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-cdn@' + VER + '/dados/avaliacoes_produtos.json';
  /* AVAL = põe a nota das avaliações (Mercado Livre) no JSON-LD do produto. Ver LEIA-ME antes de ligar. */
  var AVAL = false; /* Filipe 27/10: sem estrelas do ML para o Google (no site as avaliações continuam) */
  var MARCA = { '@type': 'Brand', name: 'MG Peças Automotivas' };
  var COD = /\bMG-?[A-Z]?\d+[A-Z]?\b/i;

  function meta(p) { var e = document.querySelector('meta[property="' + p + '"],meta[name="' + p + '"]'); return e ? e.content : ''; }
  function txt(e) { return (e && e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function ld(o, id) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    if (id) s.id = id;
    s.textContent = JSON.stringify(o);
    document.head.appendChild(s);
  }
  function lds() {
    return [].map.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) {
      try { return { el: s, j: JSON.parse(s.textContent) }; } catch (e) { return { el: s, j: null }; }
    });
  }

  /* ---------- 2. listas: Product com preço 0 ---------- */
  function limpaListas() {
    lds().forEach(function (x) {
      var j = x.j;
      if (j && j['@type'] === 'Product' && j.offers && String(j.offers.price) === '0') x.el.remove();
    });
  }

  /* ---------- 2b. produto: o WebPage do tema traz um Product com preço "0" em mainEntity;
     vira só uma referência ao nosso Product (sem preço), para o Google ver um produto só ---------- */
  function limpaWebPage(url) {
    lds().forEach(function (x) {
      var j = x.j;
      if (!j || j['@type'] !== 'WebPage' || !j.mainEntity || j.mainEntity['@type'] !== 'Product') return;
      j.mainEntity = { '@id': url + '#produto' };
      x.el.textContent = JSON.stringify(j);
    });
  }

  /* ---------- 1. produto: JSON-LD ---------- */
  function produtoLd(nota) {
    var nome = meta('og:title') || txt(document.querySelector('.js-product-name'));
    var c = (nome.match(/\s[-–]\s(MG[A-Z0-9-]+)\s*$/i) || nome.match(COD) || [])[1] || (nome.match(COD) || [''])[0];
    c = c.toUpperCase();
    var url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href.split('?')[0];
    var desc = document.querySelector('.js-product-description');
    var oem = '';
    var carros = [];
    if (desc) {
      [].forEach.call(desc.querySelectorAll('p'), function (p) {
        var t = txt(p);
        if (!oem && /OEM|originais?/i.test(t) && t.indexOf(':') > 0) oem = t.slice(t.indexOf(':') + 1).trim();
      });
      [].forEach.call(desc.querySelectorAll('tbody tr'), function (tr) {
        var td = [].map.call(tr.querySelectorAll('td'), txt).filter(Boolean);
        if (td.length) carros.push({ '@type': 'Car', name: td.join(' ') });
      });
    }
    var imgs = [];
    var og = meta('og:image:secure_url') || meta('og:image').replace(/^http:/, 'https:');
    if (og) imgs.push(og.replace(/-\d+-0\.webp$/, '-1024-1024.webp'));
    var cats = [];
    lds().forEach(function (x) {
      var b = x.j && x.j.breadcrumb;
      if (b && b.itemListElement) b.itemListElement.forEach(function (i, k, L) { if (i.position > 1 && k < L.length - 1) cats.push(i.name); });
    });
    var p = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': url + '#produto',
      name: nome,
      url: url,
      sku: c,
      mpn: c,
      brand: MARCA,
      manufacturer: { '@type': 'Organization', name: 'MG Peças Automotivas', url: 'https://mgpecasautomotivas.com.br/' },
      description: meta('description') || meta('og:description'),
      image: imgs
    };
    if (cats.length) p.category = cats.join(' > ');
    if (oem) p.additionalProperty = [{ '@type': 'PropertyValue', name: 'Código original (OEM)', value: oem }];
    if (carros.length) p.isAccessoryOrSparePartFor = carros;
    if (nota && nota.n > 0 && nota.media) {
      p.aggregateRating = { '@type': 'AggregateRating', ratingValue: Math.round(nota.media * 10) / 10, bestRating: 5, worstRating: 1, reviewCount: nota.n };
      var rev = (nota.itens || []).filter(function (a) { return a.autor && a.texto; }).slice(0, 5).map(function (a) {
        return { '@type': 'Review', author: { '@type': 'Person', name: a.autor }, reviewBody: a.texto,
          reviewRating: { '@type': 'Rating', ratingValue: a.estrelas || 5, bestRating: 5, worstRating: 1 } };
      });
      if (rev.length) p.review = rev;
    }
    var velho = document.getElementById('mg-ld-produto');
    if (velho) velho.remove();
    ld(p, 'mg-ld-produto');
    limpaWebPage(url);
    return c;
  }

  function produto() {
    var c = produtoLd(null);
    if (!AVAL || !c || !window.fetch) return;
    fetch(DADOS_PROD).then(function (r) { return r.ok ? r.json() : {}; }).then(function (P) {
      var nota = P && P[c];
      if (nota) produtoLd(nota);
    }).catch(function () {});
  }

  /* ---------- 3. produto: H1 completo ---------- */
  /* o GTM separa título e carro na 1ª montadora da lista dele, que não tem Ram, Mini, Troller, Scania...;
     aqui o corte vai para a 1ª montadora de uma lista maior (o texto todo continua o mesmo) */
  var MONTADORAS = /\b(Alfa Romeo|Audi|BMW|BYD|Caoa|Case|Chana|Changan|Chery|Chevrolet|Chrysler|Citro[eë]n|Daewoo|DFSK|Dodge|Effa|Fiat|Ford|Geely|GM|GWM|Hafei|Haval|Honda|Hyundai|Iveco|JAC|Jaguar|Jeep|Kia|Lada|Land Rover|Lexus|Lifan|Mahindra|Mazda|Mercedes|Mini|Mitsubishi|New Holland|Nissan|Peugeot|Porsche|Ram|Renault|Scania|Seat|Shineray|Smart|SsangYong|Subaru|Suzuki|Toyota|Troller|Volare|Volkswagen|VW|Volvo)\b/;
  function corteMontadora(h) {
    var s = h.nextElementSibling;
    if (!(s && s.classList.contains('mg-sub'))) s = null;
    var tudo = (txt(h) + (s ? ' ' + txt(s) : '')).trim();
    var m = tudo.match(MONTADORAS);
    if (!m || m.index === 0) return;
    var tit = tudo.slice(0, m.index).replace(/[\s,;]+$/, ''), sub = tudo.slice(m.index);
    if (tit === txt(h)) return;
    h.textContent = tit;
    if (!s) {
      s = document.createElement('div');
      s.className = 'mg-sub';
      h.insertAdjacentElement('afterend', s);
    }
    s.textContent = sub;
  }

  function h1Produto() {
    var h = document.querySelector('h1.js-product-name[data-mg]');
    if (!h || h.dataset.mgSeo) return !!h;
    h.dataset.mgSeo = '1';
    corteMontadora(h);
    var b = h.previousElementSibling, s = h.nextElementSibling;
    if (!(b && b.classList.contains('mg-badge'))) b = null;
    if (!(s && s.classList.contains('mg-sub'))) s = null;
    var antes = [b, s].map(estilo);
    var depoisDeS = s ? s.nextElementSibling : null;
    var gapSub = s ? top(s) - fundo(h) : 0, gapFim = s && depoisDeS ? top(depoisDeS) - fundo(s) : 0;
    var titulo = document.createElement('span');
    titulo.className = 'mg-h1-tit';
    while (h.firstChild) titulo.appendChild(h.firstChild);
    if (b) { h.appendChild(b); h.appendChild(document.createTextNode(' ')); }
    h.appendChild(titulo);
    if (s) { h.appendChild(document.createTextNode(' ')); h.appendChild(s); }
    /* o que o selo e o subtítulo herdavam do lugar antigo continua igual (dentro do H1 herdariam a fonte do título) */
    [b, s].forEach(function (e, i) {
      if (!e) return;
      var d = estilo(e);
      HERDA.forEach(function (k) { if (d[k] !== antes[i][k]) e.style.setProperty(k, antes[i][k]); });
    });
    /* espaçamento: as margens do subtítulo agora ficam dentro do H1; repõe as distâncias medidas antes */
    if (s) {
      s.style.marginTop = (parseFloat(getComputedStyle(s).marginTop) + gapSub - (top(s) - fundo(titulo))) + 'px';
      s.style.marginBottom = '0px';
      if (depoisDeS) {
        h.style.marginBottom = gapFim + 'px';
        var dif = gapFim - (top(depoisDeS) - fundo(s));
        if (Math.abs(dif) > 0.5) h.style.marginBottom = (gapFim + dif) + 'px';
      }
    }
    return true;
  }
  function top(e) { return e.getBoundingClientRect().top; }
  function fundo(e) { return e.getBoundingClientRect().bottom; }
  var HERDA = ['font-family', 'font-weight', 'font-size', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-transform', 'color', 'text-align', 'white-space'];
  function estilo(e) {
    var o = {};
    if (!e) return o;
    var cs = getComputedStyle(e);
    HERDA.forEach(function (k) { o[k] = cs.getPropertyValue(k); });
    return o;
  }

  /* ---------- 4. 2º H1 vira H2 ---------- */
  function rebaixa(sel) {
    [].forEach.call(document.querySelectorAll(sel), function (h) {
      var n = document.createElement('h2');
      for (var i = 0; i < h.attributes.length; i++) n.setAttribute(h.attributes[i].name, h.attributes[i].value);
      n.classList.add('mg-h1');
      while (h.firstChild) n.appendChild(h.firstChild);
      h.parentNode.replaceChild(n, h);
    });
  }

  function css() {
    var s = document.createElement('style');
    s.id = 'mg-seo-css';
    s.textContent = [
      /* selo e subtítulo dentro do H1 do produto: mesma aparência de quando ficavam fora */
      'h1.js-product-name .mg-badge{display:table}',
      'h1.js-product-name .mg-h1-tit,h1.js-product-name .mg-sub{display:block}',
      /* títulos de bloco que eram H1 */
      'h2.mg-h1{font-family:"Barlow Condensed","Sora",sans-serif!important;font-weight:800!important}',
      '.mgcat h2.mg-h1{font-size:44px}',
      '@media (max-width:900px){.mgcat h2.mg-h1{font-size:36px}}',
      '@media (max-width:480px){.mgcat h2.mg-h1{font-size:30px}}',
      '.mgav-hero h2.mg-h1{font-size:52px;line-height:1;color:#fff;text-transform:uppercase}',
      '@media (max-width:991px){.mgav-hero h2.mg-h1{font-size:42px}}',
      '@media (max-width:640px){.mgav-hero h2.mg-h1{font-size:34px}}',
      /* caminhos na 404 e na busca sem resultado */
      '.mg-caminhos{margin:16px 0 24px;font-family:Inter,sans-serif}',
      '.mg-caminhos p{margin:0 0 12px;font-size:15px;line-height:1.4;color:#4a5568}',
      '.mg-caminhos ul{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}',
      '.mg-caminhos a{display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;border:1px solid #3498db;border-radius:6px;background:#fff;color:#1a73c8;font:600 14px/1.2 Inter,sans-serif;text-decoration:none}',
      '@media (hover:hover){.mg-caminhos a:hover{background:#eef6fc}}',
      '.mg-caminhos a:focus-visible{outline:3px solid #000922;outline-offset:2px}',
      /* rodapé: endereço com link para o mapa */
      '.mgf-dados a.mg-mapa{display:inline-flex;align-items:center;gap:4px;color:inherit;text-decoration:underline;text-underline-offset:2px}',
      '.mgf-dados a.mg-mapa svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:2}',
      '@media (hover:hover){.mgf-dados a.mg-mapa:hover{color:#1a73c8}}',
      /* Contato: Como chegar */
      '.mg-como-chegar{margin:24px 0 0;padding:16px 18px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-family:Inter,sans-serif}',
      '.mg-como-chegar h2{margin:0 0 6px;font:800 22px/1.1 "Barlow Condensed","Sora",sans-serif;text-transform:uppercase;color:#000922}',
      '.mg-como-chegar p{margin:0 0 12px;font-size:15px;color:#2d3748}',
      '.mg-cc-bts{display:flex;flex-wrap:wrap;gap:8px}',
      '.mg-cc-bts a{display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;border:1px solid #3498db;border-radius:6px;background:#fff;color:#1a73c8;font:600 14px/1.2 Inter,sans-serif;text-decoration:none}',
      '@media (hover:hover){.mg-cc-bts a:hover{background:#eef6fc}}',
      '.mg-cc-bts a:focus-visible{outline:3px solid #000922;outline-offset:2px}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- 5. acessibilidade: a busca fica sempre à vista (CSS do tema MG), mas o tema deixa
     aria-hidden="true" na caixa e o leitor de tela não chega nela; tira enquanto ela estiver visível ---------- */
  function buscaAcessivel() {
    [].forEach.call(document.querySelectorAll('.js-search-expand-form'), function (f) {
      function ajusta() {
        if (f.getAttribute('aria-hidden') === 'true' && f.offsetWidth > 0 && getComputedStyle(f).visibility !== 'hidden') f.removeAttribute('aria-hidden');
      }
      ajusta();
      new MutationObserver(ajusta).observe(f, { attributes: true, attributeFilter: ['aria-hidden'] });
      window.addEventListener('resize', ajusta);
    });
  }

  /* ---------- 6. página não encontrada (404) e busca sem resultado: caminhos para achar a peça ---------- */
  function caminhos() {
    var h = document.querySelector('h1');
    if (!h || document.getElementById('mg-caminhos')) return;
    var t = txt(h);
    var e404 = /\b404\b/.test(t);
    var vazia = /^\/search\/?$/.test(location.pathname) && /n[ãa]o encontramos/i.test(t);
    if (!e404 && !vazia) return;
    var box = document.createElement('div');
    box.id = 'mg-caminhos';
    box.className = 'mg-caminhos';
    var p = document.createElement('p');
    p.textContent = e404
      ? 'O endereço pode ter mudado. Encontre a peça por um destes caminhos:'
      : 'Dica: digite só o código MG (ex.: 001 ou MG001), o código original da peça ou o carro. Ou procure por:';
    box.appendChild(p);
    var ul = document.createElement('ul');
    [['Busca por placa', '/busca-por-veiculo/'], ['Busca pelo veículo', '/busca-por-veiculo/'], ['Todos os produtos', '/produtos/'], ['Catálogo', '/catalogo/']].forEach(function (l) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = l[1];
      a.textContent = l[0];
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    /* 404: depois de "A página que você procura não existe."; busca vazia: depois de "Escreva de outro jeito..." */
    var depois = e404
      ? document.querySelector('.error-page-subtitle') || h.closest('section')
      : [].filter.call(document.querySelectorAll('main p, p'), function (x) { return /escreva de outro jeito/i.test(txt(x)); })[0];
    if (!depois || !depois.parentNode) return;
    depois.parentNode.insertBefore(box, depois.nextSibling);
  }

  /* ---------- 7. sem palavra de venda: o tema põe " - comprar online" no texto alternativo das fotos
     e "Compre online produtos de..." no título da página /produtos/ ---------- */
  function semVenda() {
    [].forEach.call(document.querySelectorAll('img[alt]'), function (i) {
      var a = i.getAttribute('alt');
      if (/\s*-\s*comprar online\s*$/i.test(a)) i.setAttribute('alt', a.replace(/\s*-\s*comprar online\s*$/i, ''));
    });
  }
  function tituloProdutos() {
    if (/^\/produtos\/?$/.test(location.pathname) && /^compre online/i.test(document.title)) document.title = 'Todos os produtos | MG Peças Automotivas';
  }

  /* ---------- 8. produto: "APLICAÇÃO" vem como H3 logo depois do H1 (pula o nível 2);
     para leitor de tela passa a ser nível 2, sem mudar a aparência ---------- */
  function nivelAplicacao() {
    [].forEach.call(document.querySelectorAll('.js-product-description h3'), function (h) {
      if (/^aplica[çc][ãa]o$/i.test(txt(h)) && !h.hasAttribute('aria-level')) h.setAttribute('aria-level', '2');
    });
  }

  /* ---------- 9. rodapé: o endereço vira link "Como chegar" (Google Maps; no celular abre o app de mapas) ---------- */
  var MAPA = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('MG Peças Automotivas, Av. Casa Grande, 1534, Diadema - SP');
  function comoChegar() {
    var d = document.querySelector('.mgf-dados');
    if (!d) return false;
    if (d.querySelector('.mg-mapa')) return true;
    var sp = [].filter.call(d.querySelectorAll('span'), function (s) { return /Casa Grande/.test(txt(s)); })[0];
    if (!sp) return true;
    var a = document.createElement('a');
    a.className = 'mg-mapa';
    a.href = MAPA;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', txt(sp) + ' – ver no mapa');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';
    a.appendChild(document.createTextNode(txt(sp) + ' · Como chegar'));
    sp.textContent = '';
    sp.appendChild(a);
    return true;
  }

  /* página Contato: bloco "Como chegar" com o endereço e os botões do Google Maps e do Waze (sem mapa embutido) */
  function comoChegarContato() {
    if (!/^\/contato\/?$/.test(location.pathname)) return;
    var c = document.querySelector('.contact-info-container');
    if (!c || document.getElementById('mg-como-chegar')) return;
    var end = 'Av. Casa Grande, 1534, Galpão B, Diadema-SP';
    var waze = 'https://waze.com/ul?q=' + encodeURIComponent('Av. Casa Grande, 1534, Diadema - SP') + '&navigate=yes';
    var box = document.createElement('div');
    box.id = 'mg-como-chegar';
    box.className = 'mg-como-chegar';
    box.innerHTML = '<h2>Como chegar</h2><p>' + end + '</p>' +
      '<div class="mg-cc-bts"><a href="' + MAPA + '" target="_blank" rel="noopener">Abrir no Google Maps</a>' +
      '<a href="' + waze + '" target="_blank" rel="noopener">Abrir no Waze</a></div>';
    c.appendChild(box);
  }

  function vigia(fn, ms) {
    if (fn()) return;
    var mo = new MutationObserver(function () { if (fn()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, ms || 15000);
  }

  function inicia() {
    css();
    buscaAcessivel();
    caminhos();
    tituloProdutos();
    semVenda();
    [1000, 3000, 6000].forEach(function (ms) { setTimeout(semVenda, ms); });
    /* o rodapé é montado (e às vezes refeito) pelo script do tema: reaplica o link enquanto a página carrega */
    vigia(function () { comoChegar(); return false; }, 15000);
    document.addEventListener('DOMContentLoaded', comoChegar);
    window.addEventListener('load', comoChegar);
    comoChegarContato();
    var ehProduto = !!document.querySelector('.js-product-name') && /^\/produtos\/[^/]+\/?$/.test(location.pathname);
    if (ehProduto) {
      produto();
      nivelAplicacao();
      vigia(h1Produto);
    } else {
      limpaListas();
    }
    var p = location.pathname;
    if (/^\/catalogo\/?$/.test(p)) vigia(function () { rebaixa('.mgcat h1'); return false; }, 8000);
    if (/^\/avaliacoes\/?$/.test(p)) vigia(function () { var h = document.querySelector('.mgav-hero h1'); if (h) rebaixa('.mgav-hero h1'); return !!h; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
