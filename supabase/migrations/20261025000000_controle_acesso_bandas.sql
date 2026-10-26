-- ==============================================================================
-- CONTROLE DE ACESSO ÀS AGENDAS POR BANDA — MARLEY PRODUÇÕES
-- ==============================================================================

-- 1. Criação da tabela de relacionamento entre usuários/produtores e bandas
CREATE TABLE IF NOT EXISTS public.usuario_bandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    banda_id UUID NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuario_banda UNIQUE (user_id, banda_id)
);

-- Índices para otimização de consultas de permissão
CREATE INDEX IF NOT EXISTS idx_usuario_bandas_user_ativo ON public.usuario_bandas(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_usuario_bandas_banda_ativo ON public.usuario_bandas(banda_id, ativo);

-- Trigger para atualização automática de atualizado_em
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuario_bandas_updated_at ON public.usuario_bandas;
CREATE TRIGGER trg_usuario_bandas_updated_at
    BEFORE UPDATE ON public.usuario_bandas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 1b. Vínculo referencial com a tabela de bandas, quando existir (sem duplicar cadastros)
DO $$
BEGIN
    IF to_regclass('public.bandas') IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'fk_usuario_bandas_banda'
              AND conrelid = 'public.usuario_bandas'::regclass
        ) THEN
            ALTER TABLE public.usuario_bandas
                ADD CONSTRAINT fk_usuario_bandas_banda
                FOREIGN KEY (banda_id) REFERENCES public.bandas(id) ON DELETE CASCADE;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Funções auxiliares de checagem de permissão (SECURITY DEFINER para não expor privilégios)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin BOOLEAN := false;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verifica metadados de autenticação (Supabase auth.users)
    BEGIN
        SELECT EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = p_user_id
              AND (
                (u.raw_user_meta_data->>'role') IN ('admin', 'administrador') OR
                (u.raw_app_meta_data->>'role') IN ('admin', 'administrador')
              )
        ) INTO v_admin;
    EXCEPTION WHEN OTHERS THEN
        v_admin := false;
    END;

    IF v_admin THEN
        RETURN true;
    END IF;

    -- Verifica tabela de perfis, se existir (estrutura opcional), via SQL dinâmico
    IF to_regclass('public.perfis') IS NOT NULL THEN
        BEGIN
            EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = $1 AND p.role IN ($2, $3))'
                INTO v_admin
                USING p_user_id, 'admin', 'administrador';
        EXCEPTION WHEN OTHERS THEN
            v_admin := false;
        END;
    END IF;

    RETURN COALESCE(v_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.has_band_access(p_banda_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RETURN false;
    END IF;

    -- Administrador tem acesso irrestrito
    IF public.is_admin(v_uid) THEN
        RETURN true;
    END IF;

    -- Produtor só acessa se tiver vínculo ATIVO
    RETURN EXISTS (
        SELECT 1 FROM public.usuario_bandas ub
        WHERE ub.user_id = v_uid
          AND ub.banda_id = p_banda_id
          AND ub.ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. Habilitação de RLS na tabela de permissões
ALTER TABLE public.usuario_bandas ENABLE ROW LEVEL SECURITY;

-- Produtor pode visualizar apenas seus próprios vínculos ativos
DROP POLICY IF EXISTS "Produtores podem ver seus vinculos" ON public.usuario_bandas;
CREATE POLICY "Produtores podem ver seus vinculos"
    ON public.usuario_bandas
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Apenas administradores podem inserir, alterar ou remover vínculos
DROP POLICY IF EXISTS "Apenas administradores gerenciam vinculos" ON public.usuario_bandas;
CREATE POLICY "Apenas administradores gerenciam vinculos"
    ON public.usuario_bandas
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- 4. Políticas de RLS para a tabela de eventos/agendas
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'eventos') THEN
        ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Acesso a eventos por banda autorizada" ON public.eventos;
        CREATE POLICY "Acesso a eventos por banda autorizada"
            ON public.eventos
            FOR SELECT
            TO authenticated
            USING (
                public.is_admin(auth.uid()) OR
                (banda_id IS NOT NULL AND public.has_band_access(banda_id))
            );

        DROP POLICY IF EXISTS "Gerenciamento de eventos por produtores autorizados" ON public.eventos;
        CREATE POLICY "Gerenciamento de eventos por produtores autorizados"
            ON public.eventos
            FOR ALL
            TO authenticated
            USING (
                public.is_admin(auth.uid()) OR
                (banda_id IS NOT NULL AND public.has_band_access(banda_id))
            )
            WITH CHECK (
                public.is_admin(auth.uid()) OR
                (banda_id IS NOT NULL AND public.has_band_access(banda_id))
            );
    END IF;

    -- 5. Políticas de RLS para a tabela de bandas
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bandas') THEN
        ALTER TABLE public.bandas ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Visualizacao de bandas autorizadas" ON public.bandas;
        CREATE POLICY "Visualizacao de bandas autorizadas"
            ON public.bandas
            FOR SELECT
            TO authenticated
            USING (
                public.is_admin(auth.uid()) OR
                public.has_band_access(id)
            );
    END IF;
END $$;
