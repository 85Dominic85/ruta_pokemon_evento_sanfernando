# Informe Tecnico — Ruta Pokemon San Fernando (30 Aniversario)

## Resumen del Proyecto

Web app mobile-first para un evento de ruta andante tematica Pokemon en San Fernando, Cadiz, con motivo de su 30 aniversario. Los participantes recorren 5 paradas fisicas escaneando codigos QR para "capturar" Pokemon locales inspirados en la gastronomia y cultura gaditana.

- **URL de produccion:** https://ruta-pokemon-evento-sanfernando.vercel.app
- **Repositorio:** https://github.com/85Dominic85/ruta_pokemon_evento_sanfernando
- **Base de datos:** PostgreSQL en Neon (serverless) — Region EU Central

---

## Stack Tecnologico

| Componente | Tecnologia | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React + TypeScript | 19.2.3 |
| ORM | Prisma + adapter PrismaPg | 7.4.0 |
| Base de datos | PostgreSQL en Neon | Serverless |
| Hosting | Vercel | Auto-deploy desde `main` |
| Fuentes | Press Start 2P (pixel) + Inter (body) | — |
| Escaneo QR | html5-qrcode + BarcodeDetector API | 2.3.8 |
| Generacion QR | qrcode | 1.5.4 |
| Imagenes | sharp (procesamiento) | — |
| IDs | uuid | 13.0.0 |

---

## Los 5 Pokemon Locales

| ID | Nombre | Parada | Imagen | Descripcion |
|---|---|---|---|---|
| 001 | Tortillita | Antiguo Museo de San Fernando | 684.9 KB | Nacida del mar gaditano, Tortillita cruje con cada paso y deja un aroma irresistible a su alrededor. |
| 002 | Bienmesabe | Iglesia Mayor | 635.5 KB | Dulce y misterioso, Bienmesabe seduce con su textura suave y su poder reconfortante. |
| 003 | Camaron | Ayuntamiento de San Fernando | 549.7 KB | Agil como las corrientes de la Bahia, Camaron salta entre las olas con energia inagotable. |
| 004 | Canaila | Real Teatro de las Cortes | 654.9 KB | Astuta y callejera, Canaila conoce cada rincon de San Fernando y siempre encuentra un atajo. |
| 005 | Salmarin | Tienda El Dragon Rojo | 711.3 KB | Guardian de las salinas, Salmarin brilla bajo el sol con cristales de sal en su piel. |

Cada Pokemon tiene ademas una miniatura recortada (~60KB) para la vista de grid en la Pokedex.

---

## Funcionalidades Implementadas

### 1. Registro de Participantes
- Formulario con email y nickname
- Validacion de email contra allowlist configurable
- Consentimiento de datos obligatorio
- Cookie de sesion con UUID para identificar al participante

### 2. Sistema de Captura
- Escaneo de QR fisicos en cada parada → captura del Pokemon asociado
- Animacion de Pokeball CSS pura (drop → wobble × 3 → pulse → click dorado)
- Delay minimo de 2.8 segundos para asegurar la experiencia visual completa
- Prevencion de capturas duplicadas
- Las paradas se pueden activar/desactivar desde el admin

### 3. Pokedex
- Grid con miniaturas recortadas mostrando solo la ilustracion del Pokemon
- Pokemon no capturados aparecen en silueta/bloqueados
- Modal detalle con descripcion (flavor text leido desde base de datos)
- Vista fullscreen de alta calidad (95vw × 85dvh) para ver detalles de la carta
- Botones siempre visibles en barra fija inferior del modal

### 4. Mapa de Ruta
- Mapa SVG con las 5 paradas geolocalizadas en San Fernando
- **Descubrimiento progresivo:** solo se ven las paradas capturadas + la siguiente
- Paradas capturadas: marcador amarillo con glow + nombre del Pokemon
- Siguiente parada: marcador gris con "?" y texto "Encuentra el QR"
- **Escaner QR integrado** directamente en el mapa (sin salir de la app)
  - Usa BarcodeDetector API nativo (Chrome/Android, Safari iOS 16.4+)
  - Fallback a html5-qrcode para navegadores sin soporte nativo
  - Camara trasera por defecto (`facingMode: "environment"`)

