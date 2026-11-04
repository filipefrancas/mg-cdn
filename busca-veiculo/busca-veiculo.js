/* Buscador por veículo e por placa — MG Peças Automotivas
   Uso no tema: <div id="mg-busca-veiculo" data-base="URL_DOS_DADOS/" data-placa-url="URL_DO_WORKER"></div>
   + <link rel="stylesheet" href=".../busca-veiculo.css"> + <script src=".../busca-veiculo.js" defer><\/script>
   Dados: indice.json (marcas e modelos), produtos.json, marcas/<marca>.json (aplicações). */
(function () {
  'use strict';
  var raiz = document.getElementById('mg-busca-veiculo');
  if (!raiz) return;
  var BASE = raiz.getAttribute('data-base') || '';
  var PLACA_URL = raiz.getAttribute('data-placa-url') || '';
  var LOJA = raiz.getAttribute('data-loja') || '';
  var ANO_ATUAL = new Date().getFullYear() + 1;

  var indice = null, produtos = null, cacheMarcas = {};

  function sa(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function slug(s) { return sa(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
    return e;
  }
  function carregar(url) {
    return fetch(url, { cache: 'default' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  var imagens = null;
  function dadosBase() {
    if (indice && produtos) return Promise.resolve();
    var pImg = carregar(BASE + 'imagens.json').catch(function () { return null; });
    return Promise.all([carregar(BASE + 'indice.json'), carregar(BASE + 'produtos.json'), pImg]).then(function (r) { indice = r[0]; produtos = r[1]; imagens = r[2]; });
  }
  function fotoDe(idx) {
    if (!imagens || !imagens.itens) return null;
    var v = imagens.itens[idx]; if (!v) return null;
    if (/^(https?:)?\/\//.test(v)) return v;
    return (imagens.base || '') + v + (imagens.sufixo || '');
  }
  function fotoEl(idx, alt) {
    var src = fotoDe(idx);
    var box = el('span', { class: 'mgbv-foto' + (src ? '' : ' sem') });
    if (src) box.appendChild(el('img', { src: src, alt: alt || '', loading: 'lazy', width: '400', height: '220' }));
    else box.appendChild(el('span', { class: 'mgbv-foto-txt', text: 'Foto em breve' }));
    return box;
  }
  function dadosMarca(marca) {
    if (cacheMarcas[marca]) return Promise.resolve(cacheMarcas[marca]);
    return carregar(BASE + 'marcas/' + slug(marca) + '.json').then(function (d) { cacheMarcas[marca] = d; return d; });
  }

  /* ---------- UI ---------- */
  raiz.classList.add('mgbv');

  var selMarca = el('select', { id: 'mgbv-marca' }), selModelo = el('select', { id: 'mgbv-modelo', disabled: '' }),
      selAno = el('select', { id: 'mgbv-ano', disabled: '' }), selMotor = el('select', { id: 'mgbv-motor', disabled: '' });
  var btnBuscar = el('button', { class: 'mgbv-btn', type: 'button', id: 'mgbv-buscar', text: 'Buscar peças' });
  var painelVeic = el('div', { id: 'mgbv-painel-veiculo', class: 'mgbv-bloco' }, [
    el('div', { class: 'mgbv-titulo', text: 'Escolha o veículo' }),
    el('div', { class: 'mgbv-linha' }, [
      el('div', { class: 'mgbv-campo' }, [el('label', { for: 'mgbv-marca', text: 'Marca' }), selMarca]),
      el('div', { class: 'mgbv-campo' }, [el('label', { for: 'mgbv-modelo', text: 'Modelo' }), selModelo]),
      el('div', { class: 'mgbv-campo' }, [el('label', { for: 'mgbv-ano', text: 'Ano' }), selAno]),
      el('div', { class: 'mgbv-campo' }, [el('label', { for: 'mgbv-motor', text: 'Motor' }), selMotor]),
      el('div', { class: 'mgbv-campo' }, [btnBuscar])
    ]),
    el('p', { class: 'mgbv-nota', text: 'Ano e motor são opcionais. A lista vem da tabela de aplicação de cada peça MG.' })
  ]);

  var inPlaca = el('input', { type: 'text', id: 'mgbv-placa', class: 'mgbv-placa', maxlength: '8', placeholder: 'ABC1D23', autocomplete: 'off', inputmode: 'text', 'aria-label': 'Placa do veículo' });
  var btnPlaca = el('button', { class: 'mgbv-btn', type: 'button', id: 'mgbv-buscar-placa', text: 'Buscar pela placa' });
  function placaIlustracao() {
    var w = el('div', { class: 'mgbv-placa-ilustra', 'aria-hidden': 'true' });
    w.innerHTML = '<svg viewBox="0 0 200 66" width="200" height="66" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="1" y="1" width="198" height="64" rx="6" fill="#fff" stroke="#1d1d1b" stroke-width="2"/>' +
      '<path d="M1 7a6 6 0 0 1 6-6h186a6 6 0 0 1 6 6v11H1z" fill="#0b3b8c"/>' +
      '<text x="100" y="14" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="10" letter-spacing="1.5" fill="#fff">BRASIL</text>' +
      '<rect x="6" y="4" width="14" height="10" fill="#009c3b"/><path d="M13 5l6 4-6 4-6-4z" fill="#ffdf00"/><circle cx="13" cy="9" r="2.3" fill="#002776"/>' +
      '<circle cx="187" cy="9" r="5.5" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M183 10.5c1.5-1 6.5-1 8 0" stroke="#fff" stroke-width="1" fill="none"/>' +
      '<text x="100" y="54" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="32" letter-spacing="3" fill="#1d1d1b">MGP2E26</text>' +
      '<text x="12" y="62" font-family="Arial,sans-serif" font-size="5" fill="#1d1d1b">BR</text></svg>';
    return w;
  }
  var painelPlaca = el('div', { id: 'mgbv-painel-placa', class: 'mgbv-bloco' }, [
    el('div', { class: 'mgbv-titulo', text: 'Digite a placa' }),
    el('div', { class: 'mgbv-placa-wrap' }, [
      placaIlustracao(),
      el('div', { class: 'mgbv-campo' }, [el('label', { for: 'mgbv-placa', text: 'Placa (antiga ou Mercosul)' }), inPlaca]),
      btnPlaca
    ]),
    el('p', { class: 'mgbv-nota', text: 'Identificamos marca, modelo, ano e motor pela placa e mostramos as peças MG compatíveis. Nenhum dado do proprietário é consultado.' })
  ]);
  var status = el('div', { class: 'mgbv-status', id: 'mgbv-status', role: 'status' });
  var res = el('div', { class: 'mgbv-res', id: 'mgbv-res' });
  var ou = el('div', { class: 'mgbv-ou', 'aria-hidden': 'true' }, [el('span', { text: 'ou' })]);
  if (PLACA_URL) { raiz.appendChild(painelPlaca); raiz.appendChild(ou); }
  raiz.appendChild(painelVeic); raiz.appendChild(status); raiz.appendChild(res);

  function mostrarAba() { /* placa e veículo ficam na mesma tela */ }

  function setStatus(msg, tipo) {
    status.className = 'mgbv-status' + (msg ? ' on' : '') + (tipo ? ' ' + tipo : '');
    status.innerHTML = ''; if (msg) status.appendChild(typeof msg === 'string' ? document.createTextNode(msg) : msg);
  }
  function opcoes(sel, lista, placeholder) {
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: placeholder }));
    lista.forEach(function (o) { sel.appendChild(el('option', { value: o.v, text: o.t })); });
  }

  /* ---------- carga inicial ---------- */
  opcoes(selMarca, [], 'Carregando…'); selMarca.disabled = true;
  dadosBase().then(function () {
    var marcas = Object.keys(indice.marcas).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    opcoes(selMarca, marcas.map(function (m) { return { v: m, t: m }; }), 'Escolha a marca');
    selMarca.disabled = false;
    opcoes(selModelo, [], 'Escolha a marca primeiro'); opcoes(selAno, [], 'Todos'); opcoes(selMotor, [], 'Todos');
  }).catch(function (e) { setStatus('Não foi possível carregar a lista de veículos. Tente novamente em instantes.', 'erro'); console.error(e); });

  selMarca.addEventListener('change', function () {
    var m = selMarca.value; res.innerHTML = ''; setStatus('');
    selAno.disabled = selMotor.disabled = true; opcoes(selAno, [], 'Todos'); opcoes(selMotor, [], 'Todos');
    if (!m) { opcoes(selModelo, [], 'Escolha a marca primeiro'); selModelo.disabled = true; return; }
    var modelos = indice.marcas[m].slice().sort(function (a, b) { return a.localeCompare(b, 'pt-BR', { numeric: true }); });
    opcoes(selModelo, modelos.map(function (x) { return { v: x, t: x }; }), 'Escolha o modelo');
    selModelo.disabled = false; selModelo.focus();
    dadosMarca(m);
  });
  selModelo.addEventListener('change', function () {
    var m = selMarca.value, mo = selModelo.value; res.innerHTML = ''; setStatus('');
    if (!mo) { selAno.disabled = selMotor.disabled = true; return; }
    dadosMarca(m).then(function (d) {
      var apls = d[mo] || [], y1 = 9999, y2 = 0, motores = {};
      apls.forEach(function (a) { if (a[1]) y1 = Math.min(y1, a[1]); y2 = Math.max(y2, a[2] === 9999 ? ANO_ATUAL : a[2]); if (a[3]) motores[a[3]] = 1; });
      if (y1 === 9999) y1 = 1960; if (y2 < y1) y2 = ANO_ATUAL;
      var anos = []; for (var y = y2; y >= y1; y--) anos.push({ v: String(y), t: String(y) });
      opcoes(selAno, anos, 'Todos os anos'); selAno.disabled = false;
      var ms = Object.keys(motores).sort(); opcoes(selMotor, ms.map(function (x) { return { v: x, t: x }; }), 'Todos os motores'); selMotor.disabled = ms.length === 0;
    });
  });
  btnBuscar.addEventListener('click', function () {
    if (!selMarca.value) { setStatus('Escolha a marca do veículo.', 'aviso'); selMarca.focus(); return; }
    if (!selModelo.value) { setStatus('Escolha o modelo.', 'aviso'); selModelo.focus(); return; }
    buscar({ marca: selMarca.value, modelo: selModelo.value, ano: selAno.value ? +selAno.value : 0, motor: selMotor.value, cil: 0 }, null);
  });

  /* ---------- busca e resultados ---------- */
  function cilDe(txt) { var m = /(\d)[\.,](\d)/.exec(txt || ''); return m ? (+m[1] + +m[2] / 10) : 0; }
  function motorCompat(motorApl, filtroMotor, cil) {
    if (filtroMotor) return motorApl === filtroMotor ? 2 : (motorApl ? 0 : 1);
    if (!cil) return 2;
    if (!motorApl) return 1;
    var cils = (motorApl.match(/\d[\.,]\d/g) || []).map(function (x) { return +x.replace(',', '.'); });
    if (!cils.length) return 1;
    return cils.some(function (c) { return Math.abs(c - cil) < 0.051; }) ? 2 : 0;
  }
  function anoTexto(a) {
    if (!a[1] && a[2] === 9999) return 'todos os anos';
    if (a[2] === 9999) return a[1] + ' em diante';
    if (!a[1]) return 'até ' + a[2];
    return a[1] === a[2] ? String(a[1]) : a[1] + ' a ' + a[2];
  }
  function buscar(f, veiculoTexto) {
    res.innerHTML = ''; setStatus('Buscando…');
    dadosBase().then(function () { return dadosMarca(f.marca); }).then(function (d) {
      var apls = d[f.modelo] || [], porProduto = {};
      apls.forEach(function (a) {
        if (f.ano && !((a[1] || 0) <= f.ano && f.ano <= a[2])) return;
        var mc = motorCompat(a[3], f.motor, f.cil); if (mc === 0) return;
        var p = produtos[a[0]]; if (!p || !p[3]) return;
        var cur = porProduto[a[0]];
        if (!cur || mc > cur.mc) porProduto[a[0]] = { i: a[0], p: p, a: a, mc: mc };
      });
      var itens = Object.keys(porProduto).map(function (k) { return porProduto[k]; });
      itens.sort(function (x, y) { return y.mc - x.mc || x.p[1].localeCompare(y.p[1], 'pt-BR') || x.p[0].localeCompare(y.p[0], 'pt-BR', { numeric: true }); });
      renderizar(itens, f, veiculoTexto);
    }).catch(function (e) { setStatus('Erro ao buscar. Tente novamente.', 'erro'); console.error(e); });
  }
  function renderizar(itens, f, veiculoTexto) {
    setStatus('');
    var titulo = veiculoTexto || (f.marca + ' ' + f.modelo + (f.ano ? ' ' + f.ano : '') + (f.motor ? ' ' + f.motor : ''));
    if (!itens.length) {
      res.appendChild(el('div', { class: 'mgbv-vazio' }, [
        el('p', { html: 'Não encontramos peças MG cadastradas para <b>' + titulo.replace(/</g, '&lt;') + '</b>.' }),
        el('p', { html: 'Tente sem o ano ou o motor, ou <a href="' + LOJA + '/search/?q=' + encodeURIComponent(f.modelo) + '">veja todas as peças para ' + f.modelo.replace(/</g, '&lt;') + '</a>.' })
      ]));
      return;
    }
    var cab = el('div', { class: 'mgbv-res-cab' }, [
      el('h3', { text: 'Peças MG para ' + titulo }),
      el('small', { text: itens.length + (itens.length === 1 ? ' peça encontrada' : ' peças encontradas') })
    ]);
    res.appendChild(cab);
    var grupos = {}; var rotulos = {}; var ordem = [];
    itens.forEach(function (it) {
      var tipo = String(it.p[1] || 'Outros');
      var fam = sa(tipo).replace(/[^a-z0-9]+/g, ' ').trim().split(' ')[0] || 'outros';
      if (!grupos[fam]) { grupos[fam] = []; ordem.push(fam); rotulos[fam] = tipo.replace(/[-\s].*$/, ''); }
      grupos[fam].push(it);
    });
    ordem.sort(function (a, b) { return a.localeCompare(b); });
    ordem.forEach(function (fam) {
      grupos[fam].sort(function (a, b) { return String(a.p[1]).localeCompare(String(b.p[1])); });
      var g = rotulos[fam];
      var ul = el('ul', { class: 'mgbv-itens' });
      grupos[fam].forEach(function (it) {
        var apl = el('div', { class: 'mgbv-apl' }, [
          el('b', { text: f.marca + ' ' + f.modelo }), ' ', it.a[3] ? it.a[3] + ' · ' : '', anoTexto(it.a)
        ]);
        var chip = it.mc === 1 && (f.cil || f.motor) ? el('span', { class: 'mgbv-chip verificar', text: 'Confirme o motor' }) : null;
        ul.appendChild(el('li', { class: 'mgbv-item' }, [
          el('a', { href: LOJA + '/produtos/' + it.p[2] + '/' }, [
            fotoEl(it.i, it.p[1] + ' ' + it.p[0]),
            el('span', { class: 'mgbv-cod', text: it.p[0] }),
            el('span', { class: 'mgbv-tipo', text: it.p[1] }),
            apl, chip
          ])
        ]));
      });
      res.appendChild(el('div', { class: 'mgbv-grupo' }, [el('h4', { text: g + ' (' + grupos[fam].length + ')' }), ul]));
    });
    res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- placa ---------- */
  var MARCA_MAP = { 'vw': 'Volkswagen', 'volkswagen': 'Volkswagen', 'gm': 'Chevrolet', 'chevrolet': 'Chevrolet', 'chev': 'Chevrolet', 'chevr': 'Chevrolet', 'chevy': 'Chevrolet', 'gm chevrolet': 'Chevrolet','fiat': 'Fiat', 'ford': 'Ford', 'renault': 'Renault', 'peugeot': 'Peugeot', 'citroen': 'Citroën', 'toyota': 'Toyota', 'honda': 'Honda', 'hyundai': 'Hyundai', 'jeep': 'Jeep', 'nissan': 'Nissan', 'mercedes-benz': 'Mercedes-Benz', 'mercedes': 'Mercedes-Benz', 'm.benz': 'Mercedes-Benz', 'mbenz': 'Mercedes-Benz', 'iveco': 'Iveco', 'volvo': 'Volvo', 'scania': 'Scania', 'audi': 'Audi', 'seat': 'Seat', 'mitsubishi': 'Mitsubishi', 'mmc': 'Mitsubishi', 'kia': 'Kia', 'chery': 'Chery', 'caoa chery': 'Chery', 'bmw': 'BMW', 'mini': 'Mini', 'troller': 'Troller', 'dodge': 'Dodge', 'chrysler': 'Chrysler', 'ram': 'Ram', 'land rover': 'Land Rover', 'alfa romeo': 'Alfa Romeo', 'agrale': 'Agrale', 'lifan': 'Lifan', 'new holland': 'New Holland', 'case': 'Case', 'mack': 'Mack' };
  var MODELO_ALIAS = { 'palio weekend': 'Palio Weekend', 'weekend': 'Palio Weekend', 'corsa classic': 'Corsa Classic', 'classic': 'Corsa Classic', 'grand siena': 'Grand Siena', 'siena': 'Siena', 'novo uno': 'Uno', 'uno mille': 'Uno Mille', 'mille': 'Uno Mille', 'uno': 'Uno', 'nova fiorino': 'Fiorino', 'nova strada': 'Strada', 'novo ka': 'Ka', 'ka+': 'Ka', 'new fiesta': 'Fiesta', 'new civic': 'Civic', 'novo fusca': 'Fusca', 'fusca': 'Fusca', 'new beetle': 'New Beetle', 'spacefox': 'SpaceFox', 'space fox': 'SpaceFox', 'crossfox': 'CrossFox', 'cross fox': 'CrossFox', 't-cross': 'T-Cross', 'tcross': 'T-Cross', 'ecosport': 'EcoSport', 'eco sport': 'EcoSport', 'hb20': 'HB20', 'hb20s': 'HB20', 'hb20x': 'HB20', 'ix35': 'ix35', 'cr-v': 'CR-V', 'crv': 'CR-V', 'hr-v': 'HR-V', 'hrv': 'HR-V', 'wr-v': 'WR-V', 'wrv': 'WR-V', 'santa fe': 'Santa Fe', 'l200 triton': 'L200 Triton', 'l200': 'L200', 'xsara picasso': 'Xsara Picasso', 'c3 aircross': 'C3 Aircross', 'aircross': 'C3 Aircross', 'c4 lounge': 'C4', 'c4 pallas': 'C4', 'grand cherokee': 'Grand Cherokee', 'cherokee': 'Cherokee', 'doblo': 'Doblò', 'premio': 'Prêmio', 'brasilia': 'Brasília', 'cordoba': 'Córdoba', 'up': 'up!', 'up!': 'up!', 's10': 'S10', 's-10': 'S10', 'f1000': 'F-1000', 'f-1000': 'F-1000', 'f250': 'F-250', 'f-250': 'F-250', 'f350': 'F-350', 'f-350': 'F-350', 'f4000': 'F-4000', 'f-4000': 'F-4000', 'd20': 'D-20', 'd-20': 'D-20', 'c20': 'C-20', 'a20': 'A-20', 'megane': 'Mégane', 'scenic': 'Scénic', 'grand scenic': 'Scénic', 'sandero stepway': 'Sandero', 'stepway': 'Sandero', 'logan': 'Logan', 'polo sedan': 'Polo Sedan', 'polo classic': 'Polo Classic', 'passat cc': 'Passat CC', 'corolla cross': 'Corolla Cross', 'sw4': 'SW4', 'hilux sw4': 'SW4', 'tornado': 'Tornado 250', 'cg 250 tornado': 'Tornado 250' };
  var GERACAO = /^(g[2-7]|i{1,3}|iv|v|vi|[0-9]{4}|\d\.\d.*|2p|4p|hatch|sedan|sw|cs|cd|cab|cabine|dupla|simples|flex|total|totalflex|mi|mpi|mpfi|efi|fire|evo|vhc|vhce|spe|8v|12v|16v|20v|tsi|tdi|tfsi|at|ap|turbo|diesel|4x2|4x4|gl|gls|ls|lt|ltz|lx|ex|elx|edx|xr|xrs|gt|gti|gsi|highline|comfortline|trendline|sportline|attractive|premium|limited|longitude|sport|automatico|automatica|manual|cvt|dualogic|economy|essence|dynamique|expression|authentique|privilege|way|adventure|trekking|freedom|titanium|sel|se|s|xl|xls|xlt|plus|life|evolution|hgt|drive|precision|connect|move|spirit|style|pack|rs|sv|sl|sr|xei|gli|seg|altis|exl|exr|lxr|lxl|elite|turbodiesel|td|tb|tce|sce|cel|1\.0|1\.3|1\.4|1\.5|1\.6|1\.8|2\.0|2\.4|2\.8|3\.0|3\.2|.*\d+cv)$/i;

  function normalizarPlaca(p) { return (p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function placaValida(p) { return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p); }

  function casarVeiculo(info) {
    /* info: {brand, model, version, year, model_year, engine_cc} -> {marca, modelo, ano, cil, confianca} */
    var marcaRaw = sa(info.brand || '').replace(/^(i|imp|imp\.)\//, '').replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
    var marca = null;
    Object.keys(MARCA_MAP).sort(function (a, b) { return b.length - a.length; }).some(function (k) {
      if (marcaRaw === k || marcaRaw.indexOf(k + ' ') === 0 || marcaRaw.indexOf(k + '/') === 0) { marca = MARCA_MAP[k]; return true; } return false;
    });
    var modeloRaw = sa((info.model || '') + ' ' + (info.version || '')).replace(/[\/,]/g, ' ').replace(/\s+/g, ' ').trim();
    /* remove a marca repetida no início do modelo (ex.: "VW/GOL 1.0") */
    Object.keys(MARCA_MAP).forEach(function (k) { if (modeloRaw.indexOf(k + ' ') === 0) modeloRaw = modeloRaw.slice(k.length + 1); });
    var toks = modeloRaw.split(' ').filter(Boolean);
    var modelos = marca && indice.marcas[marca] ? indice.marcas[marca] : [];
    var porChave = {}; modelos.forEach(function (m) { porChave[sa(m)] = m; });
    Object.keys(MODELO_ALIAS).forEach(function (k) { if (porChave[sa(MODELO_ALIAS[k])] ) porChave[k] = porChave[sa(MODELO_ALIAS[k])]; });
    var modelo = null, usados = 0;
    /* tenta casar 3, 2 e 1 palavras a partir do início, pulando "novo/nova/new" */
    var ini = 0; while (ini < toks.length && /^(novo|nova|new|novos)$/.test(toks[ini])) ini++;
    for (var n = 3; n >= 1 && !modelo; n--) {
      var cand = toks.slice(ini, ini + n).join(' ');
      if (cand && porChave[cand]) { modelo = porChave[cand]; usados = ini + n; }
      if (!modelo && cand && porChave[toks.slice(0, ini + n).join(' ')]) { modelo = porChave[toks.slice(0, ini + n).join(' ')]; usados = ini + n; }
    }
    if (!modelo && toks.length) { /* tenta primeira palavra sem tokens de versão */
      var t0 = toks[ini];
      modelos.some(function (m) { var km = sa(m).split(' '); if (km[0] !== t0 || GERACAO.test(t0)) return false;
        if (km.length > 1 && toks.indexOf(km[1]) < 0) return false; modelo = m; usados = ini + 1; return true; });
    }
    var cil = cilDe(toks.slice(usados).join(' ')) || cilDe(info.version) || (info.engine_cc ? Math.round(info.engine_cc / 100) / 10 : 0);
    var ano = +(info.model_year || info.year || 0) || 0;
    return { marca: marca, modelo: modelo, ano: ano, cil: cil, motorTexto: toks.slice(usados).join(' ') };
  }

  function consultarPlaca(placa) {
    return fetch(PLACA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa: placa }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw Object.assign(new Error(j.erro || 'erro'), { codigo: r.status, detalhe: j }); return j; }); });
  }
  function buscarPorPlaca() {
    var placa = normalizarPlaca(inPlaca.value); inPlaca.value = placa;
    if (!placaValida(placa)) { setStatus('Digite uma placa válida, por exemplo ABC1D23 ou ABC1234.', 'aviso'); inPlaca.focus(); return; }
    res.innerHTML = ''; btnPlaca.disabled = true; setStatus('Consultando a placa ' + placa + '…');
    dadosBase().then(function () { return consultarPlaca(placa); }).then(function (j) {
      var v = j.veiculo || j;
      raiz.aplicarVeiculo(v, placa);
    }).catch(function (e) {
      var msg = 'Não conseguimos consultar essa placa agora. Use a busca pelo veículo ao lado.';
      if (e.codigo === 404) msg = 'Não encontramos dados para a placa ' + placa + '. Confira os caracteres ou use a busca pelo veículo.';
      if (e.codigo === 429) msg = 'Muitas consultas em pouco tempo. Aguarde um minuto e tente de novo.';
      setStatus(msg, 'erro'); console.error(e);
    }).then(function () { btnPlaca.disabled = false; });
  }
  raiz.aplicarVeiculo = function (v, placa) {
    var c = casarVeiculo(v);
    var descr = [v.brand, v.model, v.version, (v.model_year || v.year)].filter(Boolean).join(' ');
    if (!c.marca || !indice.marcas[c.marca]) {
      setStatus(el('span', {}, [el('span', { class: 'mgbv-veiculo', text: descr }), ' — a MG ainda não tem peças cadastradas para a marca ' + (v.brand || '') + '.']), 'aviso');
      return;
    }
    selMarca.value = c.marca; selMarca.dispatchEvent(new Event('change'));
    if (!c.modelo) {
      mostrarAba('veiculo');
      setStatus(el('span', {}, [el('span', { class: 'mgbv-veiculo', text: descr }), ' — identificamos a marca, mas não achamos o modelo na nossa tabela. Escolha o modelo ao lado.']), 'aviso');
      return;
    }
    selModelo.value = c.modelo; selModelo.dispatchEvent(new Event('change'));
    dadosMarca(c.marca).then(function () {
      if (c.ano) selAno.value = String(c.ano);
      setStatus(el('span', {}, [placa ? 'Placa ' + placa + ': ' : '', el('span', { class: 'mgbv-veiculo', text: descr })]));
      buscar({ marca: c.marca, modelo: c.modelo, ano: c.ano, motor: '', cil: c.cil }, descr);
      /* mantém o aviso do veículo acima dos resultados */
      setTimeout(function () { setStatus(el('span', {}, [placa ? 'Placa ' + placa + ': ' : '', el('span', { class: 'mgbv-veiculo', text: descr }), c.cil ? ' · motor ' + c.cil.toFixed(1) : ''])); }, 0);
    });
  };
  raiz.casarVeiculo = casarVeiculo;
  btnPlaca.addEventListener('click', buscarPorPlaca);
  inPlaca.addEventListener('keydown', function (e) { if (e.key === 'Enter') buscarPorPlaca(); });
  inPlaca.addEventListener('input', function () { inPlaca.value = inPlaca.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); });
  [selMarca, selModelo, selAno, selMotor].forEach(function (s) { s.addEventListener('keydown', function (e) { if (e.key === 'Enter') btnBuscar.click(); }); });

  /* abre direto por #veiculo=Marca|Modelo|Ano (links compartilháveis) */
  var h = /veiculo=([^&]+)/.exec(decodeURIComponent(location.hash || ''));
  /* abre direto por #placa=ABC1D23 (campo de placa da home) */
  var hp = /placa=([A-Za-z0-9-]{7,8})/.exec(location.hash || '');
  if (hp && PLACA_URL) { inPlaca.value = normalizarPlaca(hp[1]); setTimeout(buscarPorPlaca, 0); }
  if (h) { var pp = h[1].split('|'); dadosBase().then(function () { if (indice.marcas[pp[0]]) { selMarca.value = pp[0]; selMarca.dispatchEvent(new Event('change')); selModelo.value = pp[1] || ''; selModelo.dispatchEvent(new Event('change')); if (pp[1]) buscar({ marca: pp[0], modelo: pp[1], ano: +pp[2] || 0, motor: '', cil: 0 }, null); } }); }
})();
