export interface StopData {
    id: number;
    name: string;
    slug: string;
    order: number;
    qrCode: string;
    /** SVG map coordinates (percentage-based) */
    mapX: number;
    mapY: number;
}

export const STOPS: StopData[] = [
    {
        id: 1,
        name: "Antiguo Museo de San Fernando",
        slug: "museo",
        order: 1,
        qrCode: "stop-1",
        mapX: 20,
        mapY: 15,
    },
    {
        id: 2,
        name: "Iglesia Mayor",
        slug: "iglesia-mayor",
        order: 2,
        qrCode: "stop-2",
        mapX: 35,
        mapY: 30,
    },
    {
        id: 3,
        name: "Ayuntamiento de San Fernando",
        slug: "ayuntamiento",
        order: 3,
        qrCode: "stop-3",
        mapX: 50,
        mapY: 50,
    },
    {
        id: 4,
        name: "Real Teatro de las Cortes",
        slug: "teatro-cortes",
        order: 4,
        qrCode: "stop-4",
        mapX: 65,
        mapY: 65,
    },
    {
        id: 5,
        name: "Tienda El Dragón Rojo",
        slug: "dragon-rojo",
        order: 5,
        qrCode: "stop-5",
        mapX: 80,
        mapY: 82,
    },
];

export function getStopByQrCode(qrCode: string): StopData | undefined {
    return STOPS.find((s) => s.qrCode === qrCode);
}

export function getStopById(id: number): StopData | undefined {
    return STOPS.find((s) => s.id === id);
}
