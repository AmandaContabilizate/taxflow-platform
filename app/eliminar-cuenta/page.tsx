"use client";

import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountPublic } from "@/features/auth/actions";
import { PUBLIC_ROUTES } from "@/lib/routes";

const CONFIRM_WORD = "ELIMINAR";

export default function EliminarCuentaPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const wordOk = confirmWord.trim().toUpperCase() === CONFIRM_WORD;
  const canSubmit = email.length > 0 && password.length > 0 && wordOk && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await deleteAccountPublic(email, password);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error.message);
      return;
    }
    setPassword("");
    setConfirmWord("");
    setDone(true);
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
          Eliminar mi cuenta
        </h1>

        {done ? (
          <div className="mt-6 space-y-6">
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold"
              style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>
                Tu cuenta quedó desactivada. Ya no podrás iniciar sesión con{" "}
                <span className="font-black">{email}</span>. Si necesitas reactivarla,
                escríbenos al centro de ayuda.
              </span>
            </div>
            <Link href={PUBLIC_ROUTES.HOME} className="block">
              <Button type="button" variant="outline" className="w-full">
                Volver al inicio
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
              Confirma tu correo y contraseña para desactivar tu cuenta. No necesitas iniciar
              sesión.
            </p>

            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 text-[12.5px] font-semibold"
              style={{ background: "var(--danger-soft)", color: "var(--violet-ink)" }}
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Esta acción cierra tu acceso a declaraciones, facturas y documentos.
              </span>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmWord">Escribe {CONFIRM_WORD} para confirmar</Label>
              <Input
                id="confirmWord"
                type="text"
                autoComplete="off"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-2.5 text-[13px] font-semibold"
                style={{ background: "var(--danger-soft)", color: "var(--violet-ink)" }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full"
              style={{ background: "var(--danger)", color: "#fff" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Eliminar mi cuenta
                </>
              )}
            </Button>

            <Link
              href={PUBLIC_ROUTES.LOGIN}
              className="block text-center text-xs font-semibold hover:underline"
              style={{ color: "var(--muted-foreground)" }}
            >
              &larr; Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
