export type TipoVinculo = 
  | 'clt' 
  | 'temporario' 
  | 'prestador_servico' 
  | 'freelancer' 
  | 'diarista' 
  | 'colaborador_eventual';

export type StatusColaborador = 'ativo' | 'inativo' | 'afastado';

export type FormaPagamento = 'pix' | 'ted' | 'doc' | 'dinheiro' | 'cheque';

export type StatusFolha = 
  | 'em_preparacao' 
  | 'em_conferencia' 
  | 'aprovada' 
  | 'fechada' 
  | 'paga';

export type NaturezaLancamento = 'provento' | 'desconto' | 'encargo_patronal';

export type CategoriaLancamento = 
  | 'salario'
  | 'diaria'
  | 'hora_extra'
  | 'adicional_noturno'
  | 'periculosidade'
  | 'insalubridade'
  | 'comissao'
  | 'bonus'
  | 'cache'
  | 'ajuda_custo'
  | 'beneficio'
  | 'falta'
  | 'atraso'
  | 'adiantamento'
  | 'desconto_autorizado'
  | 'inss'
  | 'irrf'
  | 'fgts_patronal'
  | 'inss_patronal'
  | 'pagamento_evento';

export type StatusPagamentoRegistro = 'pendente' | 'parcial' | 'pago';

export interface HistoricoSalarial {
  id: string;
  colaborador_id: string;
  salario_base: number;
  data_vigencia: string; // YYYY-MM-DD
  motivo: string;
  usuario_id?: string;
  criado_em: string;
}

export interface Colaborador {
  id: string;
  matricula: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  cargo: string;
  departamento: string;
  tipo_vinculo: TipoVinculo;
  data_admissao: string; // YYYY-MM-DD
  salario_base: number;
  forma_pagamento: FormaPagamento;
  chave_pix?: string;
  dados_bancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    tipo_conta: 'corrente' | 'poupanca';
  };
  numero_dependentes: number;
  status: StatusColaborador;
  observacoes?: string;
  historico_salarial?: HistoricoSalarial[];
  criado_em: string;
  atualizado_em: string;
}

export interface LancamentoFolha {
  id: string;
  folha_id?: string;
  competencia: string; // MM/YYYY
  colaborador_id: string;
  colaborador_nome?: string;
  categoria: CategoriaLancamento;
  descricao: string;
  natureza: NaturezaLancamento;
  quantidade?: number;
  valor_unitario?: number;
  valor_total: number;
  data_lancamento: string; // YYYY-MM-DD
  evento_id?: string;
  evento_nome?: string;
  observacao?: string;
  ajuste_manual?: boolean;
  justificativa_ajuste?: string;
  auditoria_usuario_id?: string;
  criado_em: string;
}

export interface Adiantamento {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  valor: number;
  data_adiantamento: string; // YYYY-MM-DD
  competencia_desconto: string; // MM/YYYY
  status: 'pendente' | 'compensado' | 'cancelado';
  lancamento_id?: string;
  observacao?: string;
  criado_em: string;
}

export interface PagamentoEventoItem {
  id: string;
  evento_id: string;
  evento_nome: string;
  banda_id?: string;
  banda_nome?: string;
  colaborador_id: string;
  colaborador_nome: string;
  funcao: string;
  tipo_remuneracao: 'cache' | 'diaria' | 'hora_extra';
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_evento: string; // YYYY-MM-DD
  status: 'pendente' | 'importado_folha' | 'pago_direto';
  lancamento_id?: string;
  observacao?: string;
}

export interface FaixaTributaria {
  faixa: number;
  de: number;
  ate: number | null;
  aliquota: number; // ex: 0.075 para 7.5%
  parcela_deduzir?: number;
}

export interface ParametrosTributarios {
  id: string;
  competencia_vigencia_inicio: string; // MM/YYYY
  competencia_vigencia_fim?: string | null;
  fonte: string;
  faixas_inss: FaixaTributaria[];
  faixas_irrf: FaixaTributaria[];
  deducao_dependente_irrf: number;
  deducao_simplificada_irrf: number;
  aliquota_fgts_patronal: number; // 0.08
  aliquota_inss_patronal: number; // 0.20
  ativo: boolean;
}

export interface RegistroPagamentoFolha {
  id: string;
  folha_id: string;
  colaborador_id: string;
  colaborador_nome?: string;
  data_pagamento: string; // YYYY-MM-DD
  forma_pagamento: FormaPagamento;
  valor_pago: number;
  saldo_remanescente: number;
  referencia_transacao?: string;
  comprovante_nome?: string;
  status: StatusPagamentoRegistro;
  observacao?: string;
  registrado_por?: string;
  criado_em: string;
}

export interface FolhaCompetencia {
  id: string;
  competencia: string; // MM/YYYY
  status: StatusFolha;
  total_proventos: number;
  total_descontos: number;
  total_liquido: number;
  total_encargos_patronais: number; // FGTS + INSS patronal
  total_colaboradores: number;
  pagamentos_pendentes: number;
  snapshot_parametros?: ParametrosTributarios | null;
  aprovado_por?: string;
  aprovado_em?: string;
  fechado_por?: string;
  fechado_em?: string;
  justificativa_reabertura?: string;
  reaberto_por?: string;
  reaberto_em?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface LogAuditoriaFolha {
  id: string;
  acao: string;
  tabela: string;
  registro_id: string;
  dados_anteriores?: Record<string, unknown> | null;
  dados_novos?: Record<string, unknown> | null;
  justificativa?: string;
  usuario_id: string;
  usuario_nome: string;
  criado_em: string;
}

export interface ResumoColaboradorCompetencia {
  colaborador: Colaborador;
  proventos: LancamentoFolha[];
  descontos: LancamentoFolha[];
  encargos: LancamentoFolha[];
  total_proventos: number;
  total_descontos: number;
  valor_liquido: number;
  total_encargos_patronais: number;
  total_pago: number;
  saldo_devedor: number;
  status_pagamento: StatusPagamentoRegistro;
  base_inss: number;
  base_irrf: number;
  base_fgts: number;
  fgts_empresa: number;
}
