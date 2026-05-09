const PLATFORM_BASE_URL = "http://127.0.0.1:18790";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface ServiceStatusData {
  installed?: boolean;
  running?: boolean;
  pid?: number;
  port?: number;
  version?: string;
  uptime?: number;
  [key: string]: unknown;
}

export interface ServiceActionResult {
  ok: boolean;
  action?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface ConfigSetupResult {
  ok: boolean;
  results?: Array<{ key: string; ok: boolean; stderr?: string }>;
}

export type TunnelStatus = "running" | "active-unmanaged" | "stopped";

export interface TunnelInfo {
  id: string;
  label: string;
  description?: string;
  kind: string;
  project?: string;
  zone?: string;
  instance?: string;
  localHost: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  url: string;
  autostart: boolean;
  tags: string[];
  running: boolean;
  managed: boolean;
  pid?: number;
  status: TunnelStatus;
  startedAt?: string;
  logPath?: string;
}

export interface TunnelsListResult {
  ok: boolean;
  tunnels?: TunnelInfo[];
  registryPath?: string;
  error?: string;
}

export interface TunnelActionResult {
  ok: boolean;
  tunnel?: TunnelInfo;
  message?: string;
  error?: string;
}

async function request<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${PLATFORM_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    const data = (await res.json()) as T;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function getServiceStatus(): Promise<{
  ok: boolean;
  data?: ServiceStatusData;
  error?: string;
  raw?: string;
}> {
  return request("/api/service/status");
}

export async function startService(): Promise<ServiceActionResult> {
  return request("/api/service/start", "POST");
}

export async function stopService(): Promise<ServiceActionResult> {
  return request("/api/service/stop", "POST");
}

export async function restartService(): Promise<ServiceActionResult> {
  return request("/api/service/restart", "POST");
}

export async function installService(): Promise<ServiceActionResult> {
  return request("/api/service/install", "POST");
}

export async function uninstallService(): Promise<ServiceActionResult> {
  return request("/api/service/uninstall", "POST");
}

export async function setupConfig(): Promise<ConfigSetupResult> {
  return request("/api/config/setup", "POST");
}

export async function listTunnels(): Promise<TunnelsListResult> {
  return request("/api/tunnels", "GET");
}

export async function startTunnel(id: string): Promise<TunnelActionResult> {
  return request(`/api/tunnels/${encodeURIComponent(id)}/start`, "POST", 45_000);
}

export async function stopTunnel(id: string): Promise<TunnelActionResult> {
  return request(`/api/tunnels/${encodeURIComponent(id)}/stop`, "POST", 20_000);
}

export async function restartTunnel(id: string): Promise<TunnelActionResult> {
  return request(`/api/tunnels/${encodeURIComponent(id)}/restart`, "POST", 50_000);
}

export async function checkAvailable(): Promise<boolean> {
  try {
    const res = await request<{ ok: boolean }>("/api/health", "GET", 3000);
    return res.ok === true;
  } catch {
    return false;
  }
}
