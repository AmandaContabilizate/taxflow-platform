"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  signIn,
  signUp,
  verifyEmailCode,
  completeUserProfile,
  checkEmailExists,
} from "@/features/auth/actions";
import { getPasswordErrors } from "@/features/auth/lib/passwordPolicy";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

type Mode = "login" | "register";
type RegisterStep = "form" | "verify";

interface LoginPageClientProps {
  googleAuthUrl: string;
  facebookAuthUrl: string;
  appleAuthUrl: string;
}

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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.463 2.194-1.163 2.966-.766.83-2.026 1.484-3.037 1.407-.14-1.098.44-2.24 1.163-2.998.79-.86 2.153-1.51 3.037-1.375zM20.665 17.116c-.336.775-.735 1.53-1.216 2.24-.652.972-1.19 1.647-1.61 2.024-.65.626-1.35.947-2.098.965-.537.011-1.184-.152-1.938-.482-.756-.33-1.452-.494-2.093-.494-.672 0-1.386.164-2.146.494-.762.33-1.375.503-1.842.52-.717.03-1.434-.3-2.152-.99-.454-.42-1.017-1.117-1.69-2.093-.72-1.043-1.313-2.254-1.777-3.634-.497-1.484-.746-2.92-.746-4.31 0-1.59.343-2.96 1.03-4.11a6.05 6.05 0 0 1 2.155-2.185 5.8 5.8 0 0 1 2.92-.826c.573 0 1.325.177 2.258.526.93.35 1.528.526 1.79.526.196 0 .857-.207 1.973-.62 1.056-.383 1.947-.542 2.68-.478 1.98.16 3.468.94 4.457 2.343-1.77 1.073-2.645 2.575-2.63 4.5.014 1.5.55 2.75 1.607 3.746.478.454 1.012.806 1.605 1.056a12 12 0 0 1-.443 1.148z" />
    </svg>
  );
}

