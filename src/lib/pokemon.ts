export interface PokemonLocalData {
    id: number;
    name: string;
    imagePath: string;
    flavorText: string;
    stopId: number;
}

export const POKEMON_LOCAL: PokemonLocalData[] = [
    { id: 1, name: "Tortillita", imagePath: "/pokemon-local/001-tortillita.jpg", flavorText: "Nacida del mar gaditano, Tortillita cruje con cada paso y deja un aroma irresistible a su alrededor.", stopId: 1 },
    { id: 2, name: "Bienmesabe", imagePath: "/pokemon-local/002-bienmesabe.jpg", flavorText: "Dulce y misterioso, Bienmesabe seduce con su textura suave y su poder reconfortante.", stopId: 2 },
    { id: 3, name: "Camarón", imagePath: "/pokemon-local/003-camaron.jpg", flavorText: "Ágil como las corrientes de la Bahía, Camarón salta entre las olas con energía inagotable.", stopId: 3 },
    { id: 4, name: "Cañaíla", imagePath: "/pokemon-local/004-canaila.jpg", flavorText: "Astuta y callejera, Cañaíla conoce cada rincón de San Fernando y siempre encuentra un atajo.", stopId: 4 },
    { id: 5, name: "Salmarín", imagePath: "/pokemon-local/005-salmarin.jpg", flavorText: "Guardián de las salinas, Salmarín brilla bajo el sol con cristales de sal en su piel.", stopId: 5 },
];

export function getPokemonByStopId(stopId: number): PokemonLocalData | undefined {
    return POKEMON_LOCAL.find((p) => p.stopId === stopId);
}

export function getPokemonById(id: number): PokemonLocalData | undefined {
    return POKEMON_LOCAL.find((p) => p.id === id);
}
