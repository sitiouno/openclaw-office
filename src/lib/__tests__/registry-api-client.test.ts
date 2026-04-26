import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  channels,
  DEFAULT_REGISTRY_API_URL,
  notify,
  pairing,
  resolveRegistryApiConfig,
} from "@/lib/registry-api-client";

const originalFetch = global.fetch;

function setRuntimeUrl(url: string | undefined): void {
  const win = window as unknown as Record<string, unknown>;
  if (url === undefined) {
    delete win.__OPENCLAW_CONFIG__;
    return;
  }
  win.__OPENCLAW_CONFIG__ = { registryApiUrl: url };
}

describe("registry-api-client", () => {
  beforeEach(() => {
    setRuntimeUrl(undefined);
  });

  afterEach(() => {
    setRuntimeUrl(undefined);
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("falls back to the Tailscale HQ default when nothing is configured", () => {
    setRuntimeUrl(undefined);
    const cfg = resolveRegistryApiConfig();
    expect(cfg.baseUrl).toBe(DEFAULT_REGISTRY_API_URL);
    expect(cfg.baseUrl).toBe("http://openclaw-hq:8781");
    expect(cfg.configured).toBe(true);
  });

  it("resolves config from runtime injection and trims trailing slash", () => {
    setRuntimeUrl("http://openclaw-hq:8781/");
    const cfg = resolveRegistryApiConfig();
    expect(cfg.baseUrl).toBe("http://openclaw-hq:8781");
    expect(cfg.configured).toBe(true);
  });

  it("issues GET WITHOUT an Authorization header for pairing.list", async () => {
    setRuntimeUrl("http://openclaw-hq:8781");
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
    expect(calledUrl).toBe("http://openclaw-hq:8781/v1/pairing/requests?status_filter=pending");
    expect((init as RequestInit).method).toBe("GET");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers).toMatchObject({ Accept: "application/json" });
    // VPN is the trust boundary — no bearer token in browser bundle.
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain("authorization");
  });

  it("posts JSON body for channels.create without an Authorization header", async () => {
    setRuntimeUrl("http://openclaw-hq:8781");
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
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain("authorization");
  });

  it("posts to /v1/notify for notify.broadcast", async () => {
    setRuntimeUrl("http://openclaw-hq:8781");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true, delivered: 3 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await notify.broadcast({ scope: "admin", text: "hello" });
    expect(result).toEqual({ ok: true, delivered: 3 });
    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("http://openclaw-hq:8781/v1/notify");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ scope: "admin", text: "hello" });
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain("authorization");
  });

  it("rejects with RegistryApiError on non-2xx with detail", async () => {
    setRuntimeUrl("http://openclaw-hq:8781");
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