### 5. Panel de Administracion (`/admin`)
- Login con contrasena protegido por cookie httpOnly (24h)
- Auth guard: redirige a login si no hay sesion valida
- **Metricas en tiempo real:**
  - Total participantes, capturas, completados
  - Capturas desglosadas por Pokemon
- **Gestion de participantes:**
  - Busqueda por email o nick con paginacion
  - Otorgar capturas manualmente (dropdown por Pokemon)
  - Revocar capturas (click en badge)
- **Gestion de paradas:** activar/desactivar individualmente
- **Exportacion CSV:** participantes y completados
- **Verificacion de codigos:** validar codigos de finalizacion
- **Logout:** boton de cerrar sesion que elimina la cookie

### 6. Sistema de Finalizacion
- Al capturar los 5 Pokemon → se genera un codigo unico de 8 caracteres
- QR verificable por los organizadores desde el panel admin
- Registro de timestamp de emision y verificacion

---

## Esquema de Base de Datos

```
Participant
├── id          (UUID, PK)
├── email       (String, unique)
├── nick        (String)
├── consentAt   (DateTime)
├── createdAt   (DateTime)
├── lastSeenAt  (DateTime)
├── captures[]  → Capture
└── finish?     → Finish

Stop
├── id      (Int, PK)
├── name    (String)
├── slug    (String)
├── order   (Int)
├── qrCode  (String, unique)
├── active  (Boolean, default true)
└── pokemon[] → PokemonLocal

PokemonLocal
├── id         (Int, PK)
├── name       (String)
├── imagePath  (String)
├── flavorText (String)
├── stopId     (Int, FK → Stop)
└── captures[] → Capture

Capture
├── id            (UUID, PK)
├── participantId (UUID, FK → Participant)
├── pokemonId     (Int, FK → PokemonLocal)
├── capturedAt    (DateTime)
└── UNIQUE(participantId, pokemonId)

Finish
├── id            (UUID, PK)
├── participantId (UUID, FK → Participant, unique)
├── finishCode    (String, unique)
├── issuedAt      (DateTime)
└── verifiedAt    (DateTime?)
```

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── globals.css              # Estilos globales + animaciones Pokeball
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Landing page
│   ├── welcome/page.tsx         # Registro de participantes
│   ├── catch/[code]/page.tsx    # Captura de Pokemon (QR)
│   ├── map/page.tsx             # Mapa con ruta progresiva + escaner QR
│   ├── pokedex/page.tsx         # Coleccion con thumbnails + fullscreen
│   ├── finish/page.tsx          # Pantalla de finalizacion
│   ├── legal/page.tsx           # Informacion legal
│   ├── admin/
│   │   ├── page.tsx             # Panel admin (metricas, participantes, paradas)
│   │   └── login/page.tsx       # Login admin
│   └── api/
│       ├── participant/
│       │   ├── upsert/route.ts  # Crear/actualizar participante
│       │   └── me/route.ts      # Datos del participante + pokedex
│       ├── catch/route.ts       # Registrar captura
│       ├── finish/route.ts      # Generar codigo de finalizacion
│       └── admin/
│           ├── login/route.ts   # Login (set cookie)
│           ├── logout/route.ts  # Logout (clear cookie)
│           ├── metrics/route.ts # Metricas generales
│           ├── participants/route.ts  # Lista paginada
│           ├── grant-capture/route.ts # Otorgar captura
│           ├── revoke-capture/route.ts # Revocar captura
│           ├── stop/toggle/route.ts   # Activar/desactivar parada
│           ├── verify-finish/route.ts # Verificar codigo
│           └── export/
│               ├── participants.csv/route.ts
│               └── completions.csv/route.ts
├── lib/
│   ├── prisma.ts           # Cliente Prisma singleton
│   ├── pokemon.ts          # Datos estaticos de Pokemon locales
│   ├── stops.ts            # Datos estaticos de paradas
│   ├── admin-auth.ts       # Verificacion de autenticacion admin
│   ├── emailAllowlist.ts   # Validacion de emails permitidos
│   └── rate-limit.ts       # Rate limiting para APIs
├── prisma/
│   ├── schema.prisma       # Esquema de BD
│   └── seed.ts             # Script de seed
└── public/
    ├── pokemon-local/      # Imagenes de cartas + thumbnails
    └── qr-codes/           # QR codes generados para las 5 paradas
