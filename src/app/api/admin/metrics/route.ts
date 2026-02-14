import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [totalParticipants, totalCaptures, totalCompletions, capturesByPokemon] =
        await Promise.all([
            prisma.participant.count(),
            prisma.capture.count(),
            prisma.finish.count(),
            prisma.capture.groupBy({
                by: ["pokemonId"],
                _count: { pokemonId: true },
            }),
        ]);

    return NextResponse.json({
        ok: true,
        metrics: {
            totalParticipants,
            totalCaptures,
            totalCompletions,
            capturesByPokemon,
        },
    });
}
