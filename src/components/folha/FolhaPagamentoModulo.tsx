import React, { useState, useEffect } from 'react';
import { folhaStorage } from '../../services/folhaStorage';
import { 
  Colaborador, 
  FolhaCompetencia, 
  LancamentoFolha, 
  Adiantamento, 
  PagamentoEventoItem, 
  RegistroPagamentoFolha, 
  ParametrosTributarios, 
  LogAuditoriaFolha,
  StatusFolha
} from '../../types/folha';

import { PainelGeralCompetencia } from './PainelGeralCompetencia';
import { CadastroColaboradores } from './CadastroColaboradores';
import { LancamentosCompetencia } from './LancamentosCompetencia';
import { PagamentosEventos } from './PagamentosEventos';
import { ControleAdiantamentos } from './ControleAdiantamentos';
import { FechamentoPagamentos } from './FechamentoPagamentos';
import { RecibosHolerites } from './RecibosHolerites';
import { ParametrosAuditoria } from './ParametrosAuditoria';

type SubAba = 
  | 'painel' 
  | 'colaboradores' 
  | 'lancamentos' 
  | 'eventos' 
  | 'adiantamentos' 
  | 'fechamento' 
  | 'recibos' 
  | 'auditoria';

export const FolhaPagamentoModulo: React.FC = () => {
  const [subAbaAtiva, setSubAbaAtiva] = useState<SubAba>('painel');
  const [competenciaAtiva, setCompetenciaAtiva] = useState<string>('10/2026');

  // Estados dos dados
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [folha, setFolha] = useState<FolhaCompetencia | null>(null);
  const [folhasLista, setFolhasLista] = useState<FolhaCompetencia[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoFolha[]>([]);
  const [adiantamentos, setAdiantamentos] = useState<Adiantamento[]>([]);
  const [itensEvento, setItensEvento] = useState<PagamentoEventoItem[]>([]);
  const [registrosPagamento, setRegistrosPagamento] = useState<RegistroPagamentoFolha[]>([]);
  const [parametros, setParametros] = useState<ParametrosTributarios>(folhaStorage.getParametrosTributarios());
  const [auditoria, setAuditoria] = useState<LogAuditoriaFolha[]>([]);

  // Carrega todos os dados
  const recarregarDados = () => {
    const cols = folhaStorage.getColaboradores();
    setColaboradores(cols);

    const fList = folhaStorage.getFolhas();
    setFolhasLista(fList);

    const f = folhaStorage.getFolhaCompetencia(competenciaAtiva);
    setFolha(f);

    const l = folhaStorage.getLancamentos(competenciaAtiva);
    setLancamentos(l);

    const a = folhaStorage.getAdiantamentos();
    setAdiantamentos(a);

    const ev = folhaStorage.getPagamentosEvento();
    setItensEvento(ev);

    const reg = folhaStorage.getRegistrosPagamento(f.id);
    setRegistrosPagamento(reg);

    setParametros(folhaStorage.getParametrosTributarios());
    setAuditoria(folhaStorage.getAuditoria());
  };

  useEffect(() => {
    recarregarDados();
  }, [competenciaAtiva]);

  // Ações
  const handleMudarCompetencia = (novaComp: string) => {
    setCompetenciaAtiva(novaComp);
  };

  const handleCriarCompetencia = (novaComp: string) => {
    folhaStorage.getFolhaCompetencia(novaComp);
    setCompetenciaAtiva(novaComp);
    recarregarDados();
  };

  const handleMudarStatusFolha = (novoStatus: StatusFolha, justificativa?: string) => {
    try {
      folhaStorage.atualizarStatusFolha(competenciaAtiva, novoStatus, justificativa);
      recarregarDados();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecalcular = () => {
    folhaStorage.recalcularTotaisFolha(competenciaAtiva);
    recarregarDados();
  };

  const handleSalvarColaborador = (dados: Partial<Colaborador> & { nome_completo: string }) => {
    folhaStorage.salvarColaborador(dados);
    recarregarDados();
  };

  const handleAdicionarLancamento = (dados: Omit<LancamentoFolha, 'id' | 'criado_em'>) => {
    folhaStorage.adicionarLancamento(dados);
    recarregarDados();
  };

  const handleRemoverLancamento = (id: string, justificativa: string) => {
    folhaStorage.removerLancamento(id, justificativa);
    recarregarDados();
  };

  const handleAjustarManual = (id: string, novoValor: number, justificativa: string) => {
    folhaStorage.ajustarLancamentoManual(id, novoValor, justificativa);
    recarregarDados();
  };

  const handleAdicionarItemEvento = (dados: Omit<PagamentoEventoItem, 'id' | 'status'>) => {
    folhaStorage.adicionarPagamentoEvento(dados);
    recarregarDados();
  };

  const handleImportarParaFolha = (itemId: string, comp: string) => {
    folhaStorage.importarEventoParaFolha(itemId, comp);
    recarregarDados();
  };

  const handleCriarAdiantamento = (dados: Omit<Adiantamento, 'id' | 'criado_em' | 'status'>) => {
    folhaStorage.criarAdiantamento(dados);
    recarregarDados();
  };

  const handleCompensarAdiantamento = (adiantamentoId: string) => {
    folhaStorage.compensarAdiantamento(adiantamentoId);
    recarregarDados();
  };

  const handleRegistrarPagamento = (dados: any) => {
    folhaStorage.registrarPagamento(dados);
    recarregarDados();
  };

  const listaCompetencias = Array.from(new Set(folhasLista.map(f => f.competencia)));
  if (!listaCompetencias.includes(competenciaAtiva)) {
    listaCompetencias.push(competenciaAtiva);
  }

  const subAbasNav: { id: SubAba; label: string; icon: string }[] = [
    { id: 'painel', label: 'Painel Geral', icon: '📊' },
    { id: 'colaboradores', label: 'Colaboradores', icon: '👥' },
    { id: 'lancamentos', label: 'Lançamentos Mensais', icon: '📝' },
    { id: 'eventos', label: 'Pagamentos por Evento', icon: '🎸' },
    { id: 'adiantamentos', label: 'Adiantamentos & Vales', icon: '💳' },
    { id: 'fechamento', label: 'Fechamento & Pagamentos', icon: '🔒' },
    { id: 'recibos', label: 'Recibos & Holerites', icon: '📄' },
    { id: 'auditoria', label: 'Parâmetros & Auditoria', icon: '⚙️' }
  ];

  return (
    <div>
      {/* Cabeçalho da Folha de Pagamento */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', color: '#f8fafc' }}>
          Folha de Pagamento — Marley Produções
        </h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
          Gestão completa de remunerações, diárias de shows, cachês artísticos, encargos legais, adiantamentos e auditoria.
        </p>
      </div>

      {/* Navegação entre Sub-abas */}
      <div className="no-print" style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '8px',
        marginBottom: '24px'
      }}>
        {subAbasNav.map(item => {
          const isActive = subAbaAtiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubAbaAtiva(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Conforme Sub-Aba Ativa */}
      {folha && subAbaAtiva === 'painel' && (
        <PainelGeralCompetencia
          folha={folha}
          competencia={competenciaAtiva}
          listaCompetencias={listaCompetencias}
          aoMudarCompetencia={handleMudarCompetencia}
          aoCriarCompetencia={handleCriarCompetencia}
          aoMudarStatus={handleMudarStatusFolha}
          aoRecalcular={handleRecalcular}
        />
      )}

      {subAbaAtiva === 'colaboradores' && (
        <CadastroColaboradores
          colaboradores={colaboradores}
          aoSalvarColaborador={handleSalvarColaborador}
        />
      )}

      {folha && subAbaAtiva === 'lancamentos' && (
        <LancamentosCompetencia
          competencia={competenciaAtiva}
          statusFolha={folha.status}
          lancamentos={lancamentos}
          colaboradores={colaboradores.filter(c => c.status === 'ativo')}
          aoAdicionarLancamento={handleAdicionarLancamento}
          aoRemoverLancamento={handleRemoverLancamento}
          aoAjustarManual={handleAjustarManual}
        />
      )}

      {folha && subAbaAtiva === 'eventos' && (
        <PagamentosEventos
          competencia={competenciaAtiva}
          statusFolha={folha.status}
          itensEvento={itensEvento}
          colaboradores={colaboradores.filter(c => c.status === 'ativo')}
          aoAdicionarItemEvento={handleAdicionarItemEvento}
          aoImportarParaFolha={handleImportarParaFolha}
        />
      )}

      {folha && subAbaAtiva === 'adiantamentos' && (
        <ControleAdiantamentos
          competencia={competenciaAtiva}
          statusFolha={folha.status}
          adiantamentos={adiantamentos}
          colaboradores={colaboradores.filter(c => c.status === 'ativo')}
          aoCriarAdiantamento={handleCriarAdiantamento}
          aoCompensarAdiantamento={handleCompensarAdiantamento}
        />
      )}

      {folha && subAbaAtiva === 'fechamento' && (
        <FechamentoPagamentos
          folha={folha}
          competencia={competenciaAtiva}
          colaboradores={colaboradores}
          lancamentos={lancamentos}
          registrosPagamento={registrosPagamento}
          aoRegistrarPagamento={handleRegistrarPagamento}
        />
      )}

      {folha && subAbaAtiva === 'recibos' && (
        <RecibosHolerites
          folha={folha}
          competencia={competenciaAtiva}
          colaboradores={colaboradores.filter(c => c.status === 'ativo')}
          lancamentos={lancamentos}
          registrosPagamento={registrosPagamento}
        />
      )}

      {subAbaAtiva === 'auditoria' && (
        <ParametrosAuditoria
          parametros={parametros}
          auditoria={auditoria}
        />
      )}
    </div>
  );
};
