"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FinishPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "incomplete" | "complete" | "error">("loading");
    const [finishCode, setFinishCode] = useState("");
    const [nick, setNick] = useState("");
    const [email, setEmail] = useState("");
    const [progress, setProgress] = useState(0);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem("pokemon_email");
        const storedNick = localStorage.getItem("pokemon_nick");
        if (!storedEmail) {
            router.push("/welcome");
            return;
        }

        setEmail(storedEmail);
        if (storedNick) setNick(storedNick);

        // Attempt to finish
        fetch("/api/finish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedEmail }),
        })
            .then((res) => res.json())
            .then(async (data) => {
                if (data.ok) {
                    setFinishCode(data.finishCode);
                    // Generate QR
                    try {
                        const QRCode = (await import("qrcode")).default;
                        const baseUrl = window.location.origin;
                        const qrUrl = `${baseUrl}/api/admin/verify-finish?code=${data.finishCode}`;
                        const dataUrl = await QRCode.toDataURL(qrUrl, {
                            width: 256,
                            margin: 2,
                            color: {
                                dark: "#FFCB05",
                                light: "#1a1a2e",
                            },
                        });
                        setQrDataUrl(dataUrl);
                    } catch {
                        // QR generation failed, just show code
                    }
                    setStatus("complete");
                } else {
                    setProgress(data.progress ?? 0);
                    setStatus("incomplete");
                }
            })
            .catch(() => {
                setStatus("error");
            });
    }, [router]);

    if (status === "loading") {
        return (
            <div className="page-container">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (status === "incomplete") {
        return (
            <div className="page-container">
                <div className="page-content" style={{ justifyContent: "center", minHeight: "80dvh" }}>
                    <div className="animate-fade-in" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                        <div style={{ fontSize: "4rem" }}>🏃</div>
                        <h1 className="page-title">¡Sigue explorando!</h1>
                        <p className="page-subtitle">
                            Te faltan <strong style={{ color: "var(--color-primary)" }}>{5 - progress}</strong> paradas para completar la ruta.
                        </p>

                        <div className="progress-container">
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${(progress / 5) * 100}%` }} />
                            </div>
                            <span className="progress-text">{progress}/5</span>
                        </div>

                        <Link href="/map" className="btn btn-primary" style={{ width: "100%" }}>
                            🗺️ Ver Mapa
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="page-container">
                <div className="page-content" style={{ justifyContent: "center", minHeight: "80dvh", textAlign: "center" }}>
                    <div style={{ fontSize: "3rem" }}>😿</div>
                    <p className="error-msg">Error al verificar tu progreso. Inténtalo de nuevo.</p>
                    <Link href="/map" className="btn btn-secondary">Volver al mapa</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-content" style={{ justifyContent: "center", minHeight: "80dvh" }}>
                <div className="animate-bounce-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)", textAlign: "center" }}>
                    {/* Trophy header */}
                    <div>
                        <div style={{ fontSize: "4rem", marginBottom: "var(--space-md)" }}>🏆</div>
                        <h1 className="page-title">¡Ruta Completada!</h1>
                        <p className="page-subtitle">
                            ¡Enhorabuena, <strong style={{ color: "var(--color-primary)" }}>{nick}</strong>!
                        </p>
                        <p className="page-subtitle">
                            Has capturado los 5 Pokémon de San Fernando.
                        </p>
                    </div>

                    {/* Finish card */}
                    <div className="pokemon-card">
                        <p style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--color-text-muted)", marginBottom: "var(--space-md)" }}>
                            Tu código de finalización
                        </p>
                        <p style={{
                            fontFamily: "var(--font-pixel)",
                            fontSize: "1.5rem",
                            color: "var(--color-primary)",
                            letterSpacing: "4px",
                            marginBottom: "var(--space-lg)",
                        }}>
                            {finishCode}
                        </p>

                        {qrDataUrl && (
                            <div style={{ margin: "0 auto" }}>
                                <img
                                    src={qrDataUrl}
                                    alt="QR de finalización"
                                    width={200}
                                    height={200}
                                    style={{ borderRadius: "var(--radius-md)", imageRendering: "pixelated" }}
                                />
                                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "var(--space-sm)" }}>
                                    Muestra este QR para verificar
                                </p>
                            </div>
                        )}

                        <canvas ref={canvasRef} style={{ display: "none" }} />

                        <div style={{ marginTop: "var(--space-lg)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            <p>📧 {email}</p>
                            <p>👤 {nick}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="nav-bar">
                        <Link href="/map" className="nav-link">🗺️ Mapa</Link>
                        <Link href="/pokedex" className="nav-link">📖 Pokédex</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
