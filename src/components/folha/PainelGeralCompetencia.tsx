import React, { useState } from 'react';
import { FolhaCompetencia, StatusFolha } from '../../types/folha';
import { formatarMoeda } from '../../utils/folhaCalculos';

interface Props {
  folha: FolhaCompetencia;
  competencia: string;
  listaCompetencias: string[];
  aoMudarCompetencia: (novaComp: string) => void;
  aoCriarCompetencia: (novaComp: string) => void;
  aoMudarStatus: (novoStatus: StatusFolha, justificativa?: string) => void;
  aoRecalcular: () => void;
}

export const PainelGeralCompetencia: React.FC<Props> = ({
  folha,
  competencia,
  listaCompetencias,
  aoMudarCompetencia,
  aoCriarCompetencia,
  aoMudarStatus,
  aoRecalcular
}) => {
  const [modalNovaCompAberta, setModalNovaCompAberta] = useState(false);
  const [novaCompInput, setNovaCompInput] = useState('');
  const [modalReaberturaAberta, setModalReaberturaAberta] = useState(false);
  const [justificativaReabertura, setJustificativaReabertura] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const statusConfig: Record<StatusFolha, { label: string; cor: string; bg: string }> = {
    em_preparacao: { label: 'Em Preparação', cor: '#94a3b8', bg: '#1e293b' },
    em_conferencia: { label: 'Em Conferência', cor: '#facc15', bg: '#362f12' },
    aprovada: { label: 'Aprovada', cor: '#38bdf8', bg: '#0c2e4e' },
    fechada: { label: 'Fechada', cor: '#4ade80', bg: '#0d3822' },
    paga: { label: 'Paga', cor: '#a855f7', bg: '#33164d' }
  };

  const statusInfo = statusConfig[folha.status] || statusConfig.em_preparacao;

  const handleCriarCompetencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(novaCompInput)) {
      setErroMsg('Competência deve estar no formato MM/AAAA (ex: 11/2026).');
      return;
    }
    setErroMsg('');
    aoCriarCompetencia(novaCompInput);
    setNovaCompInput('');
    setModalNovaCompAberta(false);
  };

  const handleConfirmarReabertura = () => {
    if (!justificativaReabertura || justificativaReabertura.trim().length < 10) {
      setErroMsg('A justificativa de reabertura deve ter no mínimo 10 caracteres.');
      return;
    }
    setErroMsg('');
    aoMudarStatus('em_preparacao', justificativaReabertura);
    setJustificativaReabertura('');
    setModalReaberturaAberta(false);
  };

  return (
    <div>
      {/* Barra de controle superior */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backgroundColor: '#0f172a',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        marginBottom: '24px'
      }}>
        {/* Seletor de Competência */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Competência
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={competencia}
                onChange={(e) => aoMudarCompetencia(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {listaCompetencias.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setModalNovaCompAberta(true)}
                title="Criar nova competência"
                style={{
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                + Nova
              </button>
            </div>
          </div>

          {/* Badge de Status */}
          <div style={{ marginLeft: '8px' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
              Status da Folha
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: statusInfo.bg,
              color: statusInfo.cor,
              border: `1px solid ${statusInfo.cor}40`
            }}>
              ● {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Botões de Ações do Fluxo da Folha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={aoRecalcular}
            title="Recalcular totais e aplicar parâmetros vigentes"
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            <span>Recalcular</span>
          </button>

          {folha.status === 'em_preparacao' && (
            <button
              type="button"
              onClick={() => aoMudarStatus('em_conferencia')}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Avançar para Conferência →
            </button>
          )}

          {folha.status === 'em_conferencia' && (
            <button
              type="button"
              onClick={() => aoMudarStatus('aprovada')}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✓ Aprovar Folha
            </button>
          )}

          {folha.status === 'aprovada' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Confirma o FECHAMENTO da folha de pagamento? Após fechar, novos lançamentos e edições comuns serão bloqueados.')) {
                  aoMudarStatus('fechada');
                }
              }}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔒 Fechar Folha Oficial
            </button>
          )}

          {(folha.status === 'fechada' || folha.status === 'paga') && (
            <button
              type="button"
              onClick={() => setModalReaberturaAberta(true)}
              style={{
                backgroundColor: '#451a03',
                color: '#f97316',
                border: '1px solid #ea580c',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚠️ Reabrir Folha
            </button>
          )}
        </div>
      </div>

      {/* Alerta quando a folha está fechada */}
      {(folha.status === 'fechada' || folha.status === 'paga') && (
        <div style={{
          backgroundColor: '#052e16',
          border: '1px solid #16a34a',
          color: '#86efac',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <div>
            <strong>Folha Fechada e Bloqueada:</strong> Retrato oficial de valores e parâmetros tributários salvo. Alterações comuns estão bloqueadas.
            {folha.fechado_em && ` Fechamento realizado em ${new Date(folha.fechado_em).toLocaleString('pt-BR')}.`}
          </div>
        </div>
      )}

      {/* Grid de Métricas Principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Bruto (Proventos) */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Bruto (Proventos)
          </span>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', margin: '8px 0 0 0' }}>
            {formatarMoeda(folha.total_proventos)}
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Salários, diárias, cachês e adicionais</span>
        </div>

        {/* Descontos do Trabalhador */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Descontos do Trabalhador
          </span>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#f87171', margin: '8px 0 0 0' }}>
            - {formatarMoeda(folha.total_descontos)}
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>INSS, IRRF, faltas e adiantamentos</span>
        </div>

        {/* Valor Líquido a Pagar */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #0284c7', borderRadius: '10px', padding: '18px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Valor Líquido a Pagar
          </span>
          <p style={{ fontSize: '26px', fontWeight: 800, color: '#4ade80', margin: '8px 0 0 0' }}>
            {formatarMoeda(folha.total_liquido)}
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Proventos menos descontos</span>
        </div>

        {/* Encargos Patronais (Empresa) */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Encargos Patronais
          </span>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#c084fc', margin: '8px 0 0 0' }}>
            {formatarMoeda(folha.total_encargos_patronais)}
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>FGTS (8%) e INSS da empresa (não deduz do trabalhador)</span>
        </div>

        {/* Pagamentos Pendentes */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            Colaboradores Pendentes
          </span>
          <p style={{ fontSize: '24px', fontWeight: 700, color: folha.pagamentos_pendentes > 0 ? '#facc15' : '#4ade80', margin: '8px 0 0 0' }}>
            {folha.pagamentos_pendentes} / {folha.total_colaboradores}
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Com saldo líquido a pagar</span>
        </div>
      </div>

      {/* Modal Criar Nova Competência */}
      {modalNovaCompAberta && (
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
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#f8fafc' }}>
              Criar Nova Competência
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Digite o mês e ano da nova folha de pagamento no formato MM/AAAA (ex: 11/2026).
            </p>

            {erroMsg && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {erroMsg}
              </div>
            )}

            <form onSubmit={handleCriarCompetencia}>
              <input
                type="text"
                placeholder="MM/AAAA (ex: 11/2026)"
                value={novaCompInput}
                onChange={(e) => setNovaCompInput(e.target.value)}
                maxLength={7}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '15px',
                  marginBottom: '16px',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setModalNovaCompAberta(false); setErroMsg(''); }}
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
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Criar Folha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reabertura de Folha com Justificativa Obrigatória */}
      {modalReaberturaAberta && (
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
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #ea580c',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#f97316' }}>
              ⚠️ Reabrir Folha Fechada
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              A folha da competência <strong>{competencia}</strong> já foi finalizada. A reabertura cancela o bloqueio de alterações e exige justificativa auditada.
            </p>

            {erroMsg && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {erroMsg}
              </div>
            )}

            <textarea
              placeholder="Descreva detalhadamente o motivo da reabertura (mínimo 10 caracteres)..."
              value={justificativaReabertura}
              onChange={(e) => setJustificativaReabertura(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '16px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setModalReaberturaAberta(false); setErroMsg(''); }}
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
                type="button"
                onClick={handleConfirmarReabertura}
                style={{
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirmar Reabertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
