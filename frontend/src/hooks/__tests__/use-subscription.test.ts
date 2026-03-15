import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@/api/services/billing.service";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

function createSubscription(
  tier: Subscription["tier"],
  status: Subscription["status"],
): Subscription {
  return {
    id: "sub-1",
    userId: "user-1",
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
    stripePriceId: "price_123",
    tier,
    status,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialStart: null,
    trialEnd: null,
    createdAt: "2026-03-15T00:00:00.000Z",
    updatedAt: "2026-03-15T00:00:00.000Z",
  };
}

describe("useSubscriptionStatus", () => {
  const mockUseQuery = vi.mocked(useQuery);

  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("returns isPro=true for an active PRO subscription", () => {
    mockUseQuery.mockReturnValue({
      data: createSubscription("PRO", "ACTIVE"),
      isLoading: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.isPro).toBe(true);
    expect(result.current.isFree).toBe(false);
    expect(result.current.tier).toBe("PRO");
  });

  it("returns isPro=true for a trialing PREMIUM subscription", () => {
    mockUseQuery.mockReturnValue({
      data: createSubscription("PREMIUM", "TRIALING"),
      isLoading: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.isPro).toBe(true);
    expect(result.current.isPremium).toBe(true);
  });

  it("returns isPro=false for a FREE subscription", () => {
    mockUseQuery.mockReturnValue({
      data: createSubscription("FREE", "ACTIVE"),
      isLoading: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.isPro).toBe(false);
    expect(result.current.isFree).toBe(true);
    expect(result.current.tier).toBe("FREE");
  });

  it("returns isPro=false and isFree=true when no subscription exists", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.isPro).toBe(false);
    expect(result.current.isFree).toBe(true);
    expect(result.current.status).toBeNull();
  });
});
