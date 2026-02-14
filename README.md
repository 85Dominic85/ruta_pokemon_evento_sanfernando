# 🎮 Ruta Pokémon San Fernando — 30 Aniversario

Web app mobile-first para una ruta a pie de 5 paradas en San Fernando (Cádiz). Los participantes escanean códigos QR en cada parada para "capturar" Pokémon locales inspirados en la gastronomía y cultura gaditana.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Base de datos**: PostgreSQL con Prisma ORM
- **Estilo**: CSS vanilla con estética retro pixel-art (Press Start 2P + Inter)
- **QR**: Generación con `qrcode` para certificados de finalización

## Pokémon Locales

| # | Nombre | Parada |
|---|--------|--------|
| 001 | Tortillita | Antiguo Museo de San Fernando |
| 002 | Bienmesabe | Iglesia Mayor |
| 003 | Camarón | Ayuntamiento de San Fernando |
| 004 | Cañaíla | Real Teatro de las Cortes |
| 005 | Salmarín | Tienda El Dragón Rojo |

## Flujo del Participante

1. **`/welcome`** — Registro con nick, email y consentimiento
2. **`/catch/[code]`** — Escanea QR → captura Pokémon con animación
3. **`/map`** — Mapa SVG con progreso (pins color/gris)
4. **`/pokedex`** — Cuadrícula con Pokémon capturados y siluetas
5. **`/finish`** — Al capturar los 5: certificado con código QR verificable

## Panel de Admin (`/admin`)

- 📊 Métricas (participantes, capturas, completados)
- 👥 Gestión de participantes (buscar, otorgar/revocar capturas)
- 📍 Activar/desactivar paradas
- ✅ Verificar códigos de finalización
- 📥 Exportar CSV (participantes y completados)

Acceso protegido por contraseña (`ADMIN_PASSWORD`).

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y ADMIN_PASSWORD

# 3. Generar cliente Prisma y migrar
npx prisma generate
npx prisma db push

# 4. Seed de paradas y Pokémon
npx prisma db seed

# 5. Arrancar dev server
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL |
| `ADMIN_PASSWORD` | Contraseña para el panel admin |
| `NEXT_PUBLIC_BASE_URL` | URL base de la app (para QR de finalización) |

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/          # API Routes (participant, catch, finish, admin)
│   ├── welcome/      # Registro
│   ├── catch/[code]/ # Captura por QR
│   ├── map/          # Mapa de ruta
│   ├── pokedex/      # Colección de Pokémon
│   ├── finish/       # Pantalla de finalización
│   ├── legal/        # Información legal
│   └── admin/        # Panel de administración
├── lib/              # Utilidades (prisma, pokemon, stops, rate-limit, email)
└── middleware.ts     # Protección de rutas admin
prisma/
├── schema.prisma     # Esquema de base de datos
└── seed.ts           # Script de seed
public/
└── pokemon-local/    # SVG de los 5 Pokémon
```

## Deploy

Despliega en [Vercel](https://vercel.com) con una base de datos PostgreSQL (ej: [Neon](https://neon.tech)):

1. Conecta el repositorio a Vercel
2. Configura las variables de entorno
3. Vercel ejecutará `npm run build` automáticamente
