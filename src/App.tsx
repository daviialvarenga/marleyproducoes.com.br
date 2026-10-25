import React from 'react';
import { useAutoReloadOnCredits } from './hooks/useAutoReloadOnCredits';

export const App: React.FC = () => {
  const { credits, hasCredits, triggerReload } = useAutoReloadOnCredits();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <header style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
          Marley Produções
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.5 }}>
          Sistema de Gestão de Bandas e Eventos
        </p>

        <div style={{
          marginTop: '24px',
          padding: '16px 24px',
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          border: '1px solid #334155',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Status de Créditos:</span>
          <span style={{
            fontWeight: 600,
            fontSize: '14px',
            color: hasCredits ? '#4ade80' : '#f87171'
          }}>
            {hasCredits ? `${credits} disponíveis` : 'Sem créditos'}
          </span>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => triggerReload('solicitado pelo usuario')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Testar Recarregamento Seguro
          </button>
        </div>
      </header>
    </div>
  );
};

export default App;
