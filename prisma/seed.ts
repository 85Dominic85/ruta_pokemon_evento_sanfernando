import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed stops
    const stops = [
        { id: 1, name: "Antiguo Museo de San Fernando", slug: "museo", order: 1, qrCode: "stop-1", active: true, mapX: 65.4, mapY: 19.2 },
        { id: 2, name: "Iglesia Mayor", slug: "iglesia-mayor", order: 2, qrCode: "stop-2", active: true, mapX: 54.3, mapY: 33.3 },
        { id: 3, name: "Ayuntamiento de San Fernando", slug: "ayuntamiento", order: 3, qrCode: "stop-3", active: true, mapX: 16.1, mapY: 60.2 },
        { id: 4, name: "Real Teatro de las Cortes", slug: "teatro-cortes", order: 4, qrCode: "stop-4", active: true, mapX: 28.8, mapY: 31.8 },
        { id: 5, name: "Tienda El Dragón Rojo", slug: "dragon-rojo", order: 5, qrCode: "stop-5", active: true, mapX: 36.3, mapY: 22.7 },
    ];

    for (const stop of stops) {
        await prisma.stop.upsert({
            where: { id: stop.id },
            update: stop,
            create: stop,
        });
    }
    console.log("✅ Stops seeded");

    // Seed Pokémon
    const pokemon = [
        { id: 1, name: "Tortillita", imagePath: "/pokemon-local/001-tortillita.png", flavorText: "Nacida del mar gaditano, Tortillita cruje con cada paso y deja un aroma irresistible a su alrededor.", stopId: 1 },
        { id: 2, name: "Bienmesabe", imagePath: "/pokemon-local/002-bienmesabe.png", flavorText: "Dulce y misterioso, Bienmesabe seduce con su textura suave y su poder reconfortante.", stopId: 2 },
        { id: 3, name: "Camarón", imagePath: "/pokemon-local/003-camaron.png", flavorText: "Ágil como las corrientes de la Bahía, Camarón salta entre las olas con energía inagotable.", stopId: 3 },
        { id: 4, name: "Cañaíla", imagePath: "/pokemon-local/004-canaila.png", flavorText: "Astuta y callejera, Cañaíla conoce cada rincón de San Fernando y siempre encuentra un atajo.", stopId: 4 },
        { id: 5, name: "Salmarín", imagePath: "/pokemon-local/005-salmarin.png", flavorText: "Guardián de las salinas, Salmarín brilla bajo el sol con cristales de sal en su piel.", stopId: 5 },
    ];

    for (const p of pokemon) {
        await prisma.pokemonLocal.upsert({
            where: { id: p.id },
            update: p,
            create: p,
        });
    }
    console.log("✅ Pokémon seeded");

    // Seed test user
    const testUser = await prisma.participant.upsert({
        where: { email: "tester@gmail.com" },
        update: {},
        create: {
            email: "tester@gmail.com",
            nick: "TestTrainer",
            consentAt: new Date(),
        },
    });

    // Give test user 2 captures (Tortillita and Bienmesabe)
    for (const pokemonId of [1, 2]) {
        await prisma.capture.upsert({
            where: {
                participantId_pokemonId: {
                    participantId: testUser.id,
                    pokemonId,
                },
            },
            update: {},
            create: {
                participantId: testUser.id,
                pokemonId,
            },
        });
    }
    console.log("✅ Test user seeded (tester@gmail.com / TestTrainer) with 2 captures");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
