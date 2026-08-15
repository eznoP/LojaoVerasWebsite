-- Lojão Veras · catálogo administrável
-- Execute no SQL Editor de um projeto Supabase dedicado ao site.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  catalog_type text not null check (catalog_type in ('lighting', 'other')),
  category text not null,
  category_label text not null,
  description text not null default '',
  detail_note text not null default '',
  image_path text,
  image_url text,
  properties jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_properties_array check (jsonb_typeof(properties) = 'array')
);

alter table public.products enable row level security;

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

drop policy if exists "products_public_active_read" on public.products;
create policy "products_public_active_read"
on public.products
for select
to anon
using (active = true);

drop policy if exists "products_authenticated_read" on public.products;
create policy "products_authenticated_read"
on public.products
for select
to authenticated
using (active = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin());

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

-- Bucket público para as fotos exibidas no catálogo. Escrita continua protegida por RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- Catálogo atual como ponto de partida. Reexecutar este arquivo não sobrescreve edições existentes.
insert into public.products
(slug, name, catalog_type, category, category_label, description, detail_note, image_url, properties, sort_order)
values
('pendente-escultural-madeira','Pendente Escultural de Madeira','lighting','pendente','Pendente','Pendente de madeira com composição escultural e presença marcante. Ideal para quem busca uma peça decorativa que também funcione como ponto de luz.','Cores, dimensões e disponibilidade devem ser confirmadas com a equipe do Lojão Veras.','./assets/produtos/pendente-escultural-madeira.webp','[]'::jsonb,10),
('pendente-organico-madeira','Pendente Orgânico de Madeira','lighting','pendente','Pendente','Modelo de madeira com linhas orgânicas e visual leve, pensado para compor ambientes acolhedores e projetos com materiais naturais.','Cores, dimensões e disponibilidade devem ser confirmadas com a equipe do Lojão Veras.','./assets/produtos/pendente-organico-madeira.webp','[]'::jsonb,20),
('arandela-lanterna-preta','Arandela Lanterna Preta','lighting','arandela','Arandela','Arandela em formato de lanterna com acabamento preto e linguagem clássica, indicada para criar pontos de iluminação decorativa em paredes.','Dimensões, acabamento e disponibilidade devem ser confirmados com a equipe do Lojão Veras.','./assets/produtos/arandela-lanterna-preta.webp','[]'::jsonb,30),
('pendente-aramado-preto','Pendente Aramado Preto','lighting','pendente','Pendente','Pendente com estrutura aramada preta e desenho contemporâneo, valorizando a lâmpada e trazendo leveza visual à composição.','Cores, dimensões e disponibilidade devem ser confirmadas com a equipe do Lojão Veras.','./assets/produtos/pendente-aramado-preto.webp','[]'::jsonb,40),
('pendente-cupula-madeira','Pendente Cúpula de Madeira','lighting','pendente','Pendente','Pendente com cúpula em madeira e desenho limpo, combinando iluminação funcional com acabamento de aspecto natural.','Cores, dimensões e disponibilidade devem ser confirmadas com a equipe do Lojão Veras.','./assets/produtos/pendente-cupula-madeira.webp','[]'::jsonb,50),
('cabos-eletricos','Cabos elétricos','other','material','Material elétrico','Opções para instalações residenciais, comerciais e diferentes necessidades de projeto.','Confirme modelos, cores, bitolas e estoque com a equipe antes da visita.',null,'[{"label":"Bitola","values":["1,5 mm²","2,5 mm²","4 mm²","Outras"]},{"label":"Cor","values":["Preto","Azul","Vermelho","Outras"]}]'::jsonb,100),
('lampadas','Lâmpadas','other','iluminacao','Iluminação','Modelos em diferentes formatos, potências e temperaturas de cor para cada ambiente.','Confirme potência, temperatura de cor, soquete e estoque com a equipe.',null,'[{"label":"Potência","values":["9W","12W","15W","Outras"]},{"label":"Luz","values":["Quente","Neutra","Fria"]}]'::jsonb,110),
('extensoes-eletricas','Extensões elétricas','other','acessorios','Acessórios','Soluções práticas para ampliar pontos de energia em diferentes usos e ambientes.','Comprimento, quantidade de tomadas, corrente suportada e estoque devem ser confirmados na loja.',null,'[{"label":"Comprimento","values":["3 m","5 m","10 m","Outros"]},{"label":"Cor","values":["Branco","Preto","Outras"]}]'::jsonb,120),
('tomadas-interruptores','Tomadas e interruptores','other','material','Material elétrico','Conjuntos, módulos e acabamentos para instalações e reformas.','Confirme padrão, amperagem, acabamento, cor e disponibilidade com a equipe.',null,'[{"label":"Configuração","values":["10A","20A","Módulos variados"]},{"label":"Cor","values":["Branco","Preto","Outras"]}]'::jsonb,130),
('plugues-adaptadores','Plugues e adaptadores','other','acessorios','Acessórios','Itens de conexão e adaptação para diferentes equipamentos e pontos elétricos.','Confirme padrão, amperagem, formato e disponibilidade antes da compra.',null,'[{"label":"Tipo","values":["10A","20A","Adaptadores variados"]},{"label":"Cor","values":["Branco","Preto","Outras"]}]'::jsonb,140),
('materiais-instalacao','Materiais de instalação','other','instalacao','Instalação','Acessórios e itens auxiliares para instalações, manutenção e pequenos reparos.','Informe o que precisa ao vendedor para receber orientação sobre modelos e disponibilidade.',null,'[{"label":"Aplicação","values":["Residencial","Comercial","Manutenção"]},{"label":"Tamanho","values":["Diversos tamanhos"]}]'::jsonb,150)
on conflict (slug) do nothing;

-- IMPORTANTE: crie o usuário administrador em Authentication > Users e só depois
-- autorize o UUID desse usuário manualmente, por exemplo:
-- insert into public.admin_users (user_id) values ('UUID-DO-USUARIO-AQUI');
