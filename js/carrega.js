/* MG Peças – carregador (uma linha no Código do selo para vários arquivos)
   O Código do selo da Nuvemshop tem limite de tamanho. Esta linha única carrega outros arquivos da pasta js/ do
   MESMO commit em que este arquivo foi chamado (o endereço é tirado do próprio <script>), então tudo continua
   fixado por commit. Os nomes vêm no atributo data-mg, sem ".js", separados por espaço:
     <script src=".../mg-cdn@COMMIT/js/carrega.js" data-mg="medicao conta" defer></script>
   Só aceita nomes simples (letras minúsculas, números e hífen) e não carrega o mesmo arquivo duas vezes.
   Use só para arquivos que não mexem no que aparece na página logo na abertura (medição, contador): eles chegam
   um instante depois dos scripts chamados direto no Código do selo. */
(function () {
  var eu = document.currentScript;
  if (!eu || !eu.src) return;
  var base = eu.src.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  var nomes = (eu.getAttribute('data-mg') || '').split(/[\s,]+/);
  var feitos = window.__mgCarrega = window.__mgCarrega || {};
  for (var i = 0; i < nomes.length; i++) {
    var n = nomes[i];
    if (!/^[a-z0-9-]+$/.test(n) || feitos[n]) continue;
    feitos[n] = 1;
    var s = document.createElement('script');
    s.src = base + n + '.js';
    s.async = false;                                /* mantém a ordem do atributo */
    (document.head || document.documentElement).appendChild(s);
  }
})();
