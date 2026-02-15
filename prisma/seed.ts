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
        { id: 1, name: "Tortillita", imagePath: "/pokemon-local/001-tortillita.png", flavorText: "Se dice que este pequeño Pokémon nació una tarde en las marismas de San Fernando, cuando el aroma del aceite caliente se mezcló con la brisa del mar. Los camarones recién traídos del estero y la masa dorada dieron forma a una criatura alegre y crujiente. Desde entonces, aparece donde hay risas, feria y buen ambiente, dejando tras de sí el inconfundible sonido de su “crujido” legendario.", stopId: 1 },
        { id: 2, name: "Bienmesabe", imagePath: "/pokemon-local/002-bienmesabe.png", flavorText: "En las aguas de San Fernando, donde el estero se funde con el Atlántico, nació Bienmesabe. Inspirado en el famoso adobo isleño, este Pokémon combina la fuerza del mar con el sabor de la tradición. Dicen que aparece cuando el viento trae aroma a freiduría y que su mordida es tan intensa como el carácter de La Isla.", stopId: 2 },
        { id: 3, name: "Camarón", imagePath: "/pokemon-local/003-camaron.png", flavorText: "Bajo la luna de La Isla, este pequeño Pokémon de una sola pinza canta con tal sentimiento que hasta las olas marcan el compás. Su voz no se escucha… se siente.", stopId: 3 },
        { id: 4, name: "Cañaílla", imagePath: "/pokemon-local/004-canaila.png", flavorText: "Vive aferrada a las rocas del estero en San Fernando. Cuando sube la marea, asoma entre la espuma, protegiéndose con su dura concha y sus afilados pinchos.", stopId: 4 },
        { id: 5, name: "Salmarín", imagePath: "/pokemon-local/005-salmarin.png", flavorText: "Nace en las salinas de San Fernando cuando el sol cristaliza la sal del estero. Silencioso y brillante, protege el paisaje reflejando la luz del atardecer sobre las aguas tranquilas.", stopId: 5 },
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
