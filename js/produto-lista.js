/* MG Peças – produto e listas (código MG, selo, OEM, tabela de aplicação, campo de busca)
   Porte FIEL da tag "MG site - produto e lista" que rodava pelo Google Tag Manager (HTML personalizado, All Pages).
   Mesmo CSS, mesmos seletores, mesma expressão do código, mesmos textos e o mesmo link do botão: a ideia é o site
   ficar exatamente como está, só que sem depender do GTM. Nada aqui foi "melhorado" de propósito.

   O que faz:
   1. Listas (categoria, busca, vitrines): "Código: MGxxxx" (.mg-codigo) logo abaixo do nome de cada peça.
   2. Página da peça: selo .mg-badge com o código antes do H1; o H1 fica só com o nome e a montadora em diante vai
      para .mg-sub; a caixa .mg-oem recebe os parágrafos de OEM/Embalagem da descrição (que ficam ocultos lá);
      botão .mg-btn "Encontrar representante"; classe .mg-desc no bloco da aplicação; oculta o aviso "sob consulta".
   3. Campo de busca: texto de exemplo (um para computador, outro para celular).

   Convivência com a tag do GTM (enquanto ela ainda estiver ligada), em qualquer ordem:
   - página da peça: as duas usam a mesma marca h1[data-mg="1"]; quem chega depois encontra a marca e não refaz nada;
   - listas: as duas só criam o "Código:" se o elemento seguinte ao nome ainda não for .mg-codigo;
   - busca: gravar o mesmo texto duas vezes não muda nada.
   O resultado é um selo, um OEM, um botão e um "Código:" por peça. O <style> pode ficar repetido (regras iguais).

   Diferenças em relação à tag (nenhuma muda o resultado na página):
   - se o arquivo for carregado antes de a página terminar de ser lida, espera o DOMContentLoaded (a tag rodava na
     hora em que o GTM chegava; se chegasse cedo demais, não montava nada);
   - não roda duas vezes se o arquivo for incluído duas vezes (window.__mgProdutoLista). */
