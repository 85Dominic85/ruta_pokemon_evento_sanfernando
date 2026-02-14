import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ruta Pokémon San Fernando — 30 Aniversario",
  description:
    "Recorre San Fernando capturando Pokémon locales en una ruta a pie de 5 paradas. ¡Celebra el 30 aniversario!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Ruta Pokémon San Fernando",
    description: "¡Captura 5 Pokémon locales en la ruta del 30 aniversario!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="pokeball-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
