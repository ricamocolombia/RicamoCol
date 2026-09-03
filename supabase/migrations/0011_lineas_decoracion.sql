-- Ricamo — varias lineas de decoracion por item de venta.
--
-- Una sola prenda puede llevar mas de un estampado/bordado (ej. punto
-- corazon adelante + carta atras) -- hoy `order_items.cost_cop` es un solo
-- numero manual, sin forma de sumar varios costos. Se agrega una tabla hija
-- con el detalle de cada linea; `order_items.cost_cop` sigue existiendo pero
-- pasa a ser la SUMA de estas lineas (calculada en la Server Action, no en
-- SQL). `order_items.print_size` (el campo viejo, un solo tamaño) queda sin
-- usar para ventas nuevas -- ya no representa bien "puede haber varios".

create table order_item_decorations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  -- Null para bordado (costo manual, no tiene tamaño de referencia).
  print_size text
    check (print_size in ('punto_corazon', 'media_carta', 'carta', 'oficio', 'tabloide')),
  cost_cop integer not null,
  created_at timestamptz not null default now()
);

alter table order_item_decorations enable row level security;
grant select, insert, update, delete on order_item_decorations to service_role;
grant select, insert, update, delete on order_item_decorations to authenticated;
grant select on order_item_decorations to anon;
