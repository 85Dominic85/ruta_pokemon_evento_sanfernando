"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { POKEMON_LOCAL } from "@/lib/pokemon";

interface PokedexEntry {
    id: number;
    name: string;
    imagePath: string;
    thumbPath: string;
    flavorText: string;
    captured: boolean;
}

export default function PokedexPage() {
    const router = useRouter();
    const [pokedex, setPokedex] = useState<PokedexEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPokemon, setSelectedPokemon] = useState<PokedexEntry | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem("pokemon_email");
        if (!email) {
            router.push("/welcome");
            return;
        }

        fetch(`/api/participant/me?email=${encodeURIComponent(email)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.ok && data.pokedex) {
                    setPokedex(data.pokedex);
                } else {
                    setPokedex(
                        POKEMON_LOCAL.map((p) => ({
                            ...p,
                            captured: false,
                        }))
                    );
                }
                setLoading(false);
            })
            .catch(() => {
                setPokedex(
                    POKEMON_LOCAL.map((p) => ({ ...p, captured: false }))
                );
                setLoading(false);
            });
    }, [router]);

    const progress = pokedex.filter((p) => p.captured).length;

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
                    <h1 className="page-title">📖 Pokédex</h1>
                    <p className="page-subtitle">Colección de Pokémon locales</p>
                </div>

                {/* Progress */}
                <div className="progress-container">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(progress / 5) * 100}%` }} />
                    </div>
                    <span className="progress-text">{progress}/5</span>
                </div>

                {/* Pokémon Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "var(--space-md)",
                }}>
                    {pokedex.map((pokemon, index) => (
                        <button
                            key={pokemon.id}
                            className={`card animate-fade-in stagger-${index + 1}`}
                            style={{
                                padding: "var(--space-sm)",
                                textAlign: "center",
                                cursor: pokemon.captured ? "pointer" : "default",
                                border: pokemon.captured ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                                opacity: 1,
                                background: pokemon.captured ? "var(--color-bg-card)" : "var(--color-bg)",
                            }}
                            onClick={() => pokemon.captured && setSelectedPokemon(pokemon)}
                        >
                            <div style={{
                                width: "100%",
                                aspectRatio: "2 / 1",
                                overflow: "hidden",
                                borderRadius: "var(--radius-sm)",
                                marginBottom: "var(--space-sm)",
                            }}>
                                <img
                                    src={pokemon.thumbPath}
                                    alt={pokemon.captured ? pokemon.name : "???"}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                    className={pokemon.captured ? "" : "pokemon-silhouette"}
                                />
                            </div>
                            <p style={{
                                fontFamily: "var(--font-pixel)",
                                fontSize: "0.55rem",
                                color: pokemon.captured ? "var(--color-primary)" : "var(--color-text-muted)",
                            }}>
                                #{String(pokemon.id).padStart(3, "0")}
                            </p>
                            <p style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: pokemon.captured ? "var(--color-text)" : "var(--color-text-muted)",
                                marginTop: "var(--space-xs)",
                            }}>
                                {pokemon.captured ? pokemon.name : "???"}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Detail Modal - Card info + description */}
                {selectedPokemon && !fullscreenImage && (
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0, 0, 0, 0.85)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "var(--space-md)",
                            zIndex: 100,
                        }}
                        onClick={() => setSelectedPokemon(null)}
                    >
                        <div
                            className="pokemon-card animate-bounce-in"
                            style={{ maxWidth: "380px", width: "100%", maxHeight: "90dvh", overflowY: "auto" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Card image - clickable to fullscreen */}
                            <div
                                style={{
                                    width: "260px",
                                    maxWidth: "100%",
                                    margin: "0 auto var(--space-md)",
                                    cursor: "pointer",
                                    position: "relative",
                                }}
                                onClick={() => setFullscreenImage(true)}
                            >
                                <img
                                    src={selectedPokemon.imagePath}
                                    alt={selectedPokemon.name}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        objectFit: "contain",
                                        borderRadius: "var(--radius-md)",
                                    }}
                                />
                                <div style={{
                                    position: "absolute",
                                    bottom: "var(--space-sm)",
                                    right: "var(--space-sm)",
                                    background: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    padding: "4px 8px",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.65rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}>
                                    🔍 Ampliar
                                </div>
                            </div>

                            <p style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--color-text-muted)", marginBottom: "var(--space-sm)" }}>
                                #{String(selectedPokemon.id).padStart(3, "0")}
                            </p>
                            <h3 className="pokemon-name">{selectedPokemon.name}</h3>
                            <p className="pokemon-flavor">{selectedPokemon.flavorText}</p>

                            <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-lg)", justifyContent: "center" }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFullscreenImage(true); }}
                                    className="btn btn-primary btn-small"
                                >
                                    🔍 Ver carta
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedPokemon(null); }}
                                    className="btn btn-secondary btn-small"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fullscreen card viewer - maximum quality */}
                {selectedPokemon && fullscreenImage && (
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0, 0, 0, 0.95)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 200,
                            padding: "var(--space-md)",
                        }}
                        onClick={() => setFullscreenImage(false)}
                    >
                        <img
                            src={selectedPokemon.imagePath}
                            alt={selectedPokemon.name}
                            style={{
                                maxWidth: "95vw",
                                maxHeight: "85dvh",
                                objectFit: "contain",
                                borderRadius: "var(--radius-md)",
                            }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
                            className="btn btn-secondary btn-small"
                            style={{ marginTop: "var(--space-md)" }}
                        >
                            Volver
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div className="nav-bar">
                    <Link href="/map" className="nav-link">🗺️ Mapa</Link>
                    <Link href="/finish" className="nav-link">🏆 Finalizar</Link>
                </div>
            </div>
        </div>
    );
}
