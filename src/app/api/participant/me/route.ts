import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/emailAllowlist";

export async function GET(request: NextRequest) {
    try {
        const email = request.nextUrl.searchParams.get("email");

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
                captures: {
                    include: { pokemon: true },
                },
                finish: true,
            },
        });

        if (!participant) {
            return NextResponse.json(
                { ok: false, error: "Participante no encontrado." },
                { status: 404 }
            );
        }

        // Update lastSeenAt
        await prisma.participant.update({
            where: { id: participant.id },
            data: { lastSeenAt: new Date() },
        });

        const capturedIds = participant.captures.map((c) => c.pokemonId);
        const progress = capturedIds.length;

        // Leer Pokémon desde BD para tener datos actualizados (flavorText, imagePath, etc.)
        const allPokemon = await prisma.pokemonLocal.findMany({ orderBy: { id: "asc" } });
        const pokedex = allPokemon.map((p) => ({
            id: p.id,
            name: p.name,
            imagePath: p.imagePath,
            thumbPath: p.imagePath.replace(".png", "-thumb.png"),
            flavorText: p.flavorText,
            stopId: p.stopId,
            captured: capturedIds.includes(p.id),
        }));

        return NextResponse.json({
            ok: true,
            participant: {
                id: participant.id,
                nick: participant.nick,
                email: participant.email,
                createdAt: participant.createdAt,
            },
            progress,
            captures: participant.captures,
            pokedex,
            finished: !!participant.finish,
            finishCode: participant.finish?.finishCode ?? null,
        });
    } catch (error) {
        console.error("Error in participant/me:", error);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}
