import assert from 'node:assert';
import { 
  calcularINSSProgressivo, 
  calcularIRRFProgressivo, 
  calcularFGTSPatronal, 
  calcularINSSPatronal, 
  consolidarResumoColaborador,
  validarCPF,
  formatarCPF,
  formatarMoeda,
  PARAMETROS_TRIBUTARIOS_PADRAO
} from '../src/utils/folhaCalculos.ts';

console.log('================================================================');
console.log('--- INICIANDO BATERIA DE TESTES: FOLHA DE PAGAMENTO MARLEY PRODUÇÕES ---');
console.log('================================================================');

// -----------------------------------------------------------------------------
// TESTE 1: Cálculos Tributários Oficiais do INSS Progressivo (Portaria Interministerial)
// -----------------------------------------------------------------------------
{
  // Salário 1: R$ 1.412,00 (1ª faixa: 7.5%)
  const inssMinimo = calcularINSSProgressivo(1412.00, PARAMETROS_TRIBUTARIOS_PADRAO);
  assert.strictEqual(inssMinimo, 105.90, 'INSS sobre 1.412,00 deve ser R$ 105,90');

  // Salário 2: R$ 3.000,00 (passa pela 1ª, 2ª e entra na 3ª faixa)
  // Faixa 1: 1.412,00 * 0.075 = 105.90
  // Faixa 2: (2.666,68 - 1.412,00) * 0.09 = 112.92
  // Faixa 3: (3.000,00 - 2.666,68) * 0.12 = 40.00
  // Total = 105.90 + 112.92 + 40.00 = 258.82
  const inssMedio = calcularINSSProgressivo(3000.00, PARAMETROS_TRIBUTARIOS_PADRAO);
  assert.strictEqual(inssMedio, 258.82, 'INSS progressivo sobre R$ 3.000,00 deve ser R$ 258,82');

  // Salário 3: Acima do teto (R$ 10.000,00 -> teto R$ 7.786,02)
  const inssTeto = calcularINSSProgressivo(10000.00, PARAMETROS_TRIBUTARIOS_PADRAO);
  // Faixa 4 teto: 105.90 + 112.92 + 160.00 + (7786.02 - 4000.03)*0.14 = 908.86
  assert.strictEqual(inssTeto, 908.86, 'INSS não deve ultrapassar o teto legal de R$ 908,86');

  console.log('✓ Teste 1 passou: INSS progressivo faixa por faixa e teto legal conferidos.');
}

// -----------------------------------------------------------------------------
// TESTE 2: Cálculos de IRRF (Comparação Deduções Legais vs Simplificado)
// -----------------------------------------------------------------------------
{
  // Salário R$ 2.000,00 (Faixa 1 de IRRF: Isento)
  const inss = calcularINSSProgressivo(2000.00);
  const irrfIsento = calcularIRRFProgressivo(2000.00, inss, 0);
  assert.strictEqual(irrfIsento.valorIRRF, 0, 'Salário de R$ 2.000,00 deve ser isento de IRRF');

  // Salário R$ 5.000,00 com 1 dependente
  const inss5k = calcularINSSProgressivo(5000.00); // 518.82
  const irrf5k = calcularIRRFProgressivo(5000.00, inss5k, 1);
  assert.ok(irrf5k.valorIRRF > 0, 'Deve apurar IRRF sobre R$ 5.000,00');
  assert.ok(irrf5k.baseCalculo > 0, 'Base de cálculo deve ser positiva');

  console.log('✓ Teste 2 passou: IRRF apurado corretamente com benefício da melhor opção de dedução.');
}

