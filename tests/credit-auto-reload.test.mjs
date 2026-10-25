import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

console.log('--- Iniciando Testes de Auto-Recarregamento e Proteção contra Tela em Branco ---');

// Mock do ambiente DOM de navegador
function createMockWindow() {
  const storage = {};
  const sessionStorageStore = {};
  const listeners = {};
  let reloadCount = 0;

  const mockDocument = {
    readyState: 'complete',
    body: {
      children: [],
      textContent: '',
      appendChild(child) {
        this.children.push(child);
      }
    },
    getElementById(id) {
      if (id === 'root') {
        return mockDocument.rootElement;
      }
      return mockDocument.body.children.find(c => c.id === id) || null;
    },
    querySelector() {
      return null;
    },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        style: {},
        children: [],
        appendChild(child) { this.children.push(child); },
        setAttribute() {},
        id: ''
      };
    },
    addEventListener(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    rootElement: {
      children: [],
      textContent: ''
    }
  };

  const mockWin = {
    document: mockDocument,
    location: {
      reload() {
        reloadCount++;
      }
    },
    localStorage: {
      getItem(k) { return storage[k] ?? null; },
      setItem(k, v) { storage[k] = String(v); },
      removeItem(k) { delete storage[k]; }
    },
    sessionStorage: {
      getItem(k) { return sessionStorageStore[k] ?? null; },
      setItem(k, v) { sessionStorageStore[k] = String(v); },
      removeItem(k) { delete sessionStorageStore[k]; }
    },
    addEventListener(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(f => f !== fn);
      }
    },
    dispatchEvent(event) {
      const fns = listeners[event.type] || [];
      for (const fn of fns) fn(event);
    },
    setTimeout(fn, ms) {
      return setTimeout(fn, ms);
    },
    clearTimeout(id) {
      clearTimeout(id);
    },
    console: {
      info() {},
      warn() {},
      error() {}
    },
    getReloadCount() { return reloadCount; }
  };

  mockWin.window = mockWin;
  mockWin.globalThis = mockWin;
  return mockWin;
}

// 1. Carrega e avalia o script public/credit-auto-reload.js no contexto simulado
const scriptCode = fs.readFileSync('/workspace/public/credit-auto-reload.js', 'utf8');

// TESTE 1: Detecção de ausência de créditos
{
  const win = createMockWindow();
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  assert.strictEqual(win.CreditAutoReload.hasCredits(), false, 'Não deve ter créditos inicialmente');
  assert.strictEqual(win.CreditAutoReload.getStoredCredits(), null, 'Saldo inicial deve ser null');
  console.log('✓ Teste 1 passou: Detecção correta de estado sem créditos.');
}

// TESTE 2: Detecção de créditos via localStorage
{
  const win = createMockWindow();
  win.localStorage.setItem('credits', '15');
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  assert.strictEqual(win.CreditAutoReload.hasCredits(), true, 'Deve ter créditos quando credits=15');
  assert.strictEqual(win.CreditAutoReload.getStoredCredits(), 15, 'Saldo de créditos deve ser 15');
  console.log('✓ Teste 2 passou: Leitura de créditos do localStorage.');
}

// TESTE 3: Detecção de tela em branco
{
  const win = createMockWindow();
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  // Com root vazio
  assert.strictEqual(win.CreditAutoReload.isScreenBlank(), true, 'Tela deve ser considerada em branco com root vazio');

  // Com conteúdo no root
  win.document.rootElement.children.push({ tagName: 'DIV' });
  win.document.rootElement.textContent = 'Conteúdo do App';
  assert.strictEqual(win.CreditAutoReload.isScreenBlank(), false, 'Tela não deve ser considerada em branco com conteúdo');
  console.log('✓ Teste 3 passou: Detecção precisa de tela em branco vs tela renderizada.');
}

// TESTE 4: Recarregamento automático quando tela em branco e créditos disponíveis
{
  const win = createMockWindow();
  win.localStorage.setItem('saldo_creditos', '5');
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  // Força avaliação
  assert.strictEqual(win.CreditAutoReload.isScreenBlank(), true);
  assert.strictEqual(win.CreditAutoReload.hasCredits(), true);

  win.CreditAutoReload.evaluateAndRecover();
  assert.strictEqual(win.getReloadCount(), 1, 'Deveria ter disparado 1 recarregamento automático');
  console.log('✓ Teste 4 passou: Recarregamento automático acionado em tela em branco com créditos.');
}

// TESTE 5: Proteção contra loop infinito de recarregamento
{
  const win = createMockWindow();
  win.localStorage.setItem('credits', '10');
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  // Dispara até o limite máximo (3 tentativas)
  win.CreditAutoReload.safeReload('teste 1');
  win.CreditAutoReload.safeReload('teste 2');
  win.CreditAutoReload.safeReload('teste 3');
  assert.strictEqual(win.getReloadCount(), 3, 'Deve permitir até 3 tentativas');

  // A 4ª tentativa deve ser bloqueada
  const result4 = win.CreditAutoReload.safeReload('teste 4');
  assert.strictEqual(result4, false, 'A 4ª tentativa deve ser rejeitada pela trava anti-loop');
  assert.strictEqual(win.getReloadCount(), 3, 'Não deve incrementar reloads além do limite');
  console.log('✓ Teste 5 passou: Proteção anti-loop de recarregamentos funciona perfeitamente.');
}

// TESTE 6: Evento personalizado 'credits_updated'
{
  const win = createMockWindow();
  vm.createContext(win);
  vm.runInContext(scriptCode, win);

  // Inicialmente sem créditos e tela em branco
  assert.strictEqual(win.CreditAutoReload.isScreenBlank(), true);

  // Usuário recebe créditos e dispara evento
  win.localStorage.setItem('credits', '20');
  win.dispatchEvent({ type: 'credits_updated', detail: { credits: 20 } });

  assert.strictEqual(win.getReloadCount(), 1, 'Deve recarregar automaticamente ao receber evento credits_updated');
  console.log('✓ Teste 6 passou: Notificação de créditos via evento recarrega a página.');
}

console.log('--- TODOS OS 6 TESTES PASSARAM COM SUCESSO! ---');
