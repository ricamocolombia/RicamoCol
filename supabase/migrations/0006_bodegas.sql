-- Ricamo — bodegas (warehouses) y inventario por bodega.
--
-- El negocio guarda su stock de prendas en blanco en mas de una bodega
-- fisica (hoy: una en el proveedor de estampados, otra en el de bordados),
-- y esa cantidad puede cambiar. `warehouses` es una tabla normal con CRUD
-- propio -- nunca un numero fijo de bodegas en el codigo.

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supplier_id uuid references suppliers(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger warehouses_set_updated_at before update on warehouses
  for each row execute function set_updated_at();

alter table warehouses enable row level security;
grant select, insert, update, delete on warehouses to service_role;
grant select, insert, update, delete on warehouses to authenticated;
grant select on warehouses to anon;

-- El inventario pasa a ser por bodega: la misma prenda/talla/color en dos
-- bodegas distintas son dos filas distintas de inventory_items, cada una
-- con su propio stock y su propio nivel minimo de alerta -- asi Maria Jose
-- le hace seguimiento independiente a cada bodega.
alter table inventory_items add column warehouse_id uuid references warehouses(id);
alter table inventory_items add column alert_enabled boolean not null default true;
alter table inventory_items alter column reorder_level set default 2;

-- El tipo de prenda deja de ser una lista fija (camiseta/buzo): el negocio
-- compra en cortes variados (regular, oversize, hoodie, etc.), con el mismo
-- criterio de "lista abierta" ya decidido para Ventas el 2026-08-28.
alter table inventory_items drop constraint if exists inventory_items_garment_type_check;

-- Compras necesita el numero de factura del proveedor.
alter table purchases add column invoice_number text;

-- Configuracion general de la app (clave/valor) -- por ejemplo el correo
-- donde llegan las alertas de inventario -- sin crear una tabla nueva por
-- cada ajuste futuro.
create table app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
create trigger app_settings_set_updated_at before update on app_settings
  for each row execute function set_updated_at();

alter table app_settings enable row level security;
grant select, insert, update, delete on app_settings to service_role;
grant select, insert, update, delete on app_settings to authenticated;
grant select on app_settings to anon;

-- Arranca con las dos bodegas reales de hoy; se pueden renombrar, desactivar
-- o agregar mas desde el panel (modulo Bodegas) sin tocar codigo.
insert into warehouses (name) values ('Bodega estampados'), ('Bodega bordados');
