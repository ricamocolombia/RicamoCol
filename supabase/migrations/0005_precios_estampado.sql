-- Ricamo — tabla de precios de referencia para los tamanos de estampado.
-- Editable desde apps/admin/app/configuracion, para que el negocio pueda
-- actualizar estos costos cuando cambien sin que haya que tocar codigo.
-- El bordado sigue siendo costo manual por venta (varia por diseno), asi
-- que no tiene fila aqui.

create table print_size_prices (
  print_size text primary key
    check (print_size in ('punto_corazon', 'media_carta', 'carta', 'oficio', 'tabloide')),
  cost_cop integer,
  updated_at timestamptz not null default now()
);
create trigger print_size_prices_set_updated_at before update on print_size_prices
  for each row execute function set_updated_at();

insert into print_size_prices (print_size, cost_cop) values
  ('punto_corazon', 5000),
  ('media_carta', 7000),
  ('carta', null),
  ('oficio', null),
  ('tabloide', null);

alter table print_size_prices enable row level security;

grant select, insert, update, delete on print_size_prices to service_role;
grant select, insert, update, delete on print_size_prices to authenticated;
grant select on print_size_prices to anon;
