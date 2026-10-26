-- ==============================================================================
-- MÓDULO DE FOLHA DE PAGAMENTO — MARLEY PRODUÇÕES
-- Migração incremental e reversível para gestão completa de colaboradores,
-- lançamentos, cálculos trabalhistas/patronais, fechamento e auditoria.
-- ==============================================================================

-- 1. Tabela de Colaboradores da Marley Produções
CREATE TABLE IF NOT EXISTS public.folha_colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(30),
    cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL DEFAULT 'Geral',
    tipo_vinculo VARCHAR(30) NOT NULL CHECK (
        tipo_vinculo IN ('clt', 'temporario', 'prestador_servico', 'freelancer', 'diarista', 'colaborador_eventual')
    ),
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
    salario_base NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (salario_base >= 0),
    forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'pix' CHECK (
        forma_pagamento IN ('pix', 'ted', 'doc', 'dinheiro', 'cheque')
    ),
    chave_pix VARCHAR(255),
    dados_bancarios JSONB,
    numero_dependentes INTEGER NOT NULL DEFAULT 0 CHECK (numero_dependentes >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (
        status IN ('ativo', 'inativo', 'afastado')
    ),
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_colaboradores_status ON public.folha_colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_folha_colaboradores_vinculo ON public.folha_colaboradores(tipo_vinculo);
CREATE INDEX IF NOT EXISTS idx_folha_colaboradores_user_id ON public.folha_colaboradores(user_id);

-- Trigger de updated_at para colaboradores
DROP TRIGGER IF EXISTS trg_folha_colaboradores_updated_at ON public.folha_colaboradores;
CREATE TRIGGER trg_folha_colaboradores_updated_at
    BEFORE UPDATE ON public.folha_colaboradores
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Histórico de Alterações Salariais
CREATE TABLE IF NOT EXISTS public.folha_historico_salarial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.folha_colaboradores(id) ON DELETE CASCADE,
    salario_base NUMERIC(12,2) NOT NULL CHECK (salario_base >= 0),
    data_vigencia DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_hist_salarial_colab ON public.folha_historico_salarial(colaborador_id, data_vigencia DESC);

-- 3. Parâmetros Tributários Oficiais Versionados (INSS, IRRF, FGTS)
CREATE TABLE IF NOT EXISTS public.folha_parametros_tributarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competencia_vigencia_inicio VARCHAR(7) NOT NULL, -- MM/AAAA
    competencia_vigencia_fim VARCHAR(7),             -- MM/AAAA ou NULL para vigente
    fonte VARCHAR(255) NOT NULL,
    faixas_inss JSONB NOT NULL,
    faixas_irrf JSONB NOT NULL,
    deducao_dependente_irrf NUMERIC(10,2) NOT NULL DEFAULT 189.59,
    deducao_simplificada_irrf NUMERIC(10,2) NOT NULL DEFAULT 564.80,
    aliquota_fgts_patronal NUMERIC(5,4) NOT NULL DEFAULT 0.0800,
    aliquota_inss_patronal NUMERIC(5,4) NOT NULL DEFAULT 0.2000,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Folhas Mensais por Competência (MM/AAAA)
CREATE TABLE IF NOT EXISTS public.folhas_mensais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competencia VARCHAR(7) NOT NULL UNIQUE, -- MM/AAAA
    status VARCHAR(20) NOT NULL DEFAULT 'em_preparacao' CHECK (
        status IN ('em_preparacao', 'em_conferencia', 'aprovada', 'fechada', 'paga')
    ),
    total_proventos NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_descontos NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_liquido NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_encargos_patronais NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_colaboradores INTEGER NOT NULL DEFAULT 0,
    pagamentos_pendentes INTEGER NOT NULL DEFAULT 0,
    snapshot_parametros JSONB,
    aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMPTZ,
    fechado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fechado_em TIMESTAMPTZ,
    justificativa_reabertura TEXT,
    reaberto_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reaberto_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folhas_mensais_comp ON public.folhas_mensais(competencia);
CREATE INDEX IF NOT EXISTS idx_folhas_mensais_status ON public.folhas_mensais(status);

DROP TRIGGER IF EXISTS trg_folhas_mensais_updated_at ON public.folhas_mensais;
CREATE TRIGGER trg_folhas_mensais_updated_at
    BEFORE UPDATE ON public.folhas_mensais
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Lançamentos Detalhados da Folha
CREATE TABLE IF NOT EXISTS public.folha_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folha_id UUID REFERENCES public.folhas_mensais(id) ON DELETE CASCADE,
    competencia VARCHAR(7) NOT NULL, -- MM/AAAA
    colaborador_id UUID NOT NULL REFERENCES public.folha_colaboradores(id) ON DELETE RESTRICT,
    categoria VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('provento', 'desconto', 'encargo_patronal')),
    quantidade NUMERIC(10,2),
    valor_unitario NUMERIC(12,2),
    valor_total NUMERIC(12,2) NOT NULL CHECK (valor_total >= 0),
    data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
    evento_id UUID,
    observacao TEXT,
    ajuste_manual BOOLEAN NOT NULL DEFAULT false,
    justificativa_ajuste TEXT,
    auditoria_usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_lancamentos_folha ON public.folha_lancamentos(folha_id);
