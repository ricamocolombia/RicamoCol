-- Otorga los privilegios base de Postgres que RLS por si solo no cubre.
--
-- RLS controla que FILAS puede ver/tocar cada rol, pero Postgres exige
-- ademas un GRANT a nivel de tabla antes de evaluar cualquier politica de
-- RLS -- sin ese GRANT, cualquier consulta falla con
-- "permission denied for table x" (42501), incluso para service_role
-- (BYPASSRLS salta las politicas de fila, no el GRANT de tabla).
--
-- Las tablas de 0001_init.sql se crearon sin este paso, lo que bloqueaba
-- por completo la app admin. Este archivo lo corrige y deja privilegios por
-- defecto para que las tablas de futuras migraciones lo hereden solas.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to service_role, authenticated, anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to service_role, authenticated, anon;
