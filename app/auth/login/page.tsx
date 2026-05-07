"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signUp, verifyEmailCode } from "@/features/auth/actions";

type Mode = "login" | "register";
type RegisterStep = "form" | "verify";

const DISPLAY_FONT = { fontFamily: "var(--font-display)" } as const;

const BENEFITS = [
  { symbol: "✓", label: "Conexión segura con el SAT" },
  { symbol: "⚡", label: "Declaraciones automáticas" },
  { symbol: "📊", label: "Dashboard en tiempo real" },
  { symbol: "🔒", label: "Tus datos protegidos" },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setRegisterStep("form");
    setCode("");
  }

  async function handleLogin(e: React.FormEvent) {
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    const res = await signUp({ email, password });
    setLoading(false);

    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "Error al registrar");
      return;
    }

    setRegisterStep("verify");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await verifyEmailCode({ email, code });
    setLoading(false);

    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "Código inválido");
      return;
    }

    router.push(res.value);
  }

  async function handleResendCode() {
    setError(null);
    setLoading(true);
    const res = await signUp({ email, password });
    setLoading(false);
    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "No se pudo reenviar el código");
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="grid min-h-screen lg:grid-cols-[370px_1fr]">
        <aside
          className="hidden lg:flex flex-col text-white px-8 py-10"
          style={{ background: "var(--ink-900)" }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--brand-500)" }}
            >
              <span className="text-base font-black text-white" style={DISPLAY_FONT}>
                C
              </span>
            </div>
            <span className="text-base font-black text-white" style={DISPLAY_FONT}>
              Contabilízate
            </span>
          </Link>

          <div className="mt-12 max-w-[280px]">
            <h1
              className="text-3xl font-black text-white leading-tight"
              style={DISPLAY_FONT}
            >
              Tu contador fiscal con IA
            </h1>
            <p className="mt-3 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              Gestiona tus impuestos, declaraciones y cumplimiento fiscal de forma automática.
            </p>
          </div>

          <div className="mt-10">
            <p
              className="text-xs font-black uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Beneficios
            </p>
            <div className="flex flex-col gap-3">
              {BENEFITS.map(({ symbol, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 benefit-item animate-slide-in-left"
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold"
                    style={{
                      background: "rgba(14, 209, 138, 0.15)",
                      color: "var(--brand-400)",
                    }}
                  >
                    {symbol}
                  </span>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-auto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Confían en nosotros miles de emprendedores en México
          </p>
        </aside>

        <section className="flex items-center justify-center p-4 sm:p-8 lg:p-14">
          <div
            className="w-full max-w-[460px] rounded-3xl px-6 py-8 sm:px-8 sm:py-9"
            style={{
              background: "var(--card)",
              boxShadow: "0 24px 45px rgba(21,17,63,0.10)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "var(--ink-900)" }}
              >
                <span
                  className="text-2xl font-black"
                  style={{ ...DISPLAY_FONT, color: "var(--brand-400)" }}
                >
                  C
                </span>
              </div>
              <h2
                className="mt-3 text-2xl font-black"
                style={{ ...DISPLAY_FONT, color: "var(--foreground)" }}
              >
                Contabilízate
              </h2>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
                Tu contador fiscal con inteligencia artificial
              </p>
            </div>

            <div
              className="rounded-2xl p-1 grid grid-cols-2 gap-1"
              style={{ background: "var(--secondary)" }}
            >
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="rounded-xl text-center py-2.5 text-sm font-bold transition-colors"
                style={
                  mode === "login"
                    ? {
                        background: "var(--card)",
                        color: "var(--foreground)",
                        boxShadow: "0 1px 2px rgba(21,17,63,0.06)",
                      }
                    : { color: "var(--muted-foreground)", background: "transparent" }
                }
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="rounded-xl text-center py-2.5 text-sm font-bold transition-colors"
                style={
                  mode === "register"
                    ? {
                        background: "var(--card)",
                        color: "var(--foreground)",
                        boxShadow: "0 1px 2px rgba(21,17,63,0.06)",
                      }
                    : { color: "var(--muted-foreground)", background: "transparent" }
                }
              >
                Registrarse
              </button>
            </div>

            {error && (
              <div
                className="mt-5 rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ background: "#FCDCDC", color: "var(--destructive)" }}
              >
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      minLength={8}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl px-4 pr-11 text-sm outline-none transition"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3 inline-flex items-center"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--brand-500)", color: "#FFFFFF" }}
                >
                  {loading ? "Iniciando..." : "Entrar"}
                </button>
              </form>
            ) : registerStep === "form" ? (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email-register"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email-register"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password-register"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Contraseña <span className="font-semibold" style={{ color: "var(--muted-foreground)" }}>(mínimo 8 caracteres)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password-register"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-xl px-4 pr-11 text-sm outline-none transition"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3 inline-flex items-center"
                      style={{ color: "var(--muted-foreground)" }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--brand-500)", color: "#FFFFFF" }}
                >
                  {loading ? "Enviando código..." : "Crear cuenta"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Te enviamos un código a
                  </p>
                  <p
                    className="text-sm font-black break-all"
                    style={{ color: "var(--brand-600)" }}
                  >
                    {email}
                  </p>
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Ingresa el código de 6 dígitos para confirmar tu cuenta.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    Código de verificación
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 w-full rounded-xl px-4 text-center text-lg font-black tracking-[0.5em] outline-none transition"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--brand-500)", color: "#FFFFFF" }}
                >
                  {loading ? "Verificando..." : "Confirmar cuenta"}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep("form");
                      setCode("");
                      setError(null);
                    }}
                    style={{ color: "var(--muted-foreground)" }}
                    className="hover:underline"
                  >
                    ← Cambiar correo
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    style={{ color: "var(--brand-600)" }}
                    className="hover:underline disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            <div
              className="mt-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              O continúa con
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setError("El acceso con Google estará disponible próximamente.")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition hover:opacity-90"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={() => setError("El acceso con Facebook estará disponible próximamente.")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#1877F2" }}
              >
                <FacebookIcon />
                Facebook
              </button>
            </div>

            <p
              className="mt-6 text-center text-xs font-semibold"
              style={{ color: "var(--muted-foreground)" }}
            >
              Al continuar aceptas nuestros{" "}
              <span style={{ color: "var(--foreground)" }}>Términos</span> y{" "}
              <span style={{ color: "var(--brand-600)" }}>Privacidad</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
