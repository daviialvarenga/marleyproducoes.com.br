import assert from 'node:assert';

const store = {};
globalThis.localStorage = {
  getItem(k) { return store[k] ?? null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; }
};

const { bandasAccessStorage } = await import('../src/services/bandasAccessStorage.ts');

console.log('--- TESTES CONTROLE DE ACESSO POR BANDA ---');

// Admin vê todas
{
  assert.ok(bandasAccessStorage.isAdmin('admin'));
  assert.ok(bandasAccessStorage.getBandasAutorizadas('admin').length > 0);
  console.log('✓ Admin visualiza todas as bandas.');
}

// Produtor sem vínculo não vê nenhuma
{
  const bandas = bandasAccessStorage.getBandasAutorizadas('produtor-a');
  assert.strictEqual(bandas.length, 0, 'Produtor sem vínculo não deve ver bandas');
  console.log('✓ Produtor sem vínculo não acessa agendas.');
}

// Vincular e acessar
{
  bandasAccessStorage.vincularProdutorBanda('admin', 'produtor-a', 'banda-01');
  assert.ok(bandasAccessStorage.temAcessoBanda('produtor-a', 'banda-01'));
  assert.ok(!bandasAccessStorage.temAcessoBanda('produtor-a', 'banda-02'));
  console.log('✓ Vínculo concede acesso apenas à banda vinculada.');
}

// Autoconcessão bloqueada
{
  let threw = false;
  try { bandasAccessStorage.vincularProdutorBanda('produtor-a', 'produtor-a', 'banda-02'); } catch (e) { threw = true; }
  assert.ok(threw, 'Produtor não pode conceder a si próprio');
  console.log('✓ Autoconcessão bloqueada.');
}

// Não-admin não pode vincular
{
  let threw = false;
  try { bandasAccessStorage.vincularProdutorBanda('produtor-b', 'produtor-a', 'banda-02'); } catch (e) { threw = true; }
  assert.ok(threw, 'Não-admin não pode vincular');
  console.log('✓ Apenas admin gerencia vínculos.');
}

// Remoção revoga acesso
{
  const v = bandasAccessStorage.getVinculos().find((x) => x.user_id === 'produtor-a' && x.banda_id === 'banda-01');
  bandasAccessStorage.removerVinculo('admin', v.id);
  assert.ok(!bandasAccessStorage.temAcessoBanda('produtor-a', 'banda-01'));
  console.log('✓ Remoção de vínculo revoga acesso.');
}

// Vínculo inativo não concede acesso
{
  bandasAccessStorage.vincularProdutorBanda('admin', 'produtor-a', 'banda-01');
  const v = bandasAccessStorage.getVinculos().find((x) => x.user_id === 'produtor-a' && x.banda_id === 'banda-01');
  bandasAccessStorage.setVinculoAtivo('admin', v.id, false);
  assert.ok(!bandasAccessStorage.temAcessoBanda('produtor-a', 'banda-01'));
  console.log('✓ Vínculo inativo não concede acesso.');
}

console.log('--- TODOS OS TESTES DE CONTROLE DE ACESSO PASSARAM ---');
