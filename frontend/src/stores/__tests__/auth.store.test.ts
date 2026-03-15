import { AUTH_CONFIG } from "@/config/constants";
import type { AuthResponse, User } from "@/types/api.types";

const mockApiClient = {
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  hasStoredSession: vi.fn(),
};

const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  me: vi.fn(),
};

vi.mock("@/api/client", () => ({
  apiClient: mockApiClient,
}));

vi.mock("@/api/services/auth.service", () => ({
  authService: mockAuthService,
}));

interface MockStorage extends Storage {
  store: Map<string, string>;
}

function createStorageMock(): MockStorage {
  const store = new Map<string, string>();

  return {
    store,
    get length() {
      return store.size;
    },
    clear: vi.fn(() => {
      store.clear();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

function installStorageMocks() {
  const localStorageMock = createStorageMock();
  const sessionStorageMock = createStorageMock();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: sessionStorageMock,
  });
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: sessionStorageMock,
  });
}

async function loadAuthStore() {
  const { useAuthStore } = await import("@/stores/auth.store");

  useAuthStore.setState(useAuthStore.getInitialState(), true);
  useAuthStore.persist.clearStorage();
  vi.clearAllMocks();

  return useAuthStore;
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    emailVerified: false,
    username: "cipher-player",
    avatarUrl: null,
    currentLevel: 3,
    totalScore: 150,
    streakDays: 4,
    growthPoints: 80,
    growthStage: 2,
    lastPlayedAt: null,
    createdAt: "2026-03-15T00:00:00.000Z",
    ...overrides,
  };
}

function createAuthResponse(user: User): { data: AuthResponse } {
  return {
    data: {
      user,
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    },
  };
}

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.resetModules();
    installStorageMocks();
    mockApiClient.hasStoredSession.mockReturnValue(false);
  });

  it("exposes the expected initial state", async () => {
    const useAuthStore = await loadAuthStore();
    const initialState = useAuthStore.getInitialState();

    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
    expect(initialState.hasHydrated).toBe(false);
    expect(initialState.isAuthReady).toBe(false);
  });

  it("login sets the authenticated user state and persists it to session storage", async () => {
    const user = createUser();
    const useAuthStore = await loadAuthStore();

    mockAuthService.login.mockResolvedValue(createAuthResponse(user));

    await useAuthStore
      .getState()
      .login({ email: "user@example.com", password: "Password1" }, false);

    expect(mockApiClient.setTokens).toHaveBeenCalledWith(
      "access-token",
      "refresh-token",
      false,
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().rememberMe).toBe(false);
    expect(sessionStorage.getItem(AUTH_CONFIG.USER_KEY)).toContain(
      '"isAuthenticated":true',
    );
    expect(localStorage.getItem(AUTH_CONFIG.USER_KEY)).toBeNull();
  });

  it("logout clears the authenticated user state", async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.setState({
      user: createUser(),
      isAuthenticated: true,
      rememberMe: true,
      isAuthReady: true,
    });

    useAuthStore.getState().logout();

    expect(mockApiClient.clearTokens).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().rememberMe).toBe(false);
  });

  it("refreshUser fetches /auth/me when a stored session exists", async () => {
    const user = createUser({ username: "refreshed-user" });
    const useAuthStore = await loadAuthStore();

    mockApiClient.hasStoredSession.mockReturnValue(true);
    mockAuthService.me.mockResolvedValue({ data: user });

    await useAuthStore.getState().refreshUser();

    expect(mockAuthService.me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("refreshUser clears auth state when no stored session exists", async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.setState({
      user: createUser(),
      isAuthenticated: true,
      rememberMe: true,
    });
    mockApiClient.hasStoredSession.mockReturnValue(false);

    await useAuthStore.getState().refreshUser();

    expect(mockAuthService.me).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
