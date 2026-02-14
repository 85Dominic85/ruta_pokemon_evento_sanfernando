"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STOPS } from "@/lib/stops";
import { POKEMON_LOCAL } from "@/lib/pokemon";

interface CaptureData {
    pokemonId: number;
}

function QRScannerModal({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(true);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function startScanner() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                // Try native BarcodeDetector first
                if ("BarcodeDetector" in window) {
                    const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({ formats: ["qr_code"] });
                    const scanFrame = async () => {
                        if (cancelled || !videoRef.current || !scanning) return;
                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            for (const barcode of barcodes) {
                                const match = barcode.rawValue.match(/\/catch\/(stop-\d+)/);
                                if (match) {
                                    stopStream();
                                    router.push(`/catch/${match[1]}`);
                                    return;
                                }
                            }
                        } catch { /* frame detection error, continue */ }
                        if (!cancelled) requestAnimationFrame(scanFrame);
                    };
                    requestAnimationFrame(scanFrame);
                } else {
                    // Fallback: html5-qrcode
                    const { Html5Qrcode } = await import("html5-qrcode");
                    const scanner = new Html5Qrcode("qr-reader-hidden");
                    await scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            const match = decodedText.match(/\/catch\/(stop-\d+)/);
                            if (match) {
                                scanner.stop().catch(() => {});
                                stopStream();
                                router.push(`/catch/${match[1]}`);
                            }
                        },
                        () => {} // ignore errors
                    );
                }
            } catch {
                if (!cancelled) setError("No se pudo acceder a la cámara. Permite el acceso en los ajustes del navegador.");
            }
        }

        startScanner();
        return () => {
            cancelled = true;
            stopStream();
        };
    }, [router, stopStream, scanning]);

    return (
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
        >
            <h2 className="page-title" style={{ marginBottom: "var(--space-md)", fontSize: "0.9rem" }}>
                📷 Escanea el QR
            </h2>

            {error ? (
                <div style={{ textAlign: "center" }}>
                    <p className="error-msg" style={{ marginBottom: "var(--space-lg)" }}>{error}</p>
                </div>
            ) : (
                <div style={{
                    position: "relative",
                    width: "min(300px, 80vw)",
                    height: "min(300px, 80vw)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: "3px solid var(--color-primary)",
                    boxShadow: "var(--shadow-glow)",
                }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                        playsInline
                        muted
                    />
                    {/* Scan overlay corners */}
                    <div style={{
                        position: "absolute",
                        inset: "20%",
                        border: "2px solid var(--color-primary)",
                        borderRadius: "var(--radius-sm)",
                        opacity: 0.6,
                        pointerEvents: "none",
                    }} />
                </div>
            )}

            <p className="page-subtitle" style={{ marginTop: "var(--space-md)", fontSize: "0.75rem" }}>
                Apunta al código QR de la parada
            </p>

            {/* Hidden div for html5-qrcode fallback */}
            <div id="qr-reader-hidden" style={{ display: "none" }} />

            <button
                onClick={() => { stopStream(); onClose(); }}
                className="btn btn-secondary btn-small"
                style={{
                    position: "absolute",
                    bottom: "var(--space-lg)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    minHeight: "44px",
                    minWidth: "120px",
                }}
            >
                Cerrar
            </button>
        </div>
    );
}

export default function MapPage() {
    const router = useRouter();
    const [captures, setCaptures] = useState<CaptureData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);

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

    // Calculate which stops are visible
    // A stop is visible if: captured, or it's the next one after the last captured
    const capturedOrders = STOPS.filter((stop) => {
        const pokemon = POKEMON_LOCAL.find((p) => p.stopId === stop.id);
        return pokemon && capturedPokemonIds.includes(pokemon.id);
    }).map((s) => s.order);

    const maxVisibleOrder = capturedOrders.length > 0 ? Math.max(...capturedOrders) + 1 : 1;
    const visibleStops = STOPS.filter((s) => s.order <= maxVisibleOrder);

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

                        {/* Route path - only between visible stops */}
                        {visibleStops.length >= 2 && (
                            <path
                                d={visibleStops.reduce((d, stop, i) => {
                                    const x = stop.mapX * 4;
                                    const y = stop.mapY * 5;
                                    if (i === 0) return `M ${x} ${y}`;
                                    const prev = visibleStops[i - 1];
                                    const px = prev.mapX * 4;
                                    const py = prev.mapY * 5;
                                    return `${d} C ${px + 40} ${py + 30}, ${x - 40} ${y - 30}, ${x} ${y}`;
                                }, "")}
                                fill="none"
                                stroke="rgba(255, 203, 5, 0.3)"
                                strokeWidth="3"
                                strokeDasharray="8 6"
                            />
                        )}

                        {/* Stop markers - only visible stops */}
                        {visibleStops.map((stop) => {
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

                                    {/* Stop number or ? */}
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
                                        {isCaptured ? stop.order : "?"}
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
                                        {isCaptured
                                            ? (stop.name.length > 25 ? stop.name.slice(0, 22) + "…" : stop.name)
                                            : "❓ Encuentra el QR"
                                        }
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

                {/* Capture button */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="btn btn-primary"
                    style={{
                        width: "100%",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        padding: "var(--space-md) var(--space-xl)",
                    }}
                >
                    📷 Escanear QR
                </button>

                {/* Navigation */}
                <div className="nav-bar">
                    <Link href="/pokedex" className="nav-link">📖 Pokédex</Link>
                    <Link href="/finish" className="nav-link">🏆 Finalizar</Link>
                </div>

                {progress === 5 && (
                    <div className="animate-fade-in" style={{ textAlign: "center" }}>
                        <Link href="/finish" className="btn btn-secondary" style={{ width: "100%" }}>
                            🎉 ¡Ruta Completa! Ver premio
                        </Link>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
        </div>
    );
}
