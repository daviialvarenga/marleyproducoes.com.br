-- ==============================================================================
-- REMOÇÃO DEFINITIVA DO MURAL DE TODO O PROJETO — MARLEY PRODUÇÕES
-- ==============================================================================

-- 1. Remoção de tabelas relacionadas a mural ou recados/avisos de mural
DROP TABLE IF EXISTS public.mural_avisos CASCADE;
DROP TABLE IF EXISTS public.mural CASCADE;
DROP TABLE IF EXISTS public.avisos_mural CASCADE;
DROP TABLE IF EXISTS public.recados_mural CASCADE;
DROP TABLE IF EXISTS public.postagens_mural CASCADE;
DROP TABLE IF EXISTS public.mensagens_mural CASCADE;

-- 2. Remoção de colunas de referência a mural em outras tabelas caso existam
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'eventos' AND column_name = 'exibir_no_mural'
    ) THEN
        ALTER TABLE public.eventos DROP COLUMN exibir_no_mural;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bandas' AND column_name = 'mural_ativo'
    ) THEN
        ALTER TABLE public.bandas DROP COLUMN mural_ativo;
    END IF;
END $$;

-- 3. Remoção de funções ou procedimentos armazenados associados ao mural
DROP FUNCTION IF EXISTS public.obter_avisos_mural CASCADE;
DROP FUNCTION IF EXISTS public.publicar_aviso_mural CASCADE;
DROP FUNCTION IF EXISTS public.handle_mural_updated_at CASCADE;
