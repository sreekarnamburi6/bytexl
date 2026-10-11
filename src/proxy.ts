import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/auth-secret";

const SESSION_COOKIE = "mediscope_session";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/uploads/")) return new NextResponse(null, { status: 404 });

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const originHeader = req.headers.get("origin");
    const requestHost = req.headers.get("host");
    const forwardedProtocol = req.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
    const requestProtocol = forwardedProtocol ?? req.nextUrl.protocol.slice(0, -1);
    const fetchSite = req.headers.get("sec-fetch-site");
    let originIsSame = true;
    if (originHeader) {
      try {
        const origin = new URL(originHeader);
        originIsSame = !!requestHost &&
          origin.host.toLowerCase() === requestHost.toLowerCase() &&
          origin.protocol === `${requestProtocol}:`;
      } catch {
        originIsSame = false;
      }
    }
    if (!originIsSame || fetchSite === "cross-site") {
      return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
    }
  }

  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(getAuthSecret()));
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (pathname.startsWith("/dashboard") && !authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirected", "1");
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/signup") && authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/api/:path*", "/uploads/:path*"],
};
