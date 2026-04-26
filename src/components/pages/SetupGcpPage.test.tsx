import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SetupGcpPage } from "./SetupGcpPage";

function setRuntimeUrl(url?: string): void {
  const win = window as unknown as Record<string, unknown>;
  if (url === undefined) {
    delete win.__OPENCLAW_CONFIG__;
    return;
  }
  win.__OPENCLAW_CONFIG__ = { registryApiUrl: url };
}

const originalFetch = global.fetch;

describe("SetupGcpPage", () => {
  beforeEach(() => {
    setRuntimeUrl(undefined);
    // Stub fetch so the auto-loaded pairing/channels lists don't hit the network.
    global.fetch = vi.fn(
      async () =>
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    setRuntimeUrl(undefined);
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders without crashing and shows the secrets notice", async () => {
    await act(async () => {
      render(<SetupGcpPage />);
    });
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/Secret Manager/i).length).toBeGreaterThan(0);
  });

  it("shows the default Tailscale HQ base URL when no override is configured", async () => {
    await act(async () => {
      render(<SetupGcpPage />);
    });
    // Default base URL is http://openclaw-hq:8781 (Tailscale hostname for HQ).
    expect(screen.getByText(/openclaw-hq:8781/)).toBeInTheDocument();
  });
});
