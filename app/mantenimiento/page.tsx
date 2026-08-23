import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estamos actualizando el servicio — Contabilízate",
};

export const dynamic = "force-static";

export default function MantenimientoPage() {
  return (
    <div
      className="force-light min-h-screen flex items-center justify-center px-6 text-center"
      style={{
        background: "linear-gradient(160deg, #221158 0%, #3A1E8C 55%, #00AD87 130%)",
      }}
    >
      <div className="max-w-md flex flex-col items-center gap-6">
        <Image src="/Conta.png" alt="Contabilízate" width={72} height={72} priority />
        <h1
          className="text-2xl sm:text-3xl font-semibold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Estamos actualizando el servicio
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          Disculpa las molestias. Estamos trabajando para mejorar tu experiencia y
          pronto estaremos operando nuevamente.
        </p>
      </div>
    </div>
  );
}
