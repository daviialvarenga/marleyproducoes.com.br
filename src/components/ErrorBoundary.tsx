import React, { Component, ErrorInfo, ReactNode } from 'react';
import { hasAvailableCredits, safeAutoReload, getStoredCredits } from '../utils/creditAutoReload';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  autoReloadOnCredits?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reloading: boolean;
  countdown: number;
}

/**
 * Error Boundary que previne tela em branco (White Screen of Death)
 * e recarrega a página automaticamente caso haja créditos disponíveis.
 */
export class ErrorBoundary extends Component<Props, State> {
  private timer: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    reloading: false,
    countdown: 3
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado na interface:', error, errorInfo);

    const autoReload = this.props.autoReloadOnCredits !== false;
    const creditsAvailable = hasAvailableCredits();

    // Se houver créditos disponíveis, agenda recarregamento automático
    if (autoReload && creditsAvailable) {
      this.setState({ reloading: true });
      this.startCountdownAndReload();
    }
  }

  private startCountdownAndReload() {
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          if (this.timer) clearInterval(this.timer);
          safeAutoReload(`Recuperação automática do ErrorBoundary com ${getStoredCredits()} créditos`);
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  }

  public componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  private handleManualReload = () => {
    safeAutoReload('Recarregamento manual solicitado pelo usuário');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const credits = getStoredCredits();
      const hasCredits = credits !== null && credits > 0;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            border: '1px solid #334155'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#38bdf8', marginTop: 0 }}>
              Recuperação de Página
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              {hasCredits
                ? `Identificamos que você possui créditos disponíveis (${credits}). O sistema está recarregando a página para restaurar sua visualização e evitar tela em branco.`
                : 'Aconteceu uma falha temporária de visualização. Clique no botão abaixo para recarregar.'}
            </p>

            {this.state.reloading && (
              <div style={{ marginBottom: '20px', fontSize: '13px', color: '#38bdf8', fontWeight: 500 }}>
                Recarregando automaticamente em {this.state.countdown}s...
              </div>
            )}

            <button
              onClick={this.handleManualReload}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              Recarregar Agora
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
