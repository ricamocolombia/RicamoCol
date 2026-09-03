-- Ricamo — seccion de Regalos: segmentos de "para quien es" (parejas,
-- familiares, amigos, etc.), administrables desde el panel (no hardcodeados
-- en el codigo), y multi-seleccionables por producto -- a diferencia de
-- `collection_id` (una sola coleccion por producto), un mismo diseño puede
-- servir de regalo para varios segmentos a la vez.

create table gift_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger gift_segments_set_updated_at before update on gift_segments
  for each row execute function set_updated_at();

alter table gift_segments enable row level security;
grant select, insert, update, delete on gift_segments to service_role;
grant select, insert, update, delete on gift_segments to authenticated;
grant select on gift_segments to anon;

create policy "Lectura publica de segmentos de regalo activos"
  on gift_segments for select
  to anon, authenticated
  using (is_active = true);

-- Relacion muchos-a-muchos: un producto puede estar en varios segmentos, un
-- segmento tiene varios productos.
create table product_gift_segments (
  product_id uuid not null references products(id) on delete cascade,
  gift_segment_id uuid not null references gift_segments(id) on delete cascade,
  primary key (product_id, gift_segment_id)
);

alter table product_gift_segments enable row level security;
grant select, insert, update, delete on product_gift_segments to service_role;
grant select, insert, update, delete on product_gift_segments to authenticated;
grant select on product_gift_segments to anon;

create policy "Lectura publica de segmentos de productos publicados"
  on product_gift_segments for select
  to anon, authenticated
  using (
    exists (
      select 1 from products
      where products.id = product_gift_segments.product_id
      and products.is_published = true
    )
  );

-- Los tres segmentos que pidio el negocio para arrancar -- se pueden
-- renombrar, desactivar o agregar mas desde el panel sin tocar codigo.
insert into gift_segments (name, slug, sort_order) values
  ('Para parejas', 'para-parejas', 1),
  ('Para familiares', 'para-familiares', 2),
  ('Para amigos', 'para-amigos', 3);
