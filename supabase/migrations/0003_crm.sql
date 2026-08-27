-- Ricamo — modulo de clientes / CRM basico.
--
-- Agrega la ciudad del cliente (necesaria para las metricas de "ciudades
-- con mayor venta" del dashboard) y una tabla de campanas de marketing por
-- email (usa Resend, ya en el stack). No hay integracion de WhatsApp Business
-- API todavia -- el envio de campanas por WhatsApp sigue siendo manual.

alter table customers add column city text;

create table marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  segment text not null default 'todos'
    check (segment in ('todos', 'nuevos', 'recurrentes', 'inactivos')),
  status text not null default 'borrador'
    check (status in ('borrador', 'enviada', 'fallida')),
  recipients_count integer,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger marketing_campaigns_set_updated_at before update on marketing_campaigns
  for each row execute function set_updated_at();

alter table marketing_campaigns enable row level security;

-- Mismo patron que 0002_grants.sql: GRANT explicito ademas de confiar en
-- los ALTER DEFAULT PRIVILEGES que ya quedaron configurados ahi.
grant select, insert, update, delete on marketing_campaigns to service_role;
grant select, insert, update, delete on marketing_campaigns to authenticated;
grant select on marketing_campaigns to anon;
