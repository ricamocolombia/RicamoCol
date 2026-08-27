"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

export async function actualizarCliente(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const instagramHandle = String(formData.get("instagram_handle") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id) {
    redirect(`/clientes?error=${encodeURIComponent("Cliente inválido")}`);
  }
  if (!fullName) {
    redirect(
      `/clientes/${id}?error=${encodeURIComponent("El nombre del cliente es obligatorio")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("customers")
    .update({
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      instagram_handle: instagramHandle || null,
      city: city || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/clientes/${id}?error=${encodeURIComponent(
        "No se pudo actualizar el cliente: " + error.message
      )}`
    );
  }

  redirect(`/clientes/${id}`);
}
