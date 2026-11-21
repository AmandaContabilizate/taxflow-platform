"use server";

import { fetchDelete, fetchGet, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toPartnershipError } from "../errors";
import type {
  PartnerEventTypeItem,
  PartnershipError,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEndpointRequest,
  WebhookEndpointWithSecret,
} from "../types";

const W = API_ROUTES.PARTNERSHIP.WEBHOOKS;

export async function getWebhookEventTypes(): Promise<Result<PartnerEventTypeItem[], PartnershipError>> {
  try {
    return ok(await fetchGet<PartnerEventTypeItem[]>(W.EVENT_TYPES, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los tipos de evento."));
  }
}

export async function getWebhooks(): Promise<Result<WebhookEndpoint[], PartnershipError>> {
  try {
    return ok(await fetchGet<WebhookEndpoint[]>(W.LIST, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener los webhooks."));
  }
}

export async function createWebhook(data: WebhookEndpointRequest): Promise<Result<WebhookEndpointWithSecret, PartnershipError>> {
  try {
    return ok(await fetchPost<WebhookEndpointWithSecret>(W.CREATE, data, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos crear el webhook."));
  }
}

export async function updateWebhook(id: number, data: WebhookEndpointRequest): Promise<Result<WebhookEndpoint, PartnershipError>> {
  try {
    return ok(await fetchPut<WebhookEndpoint>(W.UPDATE(id), data, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos guardar el webhook."));
  }
}

export async function rotateWebhookSecret(id: number): Promise<Result<WebhookEndpointWithSecret, PartnershipError>> {
  try {
    return ok(await fetchPost<WebhookEndpointWithSecret>(W.ROTATE(id), undefined, "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos rotar el secreto."));
  }
}

export async function deleteWebhook(id: number): Promise<Result<true, PartnershipError>> {
  try {
    await fetchDelete<void>(W.DELETE(id), "partnership");
    return ok(true);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos eliminar el webhook."));
  }
}

export async function getWebhookDeliveries(onlyFailed: boolean): Promise<Result<WebhookDelivery[], PartnershipError>> {
  try {
    return ok(await fetchGet<WebhookDelivery[]>(W.DELIVERIES(onlyFailed ? "?status=failed&take=100" : "?take=100"), "partnership"));
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos obtener el historial de entregas."));
  }
}

export async function redeliverWebhook(deliveryId: number): Promise<Result<true, PartnershipError>> {
  try {
    await fetchPost<unknown>(W.REDELIVER(deliveryId), undefined, "partnership");
    return ok(true);
  } catch (e) {
    return err(toPartnershipError(e, "No pudimos reenviar el evento."));
  }
}
