-- Ricamo — esquema inicial
-- Cubre: catalogo/ecommerce, banco de disenos, ventas, compras, inventario,
-- cuentas por cobrar/pagar, bancos, proveedores y domiciliarios.
-- Este archivo es un punto de partida: revisar y ajustar antes de usar en produccion.

create extension if not exists pgcrypto;

-- Funcion generica para mantener updated_at al dia
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- Clientes
-- =========================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  instagram_handle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_set_updated_at before update on customers
  for each row execute function set_updated_at();

-- =========================================================
-- Proveedores (maquiladoras que estampan/bordan, y proveedores de prendas)
-- =========================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('maquiladora', 'prendas', 'insumos', 'otro')),
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger suppliers_set_updated_at before update on suppliers
  for each row execute function set_updated_at();

-- =========================================================
-- Disenos (banco de disenos de Maria Jose)
-- =========================================================
create table designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  technique text not null check (technique in ('bordado', 'estampado')),
  status text not null default 'borrador'
    check (status in ('borrador', 'enviado_aprobacion', 'aprobado', 'enviado_maquiladora', 'archivado')),
  customer_id uuid references customers(id),
  image_url text,
  notes text,
  published_to_ecommerce boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger designs_set_updated_at before update on designs
  for each row execute function set_updated_at();

-- Solicitudes de diseno personalizado enviadas desde la web (previas a WhatsApp)
create table design_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  garment_type text not null check (garment_type in ('camiseta', 'buzo')),
  technique text not null check (technique in ('bordado', 'estampado')),
  size text,
  quantity integer not null default 1,
  reference_notes text,
  reference_image_url text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado_whatsapp', 'convertido_en_venta', 'descartado')),
  design_id uuid references designs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger design_requests_set_updated_at before update on design_requests
  for each row execute function set_updated_at();

-- =========================================================
-- Catalogo (productos de stock, no personalizados)
-- =========================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id),
  name text not null,
  slug text not null unique,
  description text,
  garment_type text not null check (garment_type in ('camiseta', 'buzo')),
  technique text not null check (technique in ('bordado', 'estampado')),
  base_price_cop integer not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,
  color text,
  sku text unique,
  price_cop integer not null,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger product_variants_set_updated_at before update on product_variants
  for each row execute function set_updated_at();

-- =========================================================
-- Inventario de prendas en blanco (insumo para estampar/bordar)
-- =========================================================
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  garment_type text not null check (garment_type in ('camiseta', 'buzo')),
  size text,
  color text,
  supplier_id uuid references suppliers(id),
  quantity_on_hand integer not null default 0,
  reorder_level integer not null default 0,
  unit_cost_cop integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger inventory_items_set_updated_at before update on inventory_items
  for each row execute function set_updated_at();

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items(id),
  movement_type text not null check (movement_type in ('entrada_compra', 'salida_produccion', 'ajuste')),
  quantity integer not null,
  reference_purchase_id uuid,
  reference_order_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Bancos y movimientos de dinero (ingresos / salidas)
-- =========================================================
create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank_name text,
  account_type text check (account_type in ('ahorros', 'corriente', 'billetera_digital', 'efectivo')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bank_accounts_set_updated_at before update on bank_accounts
  for each row execute function set_updated_at();

create table transactions (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references bank_accounts(id),
  type text not null check (type in ('ingreso', 'salida')),
  category text not null,
  amount_cop integer not null,
  description text,
  reference_order_id uuid,
  reference_purchase_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- =========================================================
-- Domiciliarios / transportadoras
-- =========================================================
create table couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger couriers_set_updated_at before update on couriers
  for each row execute function set_updated_at();

-- =========================================================
-- Ventas (orders)
-- =========================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  source text not null check (source in ('web_catalogo', 'web_personalizado', 'whatsapp', 'manual')),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmado', 'en_produccion', 'enviado', 'entregado', 'cancelado')),
  design_id uuid references designs(id),
  total_cop integer not null default 0,
  payment_status text not null default 'pendiente'
    check (payment_status in ('pendiente', 'anticipo_pagado', 'pagado', 'reembolsado')),
  payment_method text,
  courier_id uuid references couriers(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid references product_variants(id),
  design_id uuid references designs(id),
  description text,
  quantity integer not null default 1,
  unit_price_cop integer not null,
  created_at timestamptz not null default now()
);

-- Deliveries (un pedido puede tener uno o mas envios)
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  courier_id uuid references couriers(id),
  address text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_camino', 'entregado', 'fallido')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger deliveries_set_updated_at before update on deliveries
  for each row execute function set_updated_at();

-- =========================================================
-- Compras a proveedores
-- =========================================================
create table purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'recibida', 'cancelada')),
  total_cop integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger purchases_set_updated_at before update on purchases
  for each row execute function set_updated_at();

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id),
  description text,
  quantity integer not null default 1,
  unit_cost_cop integer not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Cuentas por cobrar / pagar
-- =========================================================
create table accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  order_id uuid references orders(id),
  amount_cop integer not null,
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'vencido', 'anulado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger accounts_receivable_set_updated_at before update on accounts_receivable
  for each row execute function set_updated_at();

create table accounts_payable (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id),
  purchase_id uuid references purchases(id),
  amount_cop integer not null,
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagado', 'vencido', 'anulado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger accounts_payable_set_updated_at before update on accounts_payable
  for each row execute function set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
-- Por defecto: todo bloqueado para 'anon' y 'authenticated'. El backend de
-- ambas apps opera con la service_role key (bypassa RLS) desde Server
-- Actions / route handlers. Solo se exponen lecturas publicas explicitas
-- para el catalogo y los disenos publicados, que es lo que consume el
-- ecommerce de cara al cliente.

alter table customers enable row level security;
alter table suppliers enable row level security;
alter table designs enable row level security;
alter table design_requests enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table inventory_items enable row level security;
alter table inventory_movements enable row level security;
alter table bank_accounts enable row level security;
alter table transactions enable row level security;
alter table couriers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table deliveries enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table accounts_receivable enable row level security;
alter table accounts_payable enable row level security;

create policy "Lectura publica de productos publicados"
  on products for select
  to anon, authenticated
  using (is_published = true);

create policy "Lectura publica de variantes de productos publicados"
  on product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
      and products.is_published = true
    )
  );

create policy "Lectura publica de disenos publicados"
  on designs for select
  to anon, authenticated
  using (published_to_ecommerce = true);
