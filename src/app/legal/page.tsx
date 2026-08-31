import Link from "next/link";

export default function LegalPage() {
    return (
        <div className="page-container">
            <div className="page-content" style={{ maxWidth: "640px" }}>
                <h1 className="page-title" style={{ fontSize: "0.9rem" }}>📜 Información Legal</h1>

                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                    <section>
                        <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                            Consentimiento del Evento
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                            Al participar en la Ruta Pokémon San Fernando, aceptas las siguientes condiciones:
                        </p>
                        <ul style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8, paddingLeft: "var(--space-lg)" }}>
                            <li>Tu nick y email se usarán exclusivamente para gestionar tu participación en el evento.</li>
                            <li>Los datos recopilados se utilizarán para métricas internas del evento y posibles sorteos asociados.</li>
                            <li>No compartiremos tu información con terceros ajenos al evento.</li>
                            <li>Puedes solicitar la eliminación de tus datos contactando con la organización.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                            Uso de Datos
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                            Los datos recopilados incluyen:
                        </p>
                        <ul style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8, paddingLeft: "var(--space-lg)" }}>
                            <li><strong>Nick:</strong> Tu nombre de entrenador público.</li>
                            <li><strong>Email:</strong> Para identificarte y contactarte si ganas un sorteo.</li>
                            <li><strong>Progreso:</strong> Qué paradas has visitado y qué Pokémon has capturado.</li>
                            <li><strong>Fecha de registro y última actividad.</strong></li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                            Sorteos y Premios
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                            Los participantes que completen la ruta (5/5 capturas) podrán participar en sorteos organizados
                            por los promotores del evento. Los detalles de cada sorteo se comunicarán por email.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                            Promociones de El Dragón Rojo
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                            El correo electrónico con el que te registres podrá ser utilizado por El Dragón Rojo
                            para enviarte información sobre futuras promociones, eventos y ofertas especiales.
                            Si en algún momento deseas dejar de recibir estas comunicaciones, puedes solicitarlo
                            contactando directamente con El Dragón Rojo.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontFamily: "var(--font-pixel)", fontSize: "0.65rem", color: "var(--color-primary)", marginBottom: "var(--space-sm)" }}>
                            Propiedad Intelectual
                        </h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                            Este evento es una celebración fan-made del 30 aniversario de Pokémon.
                            Los personajes y diseños utilizados en esta web son originales y no representan
                            propiedad intelectual de The Pokémon Company, Nintendo o Game Freak.
                        </p>
                    </section>
                </div>

                <div className="nav-bar">
                    <Link href="/welcome" className="nav-link">← Volver al inicio</Link>
                    <Link href="/map" className="nav-link">🗺️ Mapa</Link>
                </div>
            </div>
        </div>
    );
}
