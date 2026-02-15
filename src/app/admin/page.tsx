"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

type Tab = "metrics" | "participants" | "stops" | "mapa" | "verify";

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
                {(["metrics", "participants", "stops", "mapa", "verify"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        className={`admin-tab ${tab === t ? "active" : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === "metrics" && "📊 Métricas"}
                        {t === "participants" && "👥 Participantes"}
                        {t === "stops" && "📍 Paradas"}
                        {t === "mapa" && "🗺️ Mapa"}
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

            {/* Mapa Tab */}
            {tab === "mapa" && <MapEditor />}

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

interface MarkerStop {
    id: number;
    name: string;
    order: number;
    mapX: number;
    mapY: number;
}

function MapEditor() {
    const [stops, setStops] = useState<MarkerStop[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedStop, setSelectedStop] = useState<number | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const fetchStops = useCallback(async () => {
        try {
            const res = await fetch("/api/stops");
            const data = await res.json();
            if (data.ok) {
                setStops(data.stops.map((s: MarkerStop) => ({
                    id: s.id, name: s.name, order: s.order, mapX: s.mapX, mapY: s.mapY,
                })));
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchStops(); }, [fetchStops]);

    const getPercentCoords = useCallback((clientX: number, clientY: number) => {
        if (!mapRef.current) return null;
        const rect = mapRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        return {
            mapX: Math.round(Math.max(0, Math.min(100, x)) * 10) / 10,
            mapY: Math.round(Math.max(0, Math.min(100, y)) * 10) / 10,
        };
    }, []);

    const handleMapClick = useCallback((e: React.MouseEvent) => {
        if (selectedStop === null || dragging !== null) return;
        const coords = getPercentCoords(e.clientX, e.clientY);
        if (!coords) return;
        setStops((prev) =>
            prev.map((s) => s.id === selectedStop ? { ...s, ...coords } : s)
        );
    }, [selectedStop, dragging, getPercentCoords]);

    const handlePointerDown = useCallback((e: React.PointerEvent, stopId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(stopId);
        setSelectedStop(stopId);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (dragging === null) return;
        const coords = getPercentCoords(e.clientX, e.clientY);
        if (!coords) return;
        setStops((prev) =>
            prev.map((s) => s.id === dragging ? { ...s, ...coords } : s)
        );
    }, [dragging, getPercentCoords]);

    const handlePointerUp = useCallback(() => {
        setDragging(null);
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            for (const stop of stops) {
                await fetch("/api/admin/stop/update-position", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stopId: stop.id, mapX: stop.mapX, mapY: stop.mapY }),
                    credentials: "include",
                });
            }
            setMessage("✅ Posiciones guardadas. Los jugadores verán los cambios al recargar.");
        } catch {
            setMessage("❌ Error al guardar posiciones.");
        }
        setSaving(false);
        setTimeout(() => setMessage(""), 4000);
    }, [stops]);

    if (loading) return <div className="loading-spinner" />;

    return (
        <div>
            {/* Instructions */}
            <div className="card" style={{ marginBottom: "var(--space-md)" }}>
                <h3 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                    Editor de Marcadores del Mapa
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "var(--space-sm)" }}>
                    1. Selecciona una parada en la lista de abajo<br />
                    2. Haz click en el mapa o arrastra el marcador para reposicionarlo<br />
                    3. Pulsa &quot;Guardar posiciones&quot; para aplicar los cambios
                </p>

                {/* Stop selector */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>
                    {stops.map((stop) => (
                        <button
                            key={stop.id}
                            className={`btn btn-small ${selectedStop === stop.id ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setSelectedStop(selectedStop === stop.id ? null : stop.id)}
                            style={{ fontSize: "0.7rem", padding: "6px 10px" }}
                        >
                            {stop.order}. {stop.name}
                        </button>
                    ))}
                </div>

                {selectedStop !== null && (
                    <p style={{ fontSize: "0.75rem", color: "#4ade80" }}>
                        📍 Parada seleccionada: <strong>{stops.find((s) => s.id === selectedStop)?.name}</strong>
                        {" — "}
                        Haz click en el mapa o arrastra el marcador
                    </p>
                )}
            </div>

            {/* Map with draggable markers */}
            <div
                ref={mapRef}
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "900px",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: selectedStop !== null ? "3px solid var(--color-primary)" : "2px solid rgba(255,203,5,0.3)",
                    cursor: selectedStop !== null ? "crosshair" : "default",
                    userSelect: "none",
                    touchAction: "none",
                }}
                onClick={handleMapClick}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <img
                    src="/images/mapa_ruta_pokeballs.png"
                    alt="Mapa de la Ruta Pokémon"
                    style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated", pointerEvents: "none" }}
                    draggable={false}
                />

                {/* Markers */}
                {stops.map((stop) => {
                    const isSelected = selectedStop === stop.id;
                    const isDragging = dragging === stop.id;
                    return (
                        <div
                            key={stop.id}
                            style={{
                                position: "absolute",
                                left: `${stop.mapX}%`,
                                top: `${stop.mapY}%`,
                                transform: "translate(-50%, -50%)",
                                zIndex: isSelected || isDragging ? 30 : 10,
                                cursor: "grab",
                                touchAction: "none",
                            }}
                            onPointerDown={(e) => handlePointerDown(e, stop.id)}
                        >
                            {/* Marker circle */}
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: isSelected ? "#FFCB05" : "#FFFFFF",
                                    border: `4px solid ${isSelected ? "#FF0000" : "#1a1a2e"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    color: isSelected ? "#1a1a2e" : "#FF0000",
                                    fontFamily: "'Press Start 2P', monospace",
                                    boxShadow: isSelected
                                        ? "0 0 0 3px rgba(255,0,0,0.6), 0 0 20px rgba(255,203,5,0.7)"
                                        : "0 0 0 2px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.6)",
                                    transition: isDragging ? "none" : "box-shadow 0.2s, background 0.2s",
                                }}
                            >
                                {stop.order}
                            </div>
                            {/* Label */}
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                whiteSpace: "nowrap",
                                fontSize: "8px",
                                fontWeight: 700,
                                color: "#fff",
                                background: isSelected ? "rgba(255,0,0,0.85)" : "rgba(0,0,0,0.8)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                marginTop: "3px",
                                textAlign: "center",
                                pointerEvents: "none",
                            }}>
                                {stop.name.length > 18 ? stop.name.slice(0, 15) + "..." : stop.name}
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "7px" }}>
                                    ({stop.mapX}%, {stop.mapY}%)
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save button */}
            <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "var(--space-lg)", alignItems: "center" }}>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ minWidth: "200px" }}
                >
                    {saving ? "Guardando..." : "💾 Guardar posiciones"}
                </button>
                {message && (
                    <span style={{ fontSize: "0.85rem" }}>{message}</span>
                )}
            </div>

            {/* Coordinates table */}
            <div className="card" style={{ marginTop: "var(--space-lg)" }}>
                <h4 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.6rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                    Coordenadas actuales
                </h4>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Parada</th>
                            <th>X (%)</th>
                            <th>Y (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stops.map((stop) => (
                            <tr
                                key={stop.id}
                                style={{
                                    background: selectedStop === stop.id ? "rgba(255,203,5,0.15)" : undefined,
                                    cursor: "pointer",
                                }}
                                onClick={() => setSelectedStop(stop.id)}
                            >
                                <td>{stop.order}</td>
                                <td>{stop.name}</td>
                                <td style={{ fontFamily: "monospace" }}>{stop.mapX}</td>
                                <td style={{ fontFamily: "monospace" }}>{stop.mapY}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
