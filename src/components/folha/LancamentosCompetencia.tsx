import React, { useState } from 'react';
import { 
  Colaborador, 
  LancamentoFolha, 
  NaturezaLancamento, 
  CategoriaLancamento, 
  StatusFolha 
} from '../../types/folha';
import { formatarMoeda, formatarDataBR } from '../../utils/folhaCalculos';

interface Props {
  competencia: string;
  statusFolha: StatusFolha;
  lancamentos: LancamentoFolha[];
  colaboradores: Colaborador[];
  aoAdicionarLancamento: (dados: Omit<LancamentoFolha, 'id' | 'criado_em'>) => void;
  aoRemoverLancamento: (id: string, justificativa: string) => void;
  aoAjustarManual: (id: string, novoValor: number, justificativa: string) => void;
}

export const LancamentosCompetencia: React.FC<Props> = ({
  competencia,
  statusFolha,
  lancamentos,
  colaboradores,
  aoAdicionarLancamento,
  aoRemoverLancamento,
  aoAjustarManual
}) => {
  const folhaBloqueada = statusFolha === 'fechada' || statusFolha === 'paga';

  // Filtros
  const [filtroColab, setFiltroColab] = useState<string>('todos');
  const [filtroNatureza, setFiltroNatureza] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
  const [lancamentoAjustando, setLancamentoAjustando] = useState<LancamentoFolha | null>(null);

  // Form Novo Lançamento
  const [formColabId, setFormColabId] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaLancamento>('hora_extra');
  const [formNatureza, setFormNatureza] = useState<NaturezaLancamento>('provento');
  const [formDescricao, setFormDescricao] = useState('');
  const [formQtd, setFormQtd] = useState('1');
  const [formUnitario, setFormUnitario] = useState('0');
  const [formTotal, setFormTotal] = useState('0');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formEventoNome, setFormEventoNome] = useState('');
  const [formObs, setFormObs] = useState('');
  const [erroForm, setErroForm] = useState('');

  // Form Ajuste Manual
  const [ajusteNovoValor, setAjusteNovoValor] = useState('');
  const [ajusteJustificativa, setAjusteJustificativa] = useState('');
  const [ajusteErro, setAjusteErro] = useState('');

  const categoriasConfig: { id: CategoriaLancamento; label: string; padraoNatureza: NaturezaLancamento }[] = [
    { id: 'salario', label: 'Salário Base / Remuneração Contratual', padraoNatureza: 'provento' },
    { id: 'diaria', label: 'Diária Técnica / Equipe', padraoNatureza: 'provento' },
    { id: 'cache', label: 'Cachê Artístico / Banda', padraoNatureza: 'provento' },
    { id: 'hora_extra', label: 'Horas Extras', padraoNatureza: 'provento' },
    { id: 'adicional_noturno', label: 'Adicional Noturno', padraoNatureza: 'provento' },
    { id: 'periculosidade', label: 'Adicional de Periculosidade', padraoNatureza: 'provento' },
    { id: 'insalubridade', label: 'Adicional de Insalubridade', padraoNatureza: 'provento' },
    { id: 'comissao', label: 'Comissão', padraoNatureza: 'provento' },
    { id: 'bonus', label: 'Bônus / Gratificação', padraoNatureza: 'provento' },
    { id: 'ajuda_custo', label: 'Ajuda de Custo / Alimentação / Transporte', padraoNatureza: 'provento' },
    { id: 'beneficio', label: 'Benefício Extra', padraoNatureza: 'provento' },
    { id: 'pagamento_evento', label: 'Remuneração de Evento / Show', padraoNatureza: 'provento' },
    { id: 'falta', label: 'Falta / Ausência não justificada', padraoNatureza: 'desconto' },
    { id: 'atraso', label: 'Atraso', padraoNatureza: 'desconto' },
    { id: 'adiantamento', label: 'Adiantamento / Vale Salarial', padraoNatureza: 'desconto' },
    { id: 'desconto_autorizado', label: 'Desconto Autorizado Diverso', padraoNatureza: 'desconto' },
    { id: 'inss', label: 'INSS Trabalhador (Previdência)', padraoNatureza: 'desconto' },
    { id: 'irrf', label: 'IRRF (Imposto de Renda Retido)', padraoNatureza: 'desconto' },
    { id: 'fgts_patronal', label: 'FGTS Patronal (8% - Encargo Empresa)', padraoNatureza: 'encargo_patronal' },
    { id: 'inss_patronal', label: 'INSS Patronal (20% - Encargo Empresa)', padraoNatureza: 'encargo_patronal' }
  ];

  const abrirNovoLancamento = () => {
    const primeiroColab = colaboradores[0]?.id || '';
    setFormColabId(primeiroColab);
    setFormCategoria('hora_extra');
    setFormNatureza('provento');
    setFormDescricao('Horas Extras - Produção / Montagem');
    setFormQtd('1');
    setFormUnitario('150');
    setFormTotal('150');
    setFormData(new Date().toISOString().split('T')[0]);
    setFormEventoNome('');
    setFormObs('');
    setErroForm('');
    setModalNovoAberto(true);
  };

  const handleMudarCategoria = (catId: CategoriaLancamento) => {
    setFormCategoria(catId);
    const cat = categoriasConfig.find(c => c.id === catId);
    if (cat) {
      setFormNatureza(cat.padraoNatureza);
      if (!formDescricao || formDescricao.includes('Horas Extras') || formDescricao.includes('Salário')) {
        setFormDescricao(cat.label);
      }
    }
  };

  const handleMudarQtdOuUnitario = (qtdStr: string, unitStr: string) => {
    setFormQtd(qtdStr);
    setFormUnitario(unitStr);
    const q = parseFloat(qtdStr) || 0;
    const u = parseFloat(unitStr) || 0;
    const total = Math.round(q * u * 100) / 100;
    setFormTotal(String(total));
  };

  const handleSalvarNovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formColabId) {
      setErroForm('Selecione um colaborador.');
      return;
    }
    const valTotal = parseFloat(formTotal.replace(',', '.')) || 0;
    if (valTotal <= 0) {
      setErroForm('O valor total do lançamento deve ser maior que zero.');
      return;
    }
    const colab = colaboradores.find(c => c.id === formColabId);
    if (!colab) {
      setErroForm('Colaborador inválido.');
      return;
    }

    try {
      aoAdicionarLancamento({
        competencia,
        colaborador_id: formColabId,
        colaborador_nome: colab.nome_completo,
        categoria: formCategoria,
        descricao: formDescricao.trim(),
        natureza: formNatureza,
        quantidade: parseFloat(formQtd) || undefined,
        valor_unitario: parseFloat(formUnitario) || undefined,
        valor_total: valTotal,
        data_lancamento: formData,
        evento_nome: formEventoNome.trim() || undefined,
        observacao: formObs.trim() || undefined
      });
      setModalNovoAberto(false);
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao adicionar lançamento.');
    }
  };

  const abrirAjusteManual = (lanc: LancamentoFolha) => {
    setLancamentoAjustando(lanc);
    setAjusteNovoValor(String(lanc.valor_total));
    setAjusteJustificativa(lanc.justificativa_ajuste || '');
    setAjusteErro('');
    setModalAjusteAberto(true);
  };

  const handleSalvarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lancamentoAjustando) return;
    const v = parseFloat(ajusteNovoValor.replace(',', '.')) || 0;
    if (v < 0) {
      setAjusteErro('O valor ajustado não pode ser negativo.');
      return;
    }
    if (!ajusteJustificativa || ajusteJustificativa.trim().length < 5) {
      setAjusteErro('A justificativa é obrigatória e deve ter pelo menos 5 caracteres para fins de auditoria.');
      return;
    }

    try {
      aoAjustarManual(lancamentoAjustando.id, v, ajusteJustificativa.trim());
      setModalAjusteAberto(false);
    } catch (err: any) {
      setAjusteErro(err.message || 'Erro ao ajustar lançamento.');
    }
  };

  const handleExcluir = (lanc: LancamentoFolha) => {
    const motivo = window.prompt(`Confirma a remoção do lançamento "${lanc.descricao}" de ${formatarMoeda(lanc.valor_total)}? Digite o motivo para auditoria:`);
    if (motivo !== null) {
      if (!motivo.trim()) {
        alert('É necessário fornecer um motivo para a exclusão.');
        return;
      }
      try {
        aoRemoverLancamento(lanc.id, motivo.trim());
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Filtragem
  const filtrados = lancamentos.filter(l => {
    const colabMatch = filtroColab === 'todos' || l.colaborador_id === filtroColab;
    const naturezaMatch = filtroNatureza === 'todos' || l.natureza === filtroNatureza;
    const catMatch = filtroCategoria === 'todos' || l.categoria === filtroCategoria;
    return colabMatch && naturezaMatch && catMatch;
  });

  return (
    <div>
      {/* Barra de Filtros e Ação */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: '#0f172a',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <select
            value={filtroColab}
            onChange={(e) => setFiltroColab(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="todos">Todos os Colaboradores</option>
            {colaboradores.map(c => (
              <option key={c.id} value={c.id}>{c.nome_completo} ({c.matricula})</option>
            ))}
          </select>

          <select
            value={filtroNatureza}
            onChange={(e) => setFiltroNatureza(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="todos">Todas as Naturezas</option>
            <option value="provento">Proventos (+)</option>
            <option value="desconto">Descontos (-)</option>
            <option value="encargo_patronal">Encargos Patronais (Empresa)</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="todos">Todas as Categorias</option>
            {categoriasConfig.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={folhaBloqueada}
          onClick={abrirNovoLancamento}
          style={{
            backgroundColor: folhaBloqueada ? '#334155' : '#0284c7',
            color: folhaBloqueada ? '#94a3b8' : '#ffffff',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: folhaBloqueada ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>+</span>
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Tabela de Lançamentos */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descrição / Categoria</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Natureza</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Qtd × Unitário</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Valor Total</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum lançamento encontrado nesta competência com os filtros aplicados.
                </td>
              </tr>
            ) : (
              filtrados.map((l) => {
                const isProvento = l.natureza === 'provento';
                const isDesconto = l.natureza === 'desconto';
                const isEncargo = l.natureza === 'encargo_patronal';

                const corValor = isProvento ? '#4ade80' : isDesconto ? '#f87171' : '#c084fc';
                const sinal = isProvento ? '+' : isDesconto ? '-' : '⚖️';

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatarDataBR(l.data_lancamento)}
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {l.colaborador_nome || 'Colaborador'}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#f8fafc', fontWeight: 500 }}>
                        {l.descricao}
                        {l.ajuste_manual && (
                          <span style={{
                            marginLeft: '6px',
                            backgroundColor: '#3b2505',
                            color: '#f59e0b',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            AJUSTADO MANUALMENTE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {l.evento_nome ? `Evento: ${l.evento_nome}` : l.categoria}
                        {l.observacao && ` • ${l.observacao}`}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isProvento ? '#0d3822' : isDesconto ? '#331616' : '#2b1045',
                        color: corValor
                      }}>
                        {isProvento ? 'PROVENTO' : isDesconto ? 'DESCONTO' : 'ENCARGO PATRONAL'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {l.quantidade && l.valor_unitario ? (
                        <span>{l.quantidade} × {formatarMoeda(l.valor_unitario)}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: corValor, whiteSpace: 'nowrap' }}>
                      {sinal} {formatarMoeda(l.valor_total)}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={folhaBloqueada}
                          onClick={() => abrirAjusteManual(l)}
                          title="Ajuste manual com justificativa auditada"
                          style={{
                            backgroundColor: '#1e293b',
                            color: folhaBloqueada ? '#64748b' : '#facc15',
                            border: '1px solid #334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: folhaBloqueada ? 'not-allowed' : 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Ajustar
                        </button>

                        <button
                          type="button"
                          disabled={folhaBloqueada}
                          onClick={() => handleExcluir(l)}
                          title="Remover lançamento"
                          style={{
                            backgroundColor: '#1e293b',
                            color: folhaBloqueada ? '#64748b' : '#f87171',
                            border: '1px solid #334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: folhaBloqueada ? 'not-allowed' : 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Lançamento */}
      {modalNovoAberto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '560px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>
              Novo Lançamento ({competencia})
            </h3>

            {erroForm && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarNovo}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Colaborador *
                  </label>
                  <select
                    value={formColabId}
                    onChange={(e) => setFormColabId(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_completo} ({c.matricula} - {c.tipo_vinculo.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => handleMudarCategoria(e.target.value as CategoriaLancamento)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    {categoriasConfig.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Natureza do Lançamento
                  </label>
                  <select
                    value={formNatureza}
                    onChange={(e) => setFormNatureza(e.target.value as NaturezaLancamento)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="provento">Provento (+) Adiciona aos ganhos</option>
                    <option value="desconto">Desconto (-) Deduz do salário líquido</option>
                    <option value="encargo_patronal">Encargo Patronal (Empresa - Não afeta líquido)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Data do Fato / Lançamento
                  </label>
                  <input
                    type="date"
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Descrição Completa *
                </label>
                <input
                  type="text"
                  required
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="ex: Cachê Show Marley Sunset, Diária Roadie 12h, etc."
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Quantidade
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formQtd}
                    onChange={(e) => handleMudarQtdOuUnitario(e.target.value, formUnitario)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formUnitario}
                    onChange={(e) => handleMudarQtdOuUnitario(formQtd, e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#4ade80', fontWeight: 700, border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Evento Relacionado (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Show Bob Marley Sunset"
                    value={formEventoNome}
                    onChange={(e) => setFormEventoNome(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Informações adicionais..."
                    value={formObs}
                    onChange={(e) => setFormObs(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Adicionar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Manual */}
      {modalAjusteAberto && lancamentoAjustando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#f59e0b' }}>
              ⚙️ Ajuste Manual de Lançamento
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 14px 0' }}>
              Lançamento: <strong>{lancamentoAjustando.descricao}</strong> ({lancamentoAjustando.colaborador_nome})
              <br />
              Valor atual: <strong>{formatarMoeda(lancamentoAjustando.valor_total)}</strong>
            </p>

            {ajusteErro && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {ajusteErro}
              </div>
            )}

            <form onSubmit={handleSalvarAjuste}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Novo Valor Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={ajusteNovoValor}
                  onChange={(e) => setAjusteNovoValor(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px', fontSize: '16px', fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Justificativa Obrigatória (Auditoria) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique o motivo técnico ou contábil da alteração manual..."
                  value={ajusteJustificativa}
                  onChange={(e) => setAjusteJustificativa(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalAjusteAberto(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Gravar Ajuste Auditado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
