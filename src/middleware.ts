import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-only-change-me-europauto-export-secret",
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("europauto_session")?.value;
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      role = String(payload.role ?? "");
    } catch {
      role = null;
    }
  }

  const staff = role === "ADMIN" || role === "COMMERCIAL" || role === "GESTIONNAIRE";

  if (pathname.startsWith("/espace") && !role) {
    return NextResponse.redirect(new URL("/connexion?next=" + encodeURIComponent(pathname), req.url));
  }
  if (pathname.startsWith("/admin")) {
    if (!role) return NextResponse.redirect(new URL("/connexion?next=/admin", req.url));
    if (!staff) return NextResponse.redirect(new URL("/espace", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*", "/admin/:path*"],
};
