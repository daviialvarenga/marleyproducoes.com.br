import { 
  Colaborador, 
  FolhaCompetencia, 
  LancamentoFolha, 
  Adiantamento, 
  PagamentoEventoItem, 
  RegistroPagamentoFolha, 
  ParametrosTributarios, 
  LogAuditoriaFolha,
  HistoricoSalarial,
  StatusFolha
} from '../types/folha';
import { 
  PARAMETROS_TRIBUTARIOS_PADRAO, 
  calcularINSSProgressivo, 
  calcularIRRFProgressivo, 
  calcularFGTSPatronal,
  calcularINSSPatronal,
  consolidarResumoColaborador
} from '../utils/folhaCalculos';

const STORAGE_KEY_COLABORADORES = 'marley_folha_colaboradores';
const STORAGE_KEY_FOLHAS = 'marley_folha_competencias';
const STORAGE_KEY_LANCAMENTOS = 'marley_folha_lancamentos';
const STORAGE_KEY_ADIANTAMENTOS = 'marley_folha_adiantamentos';
const STORAGE_KEY_EVENTOS_PAGAMENTOS = 'marley_folha_pagamentos_eventos';
const STORAGE_KEY_REGISTROS_PAGAMENTO = 'marley_folha_registros_pagamento';
const STORAGE_KEY_PARAMETROS = 'marley_folha_parametros_tributarios';
const STORAGE_KEY_AUDITORIA = 'marley_folha_auditoria';

// DADOS SEED INICIAIS
const COLABORADORES_SEED: Colaborador[] = [
  {
    id: 'colab-001',
    matricula: 'MP-001',
    nome_completo: 'Carlos Eduardo Moreira',
    cpf: '12345678901',
    telefone: '(11) 98765-4321',
    cargo: 'Técnico de Som / PA',
    departamento: 'Técnica & Palco',
    tipo_vinculo: 'clt',
    data_admissao: '2023-03-10',
    salario_base: 4200.00,
    forma_pagamento: 'pix',
    chave_pix: 'carlos.som@marleyproducoes.com.br',
    numero_dependentes: 1,
    status: 'ativo',
    observacoes: 'Especialista em alinhamento acústico e mixagem para grandes palcos.',
    historico_salarial: [
      {
        id: 'hist-001',
        colaborador_id: 'colab-001',
        salario_base: 3800.00,
        data_vigencia: '2023-03-10',
        motivo: 'Salário inicial de contratação',
        usuario_id: 'admin',
        criado_em: '2023-03-10T10:00:00Z'
      },
      {
        id: 'hist-002',
        colaborador_id: 'colab-001',
        salario_base: 4200.00,
        data_vigencia: '2024-05-01',
        motivo: 'Dissídio e promoção para líder técnico',
        usuario_id: 'admin',
        criado_em: '2024-05-01T10:00:00Z'
      }
    ],
    criado_em: '2023-03-10T09:00:00Z',
    atualizado_em: '2024-05-01T10:00:00Z'
  },
  {
    id: 'colab-002',
    matricula: 'MP-002',
    nome_completo: 'Mariana Silveira Ramos',
    cpf: '23456789012',
    telefone: '(11) 97654-3210',
    cargo: 'Produtora Executiva',
    departamento: 'Produção',
    tipo_vinculo: 'clt',
    data_admissao: '2022-08-15',
    salario_base: 5800.00,
    forma_pagamento: 'ted',
    dados_bancarios: {
      banco: 'Banco Itaú (341)',
      agencia: '0450',
      conta: '98765-4',
      tipo_conta: 'corrente'
    },
    numero_dependentes: 2,
    status: 'ativo',
    observacoes: 'Responsável pela gestão de logística e cronograma de shows.',
    historico_salarial: [
      {
        id: 'hist-003',
        colaborador_id: 'colab-002',
        salario_base: 5800.00,
        data_vigencia: '2022-08-15',
        motivo: 'Contratação inicial',
        usuario_id: 'admin',
        criado_em: '2022-08-15T08:00:00Z'
      }
    ],
    criado_em: '2022-08-15T08:00:00Z',
    atualizado_em: '2022-08-15T08:00:00Z'
  },
  {
    id: 'colab-003',
    matricula: 'MP-003',
    nome_completo: 'Thiago "Batata" Oliveira',
    cpf: '34567890123',
    telefone: '(11) 96543-2109',
    cargo: 'Roadie / Auxiliar de Palco',
    departamento: 'Técnica & Palco',
    tipo_vinculo: 'freelancer',
    data_admissao: '2024-01-10',
    salario_base: 0,
    forma_pagamento: 'pix',
    chave_pix: 'thiago.roadie@gmail.com',
    numero_dependentes: 0,
    status: 'ativo',
    observacoes: 'Remuneração por diária/evento conforme escala de apresentações.',
    historico_salarial: [],
    criado_em: '2024-01-10T10:00:00Z',
    atualizado_em: '2024-01-10T10:00:00Z'
  },
  {
    id: 'colab-004',
    matricula: 'MP-004',
    nome_completo: 'Lucas Medeiros (Percussão)',
    cpf: '45678901234',
    telefone: '(11) 95432-1098',
    cargo: 'Músico Percussionista',
    departamento: 'Artístico',
    tipo_vinculo: 'diarista',
    data_admissao: '2024-03-01',
    salario_base: 0,
    forma_pagamento: 'pix',
    chave_pix: '11954321098',
    numero_dependentes: 0,
    status: 'ativo',
    observacoes: 'Cachê por apresentação ao vivo.',
    historico_salarial: [],
    criado_em: '2024-03-01T10:00:00Z',
    atualizado_em: '2024-03-01T10:00:00Z'
  },
  {
    id: 'colab-005',
    matricula: 'MP-005',
    nome_completo: 'Studio Luz & Efeitos Cenográficos LTDA',
    cpf: '56789012345',
    telefone: '(11) 94321-0987',
    cargo: 'Prestador de Iluminação & Projeções',
    departamento: 'Técnica & Palco',
    tipo_vinculo: 'prestador_servico',
    data_admissao: '2023-11-01',
    salario_base: 6500.00,
    forma_pagamento: 'ted',
    dados_bancarios: {
      banco: 'Banco Bradesco (237)',
      agencia: '1234',
      conta: '56789-0',
      tipo_conta: 'corrente'
    },
    numero_dependentes: 0,
    status: 'ativo',
    observacoes: 'Contrato PJ mensal para iluminação dos eventos e manutenções técnicas.',
    historico_salarial: [
      {
        id: 'hist-004',
        colaborador_id: 'colab-005',
        salario_base: 6500.00,
        data_vigencia: '2023-11-01',
        motivo: 'Contrato de prestação de serviços',
        usuario_id: 'admin',
        criado_em: '2023-11-01T09:00:00Z'
      }
    ],
    criado_em: '2023-11-01T09:00:00Z',
    atualizado_em: '2023-11-01T09:00:00Z'
  }
];

