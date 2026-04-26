import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  channels,
  pairing,
  RegistryApiNotConfiguredError,
  resolveRegistryApiConfig,
} from "@/lib/registry-api-client";

const originalFetch = global.fetch;

function setRuntime(url: string | undefined, token: string | undefined): void {
  const win = window as unknown as Record<string, unknown>;
  if (!url && !token) {
    delete win.__OPENCLAW_CONFIG__;
    return;
  }
  win.__OPENCLAW_CONFIG__ = { registryApiUrl: url, registryApiToken: token };
}

describe("registry-api-client", () => {
  beforeEach(() => {
    setRuntime(undefined, undefined);
  });

  afterEach(() => {
    setRuntime(undefined, undefined);
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("resolves config from runtime injection and trims trailing slash", () => {
    setRuntime("https://fleet-registry-api.example.run.app/", "abc123");
    const cfg = resolveRegistryApiConfig();
    expect(cfg.baseUrl).toBe("https://fleet-registry-api.example.run.app");
    expect(cfg.token).toBe("abc123");
    expect(cfg.configured).toBe(true);
  });

  it("reports not-configured when url or token is missing", () => {
    setRuntime("", "");
    const cfg = resolveRegistryApiConfig();
    expect(cfg.configured).toBe(false);
  });

  it("throws RegistryApiNotConfiguredError when calling without config", async () => {
    setRuntime(undefined, undefined);
    await expect(pairing.list("pending")).rejects.toBeInstanceOf(RegistryApiNotConfiguredError);
  });

  it("issues GET with bearer token and parses JSON for pairing.list", async () => {
    setRuntime("https://api.example.com", "tok");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 1, branch_id: "miami" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const items = await pairing.list("pending");
    expect(items).toEqual([{ id: 1, branch_id: "miami" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("https://api.example.com/v1/pairing/requests?status_filter=pending");
    expect((init as RequestInit).method).toBe("GET");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  it("posts JSON body for channels.create", async () => {
    setRuntime("https://api.example.com", "tok");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 7, kind: "telegram", name: "Admin Bot" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const created = await channels.create({
      kind: "telegram",
      name: "Admin Bot",
      config: { chat_id: "-1001" },
      scope: "admin",
    });
    expect(created.id).toBe(7);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      kind: "telegram",
      name: "Admin Bot",
      config: { chat_id: "-1001" },
      scope: "admin",
    });
  });

  it("rejects with RegistryApiError on non-2xx with detail", async () => {
    setRuntime("https://api.example.com", "tok");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "nope" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(pairing.approve(1, { decided_by: "x" })).rejects.toMatchObject({
      name: "RegistryApiError",
      status: 403,
      message: "nope",
    });
  });
});
