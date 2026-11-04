/* Campo de placa na home — MG Peças Automotivas
 * Uso: <div id="mg-home-placa" data-busca="/busca-por-veiculo/"></div> + este script.
 * Não consulta nada aqui: só valida a placa e abre a página de busca com #placa=XXX. */
(function () {
  var raiz = document.getElementById('mg-home-placa');
  if (!raiz) return;
  var BUSCA = raiz.getAttribute('data-busca') || '/busca-por-veiculo/';
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var ilustra = el('div', { class: 'mghp-ilustra', 'aria-hidden': 'true' });
  ilustra.innerHTML = '<svg viewBox="0 0 200 66" width="200" height="66" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="1" y="1" width="198" height="64" rx="6" fill="#fff" stroke="#1d1d1b" stroke-width="2"/>' +
    '<path d="M1 7a6 6 0 0 1 6-6h186a6 6 0 0 1 6 6v11H1z" fill="#0b3b8c"/>' +
    '<text x="100" y="14" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="10" letter-spacing="1.5" fill="#fff">BRASIL</text>' +
    '<rect x="6" y="4" width="14" height="10" fill="#009c3b"/><path d="M13 5l6 4-6 4-6-4z" fill="#ffdf00"/><circle cx="13" cy="9" r="2.3" fill="#002776"/>' +
    '<circle cx="187" cy="9" r="5.5" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M183 10.5c1.5-1 6.5-1 8 0" stroke="#fff" stroke-width="1" fill="none"/>' +
    '<text x="100" y="54" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,Arial,sans-serif" font-weight="700" font-size="32" letter-spacing="3" fill="#1d1d1b">MGP2E26</text>' +
    '<text x="12" y="62" font-family="Arial,sans-serif" font-size="5" fill="#1d1d1b">BR</text></svg>';
  var input = el('input', { type: 'text', class: 'mghp-placa', maxlength: '8', placeholder: 'ABC1D23', autocomplete: 'off', 'aria-label': 'Placa do veículo' });
  var btn = el('button', { type: 'submit', class: 'mghp-btn', text: 'Buscar pela placa' });
  var erro = el('p', { class: 'mghp-erro', role: 'alert' });
  var form = el('form', { class: 'mghp-form', action: BUSCA, method: 'get' }, [input, btn]);
  raiz.className = 'mghp';
  raiz.appendChild(ilustra);
  raiz.appendChild(el('div', { class: 'mghp-texto' }, [
    el('h2', { class: 'mghp-titulo', text: 'Digite a placa e veja as peças MG do seu carro' }),
    el('p', { class: 'mghp-sub', text: 'Nenhum dado do proprietário é consultado.' })
  ]));
  raiz.appendChild(form);
  raiz.appendChild(erro);
  /* fica logo abaixo do card "Encontre a peça certa" (bloco Código 1 da home), se existir */
  var card = document.getElementById('mh-busca');
  if (card && card.parentNode) card.parentNode.insertBefore(raiz, card.nextSibling);
  input.addEventListener('input', function () { input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); erro.textContent = ''; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p)) { erro.textContent = 'Digite uma placa válida, por exemplo ABC1D23 ou ABC1234.'; input.focus(); return; }
    window.location.href = BUSCA + '#placa=' + p;
  });
})();