export function LoginPageClient({ googleAuthUrl, facebookAuthUrl, appleAuthUrl }: LoginPageClientProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<Mode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
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
    const passwordErrors = getPasswordErrors(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);

    const existsRes = await checkEmailExists(email);
    if (!existsRes.success) {
      setLoading(false);
      const flat = Object.values(existsRes.error.fieldErrors).flat();
      setError(flat[0] ?? "No se pudo validar el correo");
      return;
    }
    if (existsRes.value) {
      setLoading(false);
      setError("Este correo ya está registrado. Inicia sesión.");
      return;
    }

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

    // Un usuario recién verificado siempre es nuevo — nunca tiene RFC
    // todavía, así que va a onboarding en vez del dashboard.
    const res = await verifyEmailCode({ email, code }, PROTECTED_ROUTES.ONBOARDING);

    if (!res.success) {
      setLoading(false);
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "Código inválido");
      return;
    }

    // La sesión ya quedó establecida por verifyEmailCode; ahora completamos
    // el perfil con los datos capturados en el formulario de registro.
    if (fullName.trim()) {
      await completeUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        referralCode: referralCode.trim() || undefined,
      });
    }

    setLoading(false);
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
    <main className="min-h-screen" style={{ background: "#F6F7FB", color: "#15113F" }}>
      <div className="grid min-h-screen lg:grid-cols-[370px_1fr]">
        <aside
          className="hidden lg:flex flex-col text-white px-8 py-10"
          style={{ background: "#15113F" }}
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#0ED18A" }}
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
                      color: "#3AE3A4",
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
              background: "#FFFFFF",
              boxShadow: "0 24px 45px rgba(21,17,63,0.10)",
              border: "1px solid rgba(21,17,63,0.08)",
            }}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: "#15113F" }}
              >
                <span
                  className="text-2xl font-black"
                  style={{ ...DISPLAY_FONT, color: "#3AE3A4" }}
                >
                  C
                </span>
              </div>
              <h2
                className="mt-3 text-2xl font-black"
                style={{ ...DISPLAY_FONT, color: "#15113F" }}
              >
                Contabilízate
              </h2>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#8982BC" }}>
                Tu contador fiscal con inteligencia artificial
              </p>
            </div>

            <div
              className="rounded-2xl p-1 grid grid-cols-2 gap-1"
              style={{ background: "#F4F2F9" }}
            >
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="rounded-xl text-center py-2.5 text-sm font-bold transition-colors"
                style={
                  mode === "login"
                    ? {
                      background: "#FFFFFF",
                      color: "#15113F",
                      boxShadow: "0 1px 2px rgba(21,17,63,0.06)",
                    }
                    : { color: "#8982BC", background: "transparent" }
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
                      background: "#FFFFFF",
                      color: "#15113F",
                      boxShadow: "0 1px 2px rgba(21,17,63,0.06)",
                    }
                    : { color: "#8982BC", background: "transparent" }
                }
              >
                Registrarse
              </button>
            </div>

            {error && (
              <div
                className="mt-5 rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ background: "#FCDCDC", color: "#E84D4D" }}
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
                    style={{ color: "#15113F" }}
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
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
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
                        background: "#F4F2F9",
                        border: "1px solid rgba(21,17,63,0.08)",
                        color: "#15113F",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3 inline-flex items-center"
                      style={{ color: "#8982BC" }}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Link
                  href={PUBLIC_ROUTES.FORGOT_PASSWORD}
                  className="block text-right text-xs font-semibold hover:underline"
                  style={{ color: "#8982BC" }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "#0ED18A", color: "#FFFFFF" }}
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
                    style={{ color: "#15113F" }}
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
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
                  >
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    maxLength={10}
                    placeholder="10 dígitos"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="referralCode"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
                  >
                    Código de referido{" "}
                    <span className="font-semibold" style={{ color: "#8982BC" }}>(opcional)</span>
                  </label>
                  <input
                    id="referralCode"
                    type="text"
                    autoComplete="off"
                    placeholder="Código de referido"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="h-11 w-full rounded-xl px-4 text-sm outline-none transition"
                    style={{
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email-register"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
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
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password-register"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
                  >
                    Contraseña{" "}
                    <span className="font-semibold" style={{ color: "#8982BC" }}>
                      (mín. 8 caracteres, mayúscula, minúscula, número y símbolo)
                    </span>
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
                        background: "#F4F2F9",
                        border: "1px solid rgba(21,17,63,0.08)",
                        color: "#15113F",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3 inline-flex items-center"
                      style={{ color: "#8982BC" }}
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
                    style={{ color: "#15113F" }}
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
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "#0ED18A", color: "#FFFFFF" }}
                >
                  {loading ? "Enviando código..." : "Crear cuenta"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#15113F" }}>
                    Te enviamos un código a
                  </p>
                  <p
                    className="text-sm font-black break-all"
                    style={{ color: "#00B073" }}
                  >
                    {email}
                  </p>
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: "#8982BC" }}
                  >
                    Ingresa el código de 6 dígitos para confirmar tu cuenta.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-bold"
                    style={{ color: "#15113F" }}
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
                      background: "#F4F2F9",
                      border: "1px solid rgba(21,17,63,0.08)",
                      color: "#15113F",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="h-11 w-full rounded-xl text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "#0ED18A", color: "#FFFFFF" }}
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
                    style={{ color: "#8982BC" }}
                    className="hover:underline"
                  >
                    ← Cambiar correo
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    style={{ color: "#00B073" }}
                    className="hover:underline disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            <div
              className="mt-6 flex items-center gap-3 text-xs font-black uppercase tracking-widest"
              style={{ color: "#8982BC" }}
            >
              <div className="h-px flex-1" style={{ background: "rgba(21,17,63,0.08)" }} />
              O continúa con
              <div className="h-px flex-1" style={{ background: "rgba(21,17,63,0.08)" }} />
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = googleAuthUrl;
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition hover:opacity-90"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(21,17,63,0.08)",
                  color: "#15113F",
                }}
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = facebookAuthUrl;
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#1877F2" }}
              >
                <FacebookIcon />
                Facebook
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = appleAuthUrl;
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#000000" }}
              >
                <AppleIcon />
                Apple
              </button>
            </div>

            <p
              className="mt-6 text-center text-xs font-semibold"
              style={{ color: "#8982BC" }}
            >
              Al continuar aceptas nuestros{" "}
              <span style={{ color: "#15113F" }}>Términos</span> y{" "}
              <span style={{ color: "#00B073" }}>Privacidad</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
