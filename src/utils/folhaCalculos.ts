import type { 
  Colaborador, 
  LancamentoFolha, 
  ParametrosTributarios, 
  ResumoColaboradorCompetencia,
  StatusPagamentoRegistro
} from '../types/folha.ts';

/**
 * Parâmetros Tributários Oficiais Vigentes
 * Fonte: Portaria Interministerial MPS/MF nº 2/2024 e IN RFB nº 2.141/2023
 */
export const PARAMETROS_TRIBUTARIOS_PADRAO: ParametrosTributarios = {
  id: 'param-oficial-2024-2026',
  competencia_vigencia_inicio: '01/2024',
  competencia_vigencia_fim: null,
  fonte: 'Portaria Interministerial MPS/MF nº 2/2024 e Lei nº 14.663/2023',
  faixas_inss: [
    { faixa: 1, de: 0, ate: 1412.00, aliquota: 0.075, parcela_deduzir: 0 },
    { faixa: 2, de: 1412.01, ate: 2666.68, aliquota: 0.09, parcela_deduzir: 21.18 },
    { faixa: 3, de: 2666.69, ate: 4000.03, aliquota: 0.12, parcela_deduzir: 101.18 },
    { faixa: 4, de: 4000.04, ate: 7786.02, aliquota: 0.14, parcela_deduzir: 181.18 }
  ],
  faixas_irrf: [
    { faixa: 1, de: 0, ate: 2259.20, aliquota: 0.0, parcela_deduzir: 0 },
    { faixa: 2, de: 2259.21, ate: 2826.65, aliquota: 0.075, parcela_deduzir: 169.44 },
    { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, parcela_deduzir: 381.44 },
    { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, parcela_deduzir: 662.77 },
    { faixa: 5, de: 4664.69, ate: null, aliquota: 0.275, parcela_deduzir: 896.00 }
  ],
  deducao_dependente_irrf: 189.59,
  deducao_simplificada_irrf: 564.80,
  aliquota_fgts_patronal: 0.08,
  aliquota_inss_patronal: 0.20,
  ativo: true
};

/**
 * Formata valor monetário para Real Brasileiro (R$)
 */