(function () {
  if (window.__mgProdutoLista) return;
  window.__mgProdutoLista = 1;

  /* " - MG1438" ou " – MG1438" no fim do nome */
  var CODIGO = /\s[-\u2013]\s(MG[A-Z0-9-]+)\s*$/i;
  var LINK_REPRESENTANTE = 'https://mgpecasautomotivas.my.canva.site/';

  /* CSS igual ao da tag, sem tirar nem pôr */
  var CSS = [
    '',
    '  /* lista de produtos: código abaixo do nome */',
    '  .mg-codigo { font-size: 13px; color: #777; margin-top: 4px; }',
    '',
    '  /* descrição: esconde o título repetido, aumenta a aplicação */',
    '  .mg-desc h2:first-child { display: none; }',
    '  .mg-desc { font-size: 16px; color: #222; }',
    '  .mg-desc h3 { font-size: 18px; text-transform: uppercase; letter-spacing: .5px; margin: 6px 0 8px; }',
    '  .mg-desc table { border-collapse: collapse; width: 100%; font-size: 15px; }',
    '  .mg-desc th { background: #1d3557; color: #fff; text-align: left; padding: 8px 10px; font-size: 13px; text-transform: uppercase; }',
    '  .mg-desc td { border-bottom: 1px solid #e3e3e3; padding: 9px 10px; text-transform: uppercase; font-weight: 600; }',
    '  .mg-desc tr:nth-child(even) td { background: #f8f9fb; }',
    '  .mg-desc ul { padding-left: 0; list-style: none; margin: 0; }',
    '  .mg-desc li { border-bottom: 1px solid #e3e3e3; padding: 9px 10px; text-transform: uppercase; font-weight: 600; }',
    '  .mg-desc li:nth-child(even) { background: #f8f9fb; }',
    '  .mg-desc p:last-child { font-size: 13px; color: #777; margin-top: 14px; }',
    '',
    '  /* cabeçalho do produto */',
    '  .mg-badge { display: inline-block; background: #1d3557; color: #fff; font-weight: bold; font-size: 20px; padding: 6px 14px; border-radius: 6px; letter-spacing: 1px; margin-bottom: 10px; }',
    '  .mg-sub { color: #666; font-size: 15px; margin: 4px 0 14px; }',
    '  .mg-oem { background: #f4f7fa; border-left: 4px solid #1a8fe3; padding: 10px 14px; border-radius: 4px; font-size: 15px; margin: 0 0 16px; }',
    '  .mg-oem b { color: #1d3557; }',
    '  .mg-btn { display: inline-block; text-align: center; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; text-transform: uppercase; color: #1a8fe3; border: 2px solid #1a8fe3; text-decoration: none; margin: 0 0 20px; }',
    '  .mg-btn:hover { background: #1a8fe3; color: #fff; }',
    '  .mg-oculto { display: none !important; }',
    ''
  ].join('\n');

  /* o GTM punha o <style> da tag no fim do <body>; aqui vai para o mesmo lugar (mesma ordem em relação ao resto) */
  function estilo() {
    if (document.getElementById('mg-produto-lista-css')) return;
    var s = document.createElement('style');
    s.id = 'mg-produto-lista-css';
    s.textContent = CSS;
    (document.body || document.head || document.documentElement).appendChild(s);
  }

  /* 1. listas: "Código: MGxxxx" abaixo do nome */
  function codigoNasListas() {
    var nomes = document.querySelectorAll('.item-name, .js-item-name, .item-title, .product-item-name, .js-product-name');
    for (var i = 0; i < nomes.length; i++) {
      var nome = nomes[i];
      /* já tem (feito por este arquivo ou pela tag do GTM): não repete */
      if (nome.nextElementSibling && nome.nextElementSibling.classList.contains('mg-codigo')) continue;
      var achou = (nome.textContent || '').trim().match(CODIGO);
      if (!achou) continue;
      var linha = document.createElement('div');
      linha.className = 'mg-codigo';
      linha.textContent = 'C\u00f3digo: ' + achou[1].toUpperCase();
      nome.insertAdjacentElement('afterend', linha);
    }
  }

  /* 2. página da peça */
  function produto() {
    var h1 = document.querySelector('h1');
    if (!h1 || h1.dataset.mg) return;                      /* data-mg: já montado (aqui ou pela tag do GTM) */
    var achou = (h1.textContent || '').trim().match(CODIGO);
    if (!achou) return;
    h1.dataset.mg = '1';
    var codigo = achou[1].toUpperCase();

    /* nome sem o código; da 1ª montadora em diante vira subtítulo (só se a montadora não for a 1ª palavra) */
    var resto = h1.textContent.trim().replace(CODIGO, '');
    var MONTADORAS = /\b(Audi|BMW|Chery|Chevrolet|Citro[e\u00eb]n|Dodge|Fiat|Ford|GM|Honda|Hyundai|Iveco|Jeep|Kia|Land Rover|Mercedes|Mitsubishi|Nissan|Peugeot|Renault|Seat|Suzuki|Toyota|Volkswagen|VW|Volvo)\b/;
    var m = resto.match(MONTADORAS);
    var titulo = resto, subtitulo = '';
    if (m && m.index > 0) {
      titulo = resto.slice(0, m.index).trim();
      subtitulo = resto.slice(m.index).trim();
    }

    var selo = document.createElement('div');
    selo.className = 'mg-badge';
    selo.textContent = codigo;
    h1.parentNode.insertBefore(selo, h1);
    h1.textContent = titulo;

    var sub;
    if (subtitulo) {
      sub = document.createElement('div');
      sub.className = 'mg-sub';
      sub.textContent = subtitulo;
      h1.insertAdjacentElement('afterend', sub);
    }

    /* bloco da descrição: o pai do 1º <h3> que fala em "aplica(ção)" */
    var h3s = document.querySelectorAll('h3');
    var desc = null;
    for (var i = 0; i < h3s.length; i++) {
      if (/aplica/i.test(h3s[i].textContent)) { desc = h3s[i].parentNode; break; }
    }
    if (!desc) return;                                     /* sem aplicação: a tag também parava aqui */
    desc.classList.add('mg-desc');

    /* parágrafos curtos de OEM / Embalagem sobem para a caixa .mg-oem e somem da descrição */
    var trechos = [];
    var ps = desc.querySelectorAll('p');
    for (i = 0; i < ps.length; i++) {
      var texto = ps[i].textContent || '';
      if (/OEM|Embalagem/i.test(texto) && texto.length < 200) {
        trechos.push(ps[i].innerHTML);
        ps[i].classList.add('mg-oculto');
      }
    }

    var ancora = sub || h1;
    if (trechos.length) {
      var oem = document.createElement('div');
      oem.className = 'mg-oem';
      oem.innerHTML = trechos.join(' &nbsp;\u00b7&nbsp; ');
      ancora.insertAdjacentElement('afterend', oem);
      ancora = oem;
    }

    var botao = document.createElement('a');
    botao.className = 'mg-btn';
    botao.href = LINK_REPRESENTANTE;
    botao.textContent = 'Encontrar representante';
    ancora.insertAdjacentElement('afterend', botao);

    /* oculta o aviso "sob consulta" (o elemento do texto ou o link/botão em volta dele) */
    var todos = document.querySelectorAll('a, button, span, div');
    for (i = 0; i < todos.length; i++) {
      var el = todos[i];
      if (el.children.length === 0 && /pre[\u00e7c]o sob consulta/i.test(el.textContent)) {
        el = el.closest('a, button') || el;
        el.classList.add('mg-oculto');
      }
    }
  }

  /* 3. texto de exemplo do campo de busca */
  function busca() {
    var texto = window.innerWidth < 768 ? 'C\u00f3digo MG, carro ou OEM' : 'Busque por c\u00f3digo MG, carro ou OEM';
    var campos = document.querySelectorAll('.js-search-input, input[name="q"]');
    for (var i = 0; i < campos.length; i++) campos[i].setAttribute('placeholder', texto);
  }

  function inicia() {
    estilo();
    codigoNasListas();
    produto();
    busca();
    window.addEventListener('resize', busca);
    /* listas que entram depois (rolagem, filtros, vitrines): refaz o passo 1 a cada mudança na página */
    if (document.body) new MutationObserver(codigoNasListas).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia);
  else inicia();
})();
