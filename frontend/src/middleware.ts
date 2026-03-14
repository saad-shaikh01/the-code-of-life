import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_CONFIG, ROUTES } from "@/config/constants";

const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.DASHBOARD,
  "/puzzle",
  ROUTES.BATTLE,
  ROUTES.DAILY,
  ROUTES.CHALLENGE,
  "/leaderboard",
  ROUTES.LEADERBOARDS,
  ROUTES.ACHIEVEMENTS,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.SUBSCRIPTION,
  ROUTES.STORY,
  ROUTES.PRICING,
  "/zen-demo",
] as const;

const AUTH_ROUTE_PREFIXES = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

function matchesRoute(pathname: string, routePrefix: string): boolean {
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthSession = Boolean(
    request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value
  );

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((routePrefix) =>
    matchesRoute(pathname, routePrefix)
  );
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((routePrefix) =>
    matchesRoute(pathname, routePrefix)
  );

  if (isProtectedRoute && !hasAuthSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.LOGIN;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasAuthSession) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.DASHBOARD;
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/puzzle/:path*",
    "/battle/:path*",
    "/daily/:path*",
    "/challenge/:path*",
    "/leaderboard/:path*",
    "/leaderboards/:path*",
    "/achievements/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/subscription/:path*",
    "/story/:path*",
    "/pricing/:path*",
    "/zen-demo/:path*",
    "/login",
    "/register",
  ],
};
