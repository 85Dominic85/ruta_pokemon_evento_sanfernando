import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const participants = await prisma.participant.findMany({
        include: { captures: true, finish: true },
        orderBy: { createdAt: "desc" },
    });

    const csvHeader = "Email,Nick,Capturas,Completado,Fecha Registro,Última visita\n";
    const csvRows = participants
        .map((p) =>
            [
                p.email,
                `"${p.nick}"`,
                p.captures.length,
                p.finish ? "Sí" : "No",
                p.createdAt.toISOString(),
                p.lastSeenAt.toISOString(),
            ].join(",")
        )
        .join("\n");

    return new NextResponse(csvHeader + csvRows, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=participantes.csv",
        },
    });
}
