import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/emailAllowlist";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        if (!rateLimit(ip, 15, 60_000)) {
            return NextResponse.json(
                { ok: false, error: "Demasiadas solicitudes. Espera un momento." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email, code } = body;

        if (!email || !code) {
            return NextResponse.json(
                { ok: false, error: "Email y código son obligatorios." },
                { status: 400 }
            );
        }

        const normalizedEmail = normalizeEmail(email);

        // Find participant
        const participant = await prisma.participant.findUnique({
            where: { email: normalizedEmail },
        });

        if (!participant) {
            return NextResponse.json(
                { ok: false, error: "Participante no encontrado. Regístrate primero." },
                { status: 404 }
            );
        }

        // Find stop by QR code
        const stop = await prisma.stop.findUnique({
            where: { qrCode: code },
            include: { pokemon: true },
        });

        if (!stop) {
            return NextResponse.json(
                { ok: false, error: "Código QR no válido." },
                { status: 404 }
            );
        }

        if (!stop.active) {
            return NextResponse.json(
                { ok: false, error: "Esta parada no está activa en este momento." },
                { status: 403 }
            );
        }

        if (!stop.pokemon || stop.pokemon.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No hay Pokémon asociado a esta parada." },
                { status: 404 }
            );
        }

        const pokemonLocal = stop.pokemon[0];

        // Check if already captured
        const existingCapture = await prisma.capture.findUnique({
            where: {
                participantId_pokemonId: {
                    participantId: participant.id,
                    pokemonId: pokemonLocal.id,
                },
            },
        });

        if (existingCapture) {
            return NextResponse.json({
                ok: true,
                alreadyCaptured: true,
                pokemon: {
                    id: pokemonLocal.id,
                    name: pokemonLocal.name,
                    imagePath: pokemonLocal.imagePath,
                    flavorText: pokemonLocal.flavorText,
                },
                progress: await getProgress(participant.id),
            });
        }

        // Create capture
        await prisma.capture.create({
            data: {
                participantId: participant.id,
                pokemonId: pokemonLocal.id,
            },
        });

        const progress = await getProgress(participant.id);

        return NextResponse.json({
            ok: true,
            alreadyCaptured: false,
            pokemon: {
                id: pokemonLocal.id,
                name: pokemonLocal.name,
                imagePath: pokemonLocal.imagePath,
                flavorText: pokemonLocal.flavorText,
            },
            progress,
        });
    } catch (error) {
        console.error("Error in catch:", error);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}

async function getProgress(participantId: string): Promise<number> {
    return prisma.capture.count({
        where: { participantId },
    });
}
