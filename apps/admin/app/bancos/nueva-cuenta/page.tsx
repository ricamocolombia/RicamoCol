import Link from "next/link";
import { crearCuentaBancaria } from "../actions";

export default async function NuevaCuentaBancariaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="px-6 py-10 max-w-lg">
      <div className="mb-6">
        <Link href="/bancos" className="text-sm text-neutral-500 hover:text-ricamo-black">
          ← Bancos
        </Link>
        <h1 className="text-2xl font-bold mt-2">Nueva cuenta bancaria</h1>
      </div>

      {error && <p className="text-sm text-ricamo-red mb-4">{error}</p>}

      <form
        action={crearCuentaBancaria}
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nombre de la cuenta *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej. Bancolombia principal"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="bank_name" className="block text-sm font-medium mb-1">
            Banco / entidad
          </label>
          <input
            id="bank_name"
            name="bank_name"
            type="text"
            placeholder="Ej. Bancolombia, Nequi, Daviplata"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="account_type" className="block text-sm font-medium mb-1">
            Tipo de cuenta
          </label>
          <select
            id="account_type"
            name="account_type"
            defaultValue=""
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
          >
            <option value="">Sin especificar</option>
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
            <option value="billetera_digital">Billetera digital</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded border-neutral-300"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Activa
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-2"
        >
          Guardar cuenta
        </button>
      </form>
    </main>
  );
}
