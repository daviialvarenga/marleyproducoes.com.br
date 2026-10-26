import type { Banda, UsuarioProdutor, VinculoBanda } from '../types/bandasAccess.ts';

const KEY_BANDAS = 'marley_bandas';
const KEY_USUARIOS = 'marley_usuarios_produtores';
const KEY_VINCULOS = 'marley_usuario_bandas';

const seedBandas: Banda[] = [
  { id: 'banda-01', nome: 'Banda Horizonte' },
  { id: 'banda-02', nome: 'Os Noturnos' },
  { id: 'banda-03', nome: 'Trio Marley' }
];

const seedUsuarios: UsuarioProdutor[] = [
  { id: 'admin', nome: 'Administrador', email: 'admin@marleyproducoes.com.br', role: 'admin' },
  { id: 'produtor-a', nome: 'Produtor A', email: 'produtora@marleyproducoes.com.br', role: 'produtor' },
  { id: 'produtor-b', nome: 'Produtor B', email: 'produtorb@marleyproducoes.com.br', role: 'produtor' }
];

function read<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return [...seed];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...seed];
  } catch {
    return [...seed];
  }
}

function write<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const bandasAccessStorage = {
  getBandas(): Banda[] {
    return read<Banda>(KEY_BANDAS, seedBandas);
  },

  getUsuarios(): UsuarioProdutor[] {
    return read<UsuarioProdutor>(KEY_USUARIOS, seedUsuarios);
  },

  getVinculos(): VinculoBanda[] {
    return read<VinculoBanda>(KEY_VINCULOS, []);
  },

  isAdmin(userId: string): boolean {
    const u = this.getUsuarios().find((x) => x.id === userId);
    return u?.role === 'admin';
  },

  getVinculosDoUsuario(userId: string): VinculoBanda[] {
    return this.getVinculos().filter((v) => v.user_id === userId && v.ativo);
  },

  getBandasAutorizadas(userId: string): Banda[] {
    const bandas = this.getBandas();
    if (this.isAdmin(userId)) return bandas;
    const ids = new Set(this.getVinculosDoUsuario(userId).map((v) => v.banda_id));
    return bandas.filter((b) => ids.has(b.id));
  },

  temAcessoBanda(userId: string, bandaId: string): boolean {
    if (this.isAdmin(userId)) return true;
    return this.getVinculosDoUsuario(userId).some((v) => v.banda_id === bandaId);
  },

  vincularProdutorBanda(adminUserId: string, targetUserId: string, bandaId: string): void {
    if (!this.isAdmin(adminUserId)) {
      throw new Error('Apenas administradores podem vincular produtores a bandas.');
    }
    if (adminUserId === targetUserId) {
      throw new Error('Um usuário não pode conceder permissões a si próprio.');
    }
    const vinculos = this.getVinculos();
    const existente = vinculos.find((v) => v.user_id === targetUserId && v.banda_id === bandaId);
    const agora = new Date().toISOString();
    if (existente) {
      existente.ativo = true;
      existente.atualizado_em = agora;
    } else {
      vinculos.push({
        id: `vinc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user_id: targetUserId,
        banda_id: bandaId,
        ativo: true,
        criado_em: agora,
        atualizado_em: agora
      });
    }
    write(KEY_VINCULOS, vinculos);
  },

  removerVinculo(adminUserId: string, vinculoId: string): void {
    if (!this.isAdmin(adminUserId)) {
      throw new Error('Apenas administradores podem remover vínculos.');
    }
    const vinculos = this.getVinculos();
    const idx = vinculos.findIndex((v) => v.id === vinculoId);
    if (idx === -1) throw new Error('Vínculo não encontrado.');
    vinculos.splice(idx, 1);
    write(KEY_VINCULOS, vinculos);
  },

  setVinculoAtivo(adminUserId: string, vinculoId: string, ativo: boolean): void {
    if (!this.isAdmin(adminUserId)) {
      throw new Error('Apenas administradores podem alterar vínculos.');
    }
    const vinculos = this.getVinculos();
    const v = vinculos.find((x) => x.id === vinculoId);
    if (!v) throw new Error('Vínculo não encontrado.');
    v.ativo = ativo;
    v.atualizado_em = new Date().toISOString();
    write(KEY_VINCULOS, vinculos);
  }
};
