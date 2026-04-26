import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SetupGcpPage } from "./SetupGcpPage";

function setRuntime(url?: string, token?: string): void {
  const win = window as unknown as Record<string, unknown>;
  if (!url && !token) {
    delete win.__OPENCLAW_CONFIG__;
    return;
  }
  win.__OPENCLAW_CONFIG__ = { registryApiUrl: url, registryApiToken: token };
}

describe("SetupGcpPage", () => {
  beforeEach(() => {
    setRuntime(undefined, undefined);
  });

  afterEach(() => {
    setRuntime(undefined, undefined);
  });

  it("renders without crashing and shows the secrets notice", async () => {
    await act(async () => {
      render(<SetupGcpPage />);
    });
    // Title from i18n (zh is the default test locale)
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    // Secrets notice title text appears at least once
    expect(screen.getAllByText(/Secret Manager/i).length).toBeGreaterThan(0);
  });

  it("shows the not-configured hint when registry API is not configured", async () => {
    await act(async () => {
      render(<SetupGcpPage />);
    });
    // The PairingRequestsView should show the not-configured hint;
    // the i18n key body mentions VITE_REGISTRY_API_URL
    expect(screen.getByText(/VITE_REGISTRY_API_URL/i)).toBeInTheDocument();
  });
});
