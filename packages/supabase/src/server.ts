import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Cliente de Supabase para Server Components / Server Actions / route
// handlers. Usa la anon key + cookies de sesion (sujeto a RLS). Para
// operaciones administrativas que deben saltarse RLS, usar createServiceRoleClient.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component sin
            // capacidad de escritura: el middleware se encarga de refrescar
            // la sesion en ese caso.
          }
        },
      },
    }
  );
}

// Cliente con la service_role key: bypassa RLS por completo. Solo usar en
// codigo de servidor de confianza (route handlers, Server Actions de la app
// admin) y nunca exponer la key al cliente.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
