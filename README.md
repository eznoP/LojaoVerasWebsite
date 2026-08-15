# Lojão Veras Website · projetoLV-v2.0

Site institucional e catálogo do Lojão Veras.

- `index.html`: site público.
- `admin.html`: administração do catálogo (exige Supabase configurado).
- `js/supabase-config.js`: configuração pública do backend.
- `supabase/schema.sql`: banco, RLS e Storage do catálogo administrável.
- `ADMIN_SETUP.md`: ativação segura da área administrativa.
- `_headers`: cabeçalhos de segurança para Cloudflare Pages/Workers Static Assets.

O site funciona com o catálogo local mesmo sem Supabase. Depois da configuração, produtos ativos passam a ser carregados do banco e podem ser gerenciados pela interface administrativa.

## Versão

Atual: projetoLV-v2.2 — correção do alinhamento da área de contato.
