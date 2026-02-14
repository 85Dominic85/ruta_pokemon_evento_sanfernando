import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { finishCode } = await request.json();

    if (!finishCode) {
        return NextResponse.json(
            { ok: false, error: "finishCode es obligatorio." },
            { status: 400 }
        );
    }

    const finish = await prisma.finish.findUnique({
        where: { finishCode },
        include: { participant: true },
    });

    if (!finish) {
        return NextResponse.json(
            { ok: false, error: "Código de finalización no encontrado." },
            { status: 404 }
        );
    }

    if (finish.verifiedAt) {
        return NextResponse.json({
            ok: true,
            message: "Ya verificado anteriormente.",
            participant: {
                nick: finish.participant.nick,
                email: finish.participant.email,
            },
            verifiedAt: finish.verifiedAt,
        });
    }

    const updated = await prisma.finish.update({
        where: { finishCode },
        data: { verifiedAt: new Date() },
    });

    return NextResponse.json({
        ok: true,
        message: "Verificado correctamente.",
        participant: {
            nick: finish.participant.nick,
            email: finish.participant.email,
        },
        verifiedAt: updated.verifiedAt,
    });
}
