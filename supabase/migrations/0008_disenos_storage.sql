-- Ricamo — carga de imagenes para disenos (Supabase Storage + galeria).
--
-- Hoy `designs.image_url` es un campo de texto donde hay que pegar una URL
-- externa ya subida a otro lado. Se agrega un bucket de Storage y una tabla
-- `design_images` para poder subir varias imagenes reales por diseno desde
-- el panel admin. `designs.image_url` NO se toca ni se borra -- queda como
-- respaldo: si un diseno no tiene filas en `design_images` todavia, el
-- catalogo sigue usando esa URL vieja.

insert into storage.buckets (id, name, public)
values ('design-images', 'design-images', true)
on conflict (id) do nothing;

-- Lectura publica del bucket (ademas de que el bucket ya es public=true, se
-- deja explicita por el mismo criterio de "GRANT explicito" que ya se sigue
-- en el resto del proyecto desde el bug de 0002_grants.sql).
create policy "Lectura publica de imagenes de disenos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'design-images');

-- Toda escritura (subir/borrar imagenes) pasa por Server Actions del admin
-- con la service_role key, que ignora RLS -- no hace falta politica de
-- insert/update/delete para anon/authenticated.

create table design_images (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references designs(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  -- Controla que imagen se usa como miniatura en el catalogo. Se aplica en
  -- la Server Action (no hay constraint de "una sola por diseno" en SQL):
  -- al marcar una nueva portada, se desmarca la anterior.
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

alter table design_images enable row level security;
grant select, insert, update, delete on design_images to service_role;
grant select, insert, update, delete on design_images to authenticated;
grant select on design_images to anon;

-- Lectura publica solo si el diseno padre ya esta publicado al ecommerce.
create policy "Lectura publica de imagenes de disenos publicados"
  on design_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from designs
      where designs.id = design_images.design_id
      and designs.published_to_ecommerce = true
    )
  );