const PAGAMENTOS_EVENTO_SEED: PagamentoEventoItem[] = [
  {
    id: 'ev-pag-001',
    evento_id: 'ev-101',
    evento_nome: 'Festival Marley Sunset 2026',
    banda_id: 'banda-01',
    banda_nome: 'Marley Roots Tribute',
    colaborador_id: 'colab-003',
    colaborador_nome: 'Thiago "Batata" Oliveira',
    funcao: 'Roadie e montagem de backline',
    tipo_remuneracao: 'diaria',
    quantidade: 1,
    valor_unitario: 350.00,
    valor_total: 350.00,
    data_evento: '2026-10-15',
    status: 'pendente',
    observacao: 'Diária completa durante montagem e show'
  },
  {
    id: 'ev-pag-002',
    evento_id: 'ev-102',
    evento_nome: 'Show Tributo a Bob Marley - Turnê SP',
    banda_id: 'banda-01',
    banda_nome: 'Marley Roots Tribute',
    colaborador_id: 'colab-004',
    colaborador_nome: 'Lucas Medeiros (Percussão)',
    funcao: 'Percussão ao vivo',
    tipo_remuneracao: 'cache',
    quantidade: 1,
    valor_unitario: 800.00,
    valor_total: 800.00,
    data_evento: '2026-10-22',
    status: 'pendente',
    observacao: 'Cachê acordado por show'
  },
  {
    id: 'ev-pag-003',
    evento_id: 'ev-102',
    evento_nome: 'Show Tributo a Bob Marley - Turnê SP',
    banda_id: 'banda-01',
    banda_nome: 'Marley Roots Tribute',
    colaborador_id: 'colab-003',
    colaborador_nome: 'Thiago "Batata" Oliveira',
    funcao: 'Técnico de palco e afinação',
    tipo_remuneracao: 'diaria',
    quantidade: 1,
    valor_unitario: 350.00,
    valor_total: 350.00,
    data_evento: '2026-10-22',
    status: 'pendente',
    observacao: 'Acompanhamento da banda em trânsito'
  }
];

const ADIANTAMENTOS_SEED: Adiantamento[] = [
  {
    id: 'adiant-001',
    colaborador_id: 'colab-001',
    colaborador_nome: 'Carlos Eduardo Moreira',
    valor: 500.00,
    data_adiantamento: '2026-10-05',
    competencia_desconto: '10/2026',
    status: 'pendente',
    observacao: 'Vale adiantamento emergencial para despesas pessoais',
    criado_em: '2026-10-05T14:30:00Z'
  }
];

