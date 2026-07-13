"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeUserProfile } from "@/features/auth/actions";
import { PROTECTED_ROUTES } from "@/lib/routes";

/**
 * Paso final del alta vía OAuth (Google/Facebook): la cookie de sesión ya
 * quedó establecida por app/auth/login-callback/route.ts, pero al backend
 * le falta nombre/teléfono porque el proveedor externo no siempre los envía.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await completeUserProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      referralCode: referralCode.trim() || undefined,
    });
    setLoading(false);

    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "No se pudo completar el perfil");
      return;
    }

    router.push(PROTECTED_ROUTES.ONBOARDING);
  }

  return (
    <main
      className="force-light flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h1 className="text-xl font-black" style={{ color: "var(--card-foreground)" }}>
          Completa tu perfil
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
          Necesitamos un par de datos más para terminar de configurar tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ background: "var(--destructive)", color: "var(--destructive-foreground)" }}
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              maxLength={10}
              placeholder="10 dígitos"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode">Código de referido (opcional)</Label>
            <Input
              id="referralCode"
              type="text"
              autoComplete="off"
              placeholder="Código de referido"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
