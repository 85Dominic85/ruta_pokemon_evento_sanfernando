import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /admin pages (except login)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
        const adminToken = request.cookies.get("admin_token")?.value;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminToken || adminToken !== adminPassword) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // Protect /api/admin/* endpoints
    if (pathname.startsWith("/api/admin")) {
        const adminPassword = process.env.ADMIN_PASSWORD;
        const headerSecret = request.headers.get("x-admin-secret");
        const adminToken = request.cookies.get("admin_token")?.value;

        if (headerSecret !== adminPassword && adminToken !== adminPassword) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
