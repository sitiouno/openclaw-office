/**
 * Registry API client for the SitioUno fleet-registry-api Cloud Run service.
 *
 * This is a separate, admin-scoped REST channel (NOT routed via the gateway
 * WebSocket adapter) used by the "Setup GCP" console page to:
 *   - approve/reject pending pairing requests from new branch nodes (Tailscale)
 *   - manage GCP Secret Manager-backed notification channels (Telegram first)
 *
 * Configuration precedence:
 *   1. Runtime injection: window.__OPENCLAW_CONFIG__.registryApiUrl/Token
 *      (mirrors the gateway pattern used in src/App.tsx)
 *   2. Build-time env: VITE_REGISTRY_API_URL / VITE_REGISTRY_API_TOKEN
 *
 * The admin token is treated as a server-side credential. We deliberately:
 *   - never persist it to localStorage / sessionStorage
 *   - never log the token value
 *   - never echo secret values from POST bodies back into UI state once submitted
 */

// ---------- Types ----------

export type PairingStatus = "pending" | "approved" | "rejected" | "smoke_passed" | "smoke_failed";

export interface PairingRequest {
  id: number;
  branch_id: string;
  hostname: string;
  tailscale_ip: string;
  delegate_url: string;
  coordinator_agent_id: string;
  allowed_agents: string[];
  status: PairingStatus;
  delegation_token_fingerprint: string;
  metadata?: Record<string, unknown> | null;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

export interface PairingApproveBody {
  decided_by: string;
}

export interface PairingRejectBody {
  decided_by: string;
  reason: string;
}

export interface PairingSmokeTestBody {
  delegation_token: string;
}

export interface PairingSmokeTestResult {
  ok: boolean;
  status?: string;
  http?: number;
  detail?: Record<string, unknown> | string | null;
}

export type ChannelKind = "telegram" | "discord" | "slack" | string;
export type ChannelScope = "admin" | "branch" | string;

export interface NotificationChannel {
  id: number;
  kind: ChannelKind;
  name: string;
  config: Record<string, unknown>;
  secret_ref: string | null;
  enabled: boolean;
  scope: ChannelScope;
  last_test_at: string | null;
  last_test_result: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateChannelBody {
  kind: ChannelKind;
  name: string;
  config: Record<string, unknown>;
  scope?: ChannelScope;
}

export interface UpdateChannelBody {
  config?: Record<string, unknown>;
  name?: string;
  enabled?: boolean;
}

export interface SetSecretBody {
  secret_value: string;
}

export interface ChannelTestBody {
  message?: string;
}

export interface ChannelTestResult {
  ok: boolean;
  http?: number;
  detail?: Record<string, unknown> | string | null;
}

// ---------- Config resolution ----------

interface RuntimeConfig {
  registryApiUrl?: string;
  registryApiToken?: string;
}

function readRuntimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") return {};
  const injected = (window as unknown as Record<string, unknown>).__OPENCLAW_CONFIG__ as
    | RuntimeConfig
    | undefined;
  return injected ?? {};
}

export interface RegistryApiResolvedConfig {
  baseUrl: string;
  token: string;
  configured: boolean;
}

export function resolveRegistryApiConfig(): RegistryApiResolvedConfig {
  const runtime = readRuntimeConfig();
  const baseUrl = (
    runtime.registryApiUrl ||
    (import.meta.env as unknown as Record<string, string | undefined>).VITE_REGISTRY_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/u, "");
  const token = (
    runtime.registryApiToken ||
    (import.meta.env as unknown as Record<string, string | undefined>).VITE_REGISTRY_API_TOKEN ||
    ""
  ).trim();
  return { baseUrl, token, configured: Boolean(baseUrl && token) };
}

// ---------- Errors ----------

export class RegistryApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "RegistryApiError";
    this.status = status;
    this.body = body;
  }
}

export class RegistryApiNotConfiguredError extends Error {
  constructor() {
    super(
      "Registry API is not configured. Set VITE_REGISTRY_API_URL + VITE_REGISTRY_API_TOKEN, " +
        "or inject window.__OPENCLAW_CONFIG__.registryApiUrl/Token at runtime.",
    );
    this.name = "RegistryApiNotConfiguredError";
  }
}

// ---------- HTTP core ----------

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { baseUrl, token, configured } = resolveRegistryApiConfig();
  if (!configured) throw new RegistryApiNotConfiguredError();

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
  });

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: unknown }).detail)
        : null) ?? `Registry API ${res.status} on ${opts.method ?? "GET"} ${path}`;
    throw new RegistryApiError(res.status, message, payload);
  }

  return payload as T;
}

// ---------- Resource APIs ----------

export const pairing = {
  list: (statusFilter: PairingStatus | "all" = "pending") => {
    const qs = statusFilter === "all" ? "" : `?status_filter=${encodeURIComponent(statusFilter)}`;
    return request<PairingRequest[]>(`/v1/pairing/requests${qs}`);
  },
  get: (id: number) => request<PairingRequest>(`/v1/pairing/requests/${id}`),
  approve: (id: number, body: PairingApproveBody) =>
    request<PairingRequest>(`/v1/pairing/requests/${id}/approve`, { method: "POST", body }),
  reject: (id: number, body: PairingRejectBody) =>
    request<PairingRequest>(`/v1/pairing/requests/${id}/reject`, { method: "POST", body }),
  smokeTest: (id: number, body: PairingSmokeTestBody) =>
    request<PairingSmokeTestResult>(`/v1/pairing/requests/${id}/smoke-test`, {
      method: "POST",
      body,
    }),
};

export const channels = {
  list: () => request<NotificationChannel[]>("/v1/channels"),
  get: (id: number) => request<NotificationChannel>(`/v1/channels/${id}`),
  create: (body: CreateChannelBody) =>
    request<NotificationChannel>("/v1/channels", { method: "POST", body }),
  update: (id: number, body: UpdateChannelBody) =>
    request<NotificationChannel>(`/v1/channels/${id}`, { method: "PATCH", body }),
  delete: (id: number) => request<{ ok: boolean }>(`/v1/channels/${id}`, { method: "DELETE" }),
  setSecret: (id: number, body: SetSecretBody) =>
    request<NotificationChannel>(`/v1/channels/${id}/secret`, { method: "POST", body }),
  test: (id: number, body: ChannelTestBody = {}) =>
    request<ChannelTestResult>(`/v1/channels/${id}/test`, { method: "POST", body }),
};

export const registryApiClient = {
  pairing,
  channels,
  resolveConfig: resolveRegistryApiConfig,
};

export default registryApiClient;
