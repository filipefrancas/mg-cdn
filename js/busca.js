/* MG Peças – busca que entende variações de código
   MG08, mg 008, mg-008, MG8, 08 -> MG008 | 7517m -> MG7517M | MG-D, MG-V... ficam como estão.
   Se o código normalizado existe, vai direto para o produto; senão busca o termo normalizado. */
(function () {
  if (window.__mgBusca) return;
  window.__mgBusca = 1;

  function normaliza(t) {
    var s = String(t || '').trim().toUpperCase();
    var m = /^MG[\s\-_.]*(FT|DV|D|V|F|K|G)[\s\-_.]*(\d{1,5}[A-Z]?)$/.exec(s);
    if (m) return { cod: 'MG-' + m[1] + m[2], busca: 'MG-' + m[1] + m[2] };
    m = /^(MG)?[\s\-_.]*(\d{1,5})[\s\-]*([A-Z])?$/.exec(s);
    if (!m) return { cod: '', busca: String(t || '').trim() };
    var num = m[2].length < 3 ? ('000' + m[2]).slice(-3) : m[2];
    var cod = 'MG' + num + (m[3] || '');
    var busca = m[1] || m[3] ? cod : (m[2].length < 3 ? num : m[2]);
    return { cod: cod, busca: busca };
  }

  function produtoDoCodigo(cod) {
    var fim = new RegExp('(^|[\\s\\-–])' + cod.replace(/-/g, '\\-') + '\\s*$', 'i');
    return fetch('/search/?q=' + encodeURIComponent(cod), { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var as = doc.querySelectorAll('a[href*="/produtos/"][title]');
        for (var i = 0; i < as.length; i++) {
          if (fim.test(as[i].getAttribute('title') || '')) return as[i].getAttribute('href');
        }
        return '';
      })
      .catch(function () { return ''; });
  }

  function vaiBuscar(termo) {
    location.href = '/search/?q=' + encodeURIComponent(termo);
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.querySelector) return;
    var abaCod = f.matches('.mh-form[data-aba="cod"]'); /* buscador "Código MG" da home */
    var inp = abaCod ? f.querySelector('.mh-q') : f.querySelector('input[name="q"]');
    if (!inp || (!abaCod && !/\/search\/?$/.test((f.getAttribute('action') || '').split('?')[0]))) return;
    var orig = inp.value;
    if (!orig.trim()) return;
    var n = normaliza(orig);
    if (abaCod && n.cod) n.busca = n.cod;
    if (!n.cod && n.busca === orig.trim()) return; /* texto comum: segue a busca normal */
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!n.cod) { vaiBuscar(n.busca); return; }
    var feito = false;
    var tm = setTimeout(function () { if (!feito) { feito = true; vaiBuscar(n.busca); } }, 4000);
    produtoDoCodigo(n.cod).then(function (href) {
      if (feito) return;
      feito = true;
      clearTimeout(tm);
      if (href) location.href = href; else vaiBuscar(n.busca);
    });
  }, true);

  window.mgNormalizaBusca = normaliza;
})();
