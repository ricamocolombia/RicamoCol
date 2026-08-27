"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Cliente de Supabase para Client Components (usa la anon key, sujeto a RLS).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
