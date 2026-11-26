"use client";

import { AlertTriangle, CheckCircle2, Handshake, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPartnerConsent, respondPartnerConsent } from "@/features/partnership/actions/partnerTaxpayers.action";
import type { PartnerConsentInfo } from "@/features/partnership/types";
import { PUBLIC_ROUTES } from "@/lib/routes";

/**
 * Consentimiento del dueño de un RFC para que una empresa aliada acceda a él (Partner API). Pública: el
 * token de la liga del correo es la prueba de que quien responde controla ese correo. No requiere sesión.
 */
export default function ConsentimientoPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";
  const [info, setInfo] = useState<PartnerConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"accept" | "reject" | "report" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"accepted" | "rejected" | "reported" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getPartnerConsent(token);
      if (cancelled) return;
      if (res.success) setInfo(res.value);
      else setError(res.error.message);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function respond(action: "accept" | "reject" | "report") {
    setSubmitting(action);
    setError(null);
    const res = await respondPartnerConsent(token, action);
    setSubmitting(null);
    if (res.success) setResult(action === "accept" ? "accepted" : action === "reject" ? "rejected" : "reported");
    else setError(res.error.message);
  }

  const status = result ?? info?.status;
  const partner = info?.partnerName ?? "La empresa aliada";

  return (
    <main
      className="force-light flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}
          >
            <Handshake size={22} />
          </div>
          <h1 className="text-xl font-black" style={{ color: "var(--card-foreground)" }}>
            Solicitud de acceso a tu RFC
          </h1>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <Loader2 size={18} className="animate-spin" /> Cargando solicitud…
          </div>
        ) : status === "pending" && info ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm" style={{ color: "var(--card-foreground)" }}>
              <span className="font-black">{partner}</span> quiere conectar tu RFC{" "}
              <span className="font-mono font-bold">{info.rfc}</span>
              {info.legalName && info.legalName !== info.rfc ? ` (${info.legalName})` : ""} a su plataforma por medio de
              Contabilízate.
            </p>

            {info.permissions.length > 0 && (
              <div>
                <p className="text-[13px] font-bold" style={{ color: "var(--muted-foreground)" }}>
                  Si aceptas, podrá:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--card-foreground)" }}>
                  {info.permissions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
              Puedes retirar el acceso cuando quieras desde Mi cuenta → Aliados con acceso. Si no reconoces esta
              solicitud, recházala.
              {info.expiresAt ? ` Vence el ${new Date(info.expiresAt).toLocaleString("es-MX")}.` : ""}
            </p>

            {error && <Notice kind="error">{error}</Notice>}

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button type="button" className="flex-1" onClick={() => respond("accept")} disabled={submitting !== null}>
                {submitting === "accept" ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Aceptar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => respond("reject")}
                disabled={submitting !== null}
              >
                {submitting === "reject" ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Rechazar
              </Button>
            </div>
            <button
              type="button"
              className="w-full text-center text-[12.5px] font-semibold underline disabled:opacity-50"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => respond("report")}
              disabled={submitting !== null}
            >
              {submitting === "report" ? "Enviando…" : "No reconozco esta solicitud"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {status === "accepted" ? (
              <Notice kind="ok">
                Listo. {partner} ya tiene acceso a tu RFC. Puedes retirarlo cuando quieras desde Mi cuenta → Aliados con
                acceso.
              </Notice>
            ) : status === "reported" ? (
              <Notice kind="info">
                Gracias por avisarnos. Rechazamos la solicitud y nuestro equipo revisará a {partner}. No tendrá acceso a
                tu RFC.
              </Notice>
            ) : status === "rejected" ? (
              <Notice kind="info">Rechazaste la solicitud. {partner} no tendrá acceso a tu RFC.</Notice>
            ) : status === "expired" ? (
              <Notice kind="info">Esta solicitud venció. Si la reconoces, pide a {partner} que la envíe de nuevo.</Notice>
            ) : status === "cancelled" ? (
              <Notice kind="info">Esta solicitud ya no está activa.</Notice>
            ) : (
              <Notice kind="error">{error ?? "La liga no es válida. Revisa que la hayas copiado completa."}</Notice>
            )}
            <Link href={PUBLIC_ROUTES.HOME} className="block">
              <Button type="button" variant="outline" className="w-full">
                Ir a Contabilízate
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Notice({ kind, children }: { kind: "ok" | "info" | "error"; children: React.ReactNode }) {
  const Icon = kind === "ok" ? CheckCircle2 : kind === "error" ? XCircle : AlertTriangle;
  const style =
    kind === "ok"
      ? { background: "var(--brand-50)", color: "var(--brand-700)" }
      : kind === "error"
        ? { background: "var(--coral-soft, #FDECEC)", color: "var(--violet-ink)" }
        : { background: "var(--amber-soft)", color: "var(--violet-ink)" };
  return (
    <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold" style={style}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
