export { default } from "@/app/auth/login/page";

// `dynamic` es route segment config: Next.js lo detecta por análisis estático
// del propio archivo page.tsx, no se hereda del módulo reexportado. Sin esto,
// "/" se prerenderiza en build time y hornea las URLs de localhost (ver
// comentario en app/auth/login/page.tsx).
export const dynamic = "force-dynamic";