CREATE INDEX IF NOT EXISTS idx_folha_lancamentos_colab_comp ON public.folha_lancamentos(colaborador_id, competencia);
CREATE INDEX IF NOT EXISTS idx_folha_lancamentos_natureza ON public.folha_lancamentos(natureza);

-- 6. Adiantamentos e Vales
CREATE TABLE IF NOT EXISTS public.folha_adiantamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.folha_colaboradores(id) ON DELETE RESTRICT,
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data_adiantamento DATE NOT NULL DEFAULT CURRENT_DATE,
    competencia_desconto VARCHAR(7) NOT NULL, -- MM/AAAA
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'cancelado')),
    lancamento_id UUID REFERENCES public.folha_lancamentos(id) ON DELETE SET NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_adiantamentos_colab ON public.folha_adiantamentos(colaborador_id, status);

-- 7. Pagamentos por Evento (Cachês, Diárias e Equipes)
CREATE TABLE IF NOT EXISTS public.folha_pagamentos_evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID,
    evento_nome VARCHAR(255) NOT NULL,
    banda_id UUID,
    banda_nome VARCHAR(255),
    colaborador_id UUID NOT NULL REFERENCES public.folha_colaboradores(id) ON DELETE RESTRICT,
    funcao VARCHAR(100) NOT NULL,
    tipo_remuneracao VARCHAR(20) NOT NULL CHECK (tipo_remuneracao IN ('cache', 'diaria', 'hora_extra')),
    quantidade NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total NUMERIC(12,2) NOT NULL,
    data_evento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'importado_folha', 'pago_direto')),
    lancamento_id UUID REFERENCES public.folha_lancamentos(id) ON DELETE SET NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_pag_evento_status ON public.folha_pagamentos_evento(status);
CREATE INDEX IF NOT EXISTS idx_folha_pag_evento_colab ON public.folha_pagamentos_evento(colaborador_id);

-- 8. Registros de Pagamentos Efetuados (Baixas Parciais ou Totais)
CREATE TABLE IF NOT EXISTS public.folha_pagamentos_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folha_id UUID NOT NULL REFERENCES public.folhas_mensais(id) ON DELETE CASCADE,
    colaborador_id UUID NOT NULL REFERENCES public.folha_colaboradores(id) ON DELETE RESTRICT,
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    forma_pagamento VARCHAR(20) NOT NULL CHECK (forma_pagamento IN ('pix', 'ted', 'doc', 'dinheiro', 'cheque')),
    valor_pago NUMERIC(12,2) NOT NULL CHECK (valor_pago > 0),
    saldo_remanescente NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    referencia_transacao VARCHAR(255),
    comprovante_nome VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pago' CHECK (status IN ('pendente', 'parcial', 'pago')),
    observacao TEXT,
    registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_pag_registros_folha ON public.folha_pagamentos_registros(folha_id, colaborador_id);

-- 9. Trilha de Auditoria Rigorosa
CREATE TABLE IF NOT EXISTS public.folha_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    justificativa TEXT,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folha_auditoria_criado_em ON public.folha_auditoria(criado_em DESC);

