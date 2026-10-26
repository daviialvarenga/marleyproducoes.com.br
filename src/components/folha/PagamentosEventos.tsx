import React, { useState } from 'react';
import { PagamentoEventoItem, Colaborador, StatusFolha } from '../../types/folha';
import { formatarMoeda, formatarDataBR } from '../../utils/folhaCalculos';

interface Props {
  competencia: string;
  statusFolha: StatusFolha;
  itensEvento: PagamentoEventoItem[];
  colaboradores: Colaborador[];
  aoAdicionarItemEvento: (item: Omit<PagamentoEventoItem, 'id' | 'status'>) => void;
  aoImportarParaFolha: (itemId: string, competencia: string) => void;
}

export const PagamentosEventos: React.FC<Props> = ({
  competencia,
  statusFolha,
  itensEvento,
  colaboradores,
  aoAdicionarItemEvento,
  aoImportarParaFolha
}) => {
  const folhaBloqueada = statusFolha === 'fechada' || statusFolha === 'paga';

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [eventoNome, setEventoNome] = useState('');
  const [bandaNome, setBandaNome] = useState('Marley Roots Tribute');
  const [colabId, setColabId] = useState('');
  const [funcao, setFuncao] = useState('');
  const [tipoRemuneracao, setTipoRemuneracao] = useState<'cache' | 'diaria' | 'hora_extra'>('diaria');
  const [qtd, setQtd] = useState('1');
  const [unitario, setUnitario] = useState('350');
  const [dataEvento, setDataEvento] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  const abrirNovo = () => {
    setEventoNome('');
    setBandaNome('Marley Roots Tribute');
    setColabId(colaboradores[0]?.id || '');
    setFuncao('Auxiliar de Palco / Roadie');
    setTipoRemuneracao('diaria');
    setQtd('1');
    setUnitario('350');
    setDataEvento(new Date().toISOString().split('T')[0]);
    setObs('');
    setErro('');
    setModalNovoAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoNome.trim()) {
      setErro('Informe o nome do evento/show.');
      return;
    }
    const colab = colaboradores.find(c => c.id === colabId);
    if (!colab) {
      setErro('Selecione um colaborador válido.');
      return;
    }

    const q = parseFloat(qtd) || 1;
    const u = parseFloat(unitario.replace(',', '.')) || 0;
    if (u <= 0) {
      setErro('O valor unitário deve ser maior que zero.');
      return;
    }

    aoAdicionarItemEvento({
      evento_id: 'ev-' + Date.now(),
      evento_nome: eventoNome.trim(),
      banda_id: 'banda-01',
      banda_nome: bandaNome.trim() || undefined,
      colaborador_id: colab.id,
      colaborador_nome: colab.nome_completo,
      funcao: funcao.trim() || 'Equipe de Apoio',
      tipo_remuneracao: tipoRemuneracao,
      quantidade: q,
      valor_unitario: u,
      valor_total: Math.round(q * u * 100) / 100,
      data_evento: dataEvento,
      observacao: obs.trim() || undefined
    });

    setModalNovoAberto(false);
  };

  const handleImportar = (item: PagamentoEventoItem) => {
    if (folhaBloqueada) {
      alert('Não é possível importar itens para uma folha fechada.');
      return;
    }
    try {
      aoImportarParaFolha(item.id, competencia);
      alert(`Remuneração de ${formatarMoeda(item.valor_total)} importada para a competência ${competencia}!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Barra Superior */}
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
            Remunerações por Eventos & Shows
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Controle de cachês, diárias e equipes integrados com as bandas da Marley Produções.
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
          <span>Lançar Cachê / Diária por Evento</span>
        </button>
      </div>

      {/* Tabela de Eventos */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data do Show</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Evento & Banda</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador / Músico</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Função</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tipo Remuneração</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Valor Total</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status na Folha</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {itensEvento.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum cachê ou diária cadastrada por evento.
                </td>
              </tr>
            ) : (
              itensEvento.map(item => {
                const isImportado = item.status === 'importado_folha';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatarDataBR(item.data_evento)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.evento_nome}</div>
                      {item.banda_nome && (
                        <div style={{ fontSize: '11px', color: '#38bdf8' }}>🎸 {item.banda_nome}</div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {item.colaborador_nome}
                    </td>

                    <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                      {item.funcao}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#1e293b',
                        color: '#facc15'
                      }}>
                        {item.tipo_remuneracao.toUpperCase()} ({item.quantidade}x)
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>
                      {formatarMoeda(item.valor_total)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isImportado ? '#0d3822' : '#33230b',
                        color: isImportado ? '#4ade80' : '#f59e0b'
                      }}>
                        {isImportado ? '✓ IMPORTADO NA FOLHA' : '● PENDENTE DE IMPORTAÇÃO'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isImportado ? (
                        <button
                          type="button"
                          disabled={folhaBloqueada}
                          onClick={() => handleImportar(item)}
                          title={`Importar como lançamento de provento na competência ${competencia}`}
                          style={{
                            backgroundColor: folhaBloqueada ? '#334155' : '#0284c7',
                            color: folhaBloqueada ? '#94a3b8' : '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: folhaBloqueada ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Importar na Folha
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Conferido</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Lançamento de Evento */}
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
            maxWidth: '520px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>
              Novo Cachê / Diária por Show
            </h3>

            {erro && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Nome do Show / Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Marley Reggae Sunset 2026"
                  value={eventoNome}
                  onChange={(e) => setEventoNome(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Banda Vinculada
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Marley Roots Tribute"
                    value={bandaNome}
                    onChange={(e) => setBandaNome(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Data do Show *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Colaborador / Músico *
                  </label>
                  <select
                    value={colabId}
                    onChange={(e) => setColabId(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_completo} ({c.cargo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Função no Evento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Percussionista, Roadie"
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Remuneração
                  </label>
                  <select
                    value={tipoRemuneracao}
                    onChange={(e) => setTipoRemuneracao(e.target.value as any)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="diaria">Diária</option>
                    <option value="cache">Cachê</option>
                    <option value="hora_extra">Hora Extra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={qtd}
                    onChange={(e) => setQtd(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={unitario}
                    onChange={(e) => setUnitario(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#4ade80', fontWeight: 600, border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
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
                  Gravar Remuneração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
