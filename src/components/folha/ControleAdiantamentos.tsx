import React, { useState } from 'react';
import { Adiantamento, Colaborador, StatusFolha } from '../../types/folha';
import { formatarMoeda, formatarDataBR } from '../../utils/folhaCalculos';

interface Props {
  competencia: string;
  statusFolha: StatusFolha;
  adiantamentos: Adiantamento[];
  colaboradores: Colaborador[];
  aoCriarAdiantamento: (dados: Omit<Adiantamento, 'id' | 'criado_em' | 'status'>) => void;
  aoCompensarAdiantamento: (adiantamentoId: string) => void;
}

export const ControleAdiantamentos: React.FC<Props> = ({
  competencia,
  statusFolha,
  adiantamentos,
  colaboradores,
  aoCriarAdiantamento,
  aoCompensarAdiantamento
}) => {
  const folhaBloqueada = statusFolha === 'fechada' || statusFolha === 'paga';

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [colabId, setColabId] = useState('');
  const [valor, setValor] = useState('300');
  const [dataAdiantamento, setDataAdiantamento] = useState(new Date().toISOString().split('T')[0]);
  const [competenciaDesconto, setCompetenciaDesconto] = useState(competencia);
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  const abrirNovo = () => {
    setColabId(colaboradores[0]?.id || '');
    setValor('300');
    setDataAdiantamento(new Date().toISOString().split('T')[0]);
    setCompetenciaDesconto(competencia);
    setObs('');
    setErro('');
    setModalNovoAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const colab = colaboradores.find(c => c.id === colabId);
    if (!colab) {
      setErro('Selecione um colaborador.');
      return;
    }
    const v = parseFloat(valor.replace(',', '.')) || 0;
    if (v <= 0) {
      setErro('O valor do adiantamento deve ser positivo.');
      return;
    }

    aoCriarAdiantamento({
      colaborador_id: colab.id,
      colaborador_nome: colab.nome_completo,
      valor: v,
      data_adiantamento: dataAdiantamento,
      competencia_desconto: competenciaDesconto,
      observacao: obs.trim() || undefined
    });

    setModalNovoAberto(false);
  };

  const handleCompensar = (a: Adiantamento) => {
    if (folhaBloqueada) {
      alert('A folha da competência está fechada. Não é possível compensar novos vales.');
      return;
    }

    if (window.confirm(`Confirma o lançamento do adiantamento de ${formatarMoeda(a.valor)} como desconto na folha de ${a.competencia_desconto}? Ele será vinculado diretamente e não poderá ser descontado novamente.`)) {
      try {
        aoCompensarAdiantamento(a.id);
        alert('Adiantamento compensado com sucesso e lançado como desconto na folha!');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div>
      {/* Barra de Ações Superior */}
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
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
            Controle de Adiantamentos & Vales
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Gerenciamento de adiantamentos salariais com trava anti-duplicidade na folha.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovo}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>+</span>
          <span>Novo Adiantamento</span>
        </button>
      </div>

      {/* Regra de proteção contra dupla dedução */}
      <div style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1e3a5f',
        borderRadius: '8px',
        padding: '10px 16px',
        fontSize: '12px',
        color: '#93c5fd',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>🛡️</span>
        <span>
          <strong>Proteção Contábil Integrada:</strong> Cada adiantamento possui chave única de rastreamento. Ao ser compensado na folha, é gerado o lançamento de desconto correspondente, impedindo qualquer contabilização dupla.
        </span>
      </div>

      {/* Tabela de Adiantamentos */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data do Vale</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Comp. Desconto</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Valor do Adiantamento</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status Contábil</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Observações</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {adiantamentos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum adiantamento registrado.
                </td>
              </tr>
            ) : (
              adiantamentos.map(a => {
                const isCompensado = a.status === 'compensado';
                const isCancelado = a.status === 'cancelado';

                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatarDataBR(a.data_adiantamento)}
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {a.colaborador_nome}
                    </td>

                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 600 }}>
                      {a.competencia_desconto}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#f87171' }}>
                      {formatarMoeda(a.valor)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isCompensado ? '#0d3822' : isCancelado ? '#331616' : '#33230b',
                        color: isCompensado ? '#4ade80' : isCancelado ? '#f87171' : '#facc15'
                      }}>
                        {isCompensado ? '✓ COMPENSADO NA FOLHA' : isCancelado ? 'CANCELADO' : '● PENDENTE DE DEDUÇÃO'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {a.observacao || '-'}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isCompensado && !isCancelado ? (
                        <button
                          type="button"
                          disabled={folhaBloqueada}
                          onClick={() => handleCompensar(a)}
                          title="Lançar como desconto na folha de pagamento"
                          style={{
                            backgroundColor: folhaBloqueada ? '#334155' : '#ea580c',
                            color: folhaBloqueada ? '#94a3b8' : '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: folhaBloqueada ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Dedução na Folha
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Concluído</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Adiantamento */}
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
            maxWidth: '480px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>
              Registrar Adiantamento / Vale
            </h3>

            {erro && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Colaborador Beneficiário *
                </label>
                <select
                  value={colabId}
                  onChange={(e) => setColabId(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome_completo} ({c.matricula})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Valor do Vale (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f87171', fontWeight: 700, border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Data da Liberação *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataAdiantamento}
                    onChange={(e) => setDataAdiantamento(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Competência do Desconto (MM/AAAA) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MM/AAAA (ex: 10/2026)"
                  value={competenciaDesconto}
                  onChange={(e) => setCompetenciaDesconto(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Motivo / Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Justificativa do adiantamento..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                />
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
                  Registrar Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
