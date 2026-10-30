"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/features/auth/actions";
import { PUBLIC_ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    setSent(true);
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
          Recuperar contraseña
        </h1>

        {sent ? (
          <div className="mt-4">
            <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
              Si el correo <span className="font-black">{email}</span> está registrado, te
              enviamos instrucciones para restablecer tu contraseña. Revisa tu bandeja de
              entrada.
            </p>
            <Link href={PUBLIC_ROUTES.LOGIN} className="mt-6 block">
              <Button type="button" variant="outline" className="w-full">
                Volver a iniciar sesión
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
              Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </Button>
            <Link
              href={PUBLIC_ROUTES.LOGIN}
              className="block text-center text-xs font-semibold hover:underline"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
