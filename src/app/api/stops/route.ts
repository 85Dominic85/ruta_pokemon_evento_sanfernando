import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const stops = await prisma.stop.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            slug: true,
            order: true,
            qrCode: true,
            mapX: true,
            mapY: true,
        },
        orderBy: { order: "asc" },
    });

    return NextResponse.json({ ok: true, stops });
}
