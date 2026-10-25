import React, { useState, useEffect } from 'react';
import { useAutoReloadOnCredits } from './hooks/useAutoReloadOnCredits';

type Tab = 'dashboard' | 'bandas' | 'agendas' | 'produtores' | 'configuracoes';

// Menu oficial de navegação do projeto (Mural removido definitivamente)
const MENU_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Painel Geral', icon: '📊' },
  { id: 'bandas', label: 'Bandas', icon: '🎸' },
  { id: 'agendas', label: 'Agendas & Shows', icon: '📅' },
  { id: 'produtores', label: 'Controle de Produtores', icon: '👥' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙️' }
];

export const App: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<Tab>('dashboard');
  const { credits, hasCredits, triggerReload } = useAutoReloadOnCredits();

  // Limpeza de qualquer referência legada de rota/hash para mural
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('mural')) {
      window.history.replaceState(null, '', window.location.pathname);
      setAbaAtiva('dashboard');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Barra de Navegação Superior / Menu Principal */}
      <header style={{
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🎵</span>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.5px' }}>
              Marley Produções
            </span>
          </div>
        </div>

        {/* Itens do Menu — sem o mural */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          {MENU_ITEMS.map((item) => {
            const isActive = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status de Créditos & Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            border: '1px solid #334155'
          }}>
            <span style={{ color: '#94a3b8' }}>Créditos:</span>
            <span style={{ color: hasCredits ? '#4ade80' : '#f87171', fontWeight: 600 }}>
              {hasCredits ? `${credits}` : '0'}
            </span>
          </div>

          <button
            onClick={() => triggerReload('manual')}
            title="Recarregar tela manualmente"
            style={{
              padding: '6px 10px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ↻
          </button>
        </div>
      </header>

      {/* Conteúdo Principal conforme aba selecionada */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {abaAtiva === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                Visão Geral
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                Acompanhe o gerenciamento das agendas, bandas vinculadas e produtores da Marley Produções.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Bandas Ativas</span>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#38bdf8', margin: '8px 0 0 0' }}>--</p>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Eventos na Agenda</span>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#4ade80', margin: '8px 0 0 0' }}>--</p>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Produtores Vinculados</span>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#facc15', margin: '8px 0 0 0' }}>--</p>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'bandas' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Bandas</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Catálogo e gerenciamento de bandas sob controle de acesso.</p>
          </div>
        )}

        {abaAtiva === 'agendas' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Agendas & Shows</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Cronograma de eventos filtrado pelas bandas autorizadas do usuário.</p>
          </div>
        )}

        {abaAtiva === 'produtores' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Controle de Produtores</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Gerenciamento de vínculos entre usuários e bandas autorizadas.</p>
          </div>
        )}

        {abaAtiva === 'configuracoes' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Configurações</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Preferências do sistema e parâmetros de permissões.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
