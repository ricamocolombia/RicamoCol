-- Ricamo — catalogo curado: colecciones, destacados, mas vendidos.
--
-- Hoy no hay forma de curar que se ve en la web mas alla de "publicado
-- si/no": "Destacados" del home es simplemente los ultimos productos
-- publicados, no hay agrupacion por coleccion (temporada, fecha especial) ni
-- "mas vendidos". Este archivo agrega esa capa de curacion manual sobre
-- `products`, sin tocar el flujo de aprobacion de Disenos.

create table collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  -- Mismo bucket de design-images, bajo el prefijo colecciones/ en la Server
  -- Action -- no hace falta un bucket aparte para esto.
  cover_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger collections_set_updated_at before update on collections
  for each row execute function set_updated_at();

alter table collections enable row level security;
grant select, insert, update, delete on collections to service_role;
grant select, insert, update, delete on collections to authenticated;
grant select on collections to anon;

create policy "Lectura publica de colecciones activas"
  on collections for select
  to anon, authenticated
  using (is_active = true);

-- Un producto pertenece a lo sumo a una coleccion (no multi-tag) -- asi es
-- como Maria Jose piensa el catalogo: "esta camiseta ES de la coleccion de
-- amor y amistad", no una prenda con varias etiquetas.
alter table products add column collection_id uuid references collections(id);

-- "Destacados": curado a mano; si faltan para completar el cupo del home,
-- se rellena con los mas recientes (logica en apps/web, no aqui).
alter table products add column is_featured boolean not null default false;

-- "Mas vendidos": interruptor manual por ahora -- calcularlo de las ventas
-- reales requeriria exponer un conteo agregado de forma segura sin filtrar
-- datos de pedidos/clientes a la web publica (mejora futura, ver backlog).
alter table products add column is_bestseller boolean not null default false;
