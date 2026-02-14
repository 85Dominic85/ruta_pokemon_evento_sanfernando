import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeEmail } from "@/lib/emailAllowlist";

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { email, pokemonId } = await request.json();

    if (!email || !pokemonId) {
        return NextResponse.json(
            { ok: false, error: "Email y pokemonId son obligatorios." },
            { status: 400 }
        );
    }

    const participant = await prisma.participant.findUnique({
        where: { email: normalizeEmail(email) },
    });

    if (!participant) {
        return NextResponse.json(
            { ok: false, error: "Participante no encontrado." },
            { status: 404 }
        );
    }

    // Check if already captured
    const existing = await prisma.capture.findUnique({
        where: {
            participantId_pokemonId: {
                participantId: participant.id,
                pokemonId,
            },
        },
    });

    if (existing) {
        return NextResponse.json({
            ok: true,
            message: "Ya capturado anteriormente.",
        });
    }

    await prisma.capture.create({
        data: {
            participantId: participant.id,
            pokemonId,
        },
    });

    return NextResponse.json({ ok: true, message: "Captura otorgada." });
}
