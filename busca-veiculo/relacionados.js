/* Outras peças MG para o seu carro — bloco da página do produto (MG Peças Automotivas)
   Uso no tema (product.tpl): <div id="mg-relacionados" data-codigo="{{ product.sku }}" data-base="URL_DOS_DADOS/" data-loja="" data-busca="/busca-por-veiculo/"></div>
   + busca-veiculo.css + <script src=".../relacionados.js" defer><\/script>
   Se data-codigo vier vazio, o código é lido do título da página (termina em "- MGxxxx"). */
(function () {
  var raiz = document.getElementById('mg-relacionados'); if (!raiz) return;
  var BASE = raiz.getAttribute('data-base') || '';
  var LOJA = raiz.getAttribute('data-loja') || '';
  var BUSCA = raiz.getAttribute('data-busca') || '/busca-por-veiculo/';
  var POR_FILA = parseInt(raiz.getAttribute('data-max') || '12', 10);
  var codigo = (raiz.getAttribute('data-codigo') || '').trim().toUpperCase();
  if (!codigo) { var m = document.title.match(/\b(MG[-A-Z0-9]*\d[-A-Z0-9]*)\b/i); if (m) codigo = m[1].toUpperCase(); }
  if (!codigo) return;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'text') e.textContent = attrs[k]; else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c === null || c === undefined || c === '') return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function sa(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function slug(s) { return sa(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function carregar(url) { return fetch(url, { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); }); }
  function cil(m) { var r = String(m || '').match(/\b\d\.\d\b/g); return r ? r : []; }
  function inter(a, b) { for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) return true; return false; }
  function anoTexto(a) {
    var y1 = a[1], y2 = a[2];
    if (y1 === 0 && y2 === 9999) return 'todos os anos';
    if (y2 === 9999) return y1 + ' em diante';
    if (y1 === 0) return 'até ' + y2;
    return y1 === y2 ? String(y1) : y1 + ' a ' + y2;
  }
  function fam(t) { return sa(t).replace(/[^a-z0-9]+/g, ' ').trim().split(' ')[0] || 'outros'; }

  var indice, produtos, imagens, meuIdx = -1;
  function fotoEl(idx, alt) {
    var src = null;
    if (imagens && imagens.itens && imagens.itens[idx]) { var v = imagens.itens[idx]; src = /^(https?:)?\/\//.test(v) ? v : (imagens.base || '') + v + (imagens.sufixo || ''); }
    var box = el('span', { class: 'mgbv-foto' + (src ? '' : ' sem') });
    if (src) box.appendChild(el('img', { src: src, alt: alt || '', loading: 'lazy', width: '400', height: '220' }));
    else box.appendChild(el('span', { class: 'mgbv-foto-txt', text: 'Foto em breve' }));
    return box;
  }
  function card(idx, sub, chip) {
    var p = produtos[idx];
    return el('a', { class: 'mgrel-card', href: LOJA + '/produtos/' + p[2] + '/' }, [
      fotoEl(idx, p[1] + ' ' + p[0]),
      el('span', { class: 'mgbv-cod', text: p[0] }),
      el('span', { class: 'mgrel-nome', text: p[1] }),
      sub ? el('span', { class: 'mgrel-sub', text: sub }) : null,
      chip ? el('span', { class: 'mgbv-chip verificar', text: 'Confirme o motor' }) : null
    ]);
  }
  function carrossel(cards) {
    var trilho = el('div', { class: 'mgrel-trilho' }, cards);
    var esq = el('button', { class: 'mgrel-seta esq', type: 'button', 'aria-label': 'Anterior', text: '◀' });
    var dir = el('button', { class: 'mgrel-seta dir', type: 'button', 'aria-label': 'Próximo', text: '▶' });
    esq.addEventListener('click', function () { trilho.scrollBy({ left: -trilho.clientWidth * 0.8, behavior: 'smooth' }); });
    dir.addEventListener('click', function () { trilho.scrollBy({ left: trilho.clientWidth * 0.8, behavior: 'smooth' }); });
    return el('div', { class: 'mgrel-carrossel' }, [esq, trilho, dir]);
  }

  Promise.all([carregar(BASE + 'indice.json'), carregar(BASE + 'produtos.json'), carregar(BASE + 'imagens.json').catch(function () { return null; })]).then(function (r) {
    indice = r[0]; produtos = r[1]; imagens = r[2];
    for (var i = 0; i < produtos.length; i++) if (produtos[i][0] === codigo) { meuIdx = i; break; }
    if (meuIdx < 0) return;
    var marcas = Object.keys(indice.marcas);
    return Promise.all(marcas.map(function (mc) { return carregar(BASE + 'marcas/' + slug(mc) + '.json').then(function (d) { return [mc, d]; }); }));
  }).then(function (lista) {
    if (!lista) return;
    // veículos em que esta peça vai
    var meus = []; // {marca, modelo, linhas:[...]}
    lista.forEach(function (par) {
      var mc = par[0], d = par[1];
      Object.keys(d).forEach(function (mod) {
        var linhas = d[mod].filter(function (l) { return l[0] === meuIdx; });
        if (linhas.length) meus.push({ marca: mc, modelo: mod, linhas: linhas, todas: d[mod] });
      });
    });
    if (!meus.length) return;
    // relacionados por veículo
    var veics = [];
    meus.forEach(function (v) {
      var best = {}, sub = {};
      v.todas.forEach(function (l) {
        var j = l[0]; if (j === meuIdx) return;
        v.linhas.forEach(function (ml) {
          if (l[1] <= ml[2] && l[2] >= ml[1]) {
            var a = cil(l[3]), b = cil(ml[3]);
            var sc = (a.length && b.length) ? (inter(a, b) ? 2 : 0) : 1;
            if (sc > (best[j] || 0)) { best[j] = sc; sub[j] = l; }
          }
        });
      });
      var rel = Object.keys(best).filter(function (j) { return best[j] > 0; }).map(function (j) { return { i: +j, sc: best[j], l: sub[j] }; });
      if (!rel.length) return;
      rel.sort(function (x, y) { return (y.sc - x.sc) || String(produtos[x.i][1]).localeCompare(String(produtos[y.i][1])); });
      var fams = {}, pick = [], resto = [];
      rel.forEach(function (x) { var f = fam(produtos[x.i][1]); if (!fams[f] && pick.length < POR_FILA) { fams[f] = 1; pick.push(x); } else resto.push(x); });
      while (pick.length < POR_FILA && resto.length) pick.push(resto.shift());
      var y1 = Math.min.apply(null, v.linhas.map(function (l) { return l[1]; })), y2 = Math.max.apply(null, v.linhas.map(function (l) { return l[2]; }));
      var mots = []; v.linhas.forEach(function (l) { cil(l[3]).forEach(function (c) { if (mots.indexOf(c) < 0) mots.push(c); }); });
      veics.push({ marca: v.marca, modelo: v.modelo, total: rel.length, pick: pick, faixa: anoTexto([0, y1, y2]) + (mots.length ? ' · motor ' + mots.join(' / ') : '') });
    });
    if (!veics.length) return;
    veics.sort(function (a, b) { return b.total - a.total; });

    var nomes = veics.map(function (v) { return v.marca + ' ' + v.modelo; });
    var intro = nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1] : nomes[0];
    var faixaEl = el('span', { class: 'mgrel-faixa' });
    var verN = el('b'), verV = el('span'), verTodas = el('a', { class: 'mgrel-ver', href: '#' }, ['Ver todas as ', verN, ' peças para ', verV, ' ▶']);
    var chips = el('div', { class: 'mgrel-chips' });
    var painel = el('div');
    raiz.classList.add('mgrel');
    raiz.appendChild(el('h2', { class: 'mgrel-titulo', text: 'Outras peças MG para o seu carro' }));
    raiz.appendChild(el('p', { class: 'mgrel-intro' }, [
      'A ', el('b', { text: codigo }), ' vai no ' + intro + '. Aqui aparecem só peças do ', el('b', { text: 'mesmo carro, mesmos anos e mesmo motor' }), ', as que entram na mesma revisão. ', faixaEl
    ]));
    raiz.appendChild(el('div', { class: 'mgrel-barra' }, [chips, verTodas]));
    raiz.appendChild(painel);

    function mostrar(k) {
      var v = veics[k];
      Array.prototype.forEach.call(chips.children, function (c, i) { c.classList.toggle('on', i === k); });
      faixaEl.textContent = v.modelo + ' ' + v.faixa;
      verN.textContent = v.total; verV.textContent = v.marca + ' ' + v.modelo;
      verTodas.href = LOJA + BUSCA + '#veiculo=' + encodeURIComponent(v.marca) + '|' + encodeURIComponent(v.modelo) + '|';
      painel.innerHTML = '';
      var cards = v.pick.map(function (x) { return card(x.i, v.modelo + ' ' + (x.l[3] ? x.l[3] + ' · ' : '') + anoTexto(x.l), x.sc === 1); });
      cards.push(el('a', { class: 'mgrel-card mais', href: verTodas.href }, [el('span', { class: 'mgrel-mais-n', text: v.total }), el('span', { class: 'mgrel-mais-t', text: 'peças MG para ' + v.marca + ' ' + v.modelo }), el('span', { class: 'mgrel-mais-b', text: 'Ver todas →' })]));
      painel.appendChild(carrossel(cards));
    }
    veics.forEach(function (v, k) {
      var b = el('button', { class: 'mgrel-chip', type: 'button' }, [v.marca + ' ' + v.modelo + ' ', el('small', { text: String(v.total) })]);
      b.addEventListener('click', function () { mostrar(k); });
      chips.appendChild(b);
    });
    mostrar(0);

    // mesma família
    var tipo = produtos[meuIdx][1], f0 = fam(tipo);
    var familia = [];
    for (var i = 0; i < produtos.length && familia.length < POR_FILA; i++) if (i !== meuIdx && produtos[i][3] && fam(produtos[i][1]) === f0 && produtos[i][1] === tipo) familia.push(i);
    if (familia.length >= 3) {
      raiz.appendChild(el('div', { class: 'mgrel-sep' }));
      raiz.appendChild(el('h2', { class: 'mgrel-titulo', text: 'Da mesma família: ' + tipo.toLowerCase() }));
      raiz.appendChild(el('p', { class: 'mgrel-intro', text: 'Outras peças MG do mesmo tipo, para outros carros.' }));
      raiz.appendChild(carrossel(familia.map(function (i) { return card(i, '', false); })));
    }
  }).catch(function (e) { if (window.console) console.warn('mg-relacionados', e); });
})();
