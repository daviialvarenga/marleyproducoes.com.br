-- ==============================================================================
-- AUDITORIA DE VÍNCULOS PRODUTOR x BANDA — MARLEY PRODUÇÕES
-- Reutiliza a estrutura de auditoria existente (folha_auditoria), quando disponível.
-- ==============================================================================

DO $$
BEGIN
    IF to_regclass('public.folha_auditoria') IS NOT NULL THEN
        CREATE OR REPLACE FUNCTION public.audit_usuario_bandas_change()
        RETURNS TRIGGER AS $f$
        BEGIN
            IF (TG_OP = 'INSERT') THEN
                INSERT INTO public.folha_auditoria (acao, tabela, registro_id, dados_anteriores, dados_novos, usuario_id)
                VALUES ('VINCULO_BANDA_CRIADO', 'usuario_bandas', NEW.id::text, NULL, to_jsonb(NEW), auth.uid());
                RETURN NEW;
            ELSIF (TG_OP = 'UPDATE') THEN
                INSERT INTO public.folha_auditoria (acao, tabela, registro_id, dados_anteriores, dados_novos, usuario_id)
                VALUES ('VINCULO_BANDA_ALTERADO', 'usuario_bandas', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
                RETURN NEW;
            ELSIF (TG_OP = 'DELETE') THEN
                INSERT INTO public.folha_auditoria (acao, tabela, registro_id, dados_anteriores, dados_novos, usuario_id)
                VALUES ('VINCULO_BANDA_REMOVIDO', 'usuario_bandas', OLD.id::text, to_jsonb(OLD), NULL, auth.uid());
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $f$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

        DROP TRIGGER IF EXISTS trg_audit_usuario_bandas ON public.usuario_bandas;
        CREATE TRIGGER trg_audit_usuario_bandas
            AFTER INSERT OR UPDATE OR DELETE ON public.usuario_bandas
            FOR EACH ROW
            EXECUTE FUNCTION public.audit_usuario_bandas_change();
    END IF;
END $$;
