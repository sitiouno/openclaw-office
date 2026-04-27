import { create } from "zustand";
import {
  channels as channelsApi,
  pairing as pairingApi,
  resolveRegistryApiConfig,
  RegistryApiNotConfiguredError,
  type ChannelTestResult,
  type CreateChannelBody,
  type NotificationChannel,
  type PairingRequest,
  type PairingStatus,
  type UpdateChannelBody,
} from "@/lib/registry-api-client";

function toMessage(err: unknown): string {
  if (err instanceof RegistryApiNotConfiguredError) return err.message;
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

function isLikelyNetworkError(err: unknown): boolean {
  // Browsers throw a TypeError ("Failed to fetch", "NetworkError when…", etc.)
  // when DNS fails, the host is unreachable, or mixed content is blocked.
  if (err instanceof TypeError) return true;
  if (err instanceof Error && /network|fetch|failed to fetch/i.test(err.message)) return true;
  return false;
}

function describeError(err: unknown, baseUrl: string): string {
  const base = toMessage(err);
  if (isLikelyNetworkError(err)) {
    return `${base} — cannot reach sidecar at ${baseUrl}. If you are not on the Tailscale tailnet, this page will be unavailable.`;
  }
  return base;
}

interface SetupGcpState {
  // Pairing
  pairingItems: PairingRequest[];
  pairingFilter: PairingStatus | "all";
  pairingLoading: boolean;
  pairingError: string | null;
  pairingActionInFlight: Record<number, boolean>;

  // Channels
  channelItems: NotificationChannel[];
  channelsLoading: boolean;
  channelsError: string | null;
  channelActionInFlight: Record<number, boolean>;
  lastChannelTest: Record<number, ChannelTestResult | null>;

  // Config readiness
  configured: boolean;
  baseUrl: string;

  refreshConfig: () => void;

  fetchPairing: (filter?: PairingStatus | "all") => Promise<void>;
  setPairingFilter: (filter: PairingStatus | "all") => void;
  approvePairing: (id: number, decidedBy: string) => Promise<void>;
  rejectPairing: (id: number, decidedBy: string, reason: string) => Promise<void>;

  fetchChannels: () => Promise<void>;
  createChannel: (body: CreateChannelBody) => Promise<NotificationChannel | null>;
  updateChannel: (id: number, body: UpdateChannelBody) => Promise<void>;
  deleteChannel: (id: number) => Promise<void>;
  setChannelSecret: (id: number, secret: string) => Promise<void>;
  testChannel: (id: number, message?: string) => Promise<ChannelTestResult | null>;
}

// Resolve config defensively at module load: any throw here would otherwise
// kill the whole bundle the moment the page is imported.
function safeInitialConfig(): { configured: boolean; baseUrl: string } {
  try {
    return resolveRegistryApiConfig();
  } catch {
    return { configured: false, baseUrl: "" };
  }
}

const initialConfig = safeInitialConfig();

export const useSetupGcpStore = create<SetupGcpState>((set, get) => ({
  pairingItems: [],
  pairingFilter: "pending",
  pairingLoading: false,
  pairingError: null,
  pairingActionInFlight: {},

  channelItems: [],
  channelsLoading: false,
  channelsError: null,
  channelActionInFlight: {},
  lastChannelTest: {},

  configured: initialConfig.configured,
  baseUrl: initialConfig.baseUrl,

  refreshConfig: () => {
    try {
      const cfg = resolveRegistryApiConfig();
      set({ configured: cfg.configured, baseUrl: cfg.baseUrl });
    } catch {
      set({ configured: false, baseUrl: "" });
    }
  },

  fetchPairing: async (filter) => {
    const useFilter = filter ?? get().pairingFilter;
    set({ pairingLoading: true, pairingError: null, pairingFilter: useFilter });
    try {
      const items = await pairingApi.list(useFilter);
      set({
        pairingItems: Array.isArray(items) ? items : [],
        pairingLoading: false,
      });
    } catch (err) {
      // Never let this throw out — surface as error state so the page can
      // render a friendly panel instead of unmounting the React tree.
      set({
        pairingError: describeError(err, get().baseUrl),
        pairingLoading: false,
        pairingItems: [],
      });
    }
  },

  setPairingFilter: (filter) => {
    set({ pairingFilter: filter });
    void get().fetchPairing(filter);
  },

  approvePairing: async (id, decidedBy) => {
    set((s) => ({ pairingActionInFlight: { ...s.pairingActionInFlight, [id]: true } }));
    try {
      await pairingApi.approve(id, { decided_by: decidedBy });
      await get().fetchPairing();
    } catch (err) {
      set({ pairingError: toMessage(err) });
    } finally {
      set((s) => {
        const next = { ...s.pairingActionInFlight };
        delete next[id];
        return { pairingActionInFlight: next };
      });
    }
  },

  rejectPairing: async (id, decidedBy, reason) => {
    set((s) => ({ pairingActionInFlight: { ...s.pairingActionInFlight, [id]: true } }));
    try {
      await pairingApi.reject(id, { decided_by: decidedBy, reason });
      await get().fetchPairing();
    } catch (err) {
      set({ pairingError: toMessage(err) });
    } finally {
      set((s) => {
        const next = { ...s.pairingActionInFlight };
        delete next[id];
        return { pairingActionInFlight: next };
      });
    }
  },

  fetchChannels: async () => {
    set({ channelsLoading: true, channelsError: null });
    try {
      const items = await channelsApi.list();
      set({
        channelItems: Array.isArray(items) ? items : [],
        channelsLoading: false,
      });
    } catch (err) {
      set({
        channelsError: describeError(err, get().baseUrl),
        channelsLoading: false,
        channelItems: [],
      });
    }
  },

  createChannel: async (body) => {
    try {
      const created = await channelsApi.create(body);
      await get().fetchChannels();
      return created;
    } catch (err) {
      set({ channelsError: toMessage(err) });
      return null;
    }
  },

  updateChannel: async (id, body) => {
    set((s) => ({ channelActionInFlight: { ...s.channelActionInFlight, [id]: true } }));
    try {
      await channelsApi.update(id, body);
      await get().fetchChannels();
    } catch (err) {
      set({ channelsError: toMessage(err) });
    } finally {
      set((s) => {
        const next = { ...s.channelActionInFlight };
        delete next[id];
        return { channelActionInFlight: next };
      });
    }
  },

  deleteChannel: async (id) => {
    set((s) => ({ channelActionInFlight: { ...s.channelActionInFlight, [id]: true } }));
    try {
      await channelsApi.delete(id);
      await get().fetchChannels();
    } catch (err) {
      set({ channelsError: toMessage(err) });
    } finally {
      set((s) => {
        const next = { ...s.channelActionInFlight };
        delete next[id];
        return { channelActionInFlight: next };
      });
    }
  },

  setChannelSecret: async (id, secret) => {
    set((s) => ({ channelActionInFlight: { ...s.channelActionInFlight, [id]: true } }));
    try {
      await channelsApi.setSecret(id, { secret_value: secret });
      await get().fetchChannels();
    } catch (err) {
      set({ channelsError: toMessage(err) });
    } finally {
      set((s) => {
        const next = { ...s.channelActionInFlight };
        delete next[id];
        return { channelActionInFlight: next };
      });
    }
  },

  testChannel: async (id, message) => {
    set((s) => ({ channelActionInFlight: { ...s.channelActionInFlight, [id]: true } }));
    try {
      const result = await channelsApi.test(id, message ? { message } : {});
      set((s) => ({ lastChannelTest: { ...s.lastChannelTest, [id]: result } }));
      // refresh so last_test_at / last_test_result reflect server state
      await get().fetchChannels();
      return result;
    } catch (err) {
      const msg = toMessage(err);
      const failure: ChannelTestResult = { ok: false, detail: msg };
      set((s) => ({
        lastChannelTest: { ...s.lastChannelTest, [id]: failure },
        channelsError: msg,
      }));
      return failure;
    } finally {
      set((s) => {
        const next = { ...s.channelActionInFlight };
        delete next[id];
        return { channelActionInFlight: next };
      });
    }
  },
}));