class FolhaStorageService {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const data = window.localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('Falha ao persistir no localStorage:', e);
    }
  }

  // --- COLABORADORES ---
  public getColaboradores(): Colaborador[] {
    const cols = this.getStorage<Colaborador[]>(STORAGE_KEY_COLABORADORES, []);
    if (!cols || cols.length === 0) {
      this.setStorage(STORAGE_KEY_COLABORADORES, COLABORADORES_SEED);
      return COLABORADORES_SEED;
    }
    return cols;
  }

  public salvarColaborador(dados: Partial<Colaborador> & { nome_completo: string }): Colaborador {
    const cols = this.getColaboradores();
    const agora = new Date().toISOString();

    if (dados.id) {
      const idx = cols.findIndex(c => c.id === dados.id);
      if (idx >= 0) {
        const anterior = cols[idx];
        const novoSalario = dados.salario_base !== undefined ? dados.salario_base : anterior.salario_base;
        const historico = [...(anterior.historico_salarial || [])];

        // Se houve alteração de salário, registra no histórico
        if (dados.salario_base !== undefined && dados.salario_base !== anterior.salario_base) {
          historico.push({
            id: 'hist-' + Date.now(),
            colaborador_id: anterior.id,
            salario_base: dados.salario_base,
            data_vigencia: agora.split('T')[0],
            motivo: dados.observacoes || 'Reajuste salarial',
            usuario_id: 'admin',
            criado_em: agora
          });
        }

        const atualizado: Colaborador = {
          ...anterior,
          ...dados,
          historico_salarial: historico,
          atualizado_em: agora
        };
        cols[idx] = atualizado;
        this.setStorage(STORAGE_KEY_COLABORADORES, cols);
        this.registrarAuditoria('ATUALIZAR_COLABORADOR', 'folha_colaboradores', atualizado.id, anterior, atualizado, 'Edição de colaborador');
        return atualizado;
      }
    }

    // Novo cadastro
    const id = 'colab-' + Date.now();
    const matricula = 'MP-' + String(cols.length + 1).padStart(3, '0');
    const novo: Colaborador = {
      id,
      matricula,
      nome_completo: dados.nome_completo,
      cpf: dados.cpf ? dados.cpf.replace(/\D/g, '') : '',
      telefone: dados.telefone || '',
      cargo: dados.cargo || 'Colaborador',
      departamento: dados.departamento || 'Geral',
      tipo_vinculo: dados.tipo_vinculo || 'clt',
      data_admissao: dados.data_admissao || agora.split('T')[0],
      salario_base: dados.salario_base || 0,
      forma_pagamento: dados.forma_pagamento || 'pix',
      chave_pix: dados.chave_pix || '',
      dados_bancarios: dados.dados_bancarios,
      numero_dependentes: dados.numero_dependentes || 0,
      status: dados.status || 'ativo',
      observacoes: dados.observacoes || '',
      historico_salarial: dados.salario_base ? [{
        id: 'hist-' + Date.now(),
        colaborador_id: id,
        salario_base: dados.salario_base,
        data_vigencia: dados.data_admissao || agora.split('T')[0],
        motivo: 'Contratação inicial',
        usuario_id: 'admin',
        criado_em: agora
      }] : [],
      criado_em: agora,
      atualizado_em: agora
    };

    cols.push(novo);
    this.setStorage(STORAGE_KEY_COLABORADORES, cols);
    this.registrarAuditoria('CRIAR_COLABORADOR', 'folha_colaboradores', novo.id, null, novo, 'Novo colaborador cadastrado');
    return novo;
  }

  // --- PARÂMETROS TRIBUTÁRIOS ---
  public getParametrosTributarios(): ParametrosTributarios {
    return this.getStorage<ParametrosTributarios>(STORAGE_KEY_PARAMETROS, PARAMETROS_TRIBUTARIOS_PADRAO);
  }

  public salvarParametrosTributarios(novos: ParametrosTributarios, justificativa: string): void {
    const atual = this.getParametrosTributarios();
    this.setStorage(STORAGE_KEY_PARAMETROS, novos);
    this.registrarAuditoria('ATUALIZAR_PARAMETROS_TRIBUTARIOS', 'folha_parametros_tributarios', novos.id, atual, novos, justificativa);
  }

  // --- FOLHA & COMPETÊNCIAS ---
  public getFolhas(): FolhaCompetencia[] {
    const folhas = this.getStorage<FolhaCompetencia[]>(STORAGE_KEY_FOLHAS, []);
    if (!folhas || folhas.length === 0) {
      // Cria folha inicial de 10/2026
      const inicial: FolhaCompetencia = {
        id: 'folha-10-2026',
        competencia: '10/2026',
        status: 'em_preparacao',
        total_proventos: 0,
        total_descontos: 0,
        total_liquido: 0,
        total_encargos_patronais: 0,
        total_colaboradores: 0,
        pagamentos_pendentes: 0,
        criado_em: '2026-10-01T08:00:00Z',
        atualizado_em: '2026-10-01T08:00:00Z'
      };
      this.setStorage(STORAGE_KEY_FOLHAS, [inicial]);
      this.inicializarLancamentosPadrao('10/2026', inicial.id);
      return [inicial];
    }
    return folhas;
  }

  public getFolhaCompetencia(competencia: string): FolhaCompetencia {
    const folhas = this.getFolhas();
    let f = folhas.find(folha => folha.competencia === competencia);
    if (!f) {
      f = {
        id: `folha-${competencia.replace('/', '-')}`,
        competencia,
        status: 'em_preparacao',
        total_proventos: 0,
        total_descontos: 0,
        total_liquido: 0,
        total_encargos_patronais: 0,
        total_colaboradores: 0,
        pagamentos_pendentes: 0,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };
      folhas.push(f);
      this.setStorage(STORAGE_KEY_FOLHAS, folhas);
      this.inicializarLancamentosPadrao(competencia, f.id);
    }
    return f;
  }

  // --- LANÇAMENTOS ---
  public getLancamentos(competencia?: string): LancamentoFolha[] {
    const all = this.getStorage<LancamentoFolha[]>(STORAGE_KEY_LANCAMENTOS, []);
    if (!competencia) return all;
    return all.filter(l => l.competencia === competencia);
  }

  public adicionarLancamento(dados: Omit<LancamentoFolha, 'id' | 'criado_em'>): LancamentoFolha {
    const folha = this.getFolhaCompetencia(dados.competencia);
    if (folha.status === 'fechada' || folha.status === 'paga') {
      throw new Error(`A folha da competência ${dados.competencia} está fechada e não permite novos lançamentos.`);
    }

    const all = this.getStorage<LancamentoFolha[]>(STORAGE_KEY_LANCAMENTOS, []);

    // Verificação de duplicidade: mesmo colaborador, mesma competência, mesma descrição/categoria e evento
    const duplicado = all.find(l => 
      l.colaborador_id === dados.colaborador_id &&
      l.competencia === dados.competencia &&
      l.categoria === dados.categoria &&
      l.descricao.trim().toLowerCase() === dados.descricao.trim().toLowerCase() &&
      l.evento_id === dados.evento_id &&
      l.valor_total === dados.valor_total
    );

    if (duplicado) {
      throw new Error(`Já existe um lançamento idêntico para este colaborador na competência ${dados.competencia}.`);
    }

    const novo: LancamentoFolha = {
      ...dados,
      id: 'lanc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      criado_em: new Date().toISOString()
    };

    all.push(novo);
    this.setStorage(STORAGE_KEY_LANCAMENTOS, all);

    this.recalcularTotaisFolha(dados.competencia);
    return novo;
  }

  public removerLancamento(id: string, justificativa: string): void {
    const all = this.getStorage<LancamentoFolha[]>(STORAGE_KEY_LANCAMENTOS, []);
    const idx = all.findIndex(l => l.id === id);
    if (idx < 0) return;

    const lanc = all[idx];
    const folha = this.getFolhaCompetencia(lanc.competencia);
    if (folha.status === 'fechada' || folha.status === 'paga') {
      throw new Error('Não é possível remover lançamentos de uma folha fechada.');
    }

    all.splice(idx, 1);
    this.setStorage(STORAGE_KEY_LANCAMENTOS, all);

    this.registrarAuditoria('REMOVER_LANCAMENTO', 'folha_lancamentos', id, lanc, null, justificativa);
    this.recalcularTotaisFolha(lanc.competencia);
  }

  public ajustarLancamentoManual(id: string, novoValor: number, justificativa: string): LancamentoFolha {
    if (!justificativa || justificativa.trim().length < 5) {
      throw new Error('É obrigatório fornecer justificativa válida com no mínimo 5 caracteres para ajuste manual.');
    }

    const all = this.getStorage<LancamentoFolha[]>(STORAGE_KEY_LANCAMENTOS, []);
    const idx = all.findIndex(l => l.id === id);
    if (idx < 0) throw new Error('Lançamento não encontrado.');

    const anterior = all[idx];
    const folha = this.getFolhaCompetencia(anterior.competencia);
    if (folha.status === 'fechada' || folha.status === 'paga') {
      throw new Error('Não é possível editar lançamentos de uma folha fechada.');
    }

    const atualizado: LancamentoFolha = {
      ...anterior,
      valor_total: novoValor,
      ajuste_manual: true,
      justificativa_ajuste: justificativa,
      auditoria_usuario_id: 'admin'
    };

    all[idx] = atualizado;
    this.setStorage(STORAGE_KEY_LANCAMENTOS, all);

    this.registrarAuditoria('AJUSTE_MANUAL_LANCAMENTO', 'folha_lancamentos', id, anterior, atualizado, justificativa);
    this.recalcularTotaisFolha(anterior.competencia);
    return atualizado;
  }

  // --- ADIANTAMENTOS ---
  public getAdiantamentos(competencia?: string): Adiantamento[] {
    const list = this.getStorage<Adiantamento[]>(STORAGE_KEY_ADIANTAMENTOS, []);
    if (!list || list.length === 0) {
      this.setStorage(STORAGE_KEY_ADIANTAMENTOS, ADIANTAMENTOS_SEED);
      return ADIANTAMENTOS_SEED;
    }
    if (!competencia) return list;
    return list.filter(a => a.competencia_desconto === competencia);
  }

  public criarAdiantamento(dados: Omit<Adiantamento, 'id' | 'criado_em' | 'status'>): Adiantamento {
    const list = this.getAdiantamentos();
    const novo: Adiantamento = {
      ...dados,
      id: 'adiant-' + Date.now(),
      status: 'pendente',
      criado_em: new Date().toISOString()
    };
    list.push(novo);
    this.setStorage(STORAGE_KEY_ADIANTAMENTOS, list);
    this.registrarAuditoria('CRIAR_ADIANTAMENTO', 'folha_adiantamentos', novo.id, null, novo, 'Novo adiantamento cadastrado');
    return novo;
  }

  /**
   * Compensa o adiantamento lançando-o como desconto na folha.
   * Garante estritamente que não haja dupla contabilização.
   */
  public compensarAdiantamento(adiantamentoId: string): void {
    const list = this.getAdiantamentos();
    const adiant = list.find(a => a.id === adiantamentoId);
    if (!adiant) throw new Error('Adiantamento não encontrado.');
    if (adiant.status === 'compensado') {
      throw new Error('Este adiantamento já foi compensado na folha e não pode ser deduzido novamente.');
    }
    if (adiant.status === 'cancelado') {
      throw new Error('Adiantamento cancelado não pode ser compensado.');
    }

    // Cria lançamento de desconto na folha da competência
    const lancamento = this.adicionarLancamento({
      competencia: adiant.competencia_desconto,
      colaborador_id: adiant.colaborador_id,
      colaborador_nome: adiant.colaborador_nome,
      categoria: 'adiantamento',
      descricao: `Desconto Adiantamento/Vale de ${adiant.data_adiantamento}`,
      natureza: 'desconto',
      valor_total: adiant.valor,
      data_lancamento: new Date().toISOString().split('T')[0],
      observacao: adiant.observacao || 'Compensação de vale autorizado'
    });

    adiant.status = 'compensado';
    adiant.lancamento_id = lancamento.id;
    this.setStorage(STORAGE_KEY_ADIANTAMENTOS, list);

    this.registrarAuditoria('COMPENSAR_ADIANTAMENTO', 'folha_adiantamentos', adiant.id, null, adiant, 'Compensado e vinculado à folha');
  }

  // --- PAGAMENTOS POR EVENTO ---
  public getPagamentosEvento(): PagamentoEventoItem[] {
    const list = this.getStorage<PagamentoEventoItem[]>(STORAGE_KEY_EVENTOS_PAGAMENTOS, []);
    if (!list || list.length === 0) {
      this.setStorage(STORAGE_KEY_EVENTOS_PAGAMENTOS, PAGAMENTOS_EVENTO_SEED);
      return PAGAMENTOS_EVENTO_SEED;
    }
    return list;
  }

  public adicionarPagamentoEvento(dados: Omit<PagamentoEventoItem, 'id' | 'status'>): PagamentoEventoItem {
    const list = this.getPagamentosEvento();
    const novo: PagamentoEventoItem = {
      ...dados,
      id: 'ev-pag-' + Date.now(),
      status: 'pendente'
    };
    list.push(novo);
    this.setStorage(STORAGE_KEY_EVENTOS_PAGAMENTOS, list);
    return novo;
  }

  /**
   * Importa pagamentos de evento pendentes para a folha da competência.
   * Evita estritamente duplicidades consultando o status e lancamento_id.
   */
  public importarEventoParaFolha(pagamentoEventoId: string, competencia: string): void {
    const list = this.getPagamentosEvento();
    const item = list.find(p => p.id === pagamentoEventoId);
    if (!item) throw new Error('Item de evento não encontrado.');
    if (item.status === 'importado_folha') {
      throw new Error('Este cachê/diária já foi importado para a folha de pagamento.');
    }

    const lancamento = this.adicionarLancamento({
      competencia,
      colaborador_id: item.colaborador_id,
      colaborador_nome: item.colaborador_nome,
      categoria: 'pagamento_evento',
      descricao: `${item.tipo_remuneracao.toUpperCase()}: ${item.funcao} - ${item.evento_nome}`,
      natureza: 'provento',
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
      data_lancamento: item.data_evento,
      evento_id: item.evento_id,
      evento_nome: item.evento_nome,
      observacao: `Banda: ${item.banda_nome || 'N/A'}`
    });

    item.status = 'importado_folha';
    item.lancamento_id = lancamento.id;
    this.setStorage(STORAGE_KEY_EVENTOS_PAGAMENTOS, list);
  }

  // --- REGISTRO DE PAGAMENTOS ---
  public getRegistrosPagamento(folhaId?: string): RegistroPagamentoFolha[] {
    const list = this.getStorage<RegistroPagamentoFolha[]>(STORAGE_KEY_REGISTROS_PAGAMENTO, []);
    if (!folhaId) return list;
    return list.filter(r => r.folha_id === folhaId);
  }

  public registrarPagamento(dados: {
    folha_id: string;
    colaborador_id: string;
    colaborador_nome: string;
    valor_pago: number;
    forma_pagamento: any;
    data_pagamento: string;
    referencia_transacao?: string;
    comprovante_nome?: string;
    observacao?: string;
    competencia: string;
  }): RegistroPagamentoFolha {
    const folha = this.getFolhaCompetencia(dados.competencia);
    if (folha.status === 'em_preparacao' || folha.status === 'em_conferencia') {
      throw new Error('A folha precisa ser aprovada ou fechada antes de registrar pagamentos.');
    }

    const colaboradores = this.getColaboradores();
    const colaborador = colaboradores.find(c => c.id === dados.colaborador_id);
    if (!colaborador) throw new Error('Colaborador não encontrado.');

    const lancamentos = this.getLancamentos(dados.competencia);
    const pagamentosAnteriores = this.getRegistrosPagamento(folha.id)
      .filter(p => p.colaborador_id === dados.colaborador_id);
    const jaPago = pagamentosAnteriores.reduce((acc, cur) => acc + cur.valor_pago, 0);

    const resumo = consolidarResumoColaborador(colaborador, lancamentos, jaPago);
    const novoSaldo = Math.max(0, Math.round((resumo.saldo_devedor - dados.valor_pago) * 100) / 100);

    const novoRegistro: RegistroPagamentoFolha = {
      id: 'pag-reg-' + Date.now(),
      folha_id: folha.id,
      colaborador_id: dados.colaborador_id,
      colaborador_nome: dados.colaborador_nome,
      data_pagamento: dados.data_pagamento,
      forma_pagamento: dados.forma_pagamento,
      valor_pago: dados.valor_pago,
      saldo_remanescente: novoSaldo,
      referencia_transacao: dados.referencia_transacao,
      comprovante_nome: dados.comprovante_nome,
      status: novoSaldo <= 0 ? 'pago' : 'parcial',
      observacao: dados.observacao,
      registrado_por: 'Administrador (admin)',
      criado_em: new Date().toISOString()
    };

    const all = this.getRegistrosPagamento();
    all.push(novoRegistro);
    this.setStorage(STORAGE_KEY_REGISTROS_PAGAMENTO, all);

    this.registrarAuditoria('REGISTRO_PAGAMENTO', 'folha_pagamentos_registros', novoRegistro.id, null, novoRegistro, `Pagamento de ${dados.valor_pago} registrado`);
    this.recalcularTotaisFolha(dados.competencia);
    return novoRegistro;
  }

  // --- FECHAMENTO & REABERTURA DA FOLHA ---
  public atualizarStatusFolha(competencia: string, novoStatus: StatusFolha, justificativa?: string): FolhaCompetencia {
    const folhas = this.getFolhas();
    const idx = folhas.findIndex(f => f.competencia === competencia);
    if (idx < 0) throw new Error('Competência não encontrada.');

    const folha = folhas[idx];
    const agora = new Date().toISOString();

    if (novoStatus === 'fechada') {
      // Validações antes do fechamento
      const params = this.getParametrosTributarios();
      if (!params || !params.ativo) {
        throw new Error('Parâmetros tributários ausentes ou inativos. Configure parâmetros válidos antes de fechar.');
      }

      if (folha.total_liquido <= 0 && folha.total_proventos <= 0) {
        throw new Error('A folha não possui lançamentos com valores válidos para fechamento.');
      }

      // Tira snapshot dos parâmetros e valores
      folha.snapshot_parametros = JSON.parse(JSON.stringify(params));
      folha.fechado_por = 'admin';
      folha.fechado_em = agora;
    }

    if (novoStatus === 'aprovada') {
      folha.aprovado_por = 'admin';
      folha.aprovado_em = agora;
    }

    if (folha.status === 'fechada' && novoStatus === 'em_preparacao') {
      // Reabertura de folha fechada exige justificativa
      if (!justificativa || justificativa.trim().length < 10) {
        throw new Error('Reabertura de folha fechada exige justificativa detalhada com no mínimo 10 caracteres.');
      }
      folha.justificativa_reabertura = justificativa;
      folha.reaberto_por = 'admin';
      folha.reaberto_em = agora;
      this.registrarAuditoria('REABERTURA_FOLHA', 'folhas_mensais', folha.id, folha, { status: novoStatus, justificativa }, justificativa);
    }

    folha.status = novoStatus;
    folha.atualizado_em = agora;
    folhas[idx] = folha;
    this.setStorage(STORAGE_KEY_FOLHAS, folhas);

    this.registrarAuditoria('MUDANCA_STATUS_FOLHA', 'folhas_mensais', folha.id, null, { status: novoStatus }, `Folha alterada para ${novoStatus}`);
    return folha;
  }

  // --- AUDITORIA ---
  public getAuditoria(): LogAuditoriaFolha[] {
    return this.getStorage<LogAuditoriaFolha[]>(STORAGE_KEY_AUDITORIA, []);
  }

  public registrarAuditoria(
    acao: string, 
    tabela: string, 
    registro_id: string, 
    dados_anteriores: any, 
    dados_novos: any, 
    justificativa?: string
  ): void {
    const list = this.getAuditoria();
    const log: LogAuditoriaFolha = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      acao,
      tabela,
      registro_id,
      dados_anteriores: dados_anteriores ? JSON.parse(JSON.stringify(dados_anteriores)) : null,
      dados_novos: dados_novos ? JSON.parse(JSON.stringify(dados_novos)) : null,
      justificativa,
      usuario_id: 'admin',
      usuario_nome: 'Administrador do Sistema',
      criado_em: new Date().toISOString()
    };
    list.unshift(log);
    // Guarda os últimos 200 logs
    if (list.length > 200) list.length = 200;
    this.setStorage(STORAGE_KEY_AUDITORIA, list);
  }

  // --- CÁLCULO E INICIALIZAÇÃO ---
  public recalcularTotaisFolha(competencia: string): FolhaCompetencia {
    const folha = this.getFolhaCompetencia(competencia);
    const colaboradores = this.getColaboradores().filter(c => c.status === 'ativo');
    const lancamentos = this.getLancamentos(competencia);
    const pagamentos = this.getRegistrosPagamento(folha.id);

    let totalProventos = 0;
    let totalDescontos = 0;
    let totalEncargosPatronais = 0;
    let pendentesCount = 0;

    colaboradores.forEach(colab => {
      const pagamentosColab = pagamentos.filter(p => p.colaborador_id === colab.id);
      const totalPago = pagamentosColab.reduce((acc, p) => acc + p.valor_pago, 0);
      const resumo = consolidarResumoColaborador(colab, lancamentos, totalPago);

      totalProventos += resumo.total_proventos;
      totalDescontos += resumo.total_descontos;
      totalEncargosPatronais += resumo.total_encargos_patronais;

      if (resumo.saldo_devedor > 0) {
        pendentesCount++;
      }
    });

    const totalLiquido = Math.max(0, Math.round((totalProventos - totalDescontos) * 100) / 100);

    folha.total_proventos = Math.round(totalProventos * 100) / 100;
    folha.total_descontos = Math.round(totalDescontos * 100) / 100;
    folha.total_liquido = totalLiquido;
    folha.total_encargos_patronais = Math.round(totalEncargosPatronais * 100) / 100;
    folha.total_colaboradores = colaboradores.length;
    folha.pagamentos_pendentes = pendentesCount;
    folha.atualizado_em = new Date().toISOString();

    const folhas = this.getFolhas();
    const idx = folhas.findIndex(f => f.competencia === competencia);
    if (idx >= 0) {
      folhas[idx] = folha;
      this.setStorage(STORAGE_KEY_FOLHAS, folhas);
    }

    return folha;
  }

  public inicializarLancamentosPadrao(competencia: string, folhaId: string): void {
    const colaboradores = this.getColaboradores().filter(c => c.status === 'ativo');
    const allLancamentos = this.getStorage<LancamentoFolha[]>(STORAGE_KEY_LANCAMENTOS, []);
    const existentes = allLancamentos.filter(l => l.competencia === competencia);

    if (existentes.length > 0) return; // Já possui lançamentos

    const novos: LancamentoFolha[] = [];
    const params = this.getParametrosTributarios();
    const hoje = new Date().toISOString().split('T')[0];

    colaboradores.forEach(c => {
      if (c.salario_base > 0) {
        // Lança salário base
        novos.push({
          id: 'lanc-sal-' + c.id + '-' + Date.now(),
          folha_id: folhaId,
          competencia,
          colaborador_id: c.id,
          colaborador_nome: c.nome_completo,
          categoria: 'salario',
          descricao: c.tipo_vinculo === 'clt' ? 'Salário Base Mensal' : 'Remuneração Contratual Mensal',
          natureza: 'provento',
          valor_total: c.salario_base,
          data_lancamento: hoje,
          observacao: `Vínculo: ${c.tipo_vinculo.toUpperCase()}`,
          criado_em: new Date().toISOString()
        });

        // Se for CLT, calcula e lança INSS, IRRF e FGTS patronal
        if (c.tipo_vinculo === 'clt') {
          const inss = calcularINSSProgressivo(c.salario_base, params);
          if (inss > 0) {
            novos.push({
              id: 'lanc-inss-' + c.id + '-' + Date.now(),
              folha_id: folhaId,
              competencia,
              colaborador_id: c.id,
              colaborador_nome: c.nome_completo,
              categoria: 'inss',
              descricao: 'Desconto INSS Empregado (Tabela Progressiva)',
              natureza: 'desconto',
              valor_total: inss,
              data_lancamento: hoje,
              observacao: 'Conforme tabela oficial vigente',
              criado_em: new Date().toISOString()
            });
          }

          const irrf = calcularIRRFProgressivo(c.salario_base, inss, c.numero_dependentes, params);
          if (irrf.valorIRRF > 0) {
            novos.push({
              id: 'lanc-irrf-' + c.id + '-' + Date.now(),
              folha_id: folhaId,
              competencia,
              colaborador_id: c.id,
              colaborador_nome: c.nome_completo,
              categoria: 'irrf',
              descricao: `IRRF Retido na Fonte (${irrf.metodo === 'simplificado' ? 'Desconto Simplificado' : 'Deduções Legais'})`,
              natureza: 'desconto',
              valor_total: irrf.valorIRRF,
              data_lancamento: hoje,
              observacao: `Base de cálculo: R$ ${irrf.baseCalculo.toFixed(2)}`,
              criado_em: new Date().toISOString()
            });
          }

          // FGTS Patronal (8%) - Encargo da empresa, NUNCA descontado do colaborador
          const fgts = calcularFGTSPatronal(c.salario_base, params.aliquota_fgts_patronal);
          if (fgts > 0) {
            novos.push({
              id: 'lanc-fgts-' + c.id + '-' + Date.now(),
              folha_id: folhaId,
              competencia,
              colaborador_id: c.id,
              colaborador_nome: c.nome_completo,
              categoria: 'fgts_patronal',
              descricao: 'FGTS Patronal (8% - Encargo da Empresa)',
              natureza: 'encargo_patronal',
              valor_total: fgts,
              data_lancamento: hoje,
              observacao: 'Encargo patronal exclusivo; não afeta o salário líquido',
              criado_em: new Date().toISOString()
            });
          }

          // INSS Patronal (20%) - Encargo da empresa
          const inssPatronal = calcularINSSPatronal(c.salario_base, params.aliquota_inss_patronal);
          if (inssPatronal > 0) {
            novos.push({
              id: 'lanc-insspat-' + c.id + '-' + Date.now(),
              folha_id: folhaId,
              competencia,
              colaborador_id: c.id,
              colaborador_nome: c.nome_completo,
              categoria: 'inss_patronal',
              descricao: 'INSS Patronal (20% - Encargo da Empresa)',
              natureza: 'encargo_patronal',
              valor_total: inssPatronal,
              data_lancamento: hoje,
              observacao: 'Encargo patronal da empresa',
              criado_em: new Date().toISOString()
            });
          }
        }
      }
    });

    this.setStorage(STORAGE_KEY_LANCAMENTOS, [...allLancamentos, ...novos]);
    this.recalcularTotaisFolha(competencia);
  }
}

export const folhaStorage = new FolhaStorageService();
