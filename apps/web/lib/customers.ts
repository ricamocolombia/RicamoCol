import { createServiceRoleClient } from "@ricamo/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

// Normaliza un celular colombiano a solo digitos sin el indicativo 57, para
// que "300 000 0000", "3000000000" y "+57 300 000 0000" sean el mismo
// cliente.
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
}

// Busca el cliente por telefono (normalizado o tal como se guardo antes de
// normalizar) o lo crea. Si ya existia, solo completa los campos que tenia
// vacios (correo, ciudad, direccion) -- nunca sobrescribe: el formulario es
// publico y cualquiera que conozca un telefono podria cambiarle el correo a
// otro cliente. La direccion de cada pedido se guarda aparte en el pedido.
// Devuelve null si no se pudo crear.
export async function findOrCreateCustomer(
  supabase: ServiceClient,
  input: { name: string; phone: string; email?: string; city?: string; address?: string }
): Promise<string | null> {
  const phone = normalizePhone(input.phone);
  const candidates = [...new Set([phone, input.phone.trim()])].filter(Boolean);

  const { data: existing } = await supabase
    .from("customers")
    .select("id, email, city, address")
    .in("phone", candidates)
    .order("created_at", { ascending: true })
    .limit(1);

  const current = existing?.[0];

  if (current) {
    const updates: { email?: string; city?: string; address?: string } = {};
    if (input.email && !current.email) updates.email = input.email;
    if (input.city && !current.city) updates.city = input.city;
    if (input.address && !current.address) updates.address = input.address;
    if (Object.keys(updates).length > 0) {
      await supabase.from("customers").update(updates).eq("id", current.id);
    }
    return current.id;
  }

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      full_name: input.name,
      phone,
      email: input.email || null,
      city: input.city || null,
      address: input.address || null,
    })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}
