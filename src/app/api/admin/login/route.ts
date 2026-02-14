import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
        return NextResponse.json({ ok: false, error: "Contraseña incorrecta." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_token", adminPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });

    return response;
}
