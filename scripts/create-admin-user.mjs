// Uso: node --env-file=apps/admin/.env.local scripts/create-admin-user.mjs <email> <password>
//
// Crea (o si ya existe, deja tal cual) un usuario de Supabase Auth para el
// panel admin, con el email ya confirmado -- no hay flujo de registro
// publico, las cuentas se crean asi o desde el Dashboard de Supabase.
import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: node --env-file=apps/admin/.env.local scripts/create-admin-user.mjs <email> <password>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Error creando el usuario:", error.message);
  process.exit(1);
}

console.log("Usuario creado:", data.user.id, data.user.email);
