import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      <form action={signIn} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center mb-2">Ricamo Admin</h1>

        {error && (
          <p className="text-sm text-ricamo-red text-center">{error}</p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-lg py-2"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
