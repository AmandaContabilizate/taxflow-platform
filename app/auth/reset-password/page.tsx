"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/features/auth/actions";
import { getPasswordErrors } from "@/features/auth/lib/passwordPolicy";
import { PUBLIC_ROUTES } from "@/lib/routes";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const resetCode = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    const passwordErrors = getPasswordErrors(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    setLoading(true);
    const res = await resetPassword({ email, resetCode, newPassword });
    setLoading(false);

    if (!res.success) {
      const flat = Object.values(res.error.fieldErrors).flat();
      setError(flat[0] ?? "No se pudo restablecer la contraseña");
      return;
    }

    router.push(res.value);
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
          Nueva contraseña
        </h1>

        {!email || !resetCode ? (
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--destructive)" }}>
            El enlace de restablecimiento no es válido o expiró. Solicita uno nuevo.
          </p>
        ) : (
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
              <Label htmlFor="newPassword">
                Nueva contraseña{" "}
                <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>
                  (mín. 8 caracteres, mayúscula, minúscula, número y símbolo)
                </span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </Button>
          </form>
        )}

        <Link
          href={PUBLIC_ROUTES.LOGIN}
          className="mt-6 block text-center text-xs font-semibold hover:underline"
          style={{ color: "var(--muted-foreground)" }}
        >
          ← Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
