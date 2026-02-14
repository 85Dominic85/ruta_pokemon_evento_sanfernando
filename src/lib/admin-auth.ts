import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return false;

    // Check X-Admin-Secret header
    const headerSecret = request.headers.get("x-admin-secret");
    if (headerSecret === adminPassword) return true;

    // Check admin cookie
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("admin_token");
    if (adminCookie?.value === adminPassword) return true;

    return false;
}
