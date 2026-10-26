export type PerfilUsuarioBanda = 'admin' | 'produtor';

export interface Banda {
  id: string;
  nome: string;
}

export interface UsuarioProdutor {
  id: string;
  nome: string;
  email?: string;
  role: PerfilUsuarioBanda;
}

export interface VinculoBanda {
  id: string;
  user_id: string;
  banda_id: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}
