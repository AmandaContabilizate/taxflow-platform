"use server";

import { ApiError, fetchDelete, fetchGet, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Producto, ProductosError, SaveProductoInput } from "../types";

const API = "subscription_plan_admin" as const;

function toError(e: unknown, fallback: string): ProductosError {
  if (e instanceof ApiError) {
    const body = e.body as { title?: string; detail?: string } | null | undefined;
    const message = (typeof body === "object" && body && (body.detail || body.title)) || e.message || fallback;
    return { statusCode: e.status, message };
  }
  console.error("[productos] Error:", e);
  return { statusCode: 500, message: fallback };
}

/** Todos los productos, activos e inactivos. GET subscription-plan-admin. */
export async function getProductos(): Promise<Result<Producto[], ProductosError>> {
  try {
    const data = await fetchGet<Producto[]>(API_ROUTES.PRODUCTOS.LIST, API);
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar el catálogo."));
  }
}

/** Alta (POST) o edición (PUT {id}); la edición también reconcilia los regímenes ligados. */
export async function saveProducto(input: SaveProductoInput): Promise<Result<Producto, ProductosError>> {
  try {
    const body = {
      key: input.key?.trim(),
      name: input.name.trim(),
      price: input.price,
      currency: input.currency ?? "MXN",
      billingPeriod: input.billingPeriod,
      shortDescription: input.shortDescription ?? null,
      features: input.features ?? null,
      isActive: input.isActive,
      regimeScope: input.regimeScope,
      taxRegimeIds: input.regimeScope === 1 ? input.taxRegimeIds : [],
      productType: input.productType,
      futureDeclarations: input.futureDeclarations,
      regularizationDeclarations: input.regularizationDeclarations,
      grantsFreeAddOns: input.grantsFreeAddOns,
      canBeGrantedFree: input.canBeGrantedFree,
      allowsQuantity: input.allowsQuantity,
      stripeSubscriptionPriceId: input.stripeSubscriptionPriceId ?? null,
      stripeOneTimePriceId: input.stripeOneTimePriceId ?? null,
      providerKey: input.providerKey ?? null,
      billingUnit: input.billingUnit ?? null,
      logoUrl: input.logoUrl ?? null,
      confirmMultiRegimeCoverage: input.confirmMultiRegimeCoverage ?? false,
    };
    const data = input.id !== undefined
      ? await fetchPut<Producto>(API_ROUTES.PRODUCTOS.UPDATE(input.id), body, API)
      : await fetchPost<Producto>(API_ROUTES.PRODUCTOS.CREATE, body, API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos guardar el producto."));
  }
}

/** Baja lógica (DELETE {id}). Se reactiva editando el producto con "Activo". */
export async function deactivateProducto(id: number): Promise<Result<true, ProductosError>> {
  try {
    await fetchDelete<unknown>(API_ROUTES.PRODUCTOS.DELETE(id), API);
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos dar de baja el producto."));
  }
}
