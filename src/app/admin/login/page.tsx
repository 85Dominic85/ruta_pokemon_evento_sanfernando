"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (data.ok) {
                router.push("/admin");
            } else {
                setError(data.error || "Contraseña incorrecta.");
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ justifyContent: "center", minHeight: "100dvh" }}>
            <div className="page-content" style={{ maxWidth: "400px" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>🔒</div>
                    <h1 className="page-title" style={{ fontSize: "0.9rem" }}>Admin Panel</h1>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {error && <p className="error-msg">{error}</p>}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
                        {loading ? "Verificando…" : "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
