import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { stopId, active } = await request.json();

    if (typeof stopId !== "number" || typeof active !== "boolean") {
        return NextResponse.json(
            { ok: false, error: "stopId (number) y active (boolean) son obligatorios." },
            { status: 400 }
        );
    }

    await prisma.stop.update({
        where: { id: stopId },
        data: { active },
    });

    return NextResponse.json({ ok: true, message: `Parada ${stopId} ${active ? "activada" : "desactivada"}.` });
}
