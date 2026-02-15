import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { stopId, mapX, mapY } = await request.json();

    if (typeof stopId !== "number" || typeof mapX !== "number" || typeof mapY !== "number") {
        return NextResponse.json(
            { ok: false, error: "stopId (number), mapX (number) y mapY (number) son obligatorios." },
            { status: 400 }
        );
    }

    await prisma.stop.update({
        where: { id: stopId },
        data: { mapX, mapY },
    });

    return NextResponse.json({ ok: true, message: `Posición de parada ${stopId} actualizada.` });
}
