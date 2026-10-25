-- ==============================================================================
-- CONTROLE DE CRÉDITOS E SINCRONIZAÇÃO DE SALDO — MARLEY PRODUÇÕES
-- ==============================================================================

-- 1. Criação da tabela de saldo de créditos por usuário
CREATE TABLE IF NOT EXISTS public.creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saldo INTEGER NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_creditos_usuario UNIQUE (user_id)
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_creditos_user_id ON public.creditos(user_id);

-- Trigger para atualização automática da data
DROP TRIGGER IF EXISTS trg_creditos_updated_at ON public.creditos;
CREATE TRIGGER trg_creditos_updated_at
    BEFORE UPDATE ON public.creditos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Funções auxiliares para verificação e consulta de saldo
CREATE OR REPLACE FUNCTION public.obter_saldo_creditos(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_saldo INTEGER;
BEGIN
    SELECT saldo INTO v_saldo
    FROM public.creditos
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_saldo, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.tem_creditos(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.obter_saldo_creditos(p_user_id) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Habilitação de Row Level Security (RLS)
ALTER TABLE public.creditos ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar apenas seu próprio saldo de créditos
DROP POLICY IF EXISTS "Usuarios visualizam seus proprios creditos" ON public.creditos;
CREATE POLICY "Usuarios visualizam seus proprios creditos"
    ON public.creditos
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Apenas administradores podem atualizar ou inserir créditos diretamente
DROP POLICY IF EXISTS "Administradores gerenciam creditos" ON public.creditos;
CREATE POLICY "Administradores gerenciam creditos"
    ON public.creditos
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
