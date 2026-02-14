import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { participantId } = await request.json();

    if (!participantId) {
        return NextResponse.json(
            { ok: false, error: "participantId es obligatorio." },
            { status: 400 }
        );
    }

    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { captures: true, finish: true },
    });

    if (!participant) {
        return NextResponse.json(
            { ok: false, error: "Participante no encontrado." },
            { status: 404 }
        );
    }

    // Delete in order: captures → finish → participant (no cascade in schema)
    await prisma.capture.deleteMany({
        where: { participantId },
    });

    await prisma.finish.deleteMany({
        where: { participantId },
    });

    await prisma.participant.delete({
        where: { id: participantId },
    });

    return NextResponse.json({
        ok: true,
        message: `Participante ${participant.nick} (${participant.email}) eliminado junto con ${participant.captures.length} capturas.`,
    });
}
