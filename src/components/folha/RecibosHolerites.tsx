import React, { useState } from 'react';
import { Colaborador, LancamentoFolha, FolhaCompetencia, RegistroPagamentoFolha } from '../../types/folha';
import { 
  formatarMoeda, 
  formatarCPF, 
  formatarDataBR, 
  consolidarResumoColaborador 
} from '../../utils/folhaCalculos';

interface Props {
  folha: FolhaCompetencia;
  competencia: string;
  colaboradores: Colaborador[];
  lancamentos: LancamentoFolha[];
  registrosPagamento: RegistroPagamentoFolha[];
}

export const RecibosHolerites: React.FC<Props> = ({
  folha,
  competencia,
  colaboradores,
  lancamentos,
  registrosPagamento
}) => {
  const [colabIdSelecionado, setColabIdSelecionado] = useState<string>(colaboradores[0]?.id || '');

  const colaborador = colaboradores.find(c => c.id === colabIdSelecionado) || colaboradores[0];

  const totalPago = registrosPagamento
    .filter(r => r.colaborador_id === colaborador?.id)
    .reduce((acc, cur) => acc + cur.valor_pago, 0);

  const resumo = colaborador ? consolidarResumoColaborador(colaborador, lancamentos, totalPago) : null;

  const handleImprimir = () => {
    window.print();
  };

  const exportarRelatorioCSV = () => {
    const cabecalho = 'Matricula,Colaborador,CPF,Cargo,Departamento,Vinculo,Competencia,Total Proventos,Total Descontos,Valor Liquido,Encargos Patronais,Status Pagamento\n';
    const linhas = colaboradores.map(c => {
      const p = registrosPagamento.filter(r => r.colaborador_id === c.id).reduce((acc, cur) => acc + cur.valor_pago, 0);
      const res = consolidarResumoColaborador(c, lancamentos, p);
      return `"${c.matricula}","${c.nome_completo}","${c.cpf}","${c.cargo}","${c.departamento}","${c.tipo_vinculo}","${competencia}",${res.total_proventos.toFixed(2)},${res.total_descontos.toFixed(2)},${res.valor_liquido.toFixed(2)},${res.total_encargos_patronais.toFixed(2)},"${res.status_pagamento}"`;
    }).join('\n');

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `folha_marley_producoes_${competencia.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Controles do topo (não são impressos no print) */}
      <div className="no-print" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: '#0f172a',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
            Selecionar Colaborador:
          </label>
          <select
            value={colabIdSelecionado}
            onChange={(e) => setColabIdSelecionado(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              minWidth: '280px',
              outline: 'none'
            }}
          >
            {colaboradores.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome_completo} ({c.matricula} - {c.cargo})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={exportarRelatorioCSV}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📊</span>
            <span>Exportar Folha (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleImprimir}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🖨️</span>
            <span>Imprimir / Gerar PDF</span>
          </button>
        </div>
      </div>

      {/* Nota de distinção jurídica solicitada no tópico 9 */}
      <div className="no-print" style={{
        backgroundColor: '#0c1a2e',
        border: '1px solid #1e3a5f',
        borderRadius: '8px',
        padding: '10px 16px',
        fontSize: '12px',
        color: '#93c5fd',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📄</span>
        <span>
          <strong>Diferenciação Legal:</strong> O Recibo de Folha (Holerite) é o demonstrativo oficial de apuração dos proventos, deduções e encargos do período trabalhado. O Comprovante Bancário é o documento de efetivação da transferência financeira. Ambos se complementam na prestação de contas da Marley Produções.
        </span>
      </div>

      {/* Recibo / Holerite Formatado Profissionalmente */}
      {resumo && colaborador && (
        <div id="holerite-impressao" style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          maxWidth: '850px',
          margin: '0 auto',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Cabeçalho da Empresa */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                MARLEY PRODUÇÕES ARTÍSTICAS LTDA
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                CNPJ: 12.345.678/0001-90 • Inscrição Estadual: 110.220.330.440
                <br />
                Rua dos Artistas e Sons, 420 - Pinheiros, São Paulo - SP
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.5px'
              }}>
                RECIBO DE PAGAMENTO
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                Competência: {competencia}
              </p>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Status: {folha.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Dados do Colaborador */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 140px 140px',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>CÓDIGO</span>
              <strong style={{ color: '#0f172a' }}>{colaborador.matricula}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>NOME DO COLABORADOR</span>
              <strong style={{ color: '#0f172a' }}>{colaborador.nome_completo}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>CPF (PROTEGIDO)</span>
              <strong>{formatarCPF(colaborador.cpf, true)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>ADMISSÃO</span>
              <strong>{formatarDataBR(colaborador.data_admissao)}</strong>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>CARGO / FUNÇÃO</span>
              <strong>{colaborador.cargo} ({colaborador.departamento})</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>VÍNCULO</span>
              <strong style={{ textTransform: 'uppercase' }}>{colaborador.tipo_vinculo}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>FORMA PGTO</span>
              <strong style={{ textTransform: 'uppercase' }}>{colaborador.forma_pagamento}</strong>
            </div>
          </div>

          {/* Tabela de Verbas (Proventos e Descontos) */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '50px' }}>Item</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Descrição da Verba</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px' }}>Referência</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Proventos (R$)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Descontos (R$)</th>
              </tr>
            </thead>
            <tbody>
              {/* Proventos */}
              {resumo.proventos.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 12px', color: '#64748b' }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '6px 12px', color: '#0f172a' }}>
                    {p.descricao}
                    {p.evento_nome && <span style={{ fontSize: '10px', color: '#0284c7' }}> ({p.evento_nome})</span>}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#64748b' }}>
                    {p.quantidade ? `${p.quantidade} un` : '-'}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                    {formatarMoeda(p.valor_total).replace('R$', '').trim()}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#cbd5e1' }}>-</td>
                </tr>
              ))}

              {/* Descontos */}
              {resumo.descontos.map((d, idx) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 12px', color: '#64748b' }}>{String(resumo.proventos.length + idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '6px 12px', color: '#0f172a' }}>{d.descricao}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#64748b' }}>-</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#cbd5e1' }}>-</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                    {formatarMoeda(d.valor_total).replace('R$', '').trim()}
                  </td>
                </tr>
              ))}

              {/* Linhas vazias para preencher o holerite com padrão contábil */}
              {Array.from({ length: Math.max(0, 5 - (resumo.proventos.length + resumo.descontos.length)) }).map((_, i) => (
                <tr key={'empty-' + i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '6px 12px', color: '#e2e8f0' }}>--</td>
                  <td style={{ padding: '6px 12px', color: '#e2e8f0' }}>------------------------------</td>
                  <td style={{ padding: '6px 12px', textAlign: 'center', color: '#e2e8f0' }}>-</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#e2e8f0' }}>-</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', color: '#e2e8f0' }}>-</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totais e Valor Líquido */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>TOTAL PROVENTOS</span>
              <strong style={{ fontSize: '16px', color: '#15803d' }}>{formatarMoeda(resumo.total_proventos)}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>TOTAL DESCONTOS</span>
              <strong style={{ fontSize: '16px', color: '#b91c1c' }}>{formatarMoeda(resumo.total_descontos)}</strong>
            </div>

            <div style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '6px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.9, display: 'block' }}>
                VALOR LÍQUIDO A RECEBER
              </span>
              <strong style={{ fontSize: '20px', fontWeight: 800 }}>
                {formatarMoeda(resumo.valor_liquido)}
              </strong>
            </div>
          </div>

          {/* Bases de Cálculo Legais (FGTS, INSS, IRRF) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            border: '1px solid #e2e8f0',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            marginBottom: '24px',
            backgroundColor: '#ffffff'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Salário Base</span>
              <strong>{formatarMoeda(colaborador.salario_base)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Base Cálc. INSS</span>
              <strong>{formatarMoeda(resumo.base_inss)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Base Cálc. FGTS</span>
              <strong>{formatarMoeda(resumo.base_fgts)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>FGTS do Mês (Patronal)</span>
              <strong style={{ color: '#0284c7' }}>{formatarMoeda(resumo.fgts_empresa)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Base Cálc. IRRF</span>
              <strong>{formatarMoeda(resumo.base_irrf)}</strong>
            </div>
          </div>

          {/* Termo de Quitação e Assinatura */}
          <div style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: '11px',
            color: '#475569'
          }}>
            <div style={{ maxWidth: '420px' }}>
              <p style={{ margin: '0 0 4px 0' }}>
                Reconheço haver recebido a quantia líquida discriminada neste recibo referente aos serviços prestados na competência {competencia}.
              </p>
              <span>Data: _____/_____/_________</span>
            </div>

            <div style={{ textAlign: 'center', minWidth: '240px' }}>
              <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '4px', height: '30px' }}></div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{colaborador.nome_completo}</span>
              <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Assinatura do Colaborador</span>
            </div>
          </div>
        </div>
      )}

      {/* Estilo para impressão (oculta cabeçalhos de app e navegação durante window.print()) */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header, nav, .no-print, button {
            display: none !important;
          }
          #holerite-impressao {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
