/* MG Peças – avaliações reais (Mercado Livre + Instagram)
   Uso: página /avaliacoes/ (<div id="mg-av"></div>), home (<div id="mg-av-home"></div>)
   e página de produto (<div id="mg-av-prod"></div>). Dados: dados/avaliacoes.json */
(function () {
  if (window.__mgAv) return;
  window.__mgAv = 1;
  /* VER = commit dos dados no GitHub (o @main do jsDelivr fica preso em cache) */
  var VER = 'c1a7ec4622eccc27737edb123c312625d5d34733';
  var BASE = 'https://cdn.jsdelivr.net/gh/filipefrancas/mg-site-arquivos@' + VER + '/';
  var DADOS = BASE + 'dados/avaliacoes.json';               /* todas: página /avaliacoes/ */
  var DADOS_HOME = BASE + 'dados/avaliacoes_home.json';     /* resumo + 3 destaques */
  var DADOS_PROD = BASE + 'dados/avaliacoes_produtos.json'; /* até 6 por código */
  var BLOCO = 24;
  /* Avaliações enviadas pelo próprio site: Worker mg-avaliacoes no Cloudflare.
     Vazio = formulário escondido e nada é lido de lá. */
  var AVAL_API = 'https://mg-depoimentos.filipefrancasilva10.workers.dev';

  var CSS = [
    '.mgav{--az:#3498db;--az2:#2383c4;--mar:#000922;--am:#ffc21a;--cl:#eef6fc;--bd:#dfe6f3;--tx:#1b2333;--ci:#5b6576;font-family:Barlow,system-ui,sans-serif;color:var(--tx)}',
    '.mgav *{box-sizing:border-box}',
    '.mgav h1,.mgav h2,.mgav h3{font-family:"Barlow Condensed",Barlow,sans-serif;margin:0;letter-spacing:.01em}',
    '.mgav-eb{display:inline-block;font:700 14px "Barlow Condensed",sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.9;margin-bottom:8px}',
    '.mgav-est{color:var(--am);letter-spacing:2px;font-size:16px;line-height:1}',
    '.mgav-est s{color:#d5dbe6;text-decoration:none}',
    /* hero */
    '.mgav-hero{position:relative;overflow:hidden;border-radius:24px;padding:48px 44px;color:#fff;background:radial-gradient(700px 320px at 0% 0%,rgba(255,255,255,.2),transparent 60%),linear-gradient(135deg,#3498db 0%,#1f74b0 100%);border-bottom:5px solid var(--mar);display:grid;grid-template-columns:1.2fr 1fr;gap:32px;align-items:center}',
    '.mgav-hero:before{content:"\\201D";position:absolute;right:3%;top:-70px;font:800 380px/1 "Barlow Condensed",sans-serif;color:rgba(255,255,255,.1);pointer-events:none}',
    '.mgav-hero h1{font-size:52px;line-height:1;color:#fff;text-transform:uppercase}',
    '.mgav-hero p{margin:14px 0 0;font-size:17px;color:rgba(255,255,255,.9);max-width:520px}',
    '.mgav-num{position:relative;background:#fff;color:var(--tx);border-radius:20px;padding:26px 26px 22px;box-shadow:0 18px 40px rgba(0,9,34,.18)}',
    '.mgav-num>b{display:block;font:800 92px/0.9 "Barlow Condensed",sans-serif;color:var(--az)}',
    '.mgav-num>span{display:block;font:700 20px "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.05em;margin-top:6px}',
    '.mgav-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid var(--bd)}',
    '.mgav-kpis div{font-size:13px;color:var(--ci);line-height:1.25}',
    '.mgav-kpis strong{display:block;font:800 28px/1 "Barlow Condensed",sans-serif;color:var(--tx);margin-bottom:3px}',
    /* barra de filtros */
    '.mgav-barra{margin:26px 0 18px;display:grid;gap:12px}',
    '.mgav-busca{position:relative;max-width:460px}',
    '.mgav-busca input{width:100%;height:48px;border:2px solid var(--bd);border-radius:12px;padding:0 16px 0 44px;font:500 16px Barlow,sans-serif;color:var(--tx);background:#fff;outline:none;transition:border-color .15s}',
    '.mgav-busca input:focus{border-color:var(--az)}',
    '.mgav-busca svg{position:absolute;left:14px;top:14px;width:20px;height:20px;color:var(--ci)}',
    '.mgav-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.mgav-chips em{font:700 13px "Barlow Condensed",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ci);font-style:normal;margin-right:4px}',
    '.mgav-chip{border:1.5px solid var(--bd);background:#fff;color:var(--tx);border-radius:999px;padding:7px 14px;font:600 14px Barlow,sans-serif;cursor:pointer;transition:all .15s}',
    '.mgav-chip:hover{border-color:var(--az);color:var(--az)}',
    '.mgav-chip.on{background:var(--az);border-color:var(--az);color:#fff}',
    '.mgav-chip i{font-style:normal;opacity:.7;margin-left:4px}',
    '.mgav-info{font-size:14px;color:var(--ci);margin:0 0 14px}',
    /* cartões */
    '.mgav-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}',
    '.mgav-card{background:#fff;border:1px solid var(--bd);border-radius:18px;padding:20px 20px 16px;display:flex;flex-direction:column;gap:12px;transition:transform .2s,box-shadow .2s,border-color .2s}',
    '.mgav-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(0,9,34,.08);border-color:#c9d8ee}',
    '.mgav-topo{display:flex;justify-content:space-between;align-items:center;gap:8px}',
    '.mgav-data{font-size:12px;color:var(--ci)}',
    '.mgav-card blockquote{margin:0;font:500 17px/1.4 Barlow,sans-serif;color:var(--tx);flex:1;white-space:pre-line;word-break:break-word}',
    '.mgav-peca{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--cl);border-radius:12px;padding:10px 12px;text-decoration:none!important;color:var(--tx)!important;transition:background .15s}',
    'a.mgav-peca:hover{background:#dcecf9}',
    '.mgav-peca span{font-size:13px;line-height:1.3}',
    '.mgav-peca strong{display:block;font:700 15px "Barlow Condensed",sans-serif;letter-spacing:.03em;color:var(--az)}',
    '.mgav-peca u{text-decoration:none;font:700 13px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--az);white-space:nowrap}',
    '.mgav-orig{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ci);padding-top:10px;border-top:1px solid #eef1f6}',
    '.mgav-orig b{color:var(--tx)}',
    '.mgav-orig a{color:var(--tx)!important;font-weight:700;text-decoration:none}',
    '.mgav-orig a:hover{color:var(--az)!important}',
    '.mgav-ic{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}',
    '.mgav-ic.ml{background:#fff159;color:#2d3277}',
    '.mgav-ic.ig{background:linear-gradient(45deg,#f9a825,#e1306c 55%,#833ab4);color:#fff}',
    '.mgav-ic svg{width:15px;height:15px}',
    '.mgav-mais{display:block;margin:24px auto 0;background:var(--az);color:#fff;border:0;border-radius:12px;padding:14px 30px;font:800 17px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:background .15s}',
    '.mgav-mais:hover{background:var(--az2)}',
    '.mgav-vazio{padding:30px;text-align:center;color:var(--ci);border:1px dashed var(--bd);border-radius:16px}',
    '.mgav-nota{margin:22px 0 0;font-size:13px;color:var(--ci);text-align:center}',
    /* home */
    '.mgav-home{max-width:1240px;margin:0 auto 36px;padding:0 20px}',
    '.mgav-home .mgav-hero{grid-template-columns:330px 1fr;align-items:stretch;padding:44px 40px}',
    '.mgav-home .mgav-hero h2{font-size:44px;line-height:1;color:#fff;text-transform:uppercase}',
    '.mgav-home .mgav-num>b{font-size:84px}',
    '.mgav-home .mgav-kpis{grid-template-columns:1fr 1fr;margin-top:auto}',
    '.mgav-home .mgav-num{display:flex;flex-direction:column}',
    '.mgav-home .mgav-num>b{white-space:nowrap}',
    '.mgav-home .mgav-num .mgav-est{font-size:22px;letter-spacing:3px;margin-top:12px}',
    '.mgav-num .mgav-sub{margin:12px 0 18px;font-size:15px;line-height:1.4;color:var(--ci);max-width:none}',
    '.mgav-num .mgav-sub b{color:var(--tx);font-weight:700}',
    '.mgav-cab{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px;position:relative}',
    '.mgav-bt{display:inline-block;background:#fff;color:var(--az)!important;text-decoration:none!important;font:800 16px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:12px 22px;border-radius:12px;white-space:nowrap;transition:transform .15s,box-shadow .15s}',
    '.mgav-bt:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,9,34,.2)}',
    '.mgav-home .mgav-grid{position:relative}',
    '.mgav-home .mgav-card{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.28)}',
    '.mgav-home .mgav-card:hover{border-color:rgba(255,255,255,.65);box-shadow:none}',
    '.mgav-home .mgav-card blockquote{color:#fff;font-weight:600;font-size:18px}',
    '.mgav-home .mgav-peca{background:rgba(255,255,255,.16);color:#fff!important}',
    '.mgav-home a.mgav-peca:hover{background:rgba(255,255,255,.26)}',
    '.mgav-home .mgav-peca strong,.mgav-home .mgav-peca u{color:#fff}',
    '.mgav-home .mgav-orig,.mgav-home .mgav-data{color:rgba(255,255,255,.82);border-color:rgba(255,255,255,.25)}',
    '.mgav-home .mgav-orig b,.mgav-home .mgav-orig a{color:#fff!important}',
    /* produto */
    '.mgav-prod{margin:26px 0 8px;border:1px solid var(--bd);border-radius:18px;padding:20px;background:linear-gradient(180deg,#f5faff,#fff)}',
    '.mgav-prod h3{font-size:24px;text-transform:uppercase;color:var(--tx)}',
    '.mgav-prod .mgav-res{display:flex;align-items:center;gap:10px;margin:6px 0 14px;font-size:14px;color:var(--ci);flex-wrap:wrap}',
    '.mgav-prod .mgav-grid{grid-template-columns:1fr 1fr}',
    '.mgav-prod .mgav-card{padding:16px}',
    '.mgav-prod .mgav-card blockquote{font-size:16px}',
    '.mgav-prod .mgav-lk{display:inline-block;margin-top:12px;font:700 14px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--az)!important;text-decoration:none}',
    /* formulário "Deixe sua avaliação" */
    '.mgav-dep{font:700 13px "Barlow Condensed",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--az)}',
    '.mgav-home .mgav-dep{color:#fff}',
    '.mgav-ic.mg{background:var(--az);color:#fff;font:800 10px Barlow,sans-serif}',
    '.mgav-abre{display:inline-flex;align-items:center;gap:8px;margin-top:18px;background:#fff;color:var(--az)!important;border:0;border-radius:12px;padding:12px 20px;font:800 16px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;text-decoration:none!important;transition:transform .15s,box-shadow .15s}',
    '.mgav-abre:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,9,34,.2)}',
    '.mgav-abre-fim{display:flex;width:fit-content;margin:28px auto 0;background:#fff;color:var(--az)!important;border:2px solid var(--az);box-shadow:none}',
    '.mgav-abre-fim+div .mgav-form{margin:18px auto 4px}',
    '.mgav-abre-fim+div .mgav-obrigado{margin:18px auto 4px}',
    '.mgav-form{margin:22px 0 4px;background:#fff;border:1px solid var(--bd);border-radius:18px;padding:22px;display:grid;gap:14px;max-width:640px}',
    '.mgav-form h3{font-size:24px;text-transform:uppercase}',
    '.mgav-form p{margin:0;font-size:14px;color:var(--ci)}',
    '.mgav-form label{display:grid;gap:6px;font:600 14px Barlow,sans-serif}',
    '.mgav-form label i{font-style:normal;font-weight:400;color:var(--ci)}',
    '.mgav-form textarea,.mgav-form input[type=text],.mgav-form input[type=email]{width:100%;border:2px solid var(--bd);border-radius:12px;padding:12px 14px;font:500 16px Barlow,sans-serif;color:var(--tx);background:#fff;outline:none}',
    '.mgav-form textarea{min-height:110px;resize:vertical}',
    '.mgav-form textarea:focus,.mgav-form input[type=text]:focus,.mgav-form input[type=email]:focus{border-color:var(--az)}',
    '.mgav-form .mgav-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.mgav-form .mgav-ck{display:flex;gap:10px;align-items:flex-start;font-weight:400;color:var(--ci)}',
    '.mgav-form .mgav-ck input{margin-top:3px;width:18px;height:18px;flex-shrink:0}',
    '.mgav-form .mgav-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '.mgav-form .mgav-enviar{justify-self:start;background:var(--az);color:#fff;border:0;border-radius:12px;padding:14px 28px;font:800 17px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}',
    '.mgav-form .mgav-enviar:disabled{opacity:.6;cursor:default}',
    '.mgav-form .mgav-erro{color:#c0392b;font-size:14px;min-height:1em}',
    '.mgav-obrigado{margin:22px 0 4px;background:var(--cl);border-radius:18px;padding:22px;max-width:640px;font-size:16px}',
    '.mgav-obrigado b{display:block;font:800 22px "Barlow Condensed",sans-serif;text-transform:uppercase;color:var(--az);margin-bottom:4px}',
    '@media (max-width:640px){.mgav-form .mgav-2{grid-template-columns:1fr}.mgav-form{padding:18px}}',
    '@media (max-width:1199px){.mgav-home .mgav-hero{grid-template-columns:1fr}.mgav-home .mgav-num{display:grid;grid-template-columns:auto 1fr;column-gap:24px;align-items:center}.mgav-home .mgav-num>b{grid-row:span 2}.mgav-home .mgav-num .mgav-sub{margin:4px 0 0}.mgav-home .mgav-num .mgav-est{display:none}.mgav-home .mgav-kpis{grid-column:1/-1}}',
    '@media (max-width:991px){.mgav-hero,.mgav-home .mgav-hero{grid-template-columns:1fr;padding:34px 24px}.mgav-grid{grid-template-columns:1fr 1fr}.mgav-hero h1{font-size:42px}}',
    '@media (max-width:640px){.mgav-grid,.mgav-prod .mgav-grid{grid-template-columns:1fr}.mgav-hero,.mgav-home .mgav-hero{padding:28px 18px;border-radius:18px}.mgav-hero h1,.mgav-home .mgav-hero h2{font-size:34px}.mgav-num>b,.mgav-home .mgav-num>b{font-size:68px}.mgav-cab{flex-direction:column;align-items:flex-start}.mgav-home{padding:0 14px}.mgav-kpis strong{font-size:24px}}'
  ].join('');

  var IC_ML = '<b style="font:800 10px Barlow,sans-serif;letter-spacing:-.02em">ML</b>';
  var IC_IG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>';
  var IC_LUPA = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function cod(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  /* um anúncio pode ter mais de um código MG ("MG250 / MG016") */
  function cods(a) { return a._c || (a._c = String(a.codigo || '').split('/').map(cod).filter(Boolean)); }
  function linha(p) {
    p = norm(p);
    if (!p) return '';
    if (/coxim/.test(p)) return 'Coxins';
    if (/reservat/.test(p)) return 'Reservatórios';
    if (/tampa/.test(p) && /valvul|comando/.test(p)) return 'Tampas de válvulas';
    if (/radiador|refrigera|arrefec|termostat|cavalete|tubo (d[ae] )?agua/.test(p)) return 'Arrefecimento';
    if (/respiro|anti.?chama|defletor|filtro (d[eo] )?ar|tbi/.test(p)) return 'Ar e respiro';
    if (/tanque|combust/.test(p)) return 'Combustível';
    return 'Outras peças';
  }
  function chaveData(d) { var m = /^([a-z]{3})\/(\d{4})$/.exec(d || ''); return m ? +m[2] * 12 + MESES.indexOf(m[1]) : 0; }
  function estrelas(n) { n = Math.round(n || 5); return '<span class="mgav-est" aria-label="' + n + ' de 5 estrelas">' + '★★★★★'.slice(0, n) + '<s>' + '★★★★★'.slice(n) + '</s></span>'; }
  function css() { if (document.getElementById('mgav-css')) return; var s = document.createElement('style'); s.id = 'mgav-css'; s.textContent = CSS; document.head.appendChild(s); }

  function cartao(a) {
    var ig = a.origem === 'Instagram', site = a.origem === 'Site MG';
    var peca = '';
    if (a.codigo) {
      peca = '<a class="mgav-peca" href="' + esc(a.url_produto || ('/produtos/' + cods(a)[0].toLowerCase() + '/')) + '"><span><strong>' + esc(a.codigo) + '</strong>' + esc(a.peca) + (a.carro ? ' · ' + esc(a.carro) : '') + '</span><u>Ver peça →</u></a>';
    } else if (a.peca) {
      peca = '<div class="mgav-peca"><span>' + esc(a.peca) + '</span></div>';
    }
    var quem = site ? '<b>' + esc(a.autor || 'Cliente') + '</b> · Site MG' : ig
      ? (a.link_post ? '<a href="' + esc(a.link_post) + '" target="_blank" rel="noopener">' + esc(a.autor) + '</a>' : '<b>' + esc(a.autor) + '</b>') + ' · Instagram'
      : '<b>Comprador</b> · Mercado Livre';
    return '<article class="mgav-card"><div class="mgav-topo">' + (site ? '<span class="mgav-dep">Depoimento</span>' : estrelas(a.estrelas)) + '<span class="mgav-data">' + esc(a.data) + '</span></div>' +
      '<blockquote>“' + esc(a.texto) + '”</blockquote>' + peca +
      '<div class="mgav-orig"><span class="mgav-ic ' + (site ? 'mg">MG' : ig ? 'ig">' + IC_IG : 'ml">' + IC_ML) + '</span><span>' + quem + '</span></div></article>';
  }

  function resumo(L) {
    var soma = 0, ne = 0, cs = {}, ml = 0, ig = 0, st = 0;
    L.forEach(function (a) { if (a.origem !== 'Site MG') { soma += a.estrelas || 5; ne++; } cods(a).forEach(function (c) { cs[c] = 1; }); if (a.origem === 'Instagram') ig++; else if (a.origem === 'Site MG') st++; else ml++; });
    return { total: L.length, media: ne ? soma / ne : 0, codigos: Object.keys(cs).length, ml: ml, ig: ig, site: st };
  }
  function fmt(n) { return n.toFixed(1).replace('.', ','); }
  function mil(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function conta(el, fim) {
    if (!('IntersectionObserver' in window)) { el.textContent = mil(fim); return; }
    el.textContent = '0';
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      function passo(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = mil(fim * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(passo); }
      requestAnimationFrame(passo);
    });
    io.observe(el);
  }
  /* Mercado Livre e Instagram sempre na frente (compra/uso confirmado); depoimentos do site depois */
  function ordena(L) {
    return L.slice().sort(function (a, b) { return ((a.origem === 'Site MG') - (b.origem === 'Site MG')) || (chaveData(b.data) - chaveData(a.data)) || ((b.texto || '').length - (a.texto || '').length); });
  }

  /* ---------- formulário "Deixe seu depoimento" ----------
     Nada aparece no site na hora: o envio vai para uma fila que o Filipe aprova.
     A resposta ao cliente é a mesma em qualquer caso. */
  function formulario(onde, codigo) {
    var box = document.createElement('div');
    box.innerHTML = '<form class="mgav-form" novalidate><h3>Deixe seu depoimento</h3>' +
      '<p>Conte como foi com a peça MG. Seu depoimento passa por uma revisão antes de aparecer no site.</p>' +
      '<label>Seu depoimento<textarea name="texto" maxlength="600" required placeholder="Ex.: encaixou certinho no meu carro, acabamento muito bom."></textarea></label>' +
      '<div class="mgav-2"><label><span>Seu primeiro nome <i>(opcional)</i></span><input type="text" name="nome" maxlength="40" autocomplete="given-name"></label>' +
      '<label><span>Código da peça <i>(se souber)</i></span><input type="text" name="codigo" maxlength="16" placeholder="Ex.: MG091" value="' + esc(codigo || '') + '"></label></div>' +
      '<label><span>Seu e-mail <i>(não aparece no site)</i></span><input type="email" name="email" maxlength="120" autocomplete="email" required inputmode="email"></label>' +
      '<label class="mgav-hp" aria-hidden="true">Site<input type="text" name="site" tabindex="-1" autocomplete="off"></label>' +
      '<label class="mgav-ck"><input type="checkbox" name="autorizo"> Autorizo a MG a publicar meu comentário com meu primeiro nome no site.</label>' +
      '<div class="mgav-erro" role="alert"></div><button class="mgav-enviar" type="submit">Enviar depoimento</button></form>';
    var f = box.firstChild, erro = f.querySelector('.mgav-erro');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = f.texto.value.trim();
      if (tx.length < 4) { erro.textContent = 'Escreva seu depoimento sobre a peça.'; return; }
      var em = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(em)) { erro.textContent = 'Informe um e-mail válido. Ele não aparece no site.'; return; }
      if (!f.autorizo.checked) { erro.textContent = 'Marque a autorização para enviarmos seu depoimento.'; return; }
      erro.textContent = '';
      var bt = f.querySelector('.mgav-enviar'); bt.disabled = true; bt.textContent = 'Enviando…';
      fetch(AVAL_API + '/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: tx, nome: f.nome.value, email: em, codigo: f.codigo.value, autorizo: true, site: f.site.value, pagina: location.pathname })
      }).then(function (r) {
        if (r.status === 429) throw 'Você já enviou alguns depoimentos agora. Tente de novo mais tarde.';
        if (r.status === 422) return r.json().then(function (j) { throw j.erro === 'email' ? 'Esse e-mail não parece válido. Confira e tente de novo.' : 'Confira os campos e tente de novo.'; });
        if (!r.ok) throw 'Não foi possível enviar agora. Tente de novo em instantes.';
        box.innerHTML = '<div class="mgav-obrigado"><b>Obrigado pelo depoimento!</b>Recebemos sua mensagem. Ela passa por uma revisão antes de aparecer no site.</div>';
      }).catch(function (m) { erro.textContent = typeof m === 'string' ? m : 'Não foi possível enviar agora. Tente de novo em instantes.'; bt.disabled = false; bt.textContent = 'Enviar depoimento'; });
    });
    onde.insertAdjacentElement('afterend', box);
    f.texto.focus();
    return box;
  }
  /* botão que abre o formulário logo abaixo de "depois" (uma vez só) */
  function botaoAvaliar(classe, texto, depois, codigo) {
    if (!AVAL_API) return null;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mgav-abre ' + (classe || ''); b.textContent = texto;
    var aberto = null;
    b.addEventListener('click', function () {
      if (aberto) { aberto.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      aberto = formulario(depois(), codigo);
    });
    return b;
  }
  /* depoimentos aprovados pelo Filipe no painel (sem estrelas; não entram na nota média) */
  function doSite() {
    if (!AVAL_API) return Promise.resolve([]);
    return fetch(AVAL_API + '/publicas').then(function (r) { return r.ok ? r.json() : []; }).then(function (L) {
      return (Array.isArray(L) ? L : []).filter(function (a) { return a && typeof a.texto === 'string' && a.texto; })
        .map(function (a) { return { codigo: a.codigo, texto: a.texto, autor: a.autor, data: a.data, origem: 'Site MG' }; });
    }).catch(function () { return []; });
  }

  /* ---------- página /avaliacoes/ ---------- */
  function pagina(box, L) {
    var R = resumo(L);
    L = ordena(L);
    var linhas = {};
    L.forEach(function (a) { a._l = linha(a.peca); if (a._l) linhas[a._l] = (linhas[a._l] || 0) + 1; });
    var nomesL = Object.keys(linhas).sort(function (x, y) { return linhas[y] - linhas[x]; });
    box.className = 'mgav';
    box.innerHTML =
      '<section class="mgav-hero"><div><span class="mgav-eb">Avaliações reais</span><h1>Quem usa, recomenda</h1>' +
      '<p>Opiniões de quem comprou peças MG no Mercado Livre e comentários de autopeças e oficinas no nosso Instagram. Textos sem edição.</p></div>' +
      '<div class="mgav-num"><b data-n="' + R.total + '">' + mil(R.total) + '</b><span>avaliações positivas</span>' +
      '<div class="mgav-kpis"><div><strong>' + fmt(R.media) + ' ★</strong>média de 5</div><div><strong>' + R.codigos + '</strong>códigos avaliados</div><div><strong>' + mil(R.ml) + ' + ' + R.ig + '</strong>Mercado Livre + Instagram</div></div></div></section>' +
      '<div class="mgav-barra"><label class="mgav-busca">' + IC_LUPA + '<input type="search" placeholder="Buscar por código (ex.: MG091), peça ou carro" aria-label="Buscar avaliações"></label>' +
      '<div class="mgav-chips" data-f="l"><em>Linha</em><button class="mgav-chip on" data-v="">Todas</button>' + nomesL.map(function (n) { return '<button class="mgav-chip" data-v="' + esc(n) + '">' + esc(n) + '<i>' + mil(linhas[n]) + '</i></button>'; }).join('') + '</div>' +
      '<div class="mgav-chips" data-f="o"><em>Origem</em><button class="mgav-chip on" data-v="">Todas</button><button class="mgav-chip" data-v="Mercado Livre">Mercado Livre<i>' + mil(R.ml) + '</i></button><button class="mgav-chip" data-v="Instagram">Instagram<i>' + R.ig + '</i></button>' + (R.site ? '<button class="mgav-chip" data-v="Site MG">Depoimentos<i>' + mil(R.site) + '</i></button>' : '') + '</div></div>' +
      '<p class="mgav-info"></p><div class="mgav-grid"></div><button class="mgav-mais" type="button">Ver mais avaliações</button>' +
      '<p class="mgav-nota">Avaliações do Mercado Livre exibidas sem o nome do comprador.' + (R.site ? ' Depoimentos enviados pelo site são revisados antes de aparecer aqui.' : '') + ' Atualizamos esta página periodicamente.</p>';
    conta(box.querySelector('.mgav-num b'), R.total);
    /* depoimento: só um botão discreto depois das avaliações; o formulário abre ao clicar */
    var ba = botaoAvaliar('mgav-abre-fim', 'Deixar um depoimento', function () { return ba; }, '');
    if (ba) box.querySelector('.mgav-nota').insertAdjacentElement('beforebegin', ba);
    var f = { l: '', o: '', q: '' }, vis = BLOCO, grid = box.querySelector('.mgav-grid'), mais = box.querySelector('.mgav-mais'), info = box.querySelector('.mgav-info');
    function filtra() {
      var q = norm(f.q).trim(), qc = cod(f.q);
      var exato = qc.length >= 3 && /\d/.test(qc) && L.some(function (a) { return cods(a).indexOf(qc) > -1; });
      return L.filter(function (a) {
        if (f.l && a._l !== f.l) return false;
        if (f.o && a.origem !== f.o) return false;
        if (!q) return true;
        if (exato) return cods(a).indexOf(qc) > -1;
        if (qc.length >= 3 && /\d/.test(qc) && cods(a).some(function (c) { return c.indexOf(qc) === 0; })) return true;
        return norm([a.codigo, a.peca, a.carro, a.texto].join(' ')).indexOf(q) > -1;
      });
    }
    function desenha() {
      var F = filtra();
      grid.innerHTML = F.length ? F.slice(0, vis).map(cartao).join('') : '<div class="mgav-vazio" style="grid-column:1/-1">Ainda não temos avaliações para essa busca. Novas avaliações entram aqui com frequência.</div>';
      info.textContent = mil(F.length) + (F.length === 1 ? ' avaliação' : ' avaliações') + (f.l || f.o || f.q ? (F.length === 1 ? ' encontrada' : ' encontradas') : '') + (F.length > vis ? ' · mostrando ' + mil(vis) : '');
      mais.style.display = F.length > vis ? '' : 'none';
    }
    box.querySelectorAll('.mgav-chips').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('.mgav-chip'); if (!b) return;
        g.querySelectorAll('.mgav-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        f[g.getAttribute('data-f')] = b.getAttribute('data-v'); vis = BLOCO; desenha();
      });
    });
    var inp = box.querySelector('input'), tm;
    inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { f.q = inp.value; vis = BLOCO; desenha(); }, 180); });
    var qs = /[?&]c=([^&]+)/.exec(location.search);
    if (qs) { inp.value = decodeURIComponent(qs[1]); f.q = inp.value; }
    mais.addEventListener('click', function () { vis += BLOCO; desenha(); });
    desenha();
  }

  /* ---------- home ---------- */
  function home(box, H) {
    var R = H.resumo;
    box.className = 'mgav mgav-home';
    box.innerHTML = '<section class="mgav-hero">' +
      '<div class="mgav-num"><b>' + mil(R.total) + '</b><span>avaliações positivas</span>' + estrelas(R.media) + '<p class="mgav-sub">Opiniões reais: <b>' + mil(R.ml) + '</b> no Mercado Livre e <b>' + R.ig + '</b> no Instagram da MG.</p><div class="mgav-kpis"><div><strong>' + fmt(R.media) + ' ★</strong>média de 5</div><div><strong>' + R.codigos + '</strong>códigos avaliados</div></div></div>' +
      '<div><div class="mgav-cab"><div><span class="mgav-eb">Avaliações reais</span><h2>Quem usa, recomenda</h2></div><a class="mgav-bt" href="/avaliacoes/">Ver todas as avaliações</a></div>' +
      '<div class="mgav-grid">' + (H.destaques || []).map(cartao).join('') + '</div></div></section>';
    conta(box.querySelector('.mgav-num b'), R.total);
  }

  /* ---------- produto ---------- */
  function codProduto() {
    var b = document.querySelector('.mg-badge');
    if (b) return b.textContent.trim();
    var s = document.querySelector('.product-sku');
    if (s) return s.textContent.replace(/SKU:?/i, '').trim();
    var m = ((document.querySelector('h1') || {}).textContent || '').match(/MG-?[A-Z]?\d+[A-Z]?/i);
    return m ? m[0] : '';
  }
  function produto(box, P) {
    var n = 0, t = setInterval(function () {
      var c = cod(codProduto());
      if (!c && ++n < 40) return;
      clearInterval(t);
      var I = c && P[c];
      if (!I || !I.itens.length) { box.style.display = 'none'; return; }
      var M = I.itens, R = { total: I.n, media: I.media };
      box.className = 'mgav mgav-prod';
      box.innerHTML = '<h3>O que dizem desta peça</h3><div class="mgav-res">' + estrelas(R.media) + '<span><b>' + fmt(R.media) + '</b> de 5 · ' + mil(R.total) + (R.total === 1 ? ' avaliação' : ' avaliações') + ' no Mercado Livre</span></div>' +
        '<div class="mgav-grid">' + M.slice(0, 6).map(cartao).join('') + '</div>' +
        '<a class="mgav-lk" href="/avaliacoes/?c=' + encodeURIComponent(c) + '">' + (R.total > 6 ? 'Ver as ' + mil(R.total) + ' avaliações desta peça →' : 'Ver todas as avaliações MG →') + '</a>';
      box.querySelectorAll('.mgav-peca').forEach(function (p) { p.remove(); });
      var onde = document.getElementById('mg-onde');
      if (onde && onde.parentNode) onde.insertAdjacentElement('afterend', box);
    }, 250);
  }

  /* roda fn uma vez: quando a seção chega perto da tela ou logo depois do carregamento da página (o que vier primeiro) */
  function perto(el, fn) {
    var feito = 0, io;
    function vai() { if (feito) return; feito = 1; if (io) io.disconnect(); fn(); }
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) vai(); }, { rootMargin: '600px 0px' });
      io.observe(el);
    }
    function depois() { setTimeout(vai, 1200); }
    if (document.readyState === 'complete') depois(); else window.addEventListener('load', depois);
  }

  function inicia() {
    var pg = /^\/avaliacoes\/?$/.test(location.pathname) ? document.getElementById('mg-av') : null;
    var hm = document.getElementById('mg-av-home');
    var pr = document.getElementById('mg-av-prod');
    if (!pg && !hm && !pr) return;
    css();
    function pega(u) { return fetch(u).then(function (r) { if (!r.ok) throw r.status; return r.json(); }); }
    if (pg) Promise.all([pega(DADOS), doSite()]).then(function (r) {
      pagina(pg, (r[0] || []).concat(r[1]).filter(function (a) { return a && a.texto && (a.estrelas || 5) >= 4; }));
    }).catch(function () {});
    /* home: arquivo pequeno, só quando a seção chega perto da tela */
    if (hm) perto(hm, function () { pega(DADOS_HOME).then(function (H) { home(hm, H); }).catch(function () { hm.style.display = 'none'; }); });
    if (pr) pega(DADOS_PROD).then(function (P) { produto(pr, P || {}); }).catch(function () { pr.style.display = 'none'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
