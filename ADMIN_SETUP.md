# Administração do catálogo — configuração

A versão 2.0 já contém a interface administrativa, conversão de imagens para WebP, cadastro/edição/exclusão de produtos e propriedades dinâmicas. Ela fica **desativada até o Supabase ser configurado**, para evitar qualquer senha ou chave privilegiada no front-end.

## 1. Use um projeto Supabase dedicado ao site

No SQL Editor, execute `supabase/schema.sql`. Esse arquivo cria `products`, `admin_users`, o bucket `product-images`, políticas RLS e os produtos atuais como dados iniciais.

## 2. Crie o administrador

Em **Authentication > Users**, crie o usuário que terá acesso. Copie o UUID e execute no SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('UUID-DO-USUARIO-AQUI');
```

Não existe cadastro público de administradores no site. Novos administradores só devem ser autorizados pelo painel/SQL do Supabase.

## 3. Configure o site

No Supabase, copie apenas:

- Project URL
- Publishable key (`sb_publishable_...`)

Preencha `js/supabase-config.js`:

```js
window.LV_SUPABASE_CONFIG = Object.freeze({
  url: 'https://SEU-PROJETO.supabase.co',
  publishableKey: 'sb_publishable_...'
});
```

**Nunca coloque `service_role`, secret key ou senha do banco nesse arquivo.** A publishable key pode aparecer no navegador porque as permissões reais são impostas por RLS.

## 4. Publicação

Faça commit/push normalmente. A página pública continua funcionando com o catálogo local caso o Supabase fique indisponível. Quando configurado, ela busca os produtos ativos do banco. Administradores autenticados veem um botão flutuante “Administrar catálogo”. A página `admin.html` também pode ser acessada diretamente, mas nenhuma alteração é autorizada sem sessão válida + registro em `admin_users`.

## 5. Imagens

O editor aceita JPG, PNG e WebP. Antes do upload, o navegador reduz a maior dimensão para até 1800 px e gera WebP com qualidade aproximada de 86%. O bucket só aceita WebP e a escrita é restrita aos administradores por RLS.