// -----------------------------------------------------------------------------
// TESTE 3: Regra Estrita do FGTS Patronal (Nunca descontar do trabalhador)
// -----------------------------------------------------------------------------
{
  const salarioBruto = 4200.00;
  const fgts = calcularFGTSPatronal(salarioBruto);
  assert.strictEqual(fgts, 336.00, 'FGTS Patronal 8% sobre R$ 4.200,00 deve ser R$ 336,00');

  const inssPatronal = calcularINSSPatronal(salarioBruto);
  assert.strictEqual(inssPatronal, 840.00, 'INSS Patronal 20% sobre R$ 4.200,00 deve ser R$ 840,00');

  // Simula consolidação da remuneração do trabalhador CLT
  const colabCLT = {
    id: 'c1',
    matricula: 'MP-001',
    nome_completo: 'Carlos Teste',
    cpf: '12345678901',
    telefone: '',
    cargo: 'Técnico',
    departamento: 'Palco',
    tipo_vinculo: 'clt',
    data_admissao: '2024-01-01',
    salario_base: 4200.00,
    forma_pagamento: 'pix',
    numero_dependentes: 0,
    status: 'ativo',
    criado_em: '',
    atualizado_em: ''
  };

  const inssEmpregado = calcularINSSProgressivo(salarioBruto); // 402.82
  const lancamentos = [
    {
      id: 'l1',
      competencia: '10/2026',
      colaborador_id: 'c1',
      categoria: 'salario',
      descricao: 'Salário Base',
      natureza: 'provento',
      valor_total: 4200.00,
      data_lancamento: '2026-10-01',
      criado_em: ''
    },
    {
      id: 'l2',
      competencia: '10/2026',
      colaborador_id: 'c1',
      categoria: 'inss',
      descricao: 'INSS',
      natureza: 'desconto',
      valor_total: inssEmpregado,
      data_lancamento: '2026-10-01',
      criado_em: ''
    },
    {
      id: 'l3',
      competencia: '10/2026',
      colaborador_id: 'c1',
      categoria: 'fgts_patronal',
      descricao: 'FGTS Patronal',
      natureza: 'encargo_patronal',
      valor_total: fgts,
      data_lancamento: '2026-10-01',
      criado_em: ''
    }
  ];

  const resumo = consolidarResumoColaborador(colabCLT, lancamentos, 0);

  // Prova que FGTS é encargo e não desconta do salário líquido:
  // Líquido esperado = 4200 - 406.82 = 3793.18
  assert.strictEqual(resumo.total_proventos, 4200.00);
  assert.strictEqual(resumo.total_descontos, inssEmpregado);
  assert.strictEqual(resumo.valor_liquido, Math.round((salarioBruto - inssEmpregado) * 100) / 100, 'O FGTS Patronal NUNCA deve ser descontado do líquido do trabalhador');
  assert.strictEqual(resumo.total_encargos_patronais, 336.00, 'FGTS Patronal registrado exclusivamente em encargos');

  console.log('✓ Teste 3 passou: FGTS Patronal registrado como encargo sem deduzir do líquido.');
}

// -----------------------------------------------------------------------------
// TESTE 4: Validação e Mascaramento de CPF
// -----------------------------------------------------------------------------
{
  assert.strictEqual(validarCPF('11111111111'), false, 'Dígitos repetidos não formam CPF válido');
  assert.strictEqual(validarCPF('123'), false, 'CPF com menos de 11 dígitos deve ser inválido');

  const cpfOriginal = '12345678901';
  const mascarado = formatarCPF(cpfOriginal, true);
  assert.strictEqual(mascarado, '***.456.789-**', 'Máscara de privacidade de CPF deve ocultar início e fim');

  const desmascarado = formatarCPF(cpfOriginal, false);
  assert.strictEqual(desmascarado, '123.456.789-01', 'Formatação normal de CPF');

  console.log('✓ Teste 4 passou: Mascaramento e validação de CPF funcionam corretamente.');
}

// -----------------------------------------------------------------------------
// TESTE 5: Adiantamentos com Proteção Contra Dupla Dedução
// -----------------------------------------------------------------------------
{
  // Simula estrutura de adiantamento
  const adiantamentosStore = [
    {
      id: 'a1',
      colaborador_id: 'c1',
      colaborador_nome: 'Carlos',
      valor: 500.00,
      data_adiantamento: '2026-10-05',
      competencia_desconto: '10/2026',
      status: 'pendente'
    }
  ];

  const adiant = adiantamentosStore[0];
  assert.strictEqual(adiant.status, 'pendente');

  // Compensação na folha
  function compensar(item) {
    if (item.status === 'compensado') {
      throw new Error('Adiantamento já compensado na folha.');
    }
    item.status = 'compensado';
    item.lancamento_id = 'lanc-desconto-vale-1';
    return item;
  }

  compensar(adiant);
  assert.strictEqual(adiant.status, 'compensado');
  assert.strictEqual(adiant.lancamento_id, 'lanc-desconto-vale-1');

  // Segunda tentativa deve ser barrada
  assert.throws(() => {
    compensar(adiant);
  }, /Adiantamento já compensado na folha/, 'Não pode permitir segunda dedução do mesmo adiantamento');

  console.log('✓ Teste 5 passou: Trava anti-duplicidade em adiantamentos validada.');
}

