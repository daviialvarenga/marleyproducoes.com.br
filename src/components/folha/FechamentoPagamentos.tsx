import React, { useState } from 'react';
import { 
  Colaborador, 
  FolhaCompetencia, 
  LancamentoFolha, 
  RegistroPagamentoFolha, 
  FormaPagamento 
} from '../../types/folha';
import { formatarMoeda, consolidarResumoColaborador, formatarDataBR } from '../../utils/folhaCalculos';

interface Props {
  folha: FolhaCompetencia;
  competencia: string;
  colaboradores: Colaborador[];
  lancamentos: LancamentoFolha[];
  registrosPagamento: RegistroPagamentoFolha[];
  aoRegistrarPagamento: (dados: {
    folha_id: string;
    colaborador_id: string;
    colaborador_nome: string;
    valor_pago: number;
    forma_pagamento: FormaPagamento;
    data_pagamento: string;
    referencia_transacao?: string;
    comprovante_nome?: string;
    observacao?: string;
    competencia: string;
  }) => void;
}

export const FechamentoPagamentos: React.FC<Props> = ({
  folha,
  competencia,
  colaboradores,
  lancamentos,
  registrosPagamento,
  aoRegistrarPagamento
}) => {
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false);
  const [colabSelecionado, setColabSelecionado] = useState<Colaborador | null>(null);
  const [saldoPendente, setSaldoPendente] = useState<number>(0);

  // Form Pagamento
  const [valorPagoInput, setValorPagoInput] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [referenciaTransacao, setReferenciaTransacao] = useState('');
  const [comprovanteNome, setComprovanteNome] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  const colaboradoresAtivos = colaboradores.filter(c => c.status === 'ativo');

  // Calcula os resumos de cada colaborador
  const resumos = colaboradoresAtivos.map(colab => {
    const pagosDeste = registrosPagamento
      .filter(r => r.colaborador_id === colab.id)
      .reduce((acc, cur) => acc + cur.valor_pago, 0);
    return consolidarResumoColaborador(colab, lancamentos, pagosDeste);
  });

  const abrirRegistroPagamento = (resumo: ReturnType<typeof consolidarResumoColaborador>) => {
    if (folha.status === 'em_preparacao' || folha.status === 'em_conferencia') {
      alert('Para registrar baixas de pagamento, a folha deve estar previamente Aprovada ou Fechada.');
      return;
    }

    setColabSelecionado(resumo.colaborador);
    setSaldoPendente(resumo.saldo_devedor);
    setValorPagoInput(String(resumo.saldo_devedor));
    setFormaPagamento(resumo.colaborador.forma_pagamento || 'pix');
    setDataPagamento(new Date().toISOString().split('T')[0]);
    setReferenciaTransacao('');
    setComprovanteNome('');
    setObs('');
    setErro('');
    setModalBaixaAberto(true);
  };

  const handleSalvarPagamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colabSelecionado) return;

    const valor = parseFloat(valorPagoInput.replace(',', '.')) || 0;
    if (valor <= 0) {
      setErro('O valor a pagar deve ser maior que zero.');
      return;
    }
    if (valor > saldoPendente + 0.01) {
      if (!window.confirm(`Atenção: O valor (${formatarMoeda(valor)}) é superior ao saldo em aberto (${formatarMoeda(saldoPendente)}). Deseja prosseguir?`)) {
        return;
      }
    }

    try {
      aoRegistrarPagamento({
        folha_id: folha.id,
        colaborador_id: colabSelecionado.id,
        colaborador_nome: colabSelecionado.nome_completo,
        valor_pago: valor,
        forma_pagamento: formaPagamento,
        data_pagamento: dataPagamento,
        referencia_transacao: referenciaTransacao.trim() || undefined,
        comprovante_nome: comprovanteNome.trim() || undefined,
        observacao: obs.trim() || undefined,
        competencia
      });
      setModalBaixaAberto(false);
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar pagamento.');
    }
  };

  const statusBadge = (status: 'pendente' | 'parcial' | 'pago') => {
    if (status === 'pago') {
      return (
        <span style={{ backgroundColor: '#0d3822', color: '#4ade80', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
          ✓ TOTALMENTE PAGO
        </span>
      );
    }
    if (status === 'parcial') {
      return (
        <span style={{ backgroundColor: '#33230b', color: '#f59e0b', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
          ● PAGAMENTO PARCIAL
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#331616', color: '#f87171', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
        ● PENDENTE
      </span>
    );
  };

  return (
    <div>
      {/* Aviso de Segurança de Pagamentos */}
      <div style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1e3a5f',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#93c5fd',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '18px' }}>🏦</span>
        <div>
          <strong>Política de Segurança Bancária:</strong> Os pagamentos aqui registrados servem como conferência, quitação e controle contábil. Nenhuma transferência financeira é efetuada sem integração bancária explicitamente autorizada. Suporte completo a pagamentos parciais com saldo em aberto.
        </div>
      </div>

      {/* Tabela de Fechamento por Colaborador */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto',
        marginBottom: '32px'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
            Posição da Folha por Colaborador ({competencia})
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Status da competência: <strong>{folha.status.toUpperCase()}</strong>
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Vínculo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Total Bruto</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Descontos</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Líquido a Receber</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Total Pago</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Saldo em Aberto</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Situação</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {resumos.map((r) => (
              <tr key={r.colaborador.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{r.colaborador.nome_completo}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{r.colaborador.matricula} • {r.colaborador.cargo}</div>
                </td>

                <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', color: '#38bdf8' }}>
                  {r.colaborador.tipo_vinculo}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#4ade80', fontWeight: 600 }}>
                  {formatarMoeda(r.total_proventos)}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#f87171', fontWeight: 600 }}>
                  - {formatarMoeda(r.total_descontos)}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>
                  {formatarMoeda(r.valor_liquido)}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#a855f7', fontWeight: 600 }}>
                  {formatarMoeda(r.total_pago)}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: r.saldo_devedor > 0 ? '#facc15' : '#4ade80' }}>
                  {formatarMoeda(r.saldo_devedor)}
                </td>

                <td style={{ padding: '12px 16px' }}>
                  {statusBadge(r.status_pagamento)}
                </td>

                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {r.saldo_devedor > 0 ? (
                    <button
                      type="button"
                      onClick={() => abrirRegistroPagamento(r)}
                      title="Registrar pagamento ou baixa parcial"
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Pagar / Baixar
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>Quitado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Histórico de Registros de Pagamento Efetuados */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
            Histórico de Pagamentos Confirmados
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Transações e comprovantes registrados na competência
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data do Pagamento</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Forma</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Valor Pago</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Saldo Remanescente</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Referência / Transação</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {registrosPagamento.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum pagamento registrado ainda nesta competência.
                </td>
              </tr>
            ) : (
              registrosPagamento.map(reg => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {formatarDataBR(reg.data_pagamento)}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                    {reg.colaborador_nome}
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 600 }}>
                    {reg.forma_pagamento}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                    {formatarMoeda(reg.valor_pago)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: reg.saldo_remanescente > 0 ? '#facc15' : '#94a3b8' }}>
                    {formatarMoeda(reg.saldo_remanescente)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {reg.referencia_transacao || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {reg.comprovante_nome ? (
                      <span style={{ color: '#38bdf8', fontSize: '12px' }}>📎 {reg.comprovante_nome}</span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Não anexado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Baixa de Pagamento */}
      {modalBaixaAberto && colabSelecionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
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
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#f8fafc' }}>
              Confirmar Pagamento
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Colaborador: <strong>{colabSelecionado.nome_completo}</strong> ({colabSelecionado.matricula})
              <br />
              Saldo em aberto: <strong style={{ color: '#facc15' }}>{formatarMoeda(saldoPendente)}</strong>
            </p>

            {erro && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvarPagamento}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={valorPagoInput}
                  onChange={(e) => setValorPagoInput(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#4ade80', fontSize: '18px', fontWeight: 700, border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Aceita quitação integral ou pagamento parcial</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="pix">PIX</option>
                    <option value="ted">TED</option>
                    <option value="doc">DOC</option>
                    <option value="dinheiro">Dinheiro Espécie</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  ID / Código da Transação Bancária
                </label>
                <input
                  type="text"
                  placeholder="ex: E2E-PIX-9876543210..."
                  value={referenciaTransacao}
                  onChange={(e) => setReferenciaTransacao(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Nome do Arquivo de Comprovante (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: comprovante_ted_marley_carlos.pdf"
                  value={comprovanteNome}
                  onChange={(e) => setComprovanteNome(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalBaixaAberto(false)}
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
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