```

---

## Changelog Completo

| # | Commit | Tipo | Descripcion |
|---|---|---|---|
| 1 | `f8428ec` | Feature | Proyecto inicial completo: App Router, Prisma, APIs, UI, admin |
| 2 | `4427ba5` | Fix | Script postinstall para generar Prisma client en Vercel |
| 3 | `8b80b58` | Fix | DATABASE_URL opcional para CI/CD sin conexion a BD |
| 4 | `abece0d` | Fix | Eliminar middleware.ts deprecated (auth inline en rutas) |
| 5 | `e56b326` | Feature | Formato de imagen JPG (primer intento) |
| 6 | `a1b4449` | Fix | Cambio a formato PNG |
| 7 | `565fef7` | Feature | 5 imagenes PNG de cartas alta resolucion |
| 8 | `35f80ea` | Fix | Corregir renderizado (eliminar pixelated, respetar aspect ratio) |
| 9 | `311112a` | Performance | PNG → WebP: de 40MB total a 860KB |
| 10 | `0bb8ba6` | Fix | Actualizar seed con rutas .webp |
| 11 | `356ee32` | Feature | Volver a PNG optimizado, leer datos de BD, corregir modal |
| 12 | `9275e2d` | Feature | Miniaturas recortadas, vista fullscreen, thumbPath |
| 13 | `716d832` | Feature | Animacion Pokeball CSS + botones siempre accesibles |
| 14 | `cfd1c42` | Feature | Escaner QR integrado + mapa con paradas progresivas |
| 15 | `be7a132` | Fix | Auth guard admin, credentials en fetch, logout |

---

## Optimizaciones de Rendimiento

| Aspecto | Antes | Despues | Mejora |
|---|---|---|---|
| Imagenes de carta | ~8 MB/carta (40 MB total) | ~650 KB/carta (3.2 MB total) | -92% |
| Miniaturas grid | No existian | ~60 KB cada una | Carga rapida |
| Animaciones | — | CSS puro (0 KB JS) | Sin dependencias |
| Mapa | Todas las paradas visibles | Solo las necesarias | Menos carga visual |

---

## Variables de Entorno

| Variable | Descripcion | Requerida |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Neon) | Si |
| `ADMIN_PASSWORD` | Contrasena del panel de administracion | Si |
| `NEXT_PUBLIC_BASE_URL` | URL base de la app | No (default localhost:3000) |

---

## Estado Actual

- [x] Registro de participantes con email y nick
- [x] Captura de 5 Pokemon mediante QR en paradas fisicas
- [x] Pokedex con miniaturas, detalle y vista fullscreen
- [x] Mapa con descubrimiento progresivo de paradas
- [x] Escaner QR integrado en la app
- [x] Animacion de captura Pokeball
- [x] Panel admin completo con metricas y gestion
- [x] Exportacion CSV
- [x] Sistema de finalizacion con codigo verificable
- [x] Desplegado en produccion (Vercel + Neon)
- [x] Auth guard en panel admin con cookie httpOnly

---

*Informe generado el 14 de febrero de 2026*
*Proyecto desarrollado para Antigravity — Ruta Pokemon San Fernando 30 Aniversario*
