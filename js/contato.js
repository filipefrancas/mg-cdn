/* MG Peças – página Fale com a MG (/contato/)
   Arquivo separado do seo.js. Só roda na página de contato (body.template-contact).
   Monta 5 assuntos, cada um com um formulário curto, e envia para o Worker (mg-depoimentos, rota /contato).
   O formulário nativo da Nuvemshop continua na página, recolhido em "Prefere o formulário simples?".
   Se o envio falhar, ele abre sozinho, já preenchido (se não for achado, o texto continua no formulário novo).
   O tempo de espera só começa a contar depois que o arquivo terminou de subir (internet de celular fraca).
   Link direto: /contato/?assunto=peca | distribuidor | fornecedor | trabalhe | outro | ficha (ficha cadastral: formulário do distribuidor) */
(function () {
  if (window.__mgContato) return;
  window.__mgContato = 1;

  var API = (window.MG_CONTATO_API || 'https://mg-depoimentos.filipefrancasilva10.workers.dev') + '/contato';
  var TURNSTILE_SITEKEY = window.MG_CONTATO_TURNSTILE || '0x4AAAAAAFyjfyGv2JPK5Lw_'; // site key (pública) do widget Turnstile "MG Contato" (criado em 03/11/2026)
  var ARQ_MAX = 3 * 1024 * 1024, ESPERA_MS = 20000, PARADO_MS = 45000, FOTO_MAX_PX = 1600;
  var ML_MARCA = '_BRAND_64522', ML_SUFIXO = 'MG Mangueiras - MG Peças Automotivas'; // mesmo padrão do botão da ficha e do app

  var T = {
    titulo: 'Fale com a MG',
    intro: 'Escolha o assunto para sua mensagem chegar organizada.',
    trocar: 'Trocar de assunto',
    enviar: 'Enviar mensagem', enviando: 'Enviando...', enviandoArq: 'Enviando o arquivo... ', esperaArq: 'Com arquivo, o envio pode demorar um pouco se a internet estiver fraca. Não feche a página.',
    lgpd: 'Usamos seus dados só para responder esta mensagem. Veja a <a href="/politica-de-privacidade/">Política de privacidade</a>.',
    preencha: 'Preencha este campo.',
    contato: 'Escreva seu e-mail ou seu telefone, para a gente conseguir responder.',
    email: 'Confira o e-mail. Ex.: nome@gmail.com',
    telefone: 'Confira o telefone. Ex.: 11 91234-5678',
    cnpj: 'Confira o CNPJ. Ex.: 12.345.678/0001-90',
    escolha: 'Escolha uma opção.',
    longo: 'Este texto ficou longo demais. Encurte um pouco.',
    verificacao: 'Não conseguimos confirmar que é uma pessoa. Espere a verificação acima terminar e envie de novo.',
    umDosDois: 'Preencha pelo menos um dos dois.',
    ok1: 'Mensagem enviada. Obrigado, ', ok2: 'Número do seu contato: ', ok3: '. Se for escrever de novo sobre o mesmo assunto, informe esse número.',
    limite: 'Você já mandou várias mensagens agora. Tente de novo daqui a uma hora.',
    falha: 'Não conseguimos enviar por aqui agora. Copiamos sua mensagem para o formulário simples logo abaixo. É só clicar ou tocar em Enviar.',
    falhaArq: ' O arquivo não vai junto por esse formulário.',
    cheio: 'Estamos recebendo muitas mensagens agora. Copiamos a sua para o formulário simples logo abaixo. É só clicar ou tocar em Enviar.',
    falhaSem: 'Não conseguimos enviar agora. Sua mensagem continua aqui. Tente de novo em alguns minutos.',
    offline: 'Parece que você está sem internet. Sua mensagem continua aqui. Tente de novo quando a internet voltar.',
    arqCheio: 'Hoje não conseguimos receber mais arquivos por aqui. Tire o arquivo e envie só a mensagem, ou tente de novo amanhã.',
    simples: 'Prefere o formulário simples?',
    arqBotao: 'Escolher arquivo ou tirar foto', tirar: 'Tirar',
    arqTipo: 'Este arquivo não pode ser enviado. Mande só PDF, JPG ou PNG.',
    arqGrande: 'Arquivo grande demais. O limite é 3 MB.',
    arqQtd: 'Arquivos demais. Tire um e tente de novo.',
    arqPdf: 'Por segurança, não aceitamos este PDF (ele tem senha, programa ou comando escondido). Mande uma foto do documento ou use "Imprimir > Salvar como PDF" no navegador.',
    curriculo: 'Mande o currículo ou escreva sua experiência na mensagem.',
    endereco: 'Av. Casa Grande, 1534, Galpão B, Diadema-SP'
  };

  var UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
  var F = { // campos comuns
    nome: { n: 'nome', l: 'Seu nome', req: 1, max: 80, ac: 'name' },
    email: { n: 'email', l: 'Seu e-mail', t: 'email', max: 120, ac: 'email', im: 'email' },
    tel: { n: 'telefone', l: 'Seu WhatsApp ou telefone', t: 'tel', max: 30, ac: 'tel', im: 'tel' },
    msg: { n: 'mensagem', l: 'Sua mensagem', t: 'area', req: 1, max: 3000 }
  };
  function c(base, extra) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in extra) o[k] = extra[k]; return o; }
  var ICONES = {
    peca: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    distribuidor: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    fornecedor: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
    trabalhe: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    outro: '<path d="M4 5h16v11H8l-4 4z"/>',
    ficha: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM8 12h8M8 16h6"/>'
  };
  var CAMPOS_DIST = [F.nome, { n: 'empresa', l: 'Empresa ou nome da loja', req: 1, max: 120, ac: 'organization' },
    { n: 'cnpj', l: 'CNPJ (opcional)', max: 20, ph: 'Ex.: 12.345.678/0001-90' },
    { n: 'negocio', l: 'Tipo de negócio', t: 'lista', req: 1, op: ['Autopeças', 'Oficina', 'Distribuidor', 'Outro'] },
    { n: 'cidade', l: 'Cidade', req: 1, max: 80, ac: 'address-level2' },
    { n: 'uf', l: 'UF', t: 'lista', req: 1, op: UFS, ac: 'address-level1' }, F.email, F.tel,
    c(F.msg, { l: 'Mensagem (opcional)', req: 0, ph: 'Ex.: Quero conhecer a linha MG para a minha loja.' })];
  var TXT_FICHA = { enviar: 'Enviar ficha cadastral', ok1: 'Ficha enviada. Obrigado, ',
    lgpd: 'Usamos seus dados só para entrar em contato com você. Veja a <a href="/politica-de-privacidade/">Política de privacidade</a>.' };
  var ASSUNTOS = [
    { id: 'peca', titulo: 'Dúvida sobre uma peça', sub: 'Código, aplicação ou qual peça serve no seu veículo', contato: 'um', arquivos: 2,
      campos: [F.nome, F.email, F.tel,
        { n: 'codigo', l: 'Código MG ou número original (se tiver)', max: 60, ac: 'off', cap: 'characters' },
        { n: 'veiculo', l: 'Veículo, ano e motor (se souber)', max: 120, ph: 'Ex.: Gol 1.0 2012' },
        c(F.msg, { ph: 'Ex.: A mangueira do radiador está rachada e quero saber qual é a da MG.' }),
        { n: 'arquivo', t: 'arquivo', l: 'Foto da peça (opcional, até 2 fotos)', ajuda: 'Uma foto da peça antiga, de preferência mostrando o número gravado, ajuda muito a achar a certa.', so: 'foto' }] },
    c({ id: 'distribuidor', titulo: 'Sou distribuidor', sub: 'Falar com o representante da sua região', contato: 'um', arquivos: 0, campos: CAMPOS_DIST }, TXT_FICHA),
    /* Ficha cadastral: o mesmo formulário do distribuidor, aberto por /contato/?assunto=ficha (botão "Quero que a MG me procure"
       do cartão de revenda e página Representantes). Não aparece como cartão (oculto) e é enviado ao Worker como "distribuidor". */
    c({ id: 'ficha', envia: 'distribuidor', oculto: 1, titulo: 'Ficha cadastral', sub: 'A MG entra em contato com você', contato: 'um', arquivos: 0, campos: CAMPOS_DIST }, TXT_FICHA),
    { id: 'fornecedor', titulo: 'Sou fornecedor', sub: 'Quero apresentar um produto ou serviço para a MG', contato: 'email', arquivos: 1,
      campos: [F.nome, { n: 'empresa', l: 'Empresa', req: 1, max: 120, ac: 'organization' }, c(F.email, { req: 1 }),
        c(F.tel, { l: 'Telefone (opcional)' }),
        { n: 'categoria', l: 'O que você quer apresentar?', t: 'lista', req: 1, op: ['Matéria-prima', 'Embalagem', 'Máquinas e ferramentas', 'Serviço', 'Outro'] },
        { n: 'cnpj', l: 'CNPJ (opcional)', max: 20, ph: 'Ex.: 12.345.678/0001-90' },
        { n: 'site', l: 'Site da empresa (opcional)', t: 'url', max: 200, im: 'url', ac: 'url' }, F.msg,
        { n: 'arquivo', t: 'arquivo', l: 'Apresentação (opcional)', ajuda: 'PDF, JPG ou PNG, até 3 MB. Está em PowerPoint ou Word? Salve como PDF (Arquivo > Salvar como > PDF). Se for maior, coloque o link no campo do site.' }] },
    { id: 'trabalhe', titulo: 'Quero trabalhar na MG', sub: 'Deixe seus dados e seu currículo', contato: 'telefone', arquivos: 1,
      campos: [F.nome, c(F.tel, { req: 1 }), c(F.email, { l: 'Seu e-mail (opcional)' }),
        { n: 'cidade_bairro', l: 'Cidade e bairro onde mora', req: 1, max: 120 },
        { n: 'trabalho', l: 'Que tipo de trabalho você procura ou já fez?', req: 1, max: 300 },
        { n: 'arquivo', t: 'arquivo', l: 'Currículo', ajuda: 'PDF, JPG ou PNG, até 3 MB. Pode ser uma foto nítida do currículo em papel. Se estiver em Word, salve como PDF (Arquivo > Salvar como > PDF).' },
        c(F.msg, { l: 'Mensagem (opcional)', req: 0, ajuda: 'Não tem currículo em arquivo? Escreva aqui sua experiência.' }),
        { n: 'autorizo', t: 'caixa', req: 1, l: 'Autorizo a MG a guardar meus dados e meu currículo por até 60 dias, só para avaliar uma vaga.' }] },
    { id: 'outro', titulo: 'Outro assunto', sub: 'Qualquer outra mensagem', contato: 'um', arquivos: 0,
      campos: [F.nome, F.email, F.tel, { n: 'assunto_txt', l: 'Assunto', req: 1, max: 80 }, F.msg] }
  ];
  var TOPO = {
    peca: '<div class="mgf-atalhos"><p class="mgf-atalhos-t">Antes de escrever, veja se a resposta já está aqui:</p><div class="mgf-atalhos-b">' +
      '<a class="mgf-bt mgf-bt2" href="/busca-por-veiculo/">Buscar pelo veículo</a><a class="mgf-bt mgf-bt2" href="/catalogo/">Ver o catálogo</a>' +
      '<a class="mgf-bt mgf-bt2 mgf-ml" href="https://lista.mercadolivre.com.br/mg-pecas-automotivas" target="_blank" rel="noopener">Encontre em lojas parceiras online</a></div>' +
      '<p class="mgf-pequeno">Você será direcionado a revendedores independentes.</p></div>',
    distribuidor: '<p class="mgf-texto">A MG Peças Automotivas é fabricante e vende para distribuidores de autopeças. O representante da sua região atende você.</p>' +
      '<p><a class="mgf-bt mgf-bt1" href="/representantes/">Sou distribuidor – falar com representante</a></p><p class="mgf-texto mgf-sub2 mgf-pre">Prefere que a MG entre em contato? Preencha a ficha cadastral:</p>',
    fornecedor: '<p class="mgf-texto">Quer apresentar um produto ou serviço para a fábrica? Conte em poucas linhas o que sua empresa faz e, se quiser, anexe a apresentação. Se houver interesse, a MG entra em contato.</p>',
    trabalhe: '<p class="mgf-texto">Deixe seus dados e seu currículo. Se surgir uma vaga que combine com você, a MG pode entrar em contato.</p>',
    outro: '<p class="mgf-texto">Para qualquer outro assunto, escreva aqui.</p>',
    ficha: '<p class="mgf-texto mgf-pre">Preencha seus dados e a MG entra em contato com você.</p>'
  };

  var CSS = '' +
    '#mg-fale{--az:#1a73c8;--az2:#3498db;--azc:#eef6fc;--mar:#000922;--tx:#2b3445;--ci:#5b6576;--bd:#d5deeb;--er:#b3261e;font-family:Inter,system-ui,sans-serif;color:var(--tx);padding:24px 0 8px}' +
    '#mg-fale *{box-sizing:border-box}#mg-fale [hidden]{display:none !important}#mg-fale .mgf-in{max-width:760px}' +
    '#mg-fale .mgf-intro{font-size:17px;line-height:1.55;margin:0 0 20px;max-width:60ch}' +
    '#mg-fale .mgf-cartoes{display:grid;grid-template-columns:1fr;gap:12px}' +
    '@media(min-width:768px){#mg-fale .mgf-cartoes{grid-template-columns:1fr 1fr}#mg-fale .mgf-cartoes .mgf-cartao:last-child{grid-column:1 / -1}}' +
    '#mg-fale .mgf-cartao{display:flex;align-items:center;gap:14px;width:100%;min-height:72px;padding:14px 16px;text-align:left;background:#fff;border:1.5px solid var(--bd);border-radius:12px;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,box-shadow .15s}' +
    '#mg-fale .mgf-cartao:hover{border-color:var(--az2);box-shadow:0 2px 10px rgba(26,115,200,.12)}' +
    '#mg-fale .mgf-cartao:focus-visible,#mg-fale a:focus-visible,#mg-fale button:focus-visible{outline:3px solid #f5b400;outline-offset:2px}' +
    '#mg-fale .mgf-ic{flex:0 0 44px;height:44px;border-radius:10px;background:var(--azc);display:flex;align-items:center;justify-content:center}' +
    '#mg-fale .mgf-ic svg{width:24px;height:24px;fill:none;stroke:var(--az);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '#mg-fale .mgf-ct{display:block;font-weight:700;font-size:17px;line-height:1.25;color:var(--mar)}#mg-fale .mgf-cs{display:block;font-size:14px;line-height:1.4;color:var(--ci);margin-top:2px}' +
    '#mg-fale .mgf-escolhido{background:var(--az);border-color:var(--az);cursor:default}#mg-fale .mgf-escolhido .mgf-ct,#mg-fale .mgf-escolhido .mgf-cs{color:#fff}#mg-fale .mgf-escolhido:hover{box-shadow:none;border-color:var(--az)}' +
    '#mg-fale .mgf-escolhido .mgf-ic{background:rgba(255,255,255,.18)}#mg-fale .mgf-escolhido .mgf-ic svg{stroke:#fff}' +
    '#mg-fale .mgf-trocar{display:inline-flex;align-items:center;min-height:48px;padding:0 4px;margin:4px 0 8px;background:none;border:0;color:var(--az);font:600 16px Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}' +
    '#mg-fale .mgf-painel{max-width:640px}#mg-fale .mgf-texto{font-size:16px;line-height:1.6;margin:16px 0 12px}#mg-fale .mgf-sub2{margin-top:20px;font-weight:600}' +
    '#mg-fale .mgf-atalhos{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:16px;margin:16px 0 8px}#mg-fale .mgf-atalhos-t{margin:0 0 10px;font-weight:600;font-size:16px}' +
    '#mg-fale .mgf-atalhos-b{display:flex;flex-wrap:wrap;gap:8px}#mg-fale .mgf-pequeno{font-size:13px;color:var(--ci);margin:8px 0 0}' +
    '#mg-fale .mgf-bt{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:8px;font:600 15px Inter,system-ui,sans-serif;text-decoration:none;text-align:center;line-height:1.2}' +
    '#mg-fale .mgf-bt1{background:var(--az);color:#fff;border:2px solid var(--az)}#mg-fale .mgf-bt1:hover{background:#155fa6}' +
    '#mg-fale .mgf-bt2{background:#fff;color:var(--az);border:1.5px solid var(--az2)}#mg-fale .mgf-bt2:hover{background:var(--azc)}' +
    '@media(max-width:767px){#mg-fale .mgf-atalhos-b .mgf-bt{flex:1 1 100%}#mg-fale .mgf-bt1{width:100%}}' +
    '#mg-fale form{margin-top:12px}#mg-fale .mgf-campo{margin:0 0 16px}#mg-fale label.mgf-l{display:block;font-weight:600;font-size:15px;margin:0 0 6px;color:var(--mar)}' +
    '#mg-fale .mgf-req{color:var(--er);margin-left:2px}' +
    '#mg-fale input[type=text],#mg-fale input[type=email],#mg-fale input[type=tel],#mg-fale input[type=url],#mg-fale select,#mg-fale textarea{width:100%;min-height:48px;padding:11px 12px;font:16px Inter,system-ui,sans-serif;color:var(--tx);background:#fff;border:1.5px solid #b8c4d6;border-radius:8px}' +
    '#mg-fale textarea{min-height:140px;resize:vertical;line-height:1.5}#mg-fale input:focus,#mg-fale select:focus,#mg-fale textarea:focus{outline:none;border-color:var(--az);box-shadow:0 0 0 3px rgba(26,115,200,.2)}' +
    '#mg-fale [aria-invalid=true]{border-color:var(--er) !important}#mg-fale .mgf-erro{color:var(--er);font-size:14px;margin:6px 0 0;font-weight:500}#mg-fale .mgf-erro:empty{display:none}' +
    '#mg-fale .mgf-ajuda{font-size:14px;color:var(--ci);margin:6px 0 0;line-height:1.45}#mg-fale .mgf-dupla{display:grid;gap:0 12px}@media(min-width:600px){#mg-fale .mgf-dupla{grid-template-columns:1fr 1fr}}' +
    '#mg-fale .mgf-dupla-aj{grid-column:1 / -1;margin:-8px 0 16px}' +
    '#mg-fale .mgf-cid{display:grid;grid-template-columns:1fr 120px;gap:12px}' +
    '#mg-fale .mgf-ficha{display:inline-flex;align-items:center;min-height:48px;margin-top:4px;color:var(--az);font-weight:600;font-size:15px}' +
    '#mg-fale .mgf-arq-bt{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 16px;border:1.5px dashed var(--az2);border-radius:8px;background:#fff;color:var(--az);font:600 15px Inter,system-ui,sans-serif;cursor:pointer}' +
    '#mg-fale .mgf-arq-bt svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2}' +
    '#mg-fale .mgf-arqs{list-style:none;padding:0;margin:8px 0 0}#mg-fale .mgf-arqs li{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:1px solid var(--bd);border-radius:8px;padding:4px 4px 4px 12px;margin-bottom:6px;font-size:15px;word-break:break-all}' +
    '#mg-fale .mgf-arqs button{min-height:48px;min-width:64px;background:none;border:0;color:var(--er);font:600 15px Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}' +
    '#mg-fale .mgf-caixa{display:flex;gap:12px;align-items:flex-start;font-size:15px;line-height:1.5;cursor:pointer;min-height:48px}#mg-fale .mgf-caixa input{width:24px;height:24px;flex:0 0 24px;margin:2px 0 0;accent-color:var(--az)}' +
    '#mg-fale .mgf-enviar{width:100%;min-height:52px;border:0;border-radius:8px;background:var(--az);color:#fff;font:700 17px "Barlow Condensed",Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}' +
    '#mg-fale .mgf-enviar:hover{background:#155fa6}#mg-fale .mgf-enviar[disabled]{opacity:.7;cursor:wait}@media(min-width:768px){#mg-fale .mgf-enviar{width:auto;padding:0 40px}}' +
    '#mg-fale .mgf-lgpd{font-size:14px;color:var(--ci);margin:12px 0 0;line-height:1.5}#mg-fale .mgf-lgpd a{color:var(--az)}' +
    '#mg-fale .mgf-aviso{border-radius:10px;padding:14px 16px;margin:12px 0;font-size:16px;line-height:1.5}#mg-fale .mgf-aviso:empty{display:none}' +
    '#mg-fale .mgf-aviso.erro{background:#fdecea;color:#7a1712;border:1px solid #f2b8b5}' +
    '#mg-fale .mgf-ok{background:#fff;border:1.5px solid #1e9e5a;border-radius:12px;padding:20px;margin-top:16px}#mg-fale .mgf-ok h2{font:800 26px "Barlow Condensed",sans-serif;text-transform:uppercase;color:var(--mar);margin:0 0 8px}' +
    '#mg-fale .mgf-ok p{margin:0;font-size:16px;line-height:1.55}#mg-fale .mgf-prot{font-weight:700;color:var(--mar);font-size:18px;letter-spacing:.04em}' +
    '#mg-fale .mgf-escolhido:focus{outline:3px solid #f5b400;outline-offset:2px}#mg-fale .mgf-progresso{font-size:15px;color:var(--ci);margin:10px 0 0}#mg-fale .mgf-progresso:empty{display:none}' +
    '#mg-fale .mgf-isca{position:absolute !important;left:-9999px !important;width:1px;height:1px;overflow:hidden}' +
    '.mgf-simples-bt{display:inline-flex;align-items:center;min-height:48px;padding:0;margin:0 0 8px;background:none;border:0;color:#1a73c8;font:600 16px Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}' +
    '.mgf-nativo-fechado{display:none !important}' +
    '.mgf-chegar{background:#fff;border:1px solid #e3e8ef;border-radius:8px;padding:16px 18px;margin:24px 0 0;max-width:540px}' +
    '.mgf-chegar h2{font:800 22px "Barlow Condensed",sans-serif;text-transform:uppercase;color:#000922;margin:0 0 2px}.mgf-chegar p{margin:0 0 12px;font-size:16px;color:#2b3445}' +
    '.mgf-chegar .mgf-chb{display:flex;flex-wrap:wrap;gap:8px}.mgf-chegar a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 16px;border:1.5px solid #3498db;border-radius:6px;color:#1a73c8;font:600 15px Inter,system-ui,sans-serif;text-decoration:none;background:#fff}' +
    '.mgf-chegar a:hover{background:#eef6fc}@media(max-width:767px){.mgf-chegar a{flex:1 1 140px}}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function telOk(t) { var d = String(t).replace(/\D/g, ''); return d.length >= 8 && d.length <= 26; } // mesma regra do Worker
  var CNPJ_RE = /^[0-9A-Za-z./\s-]{11,20}$/;
  function emailOk(e) { return /^[A-Za-z0-9._%+-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(e); }
  function mb(n) { return n < 102400 ? Math.max(1, Math.ceil(n / 1024)) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }

  /* mesma normalização do busca.js (MG08, mg 8 -> MG008) */
  function normaliza(t) {
    if (window.mgNormalizaBusca) return window.mgNormalizaBusca(t);
    var s = String(t || '').trim().toUpperCase();
    var m = /^MG[\s\-_.]*(FT|DV|D|V|F|K|G)[\s\-_.]*(\d{1,5}[A-Z]?)$/.exec(s);
    if (m) return { cod: 'MG-' + m[1] + m[2] };
    m = /^(MG)?[\s\-_.]*(\d{1,5})[\s\-]*([A-Z])?$/.exec(s);
    if (!m) return { cod: '' };
    var num = m[2].length < 3 ? ('000' + m[2]).slice(-3) : m[2];
    return { cod: 'MG' + num + (m[3] || '') };
  }

  /* ---------- arquivos: conferência no navegador (o Worker confere de novo) ---------- */
  function lerBytes(file, ini, fim) {
    return new Promise(function (ok, erro) { var r = new FileReader(); r.onload = function () { ok(new Uint8Array(r.result)); }; r.onerror = erro; r.readAsArrayBuffer(file.slice(ini, fim)); });
  }
  // Mesma lista do Worker. /OpenAction e /AA sozinhos não são problema (o LibreOffice usa para abrir na página 1).
  // O Worker ainda abre as partes comprimidas do PDF e confere de novo.
  var PROIBIDOS = { JavaScript: 1, JS: 1, Launch: 1, EmbeddedFile: 1, EmbeddedFiles: 1, RichMedia: 1, XFA: 1, SubmitForm: 1, ImportData: 1, GoToR: 1, GoToE: 1, Encrypt: 1, Rendition: 1, OnInstantiate: 1, Movie: 1, Sound: 1 };
  function pdfPerigoso(u) {
    var n = u.length, DEL = { 0: 1, 9: 1, 10: 1, 12: 1, 13: 1, 32: 1, 40: 1, 41: 1, 60: 1, 62: 1, 91: 1, 93: 1, 123: 1, 125: 1, 47: 1, 37: 1 };
    function hx(b) { if (b >= 48 && b <= 57) return b - 48; b |= 32; return b >= 97 && b <= 102 ? b - 87 : -1; }
    for (var i = u.indexOf(47); i !== -1 && i < n; i = u.indexOf(47, i + 1)) {
      var nome = '', j = i + 1;
      while (j < n && !DEL[u[j]] && nome.length < 20) {
        var b = u[j];
        if (b === 35 && j + 2 < n && hx(u[j + 1]) >= 0 && hx(u[j + 2]) >= 0) { b = hx(u[j + 1]) * 16 + hx(u[j + 2]); j += 2; }
        nome += String.fromCharCode(b); j++;
      }
      if (PROIBIDOS[nome]) return true;
      if (j > i + 1) i = j - 1;
    }
    return false;
  }
  function reduzirFoto(file) {
    return new Promise(function (ok, erro) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, FOTO_MAX_PX / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? ok(b) : erro('tipo'); }, 'image/jpeg', 0.85); // JPEG novo: sai sem GPS/EXIF
      };
      img.onerror = function () { URL.revokeObjectURL(url); erro('tipo'); };
      img.src = url;
    });
  }
  /* devolve { blob, ext } ou rejeita com 'tipo' | 'grande' | 'pdf' */
  function prepararArquivo(file, soFoto) {
    return lerBytes(file, 0, 8).then(function (c) {
      var pdf = c[0] === 0x25 && c[1] === 0x50 && c[2] === 0x44 && c[3] === 0x46 && c[4] === 0x2D;
      if (pdf && !soFoto) {
        if (file.size > ARQ_MAX) throw 'grande';
        return lerBytes(file, 0, file.size).then(function (u) { if (pdfPerigoso(u)) throw 'pdf'; return { blob: file, ext: 'pdf' }; });
      }
      if (pdf && soFoto) throw 'tipo';
      if (file.size > 40 * 1024 * 1024) throw 'grande';
      return reduzirFoto(file).then(function (b) { if (b.size > ARQ_MAX) throw 'grande'; return { blob: b, ext: 'jpg' }; });
    });
  }

  /* ---------- formulário nativo (reserva) ---------- */
  var nativo = null;
  function acharNativo() {
    var sec = document.getElementById('ns-section-contact_form');
    var f = (sec && sec.querySelector('form')) || document.querySelector('form.js-contact-form, form[action*="contact"], form[action*="contato"]');
    if (!f) { var fs = document.querySelectorAll('#MainContent form'); for (var i = 0; i < fs.length; i++) if (fs[i].querySelector('textarea')) { f = fs[i]; break; } }
    return f;
  }
  function campoNativo(f, re, tipo) {
    var els = f.querySelectorAll(tipo === 'area' ? 'textarea' : 'input');
    for (var i = 0; i < els.length; i++) { var e = els[i]; if (e.type === 'hidden') continue; if (tipo === 'area' || re.test((e.name || '') + ' ' + (e.id || '') + ' ' + (e.type || ''))) return e; }
    return null;
  }
  function abrirNativo(preencher) {
    if (!nativo) return false;
    nativo.wrap.classList.remove('mgf-nativo-fechado');
    nativo.bt.setAttribute('aria-expanded', 'true');
    if (preencher) {
      var f = nativo.form, p = preencher;
      [[/name|nome/i, p.nome], [/mail/i, p.email], [/phone|tel/i, p.telefone]].forEach(function (x) {
        var e = campoNativo(f, x[0]); if (e && x[1]) { e.value = x[1]; e.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      var t = campoNativo(f, null, 'area'); if (t) { t.value = p.texto; t.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    return true;
  }

  /* ---------- montagem ---------- */
  var raiz, cartoesBox, painelBox, estado = {};

  function cartaoHTML(a) {
    return '<span class="mgf-ic" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONES[a.id] + '</svg></span><span><span class="mgf-ct">' + esc(a.titulo) + '</span><span class="mgf-cs">' + esc(a.sub) + '</span></span>';
  }

  function campoHTML(a, f) {
    var id = 'mgf-' + a.id + '-' + f.n, r = f.req ? '<span class="mgf-req" aria-hidden="true">*</span>' : '';
    var desc = (f.ajuda ? id + '-aj ' : '') + id + '-er';
    var comum = ' id="' + id + '" name="' + f.n + '"' + (f.req ? ' aria-required="true"' : '') + ' aria-describedby="' + desc + '"' + (f.max ? ' maxlength="' + f.max + '"' : '') + (f.ac ? ' autocomplete="' + f.ac + '"' : '') + (f.im ? ' inputmode="' + f.im + '"' : '') + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.cap ? ' autocapitalize="' + f.cap + '"' : '');
    var h = '<div class="mgf-campo" data-campo="' + f.n + '">';
    if (f.t === 'caixa') {
      h += '<label class="mgf-caixa"><input type="checkbox" value="sim"' + comum + '><span>' + esc(f.l) + r + '</span></label>';
    } else if (f.t === 'arquivo') {
      h += '<span class="mgf-l" style="display:block;font-weight:600;font-size:15px;margin:0 0 6px;color:#000922" id="' + id + '-l">' + esc(f.l) + '</span>' +
        '<input type="file" id="' + id + '" hidden ' + (a.arquivos > 1 ? 'multiple ' : '') + 'accept="' + (f.so === 'foto' ? 'image/*' : 'application/pdf,image/jpeg,image/png,image/*') + '">' +
        '<button type="button" class="mgf-arq-bt" aria-describedby="' + id + '-l ' + desc + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.5l-8.6 8.6a5 5 0 0 1-7-7L14 5.5a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l8-8"/></svg>' + esc(T.arqBotao) + '</button><ul class="mgf-arqs"></ul>';
    } else {
      h += '<label class="mgf-l" for="' + id + '">' + esc(f.l) + r + '</label>';
      if (f.t === 'area') h += '<textarea' + comum + ' rows="5"></textarea>';
      else if (f.t === 'lista') h += '<select' + comum + '><option value="">Escolha</option>' + f.op.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
      else h += '<input type="' + (f.t === 'email' ? 'email' : f.t === 'tel' ? 'tel' : 'text') + '"' + comum + '>';
      if (f.n === 'codigo') h += '<a class="mgf-ficha" hidden href="#"></a>';
    }
    if (f.ajuda) h += '<p class="mgf-ajuda" id="' + id + '-aj">' + esc(f.ajuda) + '</p>';
    return h + '<p class="mgf-erro" id="' + id + '-er" aria-live="polite"></p></div>';
  }

  function painelHTML(a) {
    var campos = '', i = 0, fs = a.campos;
    while (i < fs.length) {
      var f = fs[i];
      if (f.n === 'email' && fs[i + 1] && fs[i + 1].n === 'telefone' && a.contato === 'um') {
        campos += '<div class="mgf-dupla">' + campoHTML(a, f) + campoHTML(a, fs[i + 1]) + '<p class="mgf-ajuda mgf-dupla-aj">' + esc(T.umDosDois) + '</p></div>'; i += 2; continue;
      }
      if (f.n === 'cidade' && fs[i + 1] && fs[i + 1].n === 'uf') { campos += '<div class="mgf-cid">' + campoHTML(a, f) + campoHTML(a, fs[i + 1]) + '</div>'; i += 2; continue; }
      campos += campoHTML(a, f); i++;
    }
    return '<button type="button" class="mgf-trocar">← ' + esc(T.trocar) + '</button>' +
      '<div class="mgf-cartao mgf-escolhido" tabindex="-1"><span class="mgf-sr" style="position:absolute;left:-9999px">Assunto escolhido: </span>' + cartaoHTML(a) + '</div>' + (TOPO[a.id] || '') +
      '<form novalidate data-assunto="' + a.id + '">' +
      '<div class="mgf-isca" aria-hidden="true"><label>Não preencha<input type="text" name="mg_confirmar" tabindex="-1" autocomplete="off"></label></div>' +
      campos + (TURNSTILE_SITEKEY ? '<div class="cf-turnstile" style="margin:0 0 16px"></div>' : '') +
      '<div class="mgf-aviso" role="alert"></div>' +
      '<button type="submit" class="mgf-enviar">' + esc(a.enviar || T.enviar) + '</button><p class="mgf-lgpd">' + (a.lgpd || T.lgpd) + '</p></form>';
  }

  function escolher(id, foco) {
    var a = ASSUNTOS.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    var p = estado[id];
    if (!p) { // monta uma vez; trocar de assunto não apaga o que já foi digitado
      p = estado[id] = { a: a, box: el('div', { 'class': 'mgf-painel', 'data-assunto': id }, painelHTML(a)), arquivos: [], t0: agoraMs() };
      painelBox.appendChild(p.box); ligar(p); verificador(p, 0);
    }
    [].forEach.call(painelBox.children, function (b) { b.hidden = b !== p.box; });
    cartoesBox.hidden = true; painelBox.hidden = false;
    try { history.replaceState(null, '', location.pathname + '?assunto=' + id + location.hash); } catch (e) { /* ok */ }
    // foco no assunto escolhido (não num campo): no celular o teclado só abre quando a pessoa toca no campo,
    // e quem usa leitor de tela passa pelos atalhos e pelo botão do representante antes do formulário.
    if (foco) { var t = p.box.querySelector('.mgf-escolhido'); if (t) t.focus({ preventScroll: true }); raiz.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  function voltar() {
    painelBox.hidden = true; cartoesBox.hidden = false;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ok */ }
    var b = cartoesBox.querySelector('.mgf-cartao'); if (b) b.focus();
  }

  /* Turnstile (Cloudflare): desenha a verificação no formulário que acabou de ser montado */
  function verificador(p, n) {
    var d = p.box.querySelector('.cf-turnstile'); if (!d || d.getAttribute('data-ok')) return;
    if (window.turnstile && turnstile.render) { d.setAttribute('data-ok', '1'); p.ts = turnstile.render(d, { sitekey: TURNSTILE_SITEKEY, language: 'pt-br' }); return; }
    if (n < 40) setTimeout(function () { verificador(p, n + 1); }, 500);
  }
  function agoraMs() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function urlML(n) {
    if (!n) return 'https://lista.mercadolivre.com.br/mg-pecas-automotivas';
    var termo = (n + ' ' + ML_SUFIXO).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'https://lista.mercadolivre.com.br/' + termo + ML_MARCA;
  }

  function erroCampo(p, nome, msg) {
    var box = p.box.querySelector('[data-campo="' + nome + '"]'); if (!box) return null;
    var e = box.querySelector('.mgf-erro'), inp = box.querySelector('input:not([type=file]),select,textarea,.mgf-arq-bt');
    e.textContent = msg || ''; if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
    return msg ? (inp || box) : null;
  }

  function desenharArquivos(p) {
    var ul = p.box.querySelector('.mgf-arqs'); if (!ul) return;
    ul.innerHTML = p.arquivos.map(function (x, i) { return '<li><span>' + esc(x.nome) + ' (' + mb(x.blob.size) + ')</span><button type="button" data-tirar="' + i + '" aria-label="' + esc(T.tirar + ' ' + x.nome) + '">' + esc(T.tirar) + '</button></li>'; }).join('');
    var bt = p.box.querySelector('.mgf-arq-bt'); if (bt) bt.hidden = p.arquivos.length >= p.a.arquivos;
  }

  function ligar(p) {
    var box = p.box, form = box.querySelector('form'), a = p.a;
    box.querySelector('.mgf-trocar').addEventListener('click', voltar);
    var cod = form.querySelector('[name=codigo]');
    if (cod) {
      var ficha = box.querySelector('.mgf-ficha'), ml = box.querySelector('.mgf-ml');
      cod.addEventListener('input', function () {
        var n = normaliza(cod.value).cod;
        if (n) { ficha.hidden = false; ficha.textContent = 'Veja a ficha da ' + n + ' no site'; ficha.href = '/search/?q=' + encodeURIComponent(n); } else ficha.hidden = true;
        // código MG: código + marca, com o filtro da marca (regra de 23/10). Texto livre: link fixo da marca.
        if (ml) ml.href = urlML(n);
      });
    }
    var inpArq = form.querySelector('input[type=file]');
    if (inpArq) {
      box.querySelector('.mgf-arq-bt').addEventListener('click', function () { inpArq.click(); });
      inpArq.addEventListener('change', function () {
        var lista = [].slice.call(inpArq.files || []); inpArq.value = '';
        erroCampo(p, 'arquivo', '');
        var so = a.campos.filter(function (f) { return f.t === 'arquivo'; })[0].so === 'foto';
        lista.slice(0, a.arquivos - p.arquivos.length).reduce(function (cad, file) {
          return cad.then(function () {
            return prepararArquivo(file, so).then(function (r) {
              p.arquivos.push({ blob: r.blob, ext: r.ext, nome: file.name || ('arquivo.' + r.ext) }); desenharArquivos(p);
            }, function (er) { erroCampo(p, 'arquivo', er === 'grande' ? T.arqGrande : er === 'pdf' ? T.arqPdf : T.arqTipo); });
          });
        }, Promise.resolve());
      });
      box.querySelector('.mgf-arqs').addEventListener('click', function (e) {
        var b = e.target.closest('[data-tirar]'); if (!b) return; p.arquivos.splice(+b.getAttribute('data-tirar'), 1); desenharArquivos(p);
        var bt = box.querySelector('.mgf-arq-bt'); if (bt) bt.focus();
      });
    }
    form.addEventListener('input', function (e) { if (e.target.name) erroCampo(p, e.target.name, ''); if (e.target.name === 'telefone') { erroCampo(p, 'email', ''); } });
    form.addEventListener('submit', function (e) { e.preventDefault(); enviar(p); });
  }

  function valores(p) {
    var form = p.box.querySelector('form'), v = {};
    p.a.campos.forEach(function (f) {
      if (f.t === 'arquivo') return;
      var e = form.querySelector('[name="' + f.n + '"]'); if (!e) return;
      v[f.n] = f.t === 'caixa' ? (e.checked ? 'sim' : '') : e.value.trim();
    });
    return v;
  }

  function validar(p, v) {
    var primeiro = null, a = p.a;
    function marca(n, m) { var x = erroCampo(p, n, m); if (x && !primeiro) primeiro = x; }
    a.campos.forEach(function (f) { if (f.t !== 'arquivo') erroCampo(p, f.n, ''); });
    a.campos.forEach(function (f) { if (f.req && f.t !== 'arquivo' && !v[f.n]) marca(f.n, f.t === 'lista' ? T.escolha : T.preencha); });
    if (v.email && !emailOk(v.email)) marca('email', T.email);
    if (v.telefone && !telOk(v.telefone)) marca('telefone', T.telefone);
    if (v.cnpj && !CNPJ_RE.test(v.cnpj)) marca('cnpj', T.cnpj);
    if (a.contato === 'um' && !v.email && !v.telefone) marca('email', T.contato);
    if (a.id === 'trabalhe' && !p.arquivos.length && !v.mensagem) marca('mensagem', T.curriculo);
    if (primeiro && primeiro.focus) primeiro.focus();
    return !primeiro;
  }

  function textoReserva(p, v) {
    var a = p.a, linhas = ['[Assunto: ' + a.titulo + ']'];
    a.campos.forEach(function (f) {
      if (['nome', 'email', 'telefone', 'mensagem', 'arquivo', 'autorizo'].indexOf(f.n) >= 0 || !v[f.n]) return;
      linhas.push(f.l.replace(/\s*\((opcional|se tiver|se souber)\)/, '') + ': ' + v[f.n]);
    });
    if (v.autorizo) linhas.push('Autorizo guardar meus dados por até 60 dias.');
    return linhas.join('\n') + '\n\n' + (v.mensagem || '');
  }

  /* Envio com XMLHttpRequest para mostrar quanto do arquivo já subiu. O relógio de "sem resposta"
     só começa quando a subida termina; enquanto sobe, só desiste se ficar PARADO_MS sem progresso. */
  function postar(fd, prog, pronto) {
    var x = new XMLHttpRequest(), relogio = null, acabou = false;
    function fim(s, j) { if (acabou) return; acabou = true; clearTimeout(relogio); pronto(s, j || {}); }
    function arma(ms) { clearTimeout(relogio); relogio = setTimeout(function () { try { x.abort(); } catch (e) { /* ok */ } fim(0); }, ms); }
    x.open('POST', API); x.withCredentials = false;
    if (x.upload) {
      x.upload.onprogress = function (e) { if (e.lengthComputable) prog(Math.floor(100 * e.loaded / e.total)); arma(PARADO_MS); };
      x.upload.onload = function () { prog(100); arma(ESPERA_MS); };
    }
    x.onload = function () { var j = {}; try { j = JSON.parse(x.responseText); } catch (e) { /* vazio */ } fim(x.status, j); };
    x.onerror = function () { fim(0); }; x.onabort = function () { fim(0); };
    arma(PARADO_MS); x.send(fd);
  }

  function enviar(p) {
    var v = valores(p); if (!validar(p, v)) return;
    var form = p.box.querySelector('form'), bt = form.querySelector('.mgf-enviar'), aviso = form.querySelector('.mgf-aviso');
    var progresso = form.querySelector('.mgf-progresso');
    if (!progresso) { progresso = el('p', { 'class': 'mgf-progresso', 'aria-live': 'polite' }); bt.parentNode.insertBefore(progresso, bt.nextSibling); }
    aviso.textContent = ''; aviso.className = 'mgf-aviso';
    var temArq = p.arquivos.length > 0;
    var fd = new FormData();
    fd.append('assunto', p.a.envia || p.a.id); fd.append('tm', String(Math.round(agoraMs() - p.t0))); fd.append('mg_confirmar', form.querySelector('[name=mg_confirmar]').value);
    Object.keys(v).forEach(function (k) { if (v[k]) fd.append(k, v[k]); });
    p.arquivos.forEach(function (x, i) { fd.append('arquivo', x.blob, 'arquivo' + (i + 1) + '.' + x.ext); });
    var ts = form.querySelector('[name="cf-turnstile-response"]'); if (ts) fd.append('cf-turnstile-response', ts.value);
    bt.disabled = true; bt.textContent = T.enviando; progresso.textContent = temArq ? T.esperaArq : '';
    function fim() { bt.disabled = false; bt.textContent = p.a.enviar || T.enviar; progresso.textContent = ''; }
    function erroGeral(txt) { aviso.className = 'mgf-aviso erro'; aviso.textContent = txt; }
    function falhou(cheio) {
      fim();
      if (navigator.onLine === false) { erroGeral(T.offline); return; }
      var abriu = abrirNativo({ nome: v.nome, email: v.email, telefone: v.telefone, texto: textoReserva(p, v) });
      if (!abriu) { erroGeral(T.falhaSem); return; } // sem formulário simples: o texto continua aqui
      erroGeral((cheio ? T.cheio : T.falha) + (temArq ? T.falhaArq : ''));
      setTimeout(function () { nativo.wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 1200);
    }
    var MSG = { email: T.email, contato: T.contato, telefone: T.telefone, cnpj: T.cnpj, curriculo: T.curriculo, tipo: T.arqTipo, grande: T.arqGrande, pdf: T.arqPdf,
      quantidade: T.arqQtd, 'arquivos-cheio': T.arqCheio, tamanho: T.longo };
    var CAMPO = { email: 'email', contato: 'email', telefone: 'telefone', cnpj: 'cnpj', curriculo: 'mensagem', tipo: 'arquivo', grande: 'arquivo', pdf: 'arquivo', quantidade: 'arquivo', 'arquivos-cheio': 'arquivo' };
    postar(fd, function (pct) { if (temArq) bt.textContent = pct < 100 ? T.enviandoArq + pct + '%' : T.enviando; }, function (s, j) {
      if (s === 200 && j.ok) { fim(); sucesso(p, v, j.protocolo); return; }
      if (s === 429) { fim(); erroGeral(T.limite); return; }
      if (s === 403 && j.erro === 'verificacao' && !p.vf) { p.vf = 1; fim(); erroGeral(T.verificacao); try { if (window.turnstile && p.ts != null) turnstile.reset(p.ts); } catch (e) { /* ok */ } return; }
      var er = j.erro, campo = j.campo || CAMPO[er];
      if (er === 'arquivos-cheio' || (s === 400 && MSG[er] && campo)) {
        fim(); var x = erroCampo(p, campo, MSG[er]); if (x && x.focus) x.focus(); return;
      }
      if (s === 400 && er === 'campo' && campo) {
        fim(); var def = p.a.campos.filter(function (f) { return f.n === campo; })[0];
        var y = erroCampo(p, campo, def && def.t === 'lista' ? T.escolha : campo === 'cnpj' ? T.cnpj : T.preencha); if (y && y.focus) y.focus(); return;
      }
      falhou(s === 503 && er === 'cheio');
    });
  }

  function sucesso(p, v, prot) {
    var nome = (v.nome || '').split(/\s+/)[0];
    var form = p.box.querySelector('form');
    var ok = el('div', { 'class': 'mgf-ok', role: 'status', tabindex: '-1' },
      '<h2>' + esc((p.a.ok1 || T.ok1) + nome + '!') + '</h2><p>' + esc(T.ok2) + '<span class="mgf-prot">' + esc(prot || '') + '</span>' + esc(T.ok3) + '</p>');
    form.replaceWith(ok); ok.focus();
    [].forEach.call(p.box.querySelectorAll('.mgf-atalhos, .mgf-pre'), function (x) { x.remove(); }); // atalhos e 'preencha a ficha' saem da tela de sucesso
    delete estado[p.a.id]; // escolher o mesmo assunto de novo abre um formulário limpo
    p.box.removeAttribute('data-assunto');
  }

  function comoChegar() {
    var q = encodeURIComponent('Av. Casa Grande, 1534, Diadema - SP');
    return '<h2>Como chegar</h2><p>' + esc(T.endereco) + '</p><div class="mgf-chb">' +
      '<a href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">Abrir no Google Maps</a>' +
      '<a href="https://waze.com/ul?q=' + q + '&navigate=yes" target="_blank" rel="noopener">Abrir no Waze</a></div>';
  }

  function iniciar() {
    if (!document.body || !document.body.classList.contains('template-contact') || document.getElementById('mg-fale')) return;
    var st = el('style', { id: 'mg-contato-css' }); st.textContent = CSS; document.head.appendChild(st);

    var titulo = document.querySelector('#ns-section-heading .page-header-title, .page-header-title, h1');
    if (titulo) titulo.textContent = T.titulo;

    var secNativa = document.getElementById('ns-section-contact_form');
    var form = acharNativo();
    var ancora = secNativa || (form && (form.closest('section') || form.parentNode));
    raiz = el('section', { id: 'mg-fale', 'aria-label': T.titulo });
    var cont = el('div', { 'class': 'container' }); var inn = el('div', { 'class': 'mgf-in' });
    inn.appendChild(el('p', { 'class': 'mgf-intro' }, esc(T.intro)));
    cartoesBox = el('div', { 'class': 'mgf-cartoes', role: 'group', 'aria-label': 'Assunto' });
    ASSUNTOS.forEach(function (a) {
      if (a.oculto) return; // a ficha cadastral não vira cartão
      var b = el('button', { type: 'button', 'class': 'mgf-cartao', 'data-id': a.id }, cartaoHTML(a));
      b.addEventListener('click', function () { escolher(a.id, true); });
      cartoesBox.appendChild(b);
    });
    painelBox = el('div', { 'class': 'mgf-paineis', hidden: '' });
    inn.appendChild(cartoesBox); inn.appendChild(painelBox); cont.appendChild(inn); raiz.appendChild(cont);
    if (ancora && ancora.parentNode) ancora.parentNode.insertBefore(raiz, ancora);
    else (document.getElementById('MainContent') || document.body).insertBefore(raiz, (document.getElementById('MainContent') || document.body).firstChild);

    // formulário nativo: fica na página, recolhido; abre pelo link ou sozinho se o envio falhar
    if (form) {
      var wrap = el('div', { 'class': 'mgf-nativo mgf-nativo-fechado', id: 'mgf-nativo' });
      form.parentNode.insertBefore(wrap, form); wrap.appendChild(form);
      var bt = el('button', { type: 'button', 'class': 'mgf-simples-bt', 'aria-expanded': 'false', 'aria-controls': 'mgf-nativo' }, esc(T.simples));
      wrap.parentNode.insertBefore(bt, wrap);
      bt.addEventListener('click', function () {
        var aberto = !wrap.classList.contains('mgf-nativo-fechado');
        wrap.classList.toggle('mgf-nativo-fechado', aberto); bt.setAttribute('aria-expanded', aberto ? 'false' : 'true');
      });
      nativo = { form: form, wrap: wrap, bt: bt };
    }

    // Como chegar, logo abaixo do endereço que a Nuvemshop já mostra
    var alvo = null, tw = document.createTreeWalker(secNativa || document.getElementById('MainContent') || document.body, NodeFilter.SHOW_TEXT), no;
    while ((no = tw.nextNode())) { if (/casa grande/i.test(no.nodeValue) && !raiz.contains(no)) { alvo = no.parentNode; break; } }
    // um dono só: se o tema ou o seo.js já puseram o "Como chegar" (ou um link do Waze), não repete
    if (!document.querySelector('.mgf-chegar, a[href*="waze.com"]')) {
      var cheg = el('div', { 'class': 'mgf-chegar' }, comoChegar());
      if (alvo) { var bloco = alvo.closest('ul, ol') || alvo.closest('li, p') || alvo; bloco.parentNode.insertBefore(cheg, bloco.nextSibling); }
      else cont.appendChild(cheg);
    }

    var q = /[?&]assunto=([a-z]+)/.exec(location.search);
    if (q && ASSUNTOS.some(function (a) { return a.id === q[1]; })) escolher(q[1], false);
    // para outros scripts da página (ex.: os cartões grandes): window.MGContato.abrir('ficha')
    window.MGContato = { abrir: function (id) { if (ASSUNTOS.some(function (a) { return a.id === id; })) { escolher(id, true); return true; } return false; } };

    if (TURNSTILE_SITEKEY && !document.querySelector('script[src*="turnstile"]')) {
      var s = el('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: '', defer: '' }); document.head.appendChild(s);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
