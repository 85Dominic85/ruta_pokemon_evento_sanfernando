"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function WelcomeForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next");

    const [nick, setNick] = useState("");
    const [email, setEmail] = useState("");
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem("pokemon_email");
        const savedNick = localStorage.getItem("pokemon_nick");
        if (savedEmail) setEmail(savedEmail);
        if (savedNick) setNick(savedNick);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/participant/upsert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nick: nick.trim(),
                    email: email.trim().toLowerCase(),
                    consent,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                setError(data.error || "Error al registrarse.");
                setLoading(false);
                return;
            }

            localStorage.setItem("pokemon_email", email.trim().toLowerCase());
            localStorage.setItem("pokemon_nick", nick.trim());

            router.push(nextUrl || "/map");
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-content">
                {/* Header */}
                <div className="animate-fade-in" style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
                    <div style={{ marginBottom: "var(--space-md)" }}>
                        <img
                            src="/images/organizador.png"
                            alt="Organizador"
                            style={{ width: "120px", height: "120px", objectFit: "contain", imageRendering: "pixelated" }}
                        />
                    </div>
                    <h1 className="page-title">Ruta Pokémon<br />San Fernando</h1>
                    <p className="page-subtitle" style={{ marginTop: "var(--space-sm)" }}>
                        30 Aniversario — ¡Captura los 5 Pokémon locales!
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card animate-fade-in stagger-2" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                    <div className="input-group">
                        <label htmlFor="nick">Tu Nick de Entrenador</label>
                        <input
                            id="nick"
                            type="text"
                            className="input-field"
                            placeholder="Ash, Misty, Brock…"
                            value={nick}
                            onChange={(e) => setNick(e.target.value)}
                            required
                            maxLength={30}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder="tu@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Gmail, Outlook, iCloud, Yahoo o Proton
                        </span>
                    </div>

                    <div className="checkbox-group">
                        <input
                            id="consent"
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            required
                        />
                        <label htmlFor="consent">
                            Acepto participar en la Ruta Pokémon y el uso de mi email para el evento.{" "}
                            <Link href="/legal" style={{ color: "var(--color-primary)" }}>
                                Más info
                            </Link>
                        </label>
                    </div>

                    {error && <p className="error-msg">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: "100%" }}
                    >
                        {loading ? "Registrando…" : "⚡ Empezar Ruta"}
                    </button>
                </form>

                {/* Footer info */}
                <p className="animate-fade-in stagger-3" style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    5 paradas · 5 Pokémon · 1 ruta épica
                </p>
            </div>
        </div>
    );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={<div className="page-container"><div className="loading-spinner" /></div>}>
            <WelcomeForm />
        </Suspense>
    );
}
