"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { POKEMON_LOCAL } from "@/lib/pokemon";

interface Participant {
    id: string;
    email: string;
    nick: string;
    createdAt: string;
    lastSeenAt: string;
    captures: { pokemonId: number; capturedAt: string; pokemon: { name: string } }[];
    finish: { finishCode: string; issuedAt: string; verifiedAt: string | null } | null;
}

interface Metrics {
    totalParticipants: number;
    totalCaptures: number;
    totalCompletions: number;
    capturesByPokemon: { pokemonId: number; _count: { pokemonId: number } }[];
}

type Tab = "metrics" | "participants" | "stops" | "verify";

export default function AdminPage() {
    const router = useRouter();
    const [authenticated, setAuthenticated] = useState(false);
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState<Tab>("metrics");
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [verifyResult, setVerifyResult] = useState<string>("");

    // Auth guard: verify cookie on mount
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/admin/metrics", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok) {
                        setAuthenticated(true);
                        setMetrics(data.metrics);
                    } else {
                        router.push("/admin/login");
                    }
                } else {
                    router.push("/admin/login");
                }
            } catch {
                router.push("/admin/login");
            } finally {
                setChecking(false);
            }
        }
        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
        router.push("/admin/login");
    };

    const fetchMetrics = useCallback(async () => {
        const res = await fetch("/api/admin/metrics", { credentials: "include" });
        const data = await res.json();
        if (data.ok) setMetrics(data.metrics);
    }, []);

    const fetchParticipants = useCallback(async (q: string, p: number) => {
        setLoading(true);
        const res = await fetch(`/api/admin/participants?query=${encodeURIComponent(q)}&page=${p}`, { credentials: "include" });
        const data = await res.json();
        if (data.ok) {
            setParticipants(data.participants);
            setTotalPages(data.totalPages);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (authenticated) fetchMetrics();
    }, [authenticated, fetchMetrics]);

    useEffect(() => {
        if (authenticated && tab === "participants") {
            fetchParticipants(search, page);
        }
    }, [authenticated, tab, search, page, fetchParticipants]);

    const handleGrant = async (email: string, pokemonId: number) => {
        const res = await fetch("/api/admin/grant-capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, pokemonId }),
            credentials: "include",
        });
        const data = await res.json();
        setMessage(data.message || data.error || "Hecho");
        fetchParticipants(search, page);
        fetchMetrics();
        setTimeout(() => setMessage(""), 3000);
    };

    const handleRevoke = async (email: string, pokemonId: number) => {
        if (!confirm("¿Seguro que quieres revocar esta captura?")) return;
        const res = await fetch("/api/admin/revoke-capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, pokemonId }),
            credentials: "include",
        });
        const data = await res.json();
        setMessage(data.message || data.error || "Hecho");
        fetchParticipants(search, page);
        fetchMetrics();
        setTimeout(() => setMessage(""), 3000);
    };

    const handleDeleteParticipant = async (participantId: string, nick: string) => {
        if (!confirm(`¿Seguro que quieres ELIMINAR a "${nick}"? Se borrarán todas sus capturas y datos. Esta acción no se puede deshacer.`)) return;
        const res = await fetch("/api/admin/delete-participant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantId }),
            credentials: "include",
        });
        const data = await res.json();
        setMessage(data.message || data.error || "Hecho");
        fetchParticipants(search, page);
        fetchMetrics();
        setTimeout(() => setMessage(""), 4000);
    };

    const handleVerify = async () => {
        const res = await fetch("/api/admin/verify-finish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ finishCode: verifyCode }),
            credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
            setVerifyResult(`✅ ${data.message} — ${data.participant.nick} (${data.participant.email})`);
        } else {
            setVerifyResult(`❌ ${data.error}`);
        }
    };

    const handleDownloadCSV = async (endpoint: string, filename: string) => {
        try {
            const res = await fetch(endpoint, { credentials: "include" });
            if (!res.ok) {
                setMessage("Error al descargar CSV");
                setTimeout(() => setMessage(""), 3000);
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setMessage("Error al descargar CSV");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    if (checking) {
        return (
            <div className="page-container" style={{ justifyContent: "center", minHeight: "100dvh" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="loading-spinner" />
                    <p style={{ marginTop: "var(--space-md)", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        Verificando acceso...
                    </p>
                </div>
            </div>
        );
    }

    if (!authenticated) return null;

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <h1 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.85rem", color: "var(--color-primary)" }}>
                    ⚙️ Admin Panel
                </h1>
                <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                    <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleDownloadCSV("/api/admin/export/participants.csv", "participantes.csv")}
                    >
                        📥 CSV Participantes
                    </button>
                    <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleDownloadCSV("/api/admin/export/completions.csv", "completados.csv")}
                    >
                        📥 CSV Completados
                    </button>
                    <button className="btn btn-small btn-danger" onClick={handleLogout}>
                        🚪 Salir
                    </button>
                </div>
            </div>

            {/* Message toast */}
            {message && (
                <div style={{
                    position: "fixed",
                    top: "var(--space-lg)",
                    right: "var(--space-lg)",
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-primary)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-md) var(--space-lg)",
                    zIndex: 200,
                    fontSize: "0.85rem",
                }}>
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className="admin-tabs">
                {(["metrics", "participants", "stops", "verify"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        className={`admin-tab ${tab === t ? "active" : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === "metrics" && "📊 Métricas"}
                        {t === "participants" && "👥 Participantes"}
                        {t === "stops" && "📍 Paradas"}
                        {t === "verify" && "✅ Verificar"}
                    </button>
                ))}
            </div>

            {/* Metrics Tab */}
            {tab === "metrics" && metrics && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{metrics.totalParticipants}</div>
                            <div className="stat-label">Participantes</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{metrics.totalCaptures}</div>
                            <div className="stat-label">Capturas</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{metrics.totalCompletions}</div>
                            <div className="stat-label">Completados</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-md)" }}>
                            Capturas por Pokémon
                        </h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Pokémon</th>
                                    <th>Capturas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {POKEMON_LOCAL.map((p) => {
                                    const count = metrics.capturesByPokemon.find((c) => c.pokemonId === p.id)?._count.pokemonId ?? 0;
                                    return (
                                        <tr key={p.id}>
                                            <td>#{String(p.id).padStart(3, "0")} {p.name}</td>
                                            <td>{count}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Participants Tab */}
            {tab === "participants" && (
                <div>
                    <div className="admin-search">
                        <input
                            className="input-field"
                            placeholder="Buscar por email o nick…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {loading ? (
                        <div className="loading-spinner" />
                    ) : (
                        <>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nick</th>
                                        <th>Email</th>
                                        <th>Capturas</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.nick}</td>
                                            <td style={{ fontSize: "0.75rem" }}>{p.email}</td>
                                            <td>
                                                {p.captures.map((c) => (
                                                    <span
                                                        key={c.pokemonId}
                                                        className="badge badge-success"
                                                        style={{ marginRight: "4px", cursor: "pointer" }}
                                                        title={`Revocar ${c.pokemon.name}`}
                                                        onClick={() => handleRevoke(p.email, c.pokemonId)}
                                                    >
                                                        {c.pokemon.name} ×
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                {p.finish ? (
                                                    <span className="badge badge-success">Completado</span>
                                                ) : (
                                                    <span className="badge badge-warning">{p.captures.length}/5</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
                                                    <select
                                                        onChange={(e) => {
                                                            const pokemonId = parseInt(e.target.value);
                                                            if (pokemonId) handleGrant(p.email, pokemonId);
                                                            e.target.value = "";
                                                        }}
                                                        className="input-field"
                                                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                                        defaultValue=""
                                                    >
                                                        <option value="">+ Otorgar</option>
                                                        {POKEMON_LOCAL.filter(
                                                            (pk) => !p.captures.some((c) => c.pokemonId === pk.id)
                                                        ).map((pk) => (
                                                            <option key={pk.id} value={pk.id}>
                                                                {pk.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="btn btn-small btn-danger"
                                                        style={{ fontSize: "0.65rem", padding: "4px 8px" }}
                                                        onClick={() => handleDeleteParticipant(p.id, p.nick)}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
                                <button
                                    className="btn btn-small btn-secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    ← Anterior
                                </button>
                                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", alignSelf: "center" }}>
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    className="btn btn-small btn-secondary"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Siguiente →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Stops Tab */}
            {tab === "stops" && <StopsManager />}

            {/* Verify Tab */}
            {tab === "verify" && (
                <div className="card" style={{ maxWidth: "500px" }}>
                    <h3 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-md)" }}>
                        Verificar Código de Finalización
                    </h3>
                    <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                        <input
                            className="input-field"
                            placeholder="Código (ej: A1B2C3D4)"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary btn-small" onClick={handleVerify}>
                            Verificar
                        </button>
                    </div>
                    {verifyResult && (
                        <p style={{ marginTop: "var(--space-md)", fontSize: "0.85rem" }}>{verifyResult}</p>
                    )}
                </div>
            )}
        </div>
    );
}

function StopsManager() {
    const [stops, setStops] = useState<{ id: number; name: string; active: boolean; qrCode: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStops = useCallback(async () => {
        // We'll use the static data + check via a simple admin endpoint
        // For MVP, use the static stops data and POST toggle
        const { STOPS } = await import("@/lib/stops");
        setStops(STOPS.map((s) => ({ id: s.id, name: s.name, active: true, qrCode: s.qrCode })));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStops();
    }, [fetchStops]);

    const handleToggle = async (stopId: number, active: boolean) => {
        await fetch("/api/admin/stop/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stopId, active }),
            credentials: "include",
        });
        setStops((prev) =>
            prev.map((s) => (s.id === stopId ? { ...s, active } : s))
        );
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="card">
            <h3 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-md)" }}>
                Gestión de Paradas
            </h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>QR Code</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {stops.map((stop) => (
                        <tr key={stop.id}>
                            <td>{stop.id}</td>
                            <td>{stop.name}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                /catch/{stop.qrCode}
                            </td>
                            <td>
                                <span className={`badge ${stop.active ? "badge-success" : "badge-error"}`}>
                                    {stop.active ? "Activa" : "Inactiva"}
                                </span>
                            </td>
                            <td>
                                <button
                                    className={`btn btn-small ${stop.active ? "btn-danger" : "btn-secondary"}`}
                                    onClick={() => handleToggle(stop.id, !stop.active)}
                                >
                                    {stop.active ? "Desactivar" : "Activar"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
