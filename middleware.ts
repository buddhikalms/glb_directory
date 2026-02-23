import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const { nextUrl, auth: session } = request;
  const pathname = nextUrl.pathname;
  const role = session?.user?.role;
  const isLoggedIn = Boolean(session?.user);

  if (!isLoggedIn && (pathname.startsWith("/admin") || pathname.startsWith("/dashboard"))) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  if (pathname.startsWith("/dashboard") && role !== "business_owner") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
