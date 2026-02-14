import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEmail, normalizeEmail } from "@/lib/emailAllowlist";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        if (!rateLimit(ip, 10, 60_000)) {
            return NextResponse.json(
                { ok: false, error: "Demasiadas solicitudes. Espera un momento." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { nick, email, consent } = body;

        if (!nick || typeof nick !== "string" || nick.trim().length < 1) {
            return NextResponse.json(
                { ok: false, error: "El nick es obligatorio." },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { ok: false, error: "El email es obligatorio." },
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);
        const validation = validateEmail(normalizedEmail);
        if (!validation.valid) {
            return NextResponse.json(
                { ok: false, error: validation.error },
                { status: 400 }
            );
        }

        if (!consent) {
            return NextResponse.json(
                { ok: false, error: "Debes aceptar el consentimiento." },
                { status: 400 }
            );
        }

        const participant = await prisma.participant.upsert({
            where: { email: normalizedEmail },
            update: {
                nick: nick.trim(),
                lastSeenAt: new Date(),
            },
            create: {
                email: normalizedEmail,
                nick: nick.trim(),
                consentAt: new Date(),
            },
        });

        return NextResponse.json({ ok: true, participantId: participant.id });
    } catch (error) {
        console.error("Error in participant upsert:", error);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
