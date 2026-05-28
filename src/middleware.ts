import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-cookie";

/**
 * Protezione delle rotte /admin/*: se il cookie di sessione manca, redirect
 * a /admin/login. La VERA verifica del token avviene server-side nelle pagine
 * (qui controlliamo solo presenza, per non duplicare logica crypto in middleware).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const c = req.cookies.get(ADMIN_COOKIE_NAME);
    if (!c) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("ritorna", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
