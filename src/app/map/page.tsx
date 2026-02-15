"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STOPS, type StopData } from "@/lib/stops";
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
    const [lastScanned, setLastScanned] = useState("");

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
                            if (barcodes.length > 0) {
                                setLastScanned(barcodes[0].rawValue);
                            }
                            for (const barcode of barcodes) {
                                const match = barcode.rawValue.match(/(?:^|\/catch\/|code=)(stop-\d+)/);
                                if (match) {
                                    stopStream();
                                    router.push(`/catch/${match[1]}`);
                                    return;
                                }
                            }
                        } catch (e) {
                            // ignore frame errors 
                        }
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
                            const match = decodedText.match(/(?:^|\/catch\/)(stop-\d+)/);
                            if (match) {
                                scanner.stop().catch(() => { });
                                stopStream();
                                router.push(`/catch/${match[1]}`);
                            }
                        },
                        () => { } // ignore errors
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

            {/* Debug info */}
            <div style={{
                marginTop: "10px",
                padding: "8px",
                background: "rgba(0,0,0,0.5)",
                borderRadius: "4px",
                fontSize: "0.7rem",
                color: "#ffc",
                maxWidth: "90%",
                wordBreak: "break-all",
                textAlign: "center"
            }}>
                DEBUG: {lastScanned || "Esperando..."}
            </div>

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
        </div >
    );
}

