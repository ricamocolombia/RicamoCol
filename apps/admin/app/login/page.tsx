import Image from "next/image";
import { signIn } from "./actions";
import { LoginBackground } from "../../components/LoginBackground";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ricamo-black flex items-center justify-center px-6 py-12">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/brand/logo-transparente-amarillo.png"
            alt="Ricamo"
            width={180}
            height={180}
            className="h-16 w-auto"
            priority
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Lo creas, lo llevas
          </p>
        </div>

        <form
          action={signIn}
          className="rounded-3xl bg-white shadow-2xl shadow-black/40 p-8 space-y-5"
        >
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-ricamo-black">Panel administrativo</h1>
            <p className="text-sm text-neutral-500 mt-1">Entra con tu cuenta de Ricamo</p>
          </div>

          {error && (
            <p className="text-sm text-ricamo-red text-center bg-ricamo-red/5 border border-ricamo-red/20 rounded-xl py-2 px-3">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-ricamo-black">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ricamo-yellow focus:border-ricamo-yellow"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-ricamo-black">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ricamo-yellow focus:border-ricamo-yellow"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-ricamo-yellow text-ricamo-black font-semibold rounded-xl py-2.5 hover:bg-ricamo-black hover:text-white transition-colors cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-6">
          Acceso exclusivo para el equipo de Ricamo
        </p>
      </div>
    </main>
  );
}
