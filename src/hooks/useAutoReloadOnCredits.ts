import { useEffect, useState, useCallback } from 'react';
import {
  getStoredCredits,
  hasAvailableCredits,
  safeAutoReload,
  checkIsScreenBlank,
  setStoredCredits
} from '../utils/creditAutoReload';

export interface UseAutoReloadOptions {
  checkIntervalMs?: number;
  reloadOnCreditsRestored?: boolean;
  enabled?: boolean;
}

/**
 * Hook do React para monitorar créditos e disparar recarregamento seguro
 * quando houver créditos ou caso uma tela em branco seja prevenida.
 */
export function useAutoReloadOnCredits({
  checkIntervalMs = 2500,
  reloadOnCreditsRestored = true,
  enabled = true
}: UseAutoReloadOptions = {}) {
  const [credits, setCreditsState] = useState<number | null>(() => getStoredCredits());
  const [hasCredits, setHasCreditsState] = useState<boolean>(() => hasAvailableCredits());

  const refreshCredits = useCallback(() => {
    const current = getStoredCredits();
    setCreditsState(current);
    setHasCreditsState(current !== null && current > 0);
    return current;
  }, []);

  const triggerReload = useCallback((reason = 'manual') => {
    return safeAutoReload(reason);
  }, []);

  const updateCredits = useCallback((amount: number) => {
    setStoredCredits(amount);
    setCreditsState(amount);
    setHasCreditsState(amount > 0);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitora transições de crédito
    let previousCredits = getStoredCredits();

    const interval = setInterval(() => {
      const current = refreshCredits();

      // Se não havia créditos e agora há, e a tela estiver em branco ou precisando restaurar
      if (
        reloadOnCreditsRestored &&
        (previousCredits === null || previousCredits <= 0) &&
        current !== null &&
        current > 0
      ) {
        if (checkIsScreenBlank()) {
          safeAutoReload('Créditos restaurados em tela em branco');
        }
      }

      previousCredits = current;
    }, checkIntervalMs);

    const onStorage = () => refreshCredits();
    const onCreditsUpdated = () => refreshCredits();

    window.addEventListener('storage', onStorage);
    window.addEventListener('credits_updated', onCreditsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('credits_updated', onCreditsUpdated);
    };
  }, [enabled, checkIntervalMs, reloadOnCreditsRestored, refreshCredits]);

  return {
    credits,
    hasCredits,
    refreshCredits,
    updateCredits,
    triggerReload
  };
}
