"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PokemonInfo {
    id: number;
    name: string;
    imagePath: string;
    flavorText: string;
}

function ConfettiEffect() {
    const colors = ["#FFCB05", "#FF0000", "#3B4CCA", "#4ade80", "#fff"];
    return (
        <div className="confetti-container">
            {Array.from({ length: 30 }).map((_, i) => (
                <div
                    key={i}
                    className="confetti-piece"
                    style={{
                        left: `${Math.random() * 100}%`,
                        backgroundColor: colors[i % colors.length],
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`,
                        borderRadius: Math.random() > 0.5 ? "50%" : "0",
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
        </div>
    );
}

export default function CatchPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const router = useRouter();
    const [pokemon, setPokemon] = useState<PokemonInfo | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "capturing" | "captured" | "already" | "error">("loading");
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem("pokemon_email");
        if (!email) {
            router.push(`/welcome?next=/catch/${code}`);
            return;
        }
        setStatus("ready");
    }, [code, router]);

    const handleCapture = useCallback(async () => {
        const email = localStorage.getItem("pokemon_email");
        if (!email) return;

        setStatus("capturing");
        setError("");

        try {
            const res = await fetch("/api/catch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!data.ok) {
                setError(data.error || "Error al capturar.");
                setStatus("error");
                return;
            }

            setPokemon(data.pokemon);
            setProgress(data.progress);

            if (data.alreadyCaptured) {
                setStatus("already");
            } else {
                setStatus("captured");
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 4000);
            }
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
            setStatus("error");
        }
    }, [code]);

    // Auto-trigger capture when ready
    useEffect(() => {
        if (status === "ready") {
            handleCapture();
        }
    }, [status, handleCapture]);

    if (status === "loading") {
        return (
            <div className="page-container">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {showConfetti && <ConfettiEffect />}
            <div className="page-content" style={{ justifyContent: "center", minHeight: "80dvh" }}>
                {status === "capturing" && (
                    <div style={{ textAlign: "center" }} className="animate-fade-in">
                        <div style={{ fontSize: "4rem", marginBottom: "var(--space-lg)" }}>
                            <span style={{ display: "inline-block", animation: "pokeball-spin 1s linear infinite" }}>⚪</span>
                        </div>
                        <h2 className="page-title">Capturando…</h2>
                        <p className="page-subtitle">La Pokéball se agita…</p>
                    </div>
                )}

                {status === "captured" && pokemon && (
                    <div className="animate-bounce-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "var(--space-sm)" }}>🎉</div>
                            <h2 className="page-title">¡Capturado!</h2>
                        </div>

                        <div className="pokemon-card">
                            <div className="pokemon-image-container">
                                <img
                                    src={pokemon.imagePath}
                                    alt={pokemon.name}
                                    width={180}
                                    height={180}
                                />
                            </div>
                            <h3 className="pokemon-name">{pokemon.name}</h3>
                            <p className="pokemon-flavor">{pokemon.flavorText}</p>
                        </div>

                        <div className="progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${(progress / 5) * 100}%` }} />
                            </div>
                            <span className="progress-text">{progress}/5</span>
                        </div>

                        <Link href="/map" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
                            🗺️ Ver Mapa
                        </Link>

                        {progress === 5 && (
                            <Link href="/finish" className="btn btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                🏆 ¡Ruta Completa!
                            </Link>
                        )}
                    </div>
                )}

                {status === "already" && pokemon && (
                    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "var(--space-sm)" }}>✅</div>
                            <h2 className="page-title">Ya capturado</h2>
                            <p className="page-subtitle">Ya tienes a {pokemon.name} en tu Pokédex</p>
                        </div>

                        <div className="pokemon-card">
                            <div className="pokemon-image-container">
                                <img
                                    src={pokemon.imagePath}
                                    alt={pokemon.name}
                                    width={180}
                                    height={180}
                                />
                            </div>
                            <h3 className="pokemon-name">{pokemon.name}</h3>
                            <p className="pokemon-flavor">{pokemon.flavorText}</p>
                        </div>

                        <Link href="/map" className="btn btn-primary" style={{ width: "100%", textAlign: "center" }}>
                            🗺️ Ver Mapa
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="animate-fade-in" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                        <div style={{ fontSize: "3rem" }}>😿</div>
                        <h2 className="page-title">Oops</h2>
                        <p className="error-msg" style={{ textAlign: "center" }}>{error}</p>
                        <button onClick={handleCapture} className="btn btn-primary">
                            Reintentar
                        </button>
                        <Link href="/map" className="nav-link" style={{ display: "block" }}>
                            Volver al mapa
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
