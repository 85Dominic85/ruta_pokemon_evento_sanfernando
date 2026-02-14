"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STOPS } from "@/lib/stops";
import { POKEMON_LOCAL } from "@/lib/pokemon";

interface CaptureData {
    pokemonId: number;
}

export default function MapPage() {
    const router = useRouter();
    const [captures, setCaptures] = useState<CaptureData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const email = localStorage.getItem("pokemon_email");
        if (!email) {
            router.push("/welcome");
            return;
        }

        fetch(`/api/participant/me?email=${encodeURIComponent(email)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setCaptures(data.captures || []);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    const progress = captures.length;
    const capturedPokemonIds = captures.map((c) => c.pokemonId);

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-content">
                {/* Header */}
                <div style={{ textAlign: "center" }}>
                    <h1 className="page-title">🗺️ Mapa de Ruta</h1>
                    <p className="page-subtitle">San Fernando, Cádiz</p>
                </div>

                {/* Progress */}
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(progress / 5) * 100}%` }}
                        />
                    </div>
                    <span className="progress-text">{progress}/5</span>
                </div>

                {/* SVG Map */}
                <div className="card" style={{ padding: "var(--space-md)", overflow: "hidden" }}>
                    <svg
                        viewBox="0 0 400 500"
                        width="100%"
                        height="auto"
                        style={{ display: "block" }}
                    >
                        {/* Background */}
                        <defs>
                            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0f3460" />
                                <stop offset="100%" stopColor="#1a1a2e" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <rect width="400" height="500" rx="12" fill="url(#bgGrad)" />

                        {/* Grid lines */}
                        {[100, 200, 300, 400].map((y) => (
                            <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        ))}
                        {[100, 200, 300].map((x) => (
                            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        ))}

                        {/* Route path */}
                        <path
                            d={`M ${STOPS[0].mapX * 4} ${STOPS[0].mapY * 5} 
                  C ${STOPS[0].mapX * 4 + 40} ${STOPS[0].mapY * 5 + 30}, ${STOPS[1].mapX * 4 - 40} ${STOPS[1].mapY * 5 - 30}, ${STOPS[1].mapX * 4} ${STOPS[1].mapY * 5}
                  C ${STOPS[1].mapX * 4 + 40} ${STOPS[1].mapY * 5 + 30}, ${STOPS[2].mapX * 4 - 40} ${STOPS[2].mapY * 5 - 30}, ${STOPS[2].mapX * 4} ${STOPS[2].mapY * 5}
                  C ${STOPS[2].mapX * 4 + 40} ${STOPS[2].mapY * 5 + 30}, ${STOPS[3].mapX * 4 - 40} ${STOPS[3].mapY * 5 - 30}, ${STOPS[3].mapX * 4} ${STOPS[3].mapY * 5}
                  C ${STOPS[3].mapX * 4 + 40} ${STOPS[3].mapY * 5 + 30}, ${STOPS[4].mapX * 4 - 40} ${STOPS[4].mapY * 5 - 30}, ${STOPS[4].mapX * 4} ${STOPS[4].mapY * 5}`}
                            fill="none"
                            stroke="rgba(255, 203, 5, 0.3)"
                            strokeWidth="3"
                            strokeDasharray="8 6"
                        />

                        {/* Stop markers */}
                        {STOPS.map((stop) => {
                            const pokemon = POKEMON_LOCAL.find((p) => p.stopId === stop.id);
                            const isCaptured = pokemon && capturedPokemonIds.includes(pokemon.id);
                            const cx = stop.mapX * 4;
                            const cy = stop.mapY * 5;

                            return (
                                <g key={stop.id}>
                                    {/* Glow ring for captured */}
                                    {isCaptured && (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r="22"
                                            fill="none"
                                            stroke="var(--color-primary)"
                                            strokeWidth="2"
                                            opacity="0.4"
                                            filter="url(#glow)"
                                        />
                                    )}

                                    {/* Pin circle */}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r="16"
                                        fill={isCaptured ? "#FFCB05" : "#3a3a5a"}
                                        stroke={isCaptured ? "#C7A008" : "#5a5a7a"}
                                        strokeWidth="3"
                                    />

                                    {/* Stop number */}
                                    <text
                                        x={cx}
                                        y={cy + 1}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={isCaptured ? "#1a1a2e" : "#8a8aaa"}
                                        fontSize="12"
                                        fontWeight="bold"
                                        fontFamily="'Press Start 2P', monospace"
                                    >
                                        {stop.order}
                                    </text>

                                    {/* Label */}
                                    <text
                                        x={cx}
                                        y={cy + 30}
                                        textAnchor="middle"
                                        fill={isCaptured ? "#FFCB05" : "#6a6a8a"}
                                        fontSize="7"
                                        fontFamily="Inter, sans-serif"
                                        fontWeight="600"
                                    >
                                        {stop.name.length > 25 ? stop.name.slice(0, 22) + "…" : stop.name}
                                    </text>

                                    {/* Pokémon name if captured */}
                                    {isCaptured && pokemon && (
                                        <text
                                            x={cx}
                                            y={cy + 40}
                                            textAnchor="middle"
                                            fill="#4ade80"
                                            fontSize="6"
                                            fontFamily="'Press Start 2P', monospace"
                                        >
                                            ✓ {pokemon.name}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Title */}
                        <text x="200" y="480" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="'Press Start 2P', monospace">
                            San Fernando · Ruta Pokémon
                        </text>
                    </svg>
                </div>

                {/* Navigation */}
                <div className="nav-bar">
                    <Link href="/pokedex" className="nav-link">📖 Pokédex</Link>
                    <Link href="/finish" className="nav-link">🏆 Finalizar</Link>
                </div>

                {progress === 5 && (
                    <div className="animate-fade-in" style={{ textAlign: "center" }}>
                        <Link href="/finish" className="btn btn-primary" style={{ width: "100%" }}>
                            🎉 ¡Ruta Completa! Ver premio
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
