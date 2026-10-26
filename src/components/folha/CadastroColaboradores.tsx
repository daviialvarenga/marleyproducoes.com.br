import React, { useState } from 'react';
import { Colaborador, StatusColaborador, TipoVinculo, FormaPagamento } from '../../types/folha';
import { formatarMoeda, formatarCPF, formatarDataBR, validarCPF } from '../../utils/folhaCalculos';

interface Props {
  colaboradores: Colaborador[];
  aoSalvarColaborador: (dados: Partial<Colaborador> & { nome_completo: string }) => void;
}

export const CadastroColaboradores: React.FC<Props> = ({
  colaboradores,
  aoSalvarColaborador
}) => {
  const [busca, setBusca] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [cpfReveladoId, setCpfReveladoId] = useState<string | null>(null);

  // Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalHistoricoColab, setModalHistoricoColab] = useState<Colaborador | null>(null);

  // Form State
  const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formDepartamento, setFormDepartamento] = useState('Técnica & Palco');
  const [formVinculo, setFormVinculo] = useState<TipoVinculo>('clt');
  const [formDataAdmissao, setFormDataAdmissao] = useState('');
  const [formSalario, setFormSalario] = useState('0');
  const [formFormaPagamento, setFormFormaPagamento] = useState<FormaPagamento>('pix');
  const [formChavePix, setFormChavePix] = useState('');
  const [formBanco, setFormBanco] = useState('');
  const [formAgencia, setFormAgencia] = useState('');
  const [formConta, setFormConta] = useState('');
  const [formTipoConta, setFormTipoConta] = useState<'corrente' | 'poupanca'>('corrente');
  const [formDependentes, setFormDependentes] = useState('0');
  const [formStatus, setFormStatus] = useState<StatusColaborador>('ativo');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formErro, setFormErro] = useState('');

  const abrirNovo = () => {
    setColaboradorEditando(null);
    setFormNome('');
    setFormCpf('');
    setFormTelefone('');
    setFormCargo('');
    setFormDepartamento('Técnica & Palco');
    setFormVinculo('clt');
    setFormDataAdmissao(new Date().toISOString().split('T')[0]);
    setFormSalario('0');
    setFormFormaPagamento('pix');
    setFormChavePix('');
    setFormBanco('');
    setFormAgencia('');
    setFormConta('');
    setFormTipoConta('corrente');
    setFormDependentes('0');
    setFormStatus('ativo');
    setFormObservacoes('');
    setFormErro('');
    setModalFormAberto(true);
  };

  const abrirEdicao = (colab: Colaborador) => {
    setColaboradorEditando(colab);
    setFormNome(colab.nome_completo);
    setFormCpf(colab.cpf);
    setFormTelefone(colab.telefone || '');
    setFormCargo(colab.cargo);
    setFormDepartamento(colab.departamento);
    setFormVinculo(colab.tipo_vinculo);
    setFormDataAdmissao(colab.data_admissao);
    setFormSalario(String(colab.salario_base));
    setFormFormaPagamento(colab.forma_pagamento);
    setFormChavePix(colab.chave_pix || '');
    setFormBanco(colab.dados_bancarios?.banco || '');
    setFormAgencia(colab.dados_bancarios?.agencia || '');
    setFormConta(colab.dados_bancarios?.conta || '');
    setFormTipoConta(colab.dados_bancarios?.tipo_conta || 'corrente');
    setFormDependentes(String(colab.numero_dependentes || 0));
    setFormStatus(colab.status);
    setFormObservacoes(colab.observacoes || '');
    setFormErro('');
    setModalFormAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormErro('O nome completo é obrigatório.');
      return;
    }
    const cpfLimpo = formCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setFormErro('O CPF deve conter 11 dígitos numéricos.');
      return;
    }
    if (!validarCPF(cpfLimpo)) {
      setFormErro('CPF inválido. Verifique os dígitos informados.');
      return;
    }

    const salarioNum = parseFloat(formSalario.replace(',', '.')) || 0;
    if (salarioNum < 0) {
      setFormErro('O salário ou remuneração base não pode ser negativo.');
      return;
    }

    const dadosBancarios = formFormaPagamento === 'ted' || formFormaPagamento === 'doc' ? {
      banco: formBanco,
      agencia: formAgencia,
      conta: formConta,
      tipo_conta: formTipoConta
    } : undefined;

    aoSalvarColaborador({
      id: colaboradorEditando?.id,
      nome_completo: formNome.trim(),
      cpf: cpfLimpo,
      telefone: formTelefone.trim(),
      cargo: formCargo.trim() || 'Colaborador',
      departamento: formDepartamento,
      tipo_vinculo: formVinculo,
      data_admissao: formDataAdmissao,
      salario_base: salarioNum,
      forma_pagamento: formFormaPagamento,
      chave_pix: formFormaPagamento === 'pix' ? formChavePix.trim() : undefined,
      dados_bancarios: dadosBancarios,
      numero_dependentes: parseInt(formDependentes, 10) || 0,
      status: formStatus,
      observacoes: formObservacoes.trim()
    });

    setModalFormAberto(false);
  };

  const vinculoLabels: Record<TipoVinculo, { label: string; cor: string; bg: string }> = {
    clt: { label: 'CLT', cor: '#38bdf8', bg: '#0c2e4e' },
    temporario: { label: 'Temporário', cor: '#fb923c', bg: '#3d1c06' },
    prestador_servico: { label: 'Prestador (PJ)', cor: '#a855f7', bg: '#2b1045' },
    freelancer: { label: 'Freelancer', cor: '#facc15', bg: '#362f12' },
    diarista: { label: 'Diarista', cor: '#34d399', bg: '#063524' },
    colaborador_eventual: { label: 'Eventual', cor: '#94a3b8', bg: '#1e293b' }
  };

  const filtrados = colaboradores.filter(c => {
    const textoMatch = busca.trim() === '' || 
      c.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      c.cargo.toLowerCase().includes(busca.toLowerCase()) ||
      c.matricula.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpf.includes(busca.replace(/\D/g, ''));

    const vinculoMatch = filtroVinculo === 'todos' || c.tipo_vinculo === filtroVinculo;
    const statusMatch = filtroStatus === 'todos' || c.status === filtroStatus;

    return textoMatch && vinculoMatch && statusMatch;
  });

  return (
    <div>
      {/* Barra de Filtros e Busca */}
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
          <input
            type="text"
            placeholder="Buscar por nome, cargo, matrícula ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              minWidth: '240px',
              outline: 'none',
              flex: 1
            }}
          />

          <select
            value={filtroVinculo}
            onChange={(e) => setFiltroVinculo(e.target.value)}
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
            <option value="todos">Todos os Vínculos</option>
            <option value="clt">CLT</option>
            <option value="temporario">Temporário</option>
            <option value="prestador_servico">Prestador (PJ)</option>
            <option value="freelancer">Freelancer</option>
            <option value="diarista">Diarista</option>
            <option value="colaborador_eventual">Colaborador Eventual</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
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
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="afastado">Afastado</option>
            <option value="inativo">Inativo</option>
          </select>
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
          <span>Novo Colaborador</span>
        </button>
      </div>

      {/* Aviso legal sobre tipos de vínculo */}
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
        <span>ℹ️</span>
        <span>
          <strong>Nota de conformidade:</strong> A categoria cadastrada organiza o fluxo operacional e não presume determinação jurídica exclusiva do vínculo contratual.
        </span>
      </div>

      {/* Tabela de Colaboradores */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#131d33', color: '#94a3b8' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Matrícula</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Colaborador</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>CPF Protegido</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Cargo / Depto</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Vínculo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Salário / Contrato</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pagamento</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum colaborador encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtrados.map((c) => {
                const vinculoInfo = vinculoLabels[c.tipo_vinculo] || vinculoLabels.colaborador_eventual;
                const isCpfRevelado = cpfReveladoId === c.id;

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38bdf8' }}>
                      {c.matricula}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{c.nome_completo}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Admissão: {formatarDataBR(c.data_admissao)} {c.telefone && `• ${c.telefone}`}
                      </div>
                    </td>

                    {/* CPF Protegido com controle de privacidade */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', color: isCpfRevelado ? '#f8fafc' : '#94a3b8' }}>
                          {formatarCPF(c.cpf, !isCpfRevelado)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCpfReveladoId(isCpfRevelado ? null : c.id)}
                          title={isCpfRevelado ? 'Ocultar CPF' : 'Visualizar CPF completo'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px',
                            color: '#38bdf8'
                          }}
                        >
                          {isCpfRevelado ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#f8fafc' }}>{c.cargo}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.departamento}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: vinculoInfo.bg,
                        color: vinculoInfo.cor
                      }}>
                        {vinculoInfo.label}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600, color: c.salario_base > 0 ? '#4ade80' : '#94a3b8' }}>
                      {c.salario_base > 0 ? formatarMoeda(c.salario_base) : 'Por evento/diária'}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                        {c.forma_pagamento}
                      </span>
                      {c.chave_pix && (
                        <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.chave_pix}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: c.status === 'ativo' ? '#0d3822' : '#331616',
                        color: c.status === 'ativo' ? '#4ade80' : '#f87171'
                      }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setModalHistoricoColab(c)}
                          title="Histórico de alterações salariais"
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#facc15',
                            border: '1px solid #334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Histórico
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEdicao(c)}
                          title="Editar colaborador"
                          style={{
                            backgroundColor: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid #334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Editar
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

      {/* Modal Cadastro/Edição de Colaborador */}
      {modalFormAberto && (
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
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>
              {colaboradorEditando ? `Editar Colaborador (${colaboradorEditando.matricula})` : 'Novo Colaborador'}
            </h3>

            {formErro && (
              <div style={{ backgroundColor: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {formErro}
              </div>
            )}

            <form onSubmit={handleSalvar}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    CPF (11 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    maxLength={14}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="ex: Roadie, Músico, Técnico PA"
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Departamento
                  </label>
                  <select
                    value={formDepartamento}
                    onChange={(e) => setFormDepartamento(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="Técnica & Palco">Técnica & Palco</option>
                    <option value="Produção">Produção</option>
                    <option value="Artístico">Artístico</option>
                    <option value="Logística">Logística</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Tipo de Vínculo
                  </label>
                  <select
                    value={formVinculo}
                    onChange={(e) => setFormVinculo(e.target.value as TipoVinculo)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="clt">CLT (Consolidação das Leis do Trabalho)</option>
                    <option value="temporario">Temporário</option>
                    <option value="prestador_servico">Prestador de Serviço (PJ)</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="diarista">Diarista</option>
                    <option value="colaborador_eventual">Colaborador Eventual</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Salário-Base / Valor Contratado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formSalario}
                    onChange={(e) => setFormSalario(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Deixe 0 se remunerado apenas por evento/diária</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Data de Admissão / Início
                  </label>
                  <input
                    type="date"
                    value={formDataAdmissao}
                    onChange={(e) => setFormDataAdmissao(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Nº Dependentes (para deduções IRRF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formDependentes}
                    onChange={(e) => setFormDependentes(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Status Cadastral
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusColaborador)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="afastado">Afastado</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Forma de Pagamento
                  </label>
                  <select
                    value={formFormaPagamento}
                    onChange={(e) => setFormFormaPagamento(e.target.value as FormaPagamento)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                  >
                    <option value="pix">PIX</option>
                    <option value="ted">Transferência Bancária (TED)</option>
                    <option value="doc">Transferência Bancária (DOC)</option>
                    <option value="dinheiro">Dinheiro Espécie</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {formFormaPagamento === 'pix' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      placeholder="CPF, CNPJ, e-mail, telefone ou aleatória"
                      value={formChavePix}
                      onChange={(e) => setFormChavePix(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px' }}
                    />
                  </div>
                )}
              </div>

              {/* Campos bancários se TED ou DOC */}
              {(formFormaPagamento === 'ted' || formFormaPagamento === 'doc') && (
                <div style={{
                  backgroundColor: '#131d33',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Banco</label>
                    <input
                      type="text"
                      placeholder="ex: Itaú (341)"
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Agência</label>
                    <input
                      type="text"
                      placeholder="ex: 0450"
                      value={formAgencia}
                      onChange={(e) => setFormAgencia(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Conta com Dígito</label>
                    <input
                      type="text"
                      placeholder="ex: 12345-6"
                      value={formConta}
                      onChange={(e) => setFormConta(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Tipo de Conta</label>
                    <select
                      value={formTipoConta}
                      onChange={(e) => setFormTipoConta(e.target.value as 'corrente' | 'poupanca')}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px' }}
                    >
                      <option value="corrente">Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Observações / Detalhes Contratuais
                </label>
                <textarea
                  rows={2}
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre escala, contrato ou qualificações..."
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setModalFormAberto(false)}
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
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico Salarial */}
      {modalHistoricoColab && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>
                  Histórico Salarial
                </h3>
                <span style={{ fontSize: '13px', color: '#38bdf8' }}>
                  {modalHistoricoColab.nome_completo} ({modalHistoricoColab.matricula})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalHistoricoColab(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {(!modalHistoricoColab.historico_salarial || modalHistoricoColab.historico_salarial.length === 0) ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Nenhum histórico salarial registrado ainda.
              </p>
            ) : (
              <div style={{ border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 12px' }}>Vigência</th>
                      <th style={{ padding: '8px 12px' }}>Salário Base</th>
                      <th style={{ padding: '8px 12px' }}>Motivo / Justificativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalHistoricoColab.historico_salarial.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', color: '#f8fafc' }}>
                          {formatarDataBR(h.data_vigencia)}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#4ade80' }}>
                          {formatarMoeda(h.salario_base)}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                          {h.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setModalHistoricoColab(null)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