function MapMarkers({ stops, capturedPokemonIds, size = "small" }: { stops: StopData[]; capturedPokemonIds: number[]; size?: "small" | "large" }) {
    const markerSize = size === "large" ? 38 : 30;
    const fontSize = size === "large" ? "12px" : "10px";
    const labelSize = size === "large" ? "9px" : "7px";
    const labelNameSize = size === "large" ? "8px" : "6px";
    const borderWidth = size === "large" ? 5 : 4;

    return (
        <>
            {stops.map((stop) => {
                const pokemon = POKEMON_LOCAL.find((p) => p.stopId === stop.id);
                const isCaptured = pokemon && capturedPokemonIds.includes(pokemon.id);
                const isNext = !isCaptured;
                return (
                    <div
                        key={stop.id}
                        style={{
                            position: "absolute",
                            left: `${stop.mapX}%`,
                            top: `${stop.mapY}%`,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    >
                        <div
                            className={isNext ? "map-marker-pulse" : ""}
                            style={{
                                width: `${markerSize}px`, height: `${markerSize}px`,
                                borderRadius: "50%",
                                background: isCaptured ? "#FFCB05" : "#FFFFFF",
                                border: `${borderWidth}px solid #1a1a2e`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: isCaptured
                                    ? "0 0 0 2px rgba(255,203,5,0.6), 0 0 12px rgba(255,203,5,0.5), 0 2px 8px rgba(0,0,0,0.6)"
                                    : "0 0 0 2px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.6)",
                                fontSize, fontWeight: "bold",
                                color: isCaptured ? "#1a1a2e" : "#FF0000",
                                fontFamily: "'Press Start 2P', monospace",
                            }}
                        >
                            {isCaptured ? stop.order : "?"}
                        </div>
                        {/* Label */}
                        <div style={{
                            position: "absolute",
                            top: "100%", left: "50%",
                            transform: "translateX(-50%)",
                            whiteSpace: "nowrap",
                            fontSize: labelSize, fontWeight: 700,
                            color: isCaptured ? "#FFF" : "#ddd",
                            background: "rgba(0,0,0,0.8)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            marginTop: "3px",
                            textAlign: "center",
                        }}>
                            {isCaptured
                                ? (stop.name.length > 22 ? stop.name.slice(0, 19) + "..." : stop.name)
                                : "Encuentra el QR"
                            }
                            {isCaptured && pokemon && (
                                <div style={{ color: "#4ade80", fontSize: labelNameSize, fontFamily: "'Press Start 2P'" }}>
                                    {pokemon.name}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

function FullMapModal({ onClose, stops, capturedPokemonIds }: { onClose: () => void; stops: StopData[]; capturedPokemonIds: number[] }) {
    return (
        <div
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.95)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                zIndex: 200, padding: "var(--space-sm)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: "relative",
                    maxWidth: "100vw", maxHeight: "85dvh",
                    overflow: "auto",
                    touchAction: "manipulation",
                    WebkitOverflowScrolling: "touch",
                    borderRadius: "var(--radius-lg)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Inner wrapper sizes to the image so markers use correct % base */}
                <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                        src="/images/mapa_ruta_pokeballs.png"
                        alt="Mapa de la Ruta Pokémon"
                        style={{
                            width: "max(100vw, 600px)", height: "auto",
                            display: "block", imageRendering: "pixelated",
                        }}
                    />
                    <MapMarkers stops={stops} capturedPokemonIds={capturedPokemonIds} size="large" />
                </div>
            </div>

            <p style={{
                color: "rgba(255,255,255,0.5)", fontSize: "0.65rem",
                marginTop: "var(--space-sm)", textAlign: "center",
            }}>
                Desliza para explorar
            </p>

            <button
                onClick={onClose}
                className="btn btn-secondary btn-small"
                style={{
                    marginTop: "var(--space-sm)",
                    minHeight: "44px", minWidth: "120px",
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
    const [allStops, setAllStops] = useState<StopData[]>(STOPS);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [showFullMap, setShowFullMap] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem("pokemon_email");
        if (!email) {
            router.push("/welcome");
            return;
        }

        // Fetch dynamic stop positions from API
        fetch("/api/stops")
            .then((res) => res.json())
            .then((data) => {
                if (data.ok && data.stops.length > 0) {
                    setAllStops(data.stops);
                }
            })
            .catch(() => { /* fallback to static STOPS */ });

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
    const capturedOrders = allStops.filter((stop) => {
        const pokemon = POKEMON_LOCAL.find((p) => p.stopId === stop.id);
        return pokemon && capturedPokemonIds.includes(pokemon.id);
    }).map((s) => s.order);

    const maxVisibleOrder = capturedOrders.length > 0 ? Math.max(...capturedOrders) + 1 : 1;
    const visibleStops = allStops.filter((s) => s.order <= maxVisibleOrder);

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
                    <h1 className="page-title">Mapa de Ruta</h1>
                    <p className="page-subtitle">San Fernando, Cadiz</p>
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

                {/* Pixel Art Map */}
                <div
                    style={{
                        position: "relative", width: "100%",
                        borderRadius: "var(--radius-lg)", overflow: "hidden",
                        cursor: "pointer",
                        border: "2px solid rgba(255,203,5,0.3)",
                    }}
                    onClick={() => setShowFullMap(true)}
                >
                    <img
                        src="/images/mapa_ruta_pokeballs.png"
                        alt="Mapa de la Ruta Pokemon"
                        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
                    />
                    <MapMarkers stops={visibleStops} capturedPokemonIds={capturedPokemonIds} size="small" />

                    {/* Hint overlay */}
                    <div style={{
                        position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)",
                        background: "rgba(0,0,0,0.65)", borderRadius: "var(--radius-sm)",
                        padding: "3px 10px", fontSize: "0.6rem", color: "rgba(255,255,255,0.8)",
                        whiteSpace: "nowrap", pointerEvents: "none",
                    }}>
                        Toca para ampliar
                    </div>
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
                    Escanear QR
                </button>

                {/* Navigation */}
                <div className="nav-bar">
                    <Link href="/pokedex" className="nav-link">Pokedex</Link>
                    <Link href="/finish" className="nav-link">Finalizar</Link>
                </div>

                {progress === 5 && (
                    <div className="animate-fade-in" style={{ textAlign: "center" }}>
                        <Link href="/finish" className="btn btn-secondary" style={{ width: "100%" }}>
                            Ruta Completa! Ver premio
                        </Link>
                    </div>
                )}
            </div>

            {/* Full Map Modal */}
            {showFullMap && (
                <FullMapModal
                    onClose={() => setShowFullMap(false)}
                    stops={visibleStops}
                    capturedPokemonIds={capturedPokemonIds}
                />
            )}

            {/* QR Scanner Modal */}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
        </div>
    );
}