-- 10. Tabela de Permissões Granulares por Usuário
CREATE TABLE IF NOT EXISTS public.folha_permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    pode_consultar BOOLEAN NOT NULL DEFAULT true,
    pode_cadastrar BOOLEAN NOT NULL DEFAULT false,
    pode_editar BOOLEAN NOT NULL DEFAULT false,
    pode_calcular BOOLEAN NOT NULL DEFAULT false,
    pode_aprovar BOOLEAN NOT NULL DEFAULT false,
    pode_fechar BOOLEAN NOT NULL DEFAULT false,
    pode_reabrir BOOLEAN NOT NULL DEFAULT false,
    pode_pagar BOOLEAN NOT NULL DEFAULT false,
    pode_configurar BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- PROTEÇÃO E INTEGRIDADE NO BANCO VIA FUNÇÕES E TRIGGERS
-- ==============================================================================

-- Função para impedir alteração de lançamentos em folhas fechadas ou pagas
CREATE OR REPLACE FUNCTION public.check_folha_bloqueada()
RETURNS TRIGGER AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status 
    FROM public.folhas_mensais 
    WHERE id = COALESCE(NEW.folha_id, OLD.folha_id);

    IF v_status IN ('fechada', 'paga') THEN
        RAISE EXCEPTION 'Operação bloqueada: a folha de pagamento está fechada ou paga. Para realizar alterações, reabra a folha formalmente com justificativa.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloqueio_folha_fechada_lancamentos ON public.folha_lancamentos;
CREATE TRIGGER trg_bloqueio_folha_fechada_lancamentos
    BEFORE INSERT OR UPDATE OR DELETE ON public.folha_lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.check_folha_bloqueada();

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.folha_colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_historico_salarial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_parametros_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_adiantamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamentos_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamentos_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_permissoes ENABLE ROW LEVEL SECURITY;

-- Função auxiliar de checagem de permissão na folha
CREATE OR REPLACE FUNCTION public.tem_permissao_folha(p_coluna_permissao TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_permitido BOOLEAN := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN false;
    END IF;

    -- Admins têm acesso total
    IF public.is_admin(v_uid) THEN
        RETURN true;
    END IF;

    -- Checa permissão específica
    EXECUTE format('SELECT COALESCE(%I, false) FROM public.folha_permissoes WHERE user_id = $1', p_coluna_permissao)
    INTO v_permitido
    USING v_uid;

    RETURN COALESCE(v_permitido, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de RLS para Colaboradores
DROP POLICY IF EXISTS "Acesso a colaboradores para gestores e administradores" ON public.folha_colaboradores;
CREATE POLICY "Acesso a colaboradores para gestores e administradores"
    ON public.folha_colaboradores
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        public.tem_permissao_folha('pode_consultar') OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Gerenciamento de colaboradores restrito a gestores autorizados" ON public.folha_colaboradores;
CREATE POLICY "Gerenciamento de colaboradores restrito a gestores autorizados"
    ON public.folha_colaboradores
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_cadastrar'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_cadastrar'));

-- Políticas de RLS para Lançamentos (Colaborador comum só vê os seus próprios demonstrativos)
DROP POLICY IF EXISTS "Visualização de lançamentos da folha" ON public.folha_lancamentos;
CREATE POLICY "Visualização de lançamentos da folha"
    ON public.folha_lancamentos
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        public.tem_permissao_folha('pode_consultar') OR
        colaborador_id IN (SELECT id FROM public.folha_colaboradores WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Gerenciamento de lançamentos restrito" ON public.folha_lancamentos;
CREATE POLICY "Gerenciamento de lançamentos restrito"
    ON public.folha_lancamentos
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_editar'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_editar'));

-- Políticas de RLS para Folhas Mensais
DROP POLICY IF EXISTS "Visualização de folhas mensais" ON public.folhas_mensais;
CREATE POLICY "Visualização de folhas mensais"
    ON public.folhas_mensais
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_consultar'));

DROP POLICY IF EXISTS "Aprovação e fechamento de folha restrito" ON public.folhas_mensais;
CREATE POLICY "Aprovação e fechamento de folha restrito"
    ON public.folhas_mensais
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_fechar'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.tem_permissao_folha('pode_fechar'));