export function formatarMoeda(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Formata CPF com opção de proteção/mascaramento
 */
export function formatarCPF(cpf: string, mascarado = false): string {
  if (!cpf) return '';
  const limpo = cpf.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
  if (limpo.length !== 11) return cpf;

  if (mascarado) {
    return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`;
  }
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
 */
export function formatarDataBR(dataIso: string): string {
  if (!dataIso) return '-';
  const partes = dataIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataIso;
}

/**
 * Validação de CPF brasileiro (dígitos verificadores)
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Cálculo progressivo de INSS para CLT (tabela oficial por faixas)
 */
export function calcularINSSProgressivo(
  salarioBruto: number,
  params: ParametrosTributarios = PARAMETROS_TRIBUTARIOS_PADRAO
): number {
  if (salarioBruto <= 0) return 0;

  let inssTotal = 0;
  const faixas = params.faixas_inss;

  for (const f of faixas) {
    if (salarioBruto > f.de) {
      const tetoFaixa = f.ate !== null ? f.ate : salarioBruto;
      const baseNestaFaixa = Math.min(salarioBruto, tetoFaixa) - f.de;
      if (baseNestaFaixa > 0) {
        inssTotal += baseNestaFaixa * f.aliquota;
      }
    }
  }

  // Arredonda para 2 casas decimais
  return Math.round(inssTotal * 100) / 100;
}

/**
 * Cálculo do IRRF com comparação entre deduções legais (INSS + dependentes)
 * e o desconto simplificado mensal oficial
 */
export function calcularIRRFProgressivo(
  salarioBruto: number,
  descontoINSS: number,
  numeroDependentes: number = 0,
  params: ParametrosTributarios = PARAMETROS_TRIBUTARIOS_PADRAO
): { valorIRRF: number; baseCalculo: number; metodo: 'legal' | 'simplificado' } {
  if (salarioBruto <= 0) {
    return { valorIRRF: 0, baseCalculo: 0, metodo: 'legal' };
  }

  // Deduções legais
  const deducaoDependentes = numeroDependentes * params.deducao_dependente_irrf;
  const deducoesLegais = descontoINSS + deducaoDependentes;
  const deducaoSimplificada = params.deducao_simplificada_irrf;

  // O trabalhador tem direito ao método que resultar em menor imposto
  const usarSimplificado = deducaoSimplificada > deducoesLegais;
  const totalDeducoes = usarSimplificado ? deducaoSimplificada : deducoesLegais;
  const baseCalculo = Math.max(0, salarioBruto - totalDeducoes);

  let valorIRRF = 0;
  for (const f of params.faixas_irrf) {
    const atendeLimiteMin = baseCalculo >= f.de;
    const atendeLimiteMax = f.ate === null || baseCalculo <= f.ate;

    if (atendeLimiteMin && atendeLimiteMax) {
      if (f.aliquota > 0) {
        valorIRRF = baseCalculo * f.aliquota - (f.parcela_deduzir || 0);
      } else {
        valorIRRF = 0;
      }
      break;
    }
  }

  return {
    valorIRRF: Math.max(0, Math.round(valorIRRF * 100) / 100),
    baseCalculo: Math.round(baseCalculo * 100) / 100,
    metodo: usarSimplificado ? 'simplificado' : 'legal'
  };
}

/**
 * FGTS Patronal: 8% do bruto para CLT
 * IMPORTANTE: Encargo exclusivo da empresa. NUNCA descontar do trabalhador.
 */
export function calcularFGTSPatronal(
  salarioBruto: number,
  aliquota: number = 0.08
): number {
  if (salarioBruto <= 0) return 0;
  return Math.round(salarioBruto * aliquota * 100) / 100;
}

/**
 * INSS Patronal: 20% do bruto para CLT (encargo da empresa)
 */
export function calcularINSSPatronal(
  salarioBruto: number,
  aliquota: number = 0.20
): number {
  if (salarioBruto <= 0) return 0;
  return Math.round(salarioBruto * aliquota * 100) / 100;
}

/**
 * Consolida o resumo financeiro de um colaborador na competência,
 * agrupando proventos, descontos, encargos patronais e saldo líquido.
 */
export function consolidarResumoColaborador(
  colaborador: Colaborador,
  lancamentos: LancamentoFolha[],
  totalPagoJaRegistrado: number = 0
): ResumoColaboradorCompetencia {
  const doColaborador = lancamentos.filter(l => l.colaborador_id === colaborador.id);

  const proventos = doColaborador.filter(l => l.natureza === 'provento');
  const descontos = doColaborador.filter(l => l.natureza === 'desconto');
  const encargos = doColaborador.filter(l => l.natureza === 'encargo_patronal');

  const total_proventos = proventos.reduce((acc, cur) => acc + (cur.valor_total || 0), 0);
  const total_descontos = descontos.reduce((acc, cur) => acc + (cur.valor_total || 0), 0);
  const total_encargos_patronais = encargos.reduce((acc, cur) => acc + (cur.valor_total || 0), 0);

  // Fórmula padrão solicitada: líquido = total de proventos - descontos do trabalhador
  const valor_liquido = Math.max(0, Math.round((total_proventos - total_descontos) * 100) / 100);

  const saldo_devedor = Math.max(0, Math.round((valor_liquido - totalPagoJaRegistrado) * 100) / 100);

  let status_pagamento: StatusPagamentoRegistro = 'pendente';
  if (totalPagoJaRegistrado >= valor_liquido && valor_liquido > 0) {
    status_pagamento = 'pago';
  } else if (totalPagoJaRegistrado > 0) {
    status_pagamento = 'parcial';
  }

  // Bases informativas
  const base_fgts = colaborador.tipo_vinculo === 'clt' ? total_proventos : 0;
  const base_inss = colaborador.tipo_vinculo === 'clt' ? total_proventos : 0;
  const inssLancado = descontos.find(d => d.categoria === 'inss')?.valor_total || 0;
  const base_irrf = colaborador.tipo_vinculo === 'clt' ? Math.max(0, total_proventos - inssLancado) : 0;
  const fgtsLancado = encargos.find(e => e.categoria === 'fgts_patronal')?.valor_total || 0;

  return {
    colaborador,
    proventos,
    descontos,
    encargos,
    total_proventos: Math.round(total_proventos * 100) / 100,
    total_descontos: Math.round(total_descontos * 100) / 100,
    valor_liquido,
    total_encargos_patronais: Math.round(total_encargos_patronais * 100) / 100,
    total_pago: Math.round(totalPagoJaRegistrado * 100) / 100,
    saldo_devedor,
    status_pagamento,
    base_inss: Math.round(base_inss * 100) / 100,
    base_irrf: Math.round(base_irrf * 100) / 100,
    base_fgts: Math.round(base_fgts * 100) / 100,
    fgts_empresa: Math.round(fgtsLancado * 100) / 100
  };
}
