import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const participants = await prisma.participant.findMany({
        select: { email: true, nick: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
        ok: true,
        participants,
        total: participants.length,
    });
}
