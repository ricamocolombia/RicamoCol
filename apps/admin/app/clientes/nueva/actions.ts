"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

export async function crearCliente(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const instagramHandle = String(formData.get("instagram_handle") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName) {
    redirect(
      `/clientes/nueva?error=${encodeURIComponent("El nombre del cliente es obligatorio")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      instagram_handle: instagramHandle || null,
      city: city || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !customer) {
    redirect(
      `/clientes/nueva?error=${encodeURIComponent(
        "No se pudo crear el cliente: " + (error?.message ?? "error desconocido")
      )}`
    );
  }

  redirect(`/clientes/${customer.id}`);
}
