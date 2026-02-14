import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/emailAllowlist";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { ok: false, error: "Email requerido." },
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        const participant = await prisma.participant.findUnique({
            where: { email: normalizedEmail },
            include: {
                captures: true,
                finish: true,
            },
        });

        if (!participant) {
            return NextResponse.json(
                { ok: false, error: "Participante no encontrado." },
                { status: 404 }
            );
        }

        if (participant.captures.length < 5) {
            return NextResponse.json(
                {
                    ok: false,
                    error: `Te faltan ${5 - participant.captures.length} capturas para completar la ruta.`,
                    progress: participant.captures.length,
                },
                { status: 400 }
            );
        }

        // Already finished
        if (participant.finish) {
            return NextResponse.json({
                ok: true,
                finishCode: participant.finish.finishCode,
                issuedAt: participant.finish.issuedAt,
            });
        }

        // Generate finish
        const finishCode = uuidv4().slice(0, 8).toUpperCase();

        const finish = await prisma.finish.create({
            data: {
                participantId: participant.id,
                finishCode,
            },
        });

        return NextResponse.json({
            ok: true,
            finishCode: finish.finishCode,
            issuedAt: finish.issuedAt,
        });
    } catch (error) {
        console.error("Error in finish:", error);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
