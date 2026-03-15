import { apiClient } from "@/api/client";
import { AUTH_CONFIG } from "@/config/constants";

function createJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("apiClient", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    sessionStorage.clear();
    apiClient.clearTokens();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores tokens in localStorage by default and sessionStorage for non-remembered sessions", () => {
    apiClient.setTokens("local-access", "local-refresh");

    expect(localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)).toBe(
      "local-access",
    );
    expect(localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)).toBe(
      "local-refresh",
    );
    expect(sessionStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)).toBeNull();

    apiClient.setTokens("session-access", "session-refresh", false);

    expect(sessionStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)).toBe(
      "session-access",
    );
    expect(sessionStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)).toBe(
      "session-refresh",
    );
    expect(localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("includes an Authorization header when an access token exists", async () => {
    localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, "existing-access-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
        data: { ok: true },
        timestamp: "2026-03-15T00:00:00.000Z",
      }),
    );

    await apiClient.get("/secure", true);

    const [, requestInit] = fetchMock.mock.calls[0];
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe(
      "Bearer existing-access-token",
    );
  });

  it("omits the Authorization header when no token exists", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
        data: { ok: true },
        timestamp: "2026-03-15T00:00:00.000Z",
      }),
    );

    await apiClient.get("/secure", true);

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(
      (requestInit?.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("refreshes tokens and retries the original request after a 401 response", async () => {
    localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, "expired-access-token");
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, "refresh-token");

    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            success: false,
            message: "Unauthorized",
            timestamp: "2026-03-15T00:00:00.000Z",
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          data: {
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
          },
          timestamp: "2026-03-15T00:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          success: true,
          data: { ok: true },
          timestamp: "2026-03-15T00:00:00.000Z",
        }),
      );

    await expect(apiClient.get("/secure", true)).resolves.toEqual({
      success: true,
      data: { ok: true },
      timestamp: "2026-03-15T00:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(
      ((fetchMock.mock.calls[2][1]?.headers as Record<string, string>) ?? {})
        .Authorization,
    ).toBe("Bearer new-access-token");
    expect(localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)).toBe(
      "new-access-token",
    );
    expect(localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)).toBe(
      "new-refresh-token",
    );
  });
});
