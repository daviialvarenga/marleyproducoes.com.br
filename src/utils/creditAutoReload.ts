/**
 * Utilitário de Auto-Recarregamento e Detecção de Tela em Branco por Créditos
 * Marley Produções / Lovable
 */

export interface CreditReloadOptions {
  maxAttempts?: number;
  attemptsWindowMs?: number;
  blankCheckDelayMs?: number;
  storageKeys?: string[];
  onReload?: (reason: string) => void;
}

const DEFAULT_STORAGE_KEYS = [
  'credits',
  'user_credits',
  'saldo_creditos',
  'creditos',
  'userCredits',
  'balance'
];

const STORAGE_KEY_ATTEMPTS = '__lov_credit_reload_attempts';
const STORAGE_KEY_PREV_CREDITS = '__lov_last_known_credits';

/**
 * Obtém o valor atual de créditos disponíveis no cliente
 */
export function getStoredCredits(customKeys = DEFAULT_STORAGE_KEYS): number | null {
  if (typeof window === 'undefined') return null;

  // 1. Variáveis globais
  const win = window as unknown as Record<string, unknown>;
  if (typeof win.__APP_CREDITS__ === 'number') return win.__APP_CREDITS__;
  if (typeof win.__CREDITS__ === 'number') return win.__CREDITS__;

  // 2. LocalStorage
  for (const key of customKeys) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null && val !== undefined && val !== '') {
        const num = parseFloat(val);
        if (!isNaN(num)) return num;
        const parsed = JSON.parse(val);
        if (typeof parsed === 'number') return parsed;
        if (parsed && typeof parsed.credits === 'number') return parsed.credits;
        if (parsed && typeof parsed.saldo === 'number') return parsed.saldo;
      }
    } catch {
      // Ignora erro
    }
  }

  // 3. SessionStorage
  for (const key of customKeys) {
    try {
      const sVal = sessionStorage.getItem(key);
      if (sVal !== null && sVal !== undefined && sVal !== '') {
        const sNum = parseFloat(sVal);
        if (!isNaN(sNum)) return sNum;
      }
    } catch {
      // Ignora erro
    }
  }

  return null;
}

/**
 * Verifica se o usuário tem créditos disponíveis (> 0)
 */
export function hasAvailableCredits(customKeys = DEFAULT_STORAGE_KEYS): boolean {
  const credits = getStoredCredits(customKeys);
  return credits !== null && credits > 0;
}

/**
 * Atualiza e notifica alteração no saldo de créditos
 */
export function setStoredCredits(amount: number, primaryKey = 'credits'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(primaryKey, String(amount));
    sessionStorage.setItem(STORAGE_KEY_PREV_CREDITS, String(amount));
    window.dispatchEvent(new CustomEvent('credits_updated', { detail: { credits: amount } }));
  } catch {
    // Ignora erro de storage
  }
}

/**
 * Checa se a tela está em branco (DOM vazio ou sem nós renderizados no root)
 */
export function checkIsScreenBlank(): boolean {
  if (typeof document === 'undefined') return false;

  const root = document.getElementById('root') || document.getElementById('app') || document.querySelector('[data-reactroot]');
  if (root) {
    const hasChildren = root.children && root.children.length > 0;
    const text = (root.textContent || '').trim();
    return !hasChildren && text.length === 0;
  }

  if (document.body) {
    const bodyText = (document.body.textContent || '').trim();
    const bodyChildren = document.body.children ? document.body.children.length : 0;
    return bodyChildren <= 1 && bodyText.length === 0;
  }

  return true;
}

/**
 * Executa o recarregamento com prevenção de loop infinito
 */
export function safeAutoReload(reason = 'créditos disponíveis', options?: CreditReloadOptions): boolean {
  if (typeof window === 'undefined' || !window.location) return false;

  const maxAttempts = options?.maxAttempts ?? 3;
  const attemptsWindowMs = options?.attemptsWindowMs ?? 30000;
  const now = Date.now();

  let attemptData = { count: 0, last: now };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (now - parsed.last < attemptsWindowMs) {
        attemptData = parsed;
      }
    }
  } catch {
    // Ignora
  }

  if (attemptData.count >= maxAttempts) {
    console.warn(`[CreditAutoReload] Limite de tentativas atingido (${maxAttempts}). Evitando recarregamento infinito.`);
    return false;
  }

  attemptData.count += 1;
  attemptData.last = now;

  try {
    sessionStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attemptData));
  } catch {
    // Ignora
  }

  if (options?.onReload) {
    options.onReload(reason);
  }

  console.info(`[CreditAutoReload] Recarregando página. Motivo: ${reason} (Tentativa ${attemptData.count}/${maxAttempts})`);
  window.location.reload();
  return true;
}

/**
 * Inicializa o observador de tela em branco com créditos
 */
export function initBlankScreenWatchdog(options?: CreditReloadOptions): () => void {
  if (typeof window === 'undefined') return () => {};

  const delay = options?.blankCheckDelayMs ?? 1500;

  const check = () => {
    if (checkIsScreenBlank() && hasAvailableCredits(options?.storageKeys)) {
      safeAutoReload('Tela em branco com créditos disponíveis', options);
    }
  };

  const timer = setTimeout(check, delay);

  const storageHandler = (e: StorageEvent) => {
    const keys = options?.storageKeys ?? DEFAULT_STORAGE_KEYS;
    if (e.key && keys.includes(e.key)) {
      const val = parseFloat(e.newValue || '0');
      if (!isNaN(val) && val > 0 && checkIsScreenBlank()) {
        safeAutoReload('Créditos recebidos via storage com tela em branco', options);
      }
    }
  };

  const customHandler = (e: Event) => {
    const customEvt = e as CustomEvent<{ credits?: number }>;
    const credits = customEvt.detail?.credits ?? getStoredCredits(options?.storageKeys);
    if (credits !== null && credits > 0 && checkIsScreenBlank()) {
      safeAutoReload('Evento de créditos atualizados com tela em branco', options);
    }
  };

  window.addEventListener('storage', storageHandler);
  window.addEventListener('credits_updated', customHandler);

  return () => {
    clearTimeout(timer);
    window.removeEventListener('storage', storageHandler);
    window.removeEventListener('credits_updated', customHandler);
  };
}