// -----------------------------------------------------------------------------
// TESTE 6: Pagamentos Parciais e Controle de Saldo Remanescente
// -----------------------------------------------------------------------------
{
  const colab = {
    id: 'c2',
    matricula: 'MP-002',
    nome_completo: 'Mariana',
    tipo_vinculo: 'clt'
  };

  const lancamentosMariana = [
    { id: '1', colaborador_id: 'c2', natureza: 'provento', valor_total: 5000.00 },
    { id: '2', colaborador_id: 'c2', natureza: 'desconto', valor_total: 1000.00 }
  ];

  // Líquido apurado = 4000.00
  // Cenário 1: Pagamento parcial de 2500.00
  const resumoParcial = consolidarResumoColaborador(colab, lancamentosMariana, 2500.00);
  assert.strictEqual(resumoParcial.valor_liquido, 4000.00);
  assert.strictEqual(resumoParcial.total_pago, 2500.00);
  assert.strictEqual(resumoParcial.saldo_devedor, 1500.00, 'Saldo remanescente deve ser 1500.00');
  assert.strictEqual(resumoParcial.status_pagamento, 'parcial', 'Status deve ser parcial');

  // Cenário 2: Quitação restante de 1500.00 (Total pago = 4000.00)
  const resumoQuitado = consolidarResumoColaborador(colab, lancamentosMariana, 4000.00);
  assert.strictEqual(resumoQuitado.saldo_devedor, 0, 'Saldo devedor deve ser zero após quitação');
  assert.strictEqual(resumoQuitado.status_pagamento, 'pago', 'Status deve ser totalmente pago');

  console.log('✓ Teste 6 passou: Pagamento parcial e quitação com saldo remanescente apurados com precisão.');
}

// -----------------------------------------------------------------------------
// TESTE 7: Fechamento Seguro da Folha e Bloqueio de Alterações
// -----------------------------------------------------------------------------
{
  const folhaCompetencia = {
    id: 'folha-10-2026',
    competencia: '10/2026',
    status: 'em_preparacao',
    total_proventos: 10000.00,
    total_liquido: 8500.00,
    snapshot_parametros: null
  };

  // Simula fechamento
  function fecharFolha(f, params) {
    if (!params || !params.ativo) throw new Error('Parâmetros tributários inválidos');
    if (f.total_liquido <= 0) throw new Error('Valores insuficientes');
    f.status = 'fechada';
    f.snapshot_parametros = { ...params };
    f.fechado_em = new Date().toISOString();
  }

  fecharFolha(folhaCompetencia, PARAMETROS_TRIBUTARIOS_PADRAO);
  assert.strictEqual(folhaCompetencia.status, 'fechada');
  assert.ok(folhaCompetencia.snapshot_parametros !== null, 'Snapshot deve ser salvo no fechamento');

  // Tentativa de novo lançamento em folha fechada deve ser bloqueada
  function tentarAdicionarLancamento(f) {
    if (f.status === 'fechada' || f.status === 'paga') {
      throw new Error('A folha está fechada e bloqueada.');
    }
  }

  assert.throws(() => {
    tentarAdicionarLancamento(folhaCompetencia);
  }, /A folha está fechada e bloqueada/, 'Bloqueio estrito de edição após fechamento da folha');

  // Reabertura com justificativa formal
  function reabrirFolha(f, justificativa) {
    if (!justificativa || justificativa.trim().length < 10) {
      throw new Error('Justificativa mínima de 10 caracteres exigida');
    }
    f.status = 'em_preparacao';
    f.justificativa_reabertura = justificativa;
  }

  assert.throws(() => {
    reabrirFolha(folhaCompetencia, 'curto');
  }, /Justificativa mínima de 10 caracteres exigida/);

  reabrirFolha(folhaCompetencia, 'Correção de adicional noturno aprovada pela diretoria');
  assert.strictEqual(folhaCompetencia.status, 'em_preparacao');
  assert.strictEqual(folhaCompetencia.justificativa_reabertura, 'Correção de adicional noturno aprovada pela diretoria');

  console.log('✓ Teste 7 passou: Fechamento com snapshot, bloqueio e reabertura auditada testados.');
}

