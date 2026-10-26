import React, { useState } from 'react';
import { bandasAccessStorage } from '../services/bandasAccessStorage';
import type { UsuarioProdutor, Banda } from '../types/bandasAccess';

export const GestaoVinculosBanda: React.FC<{ usuarioAtualId: string }> = ({ usuarioAtualId }) => {
  const [produtores] = useState<UsuarioProdutor[]>(() => bandasAccessStorage.getUsuarios().filter((u) => u.role !== 'admin'));
  const [bandas] = useState<Banda[]>(() => bandasAccessStorage.getBandas());
  const [vinculos, setVinculos] = useState(() => bandasAccessStorage.getVinculos());
  const [selecionado, setSelecionado] = useState<string>(produtores[0]?.id ?? '');
  const [bandaSel, setBandaSel] = useState<string>(bandas[0]?.id ?? '');
  const [erro, setErro] = useState<string | null>(null);

  const isAdmin = bandasAccessStorage.isAdmin(usuarioAtualId);

  const recarregar = () => setVinculos(bandasAccessStorage.getVinculos());

  const handleVincular = () => {
    setErro(null);
    try {
      bandasAccessStorage.vincularProdutorBanda(usuarioAtualId, selecionado, bandaSel);
      recarregar();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao vincular.');
    }
  };

  const handleRemover = (id: string) => {
    setErro(null);
    try {
      bandasAccessStorage.removerVinculo(usuarioAtualId, id);
      recarregar();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao remover.');
    }
  };

  const handleToggle = (id: string, ativo: boolean) => {
    setErro(null);
    try {
      bandasAccessStorage.setVinculoAtivo(usuarioAtualId, id, ativo);
      recarregar();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao alterar.');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
        Apenas administradores podem gerenciar vínculos de bandas.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selecionado} onChange={(e) => setSelecionado(e.target.value)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}>
          {produtores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select value={bandaSel} onChange={(e) => setBandaSel(e.target.value)} style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}>
          {bandas.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
        <button onClick={handleVincular} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Vincular
        </button>
      </div>

      {erro && <div style={{ color: '#f87171', fontSize: '13px' }}>{erro}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
            <th style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>Produtor</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>Banda</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>Ativo</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vinculos.map((v) => {
            const prod = produtores.find((p) => p.id === v.user_id);
            const banda = bandas.find((b) => b.id === v.banda_id);
            return (
              <tr key={v.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>{prod?.nome ?? v.user_id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>{banda?.nome ?? v.banda_id}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #1e293b' }}>{v.ativo ? 'Sim' : 'Não'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleToggle(v.id, !v.ativo)} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: 'pointer', fontSize: '12px' }}>
                    {v.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => handleRemover(v.id)} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#7f1d1d', color: '#fecaca', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                    Remover
                  </button>
                </td>
              </tr>
            );
          })}
          {vinculos.length === 0 && (
            <tr><td colSpan={4} style={{ padding: '8px', color: '#94a3b8' }}>Nenhum vínculo cadastrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
