import React, { useEffect } from 'react';
import { initBlankScreenWatchdog, hasAvailableCredits, safeAutoReload } from '../utils/creditAutoReload';

interface AutoReloadProps {
  checkDelayMs?: number;
  maxAttempts?: number;
  onReload?: (reason: string) => void;
}

/**
 * Componente sentinela para ser inserido na raiz da aplicação.
 * Monitora proativamente a tela e créditos, recarregando automaticamente
 * para eliminar telas em branco.
 */
export const AutoReloadOnCredits: React.FC<AutoReloadProps> = ({
  checkDelayMs = 1500,
  maxAttempts = 3,
  onReload
}) => {
  useEffect(() => {
    const cleanup = initBlankScreenWatchdog({
      blankCheckDelayMs: checkDelayMs,
      maxAttempts,
      onReload
    });

    // Se no momento da montagem houver créditos e erro pendente, verifica
    if (hasAvailableCredits()) {
      const pendingReload = sessionStorage.getItem('__lov_reload_pending');
      if (pendingReload) {
        sessionStorage.removeItem('__lov_reload_pending');
        safeAutoReload('Recarregamento agendado após restauração de créditos');
      }
    }

    return cleanup;
  }, [checkDelayMs, maxAttempts, onReload]);

  return null;
};
