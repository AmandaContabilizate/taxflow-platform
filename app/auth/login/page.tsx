"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/features/auth/actions";

/**
 * Login con backend Bearer (ContaboxPro core2).
 * Reemplaza el flujo Supabase. OAuth (Google/Facebook) requiere endpoints
 * adicionales en el backend; este form solo cubre login con email + password.
 */
export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo = params.get("from") || "/dashboard";
    const res = await signIn({ email, password, rememberMe }, redirectTo);

    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "Error al iniciar sesión");
      setLoading(false);
      return;
    }
    router.push(res.value);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#15113F" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: "#0ED18A" }}
              >
                C
              </div>
              <span className="font-bold text-lg text-gray-900">Contabilízate</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Inicia sesión</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido de vuelta a tu panel fiscal
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Mantener sesión iniciada
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#0ED18A" }}
            >
              {loading ? "Iniciando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/planes" className="text-emerald-600 font-semibold hover:underline">
              Ver planes
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          © Contabilízate · Tus datos están protegidos
        </p>
      </div>
    </main>
  );
}
