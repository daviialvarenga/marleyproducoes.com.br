/**
 * Sistema de Recuperação Automática e Recarregamento por Créditos
 * Marley Produções / Lovable
 *
 * Evita tela em branco (White Screen) recarregando a página automaticamente
 * quando houver créditos disponíveis ou quando uma tela branca for detectada.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY_ATTEMPTS = '__lov_credit_reload_attempts';
  var STORAGE_KEY_PREV_CREDITS = '__lov_last_known_credits';
  var MAX_RELOAD_ATTEMPTS = 3;
  var ATTEMPTS_WINDOW_MS = 30000; // 30 segundos
  var BLANK_CHECK_DELAY_MS = 1500; // 1.5s após DOM pronto

  var CREDIT_STORAGE_KEYS = [
    'credits',
    'user_credits',
    'saldo_creditos',
    'creditos',
    'userCredits',
    'balance'
  ];

  /**
   * Obtém o saldo de créditos armazenado no cliente (localStorage/sessionStorage/global)
   * @returns {number|null} Quantidade de créditos ou null se não encontrado
   */
  function getStoredCredits() {
    // 1. Variável global na janela
    if (typeof global.__APP_CREDITS__ === 'number') {
      return global.__APP_CREDITS__;
    }
    if (typeof global.__CREDITS__ === 'number') {
      return global.__CREDITS__;
    }

    // 2. Chaves comuns no localStorage
    for (var i = 0; i < CREDIT_STORAGE_KEYS.length; i++) {
      try {
        var val = localStorage.getItem(CREDIT_STORAGE_KEYS[i]);
        if (val !== null && val !== undefined && val !== '') {
          var num = parseFloat(val);
          if (!isNaN(num)) return num;
          var parsed = JSON.parse(val);
          if (typeof parsed === 'number') return parsed;
          if (parsed && typeof parsed.credits === 'number') return parsed.credits;
          if (parsed && typeof parsed.saldo === 'number') return parsed.saldo;
        }
      } catch (e) {
        // Ignora erros de parse ou acesso ao storage
      }
    }

    // 3. Chaves no sessionStorage
    for (var j = 0; j < CREDIT_STORAGE_KEYS.length; j++) {
      try {
        var sVal = sessionStorage.getItem(CREDIT_STORAGE_KEYS[j]);
        if (sVal !== null && sVal !== undefined && sVal !== '') {
          var sNum = parseFloat(sVal);
          if (!isNaN(sNum)) return sNum;
        }
      } catch (e) {
        // Ignora
      }
    }

    return null;
  }

  /**
   * Verifica se há créditos válidos (> 0)
   * @returns {boolean}
   */
  function hasCredits() {
    var c = getStoredCredits();
    return c !== null && c > 0;
  }

  /**
   * Verifica se a tela está em branco (DOM vazio ou sem conteúdo renderizado)
   * @returns {boolean}
   */
  function isScreenBlank() {
    var root = document.getElementById('root') || document.getElementById('app') || document.querySelector('[data-reactroot]');
    if (root) {
      // Se a div raiz existir, verifica se está vazia ou sem texto e sem filhos visíveis
      var hasChildren = root.children && root.children.length > 0;
      var text = (root.textContent || '').trim();
      return !hasChildren && text.length === 0;
    }

    // Se nem o root existir ou body estiver vazio
    if (document.body) {
      var bodyText = (document.body.textContent || '').trim();
      var bodyChildren = document.body.children ? document.body.children.length : 0;
      return bodyChildren <= 1 && bodyText.length === 0;
    }

    return true;
  }

  /**
   * Executa recarregamento seguro da página com proteção contra loop infinito
   * @param {string} reason Motivo do recarregamento
   * @returns {boolean} Se o reload foi disparado ou bloqueado por limite de tentativas
   */
  function safeReload(reason) {
    var now = Date.now();
    var attemptData = { count: 0, last: now };

    try {
      var raw = sessionStorage.getItem(STORAGE_KEY_ATTEMPTS);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (now - parsed.last < ATTEMPTS_WINDOW_MS) {
          attemptData = parsed;
        }
      }
    } catch (e) {
      // Ignora erro de storage
    }

    if (attemptData.count >= MAX_RELOAD_ATTEMPTS) {
      console.warn('[CreditAutoReload] Limite de tentativas de recarregamento atingido (' + MAX_RELOAD_ATTEMPTS + '). Evitando loop infinito.');
      renderRecoveryFallback('A tela não conseguiu carregar após ' + MAX_RELOAD_ATTEMPTS + ' tentativas. Seus créditos foram detectados. Clique no botão abaixo para tentar novamente.');
      return false;
    }

    attemptData.count += 1;
    attemptData.last = now;

    try {
      sessionStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attemptData));
    } catch (e) {
      // Ignora
    }

    console.info('[CreditAutoReload] Recarregando página automaticamente. Motivo: ' + (reason || 'créditos disponíveis') + ' (Tentativa ' + attemptData.count + '/' + MAX_RELOAD_ATTEMPTS + ')');
    
    // Dispara reload limpo
    if (typeof global.location !== 'undefined' && global.location.reload) {
      global.location.reload();
      return true;
    }
    return false;
  }

  /**
   * Renderiza uma tela de recuperação amigável se a tela estiver branca e o limite de reload foi atingido
   * @param {string} message Mensagem para o usuário
   */
  function renderRecoveryFallback(message) {
    if (!document.body) return;
    
    // Se já existe o aviso, não duplica
    if (document.getElementById('lov-credit-recovery-banner')) return;

    var container = document.createElement('div');
    container.id = 'lov-credit-recovery-banner';
    container.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:24px;z-index:999999;text-align:center;';
    
    var title = document.createElement('h2');
    title.style.cssText = 'font-size:20px;font-weight:600;margin-bottom:12px;color:#38bdf8;';
    title.textContent = 'Recuperação do Sistema';

    var desc = document.createElement('p');
    desc.style.cssText = 'font-size:14px;color:#94a3b8;max-width:440px;line-height:1.5;margin-bottom:20px;';
    desc.textContent = message || 'Créditos detectados. O sistema tentou recarregar para restaurar a tela.';

    var btn = document.createElement('button');
    btn.style.cssText = 'padding:10px 20px;background:#0284c7;color:#fff;border:none;border-radius:8px;font-weight:500;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(2,132,199,0.3);';
    btn.textContent = 'Recarregar Página';
    btn.onclick = function () {
      try { sessionStorage.removeItem(STORAGE_KEY_ATTEMPTS); } catch (e) {}
      global.location.reload();
    };

    container.appendChild(title);
    container.appendChild(desc);
    container.appendChild(btn);
    document.body.appendChild(container);
  }

  /**
   * Avalia a situação atual: se a tela estiver em branco e houver créditos, recarrega
   */
  function evaluateAndRecover() {
    var creditsAvailable = hasCredits();
    var blank = isScreenBlank();

    // Cenário 1: Tela em branco e há créditos disponíveis -> recarrega sozinho
    if (blank && creditsAvailable) {
      safeReload('Tela em branco detectada com créditos disponíveis (' + getStoredCredits() + ')');
      return;
    }

    // Cenário 2: Créditos acabaram de ser adicionados (transição de 0 para > 0)
    var prevCredits = null;
    try {
      var prevRaw = sessionStorage.getItem(STORAGE_KEY_PREV_CREDITS);
      if (prevRaw !== null) prevCredits = parseFloat(prevRaw);
    } catch (e) {}

    var currentCredits = getStoredCredits();
    if (currentCredits !== null) {
      try {
        sessionStorage.setItem(STORAGE_KEY_PREV_CREDITS, String(currentCredits));
      } catch (e) {}
    }

    // Se antes era 0 (ou sem créditos) e agora há créditos, e a tela está em branco ou com erro:
    if ((prevCredits === null || prevCredits <= 0) && currentCredits !== null && currentCredits > 0 && blank) {
      safeReload('Créditos recebidos e tela em branco restaurada');
    }
  }

  // 1. Watchdog pós-carregamento para detectar tela em branco
  function startWatchdog() {
    setTimeout(function () {
      evaluateAndRecover();
    }, BLANK_CHECK_DELAY_MS);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startWatchdog();
  } else {
    document.addEventListener('DOMContentLoaded', startWatchdog);
  }

  // 2. Ouvinte de eventos de armazenamento (cross-tab ou mudanças locais)
  global.addEventListener('storage', function (e) {
    if (e && e.key && CREDIT_STORAGE_KEYS.indexOf(e.key) !== -1) {
      var newVal = parseFloat(e.newValue);
      if (!isNaN(newVal) && newVal > 0) {
        if (isScreenBlank()) {
          safeReload('Atualização de créditos via storage em tela em branco');
        }
      }
    }
  });

  // 3. Evento personalizado para a aplicação avisar que créditos foram atualizados
  global.addEventListener('credits_updated', function (e) {
    var credits = e && e.detail && typeof e.detail.credits === 'number' ? e.detail.credits : getStoredCredits();
    if (credits !== null && credits > 0) {
      if (isScreenBlank()) {
        safeReload('Evento credits_updated recebido em tela em branco');
      }
    }
  });

  // 4. Captura de erros globais para evitar tela em branco silenciosa
  global.addEventListener('error', function (err) {
    // Se ocorrer erro e houver créditos, agenda verificação de tela branca
    setTimeout(function () {
      if (isScreenBlank() && hasCredits()) {
        safeReload('Erro de execução com créditos disponíveis: ' + (err && err.message ? err.message : 'desconhecido'));
      }
    }, 500);
  });

  global.addEventListener('unhandledrejection', function () {
    setTimeout(function () {
      if (isScreenBlank() && hasCredits()) {
        safeReload('Rejeição de promessa não tratada com créditos disponíveis');
      }
    }, 500);
  });

  // API Global pública
  global.CreditAutoReload = {
    hasCredits: hasCredits,
    getStoredCredits: getStoredCredits,
    setCredits: function (amount) {
      try {
        localStorage.setItem('credits', String(amount));
        sessionStorage.setItem(STORAGE_KEY_PREV_CREDITS, String(amount));
        global.dispatchEvent(new CustomEvent('credits_updated', { detail: { credits: amount } }));
      } catch (e) {}
    },
    isScreenBlank: isScreenBlank,
    safeReload: safeReload,
    evaluateAndRecover: evaluateAndRecover,
    resetAttemptCounter: function () {
      try { sessionStorage.removeItem(STORAGE_KEY_ATTEMPTS); } catch (e) {}
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
