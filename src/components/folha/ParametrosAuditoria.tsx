import React from 'react';
import { ParametrosTributarios, LogAuditoriaFolha } from '../../types/folha';
import { formatarMoeda } from '../../utils/folhaCalculos';

interface Props {
  parametros: ParametrosTributarios;
  auditoria: LogAuditoriaFolha[];
}

export const ParametrosAuditoria: React.FC<Props> = ({
  parametros,
  auditoria
}) => {
  return (
    <div>
      {/* Seção 1: Parâmetros Tributários e Previdenciários Oficiais */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#f8fafc' }}>
              Parâmetros Fiscais & Previdenciários Versionados
            </h3>
            <span style={{ fontSize: '13px', color: '#38bdf8' }}>
              Fonte Oficial: {parametros.fonte}
            </span>
          </div>

          <div style={{
            backgroundColor: '#0d3822',
            color: '#4ade80',
            border: '1px solid #16a34a',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            VIGÊNCIA ATIVA ({parametros.competencia_vigencia_inicio} em diante)
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '16px'
        }}>
          {/* Tabela INSS */}
          <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', backgroundColor: '#131d33' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' }}>
              Tabela Progressiva INSS (Empregado CLT)
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Faixa Salarial</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Alíquota</th>
                </tr>
              </thead>
              <tbody>
                {parametros.faixas_inss.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>
                      {f.ate !== null ? `${formatarMoeda(f.de)} até ${formatarMoeda(f.ate)}` : `Acima de ${formatarMoeda(f.de)}`}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#38bdf8' }}>
                      {(f.aliquota * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tabela IRRF */}
          <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', backgroundColor: '#131d33' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' }}>
              Tabela Progressiva IRRF (Receita Federal)
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Base de Cálculo</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Alíquota</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Dedução</th>
                </tr>
              </thead>
              <tbody>
                {parametros.faixas_irrf.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>
                      {f.ate !== null ? `${formatarMoeda(f.de)} até ${formatarMoeda(f.ate)}` : `Acima de ${formatarMoeda(f.de)}`}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#facc15' }}>
                      {(f.aliquota * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#f87171' }}>
                      {f.parcela_deduzir ? formatarMoeda(f.parcela_deduzir) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Encargos Patronais & Deduções */}
          <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', backgroundColor: '#131d33' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc' }}>
              Encargos Patronais & Deduções Especiais
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>FGTS Patronal (Empresa):</span>
                <strong style={{ color: '#c084fc' }}>{(parametros.aliquota_fgts_patronal * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>INSS Patronal (Empresa):</span>
                <strong style={{ color: '#c084fc' }}>{(parametros.aliquota_inss_patronal * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Dedução IRRF por Dependente:</span>
                <strong style={{ color: '#4ade80' }}>{formatarMoeda(parametros.deducao_dependente_irrf)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Desconto Mensal Simplificado IRRF:</span>
                <strong style={{ color: '#4ade80' }}>{formatarMoeda(parametros.deducao_simplificada_irrf)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Trilha de Auditoria Completa */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc' }}>
            Trilha de Auditoria & Registro de Conformidade
          </h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Registro cronológico imutável de operações críticas, ajustes manuais, aprovações e reaberturas.
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Data / Hora</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Operação</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Tabela / Alvo</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Usuário Responsável</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Justificativa / Motivo</th>
            </tr>
          </thead>
          <tbody>
            {auditoria.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum registro de auditoria gerado até o momento.
                </td>
              </tr>
            ) : (
              auditoria.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(log.criado_em).toLocaleString('pt-BR')}
                  </td>

                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 600
                    }}>
                      {log.acao}
                    </span>
                  </td>

                  <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                    {log.tabela} ({log.registro_id.slice(0, 16)})
                  </td>

                  <td style={{ padding: '10px 16px', color: '#f8fafc', fontWeight: 500 }}>
                    {log.usuario_nome}
                  </td>

                  <td style={{ padding: '10px 16px', color: '#facc15' }}>
                    {log.justificativa || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
