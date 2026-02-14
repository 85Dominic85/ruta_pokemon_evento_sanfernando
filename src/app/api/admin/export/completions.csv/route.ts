import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const completions = await prisma.finish.findMany({
        include: { participant: true },
        orderBy: { issuedAt: "desc" },
    });

    const csvHeader = "Email,Nick,Código,Emitido,Verificado\n";
    const csvRows = completions
        .map((f) =>
            [
                f.participant.email,
                `"${f.participant.nick}"`,
                f.finishCode,
                f.issuedAt.toISOString(),
                f.verifiedAt?.toISOString() ?? "",
            ].join(",")
        )
        .join("\n");

    return new NextResponse(csvHeader + csvRows, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": "attachment; filename=completados.csv",
        },
    });
}
