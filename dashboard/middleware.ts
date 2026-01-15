import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name for onboarding status
const ONBOARDING_COOKIE = "nestly-onboarding-complete";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get onboarding status from cookie
  const onboardingComplete = request.cookies.get(ONBOARDING_COOKIE)?.value === "true";

  // If user is on landing/welcome page and is onboarded, redirect to dashboard
  if ((pathname === "/landing" || pathname === "/welcome") && onboardingComplete) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is on onboarding and already completed, redirect to dashboard
  if (pathname === "/onboarding" && onboardingComplete) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow all other requests to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match specific paths that need onboarding checks
    "/onboarding",
    "/landing",
    "/welcome",
  ],
};