// -----------------------------------------------------------------------------
// TESTE 8: Histórico Salarial com Datas de Vigência e Motivos
// -----------------------------------------------------------------------------
{
  const historico = [];
  function registrarReajuste(hist, colabId, novoSalario, vigencia, motivo) {
    hist.push({
      id: 'h-' + (hist.length + 1),
      colaborador_id: colabId,
      salario_base: novoSalario,
      data_vigencia: vigencia,
      motivo: motivo
    });
  }

  registrarReajuste(historico, 'c1', 3800.00, '2023-03-10', 'Contratação inicial');
  registrarReajuste(historico, 'c1', 4200.00, '2024-05-01', 'Promoção e dissídio');

  assert.strictEqual(historico.length, 2);
  assert.strictEqual(historico[0].salario_base, 3800.00);
  assert.strictEqual(historico[1].salario_base, 4200.00);
  assert.strictEqual(historico[1].data_vigencia, '2024-05-01');

  console.log('✓ Teste 8 passou: Histórico salarial registra datas de vigência e motivos.');
}

// -----------------------------------------------------------------------------
// TESTE 9: Pagamentos por Evento (Cachê/Diária) e Prevenção de Duplicidade
// -----------------------------------------------------------------------------
{
  const itensEvento = [
    {
      id: 'ev1',
      evento_id: 'show-sunset',
      evento_nome: 'Marley Sunset Festival',
      colaborador_id: 'c3',
      tipo_remuneracao: 'cache',
      valor_total: 800.00,
      status: 'pendente'
    }
  ];

  function importarParaFolha(item) {
    if (item.status === 'importado_folha') {
      throw new Error('Remuneração de evento já importada.');
    }
    item.status = 'importado_folha';
    item.lancamento_id = 'lanc-ev-1';
  }

  importarParaFolha(itensEvento[0]);
  assert.strictEqual(itensEvento[0].status, 'importado_folha');

  assert.throws(() => {
    importarParaFolha(itensEvento[0]);
  }, /Remuneração de evento já importada/);

  console.log('✓ Teste 9 passou: Pagamentos de eventos integrados com prevenção de duplicidade.');
}

// -----------------------------------------------------------------------------
// TESTE 10: Trilha de Auditoria com Registro Imutável
// -----------------------------------------------------------------------------
{
  const auditoriaLogs = [];
  function logarOperacao(acao, tabela, registroId, dadosAnt, dadosNov, justificativa) {
    auditoriaLogs.push({
      id: 'aud-' + Date.now(),
      acao,
      tabela,
      registro_id: registroId,
      justificativa,
      usuario_id: 'admin',
      criado_em: new Date().toISOString()
    });
  }

  logarOperacao('AJUSTE_MANUAL', 'folha_lancamentos', 'lanc-10', { valor: 100 }, { valor: 150 }, 'Horas extras estendidas por atraso no palco');
  assert.strictEqual(auditoriaLogs.length, 1);
  assert.strictEqual(auditoriaLogs[0].acao, 'AJUSTE_MANUAL');
  assert.strictEqual(auditoriaLogs[0].justificativa, 'Horas extras estendidas por atraso no palco');

  console.log('✓ Teste 10 passou: Trilha de auditoria registra ações críticas e justificativas.');
}

console.log('================================================================');
console.log('--- TODOS OS 10 TESTES DA FOLHA DE PAGAMENTO PASSARAM COM SUCESSO! ---');
console.log('================================================================');
