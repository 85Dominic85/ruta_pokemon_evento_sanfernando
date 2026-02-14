import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
    if (!(await isAdminAuthenticated(request))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("query") ?? "";
    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
    const limit = 20;

    const where = query
        ? {
            OR: [
                { email: { contains: query, mode: "insensitive" as const } },
                { nick: { contains: query, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [participants, total] = await Promise.all([
        prisma.participant.findMany({
            where,
            include: {
                captures: { include: { pokemon: true } },
                finish: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.participant.count({ where }),
    ]);

    return NextResponse.json({
        ok: true,
        participants,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}
