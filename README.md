# FocusMRK

Panel personal para planificar contenido de Instagram, TikTok y Facebook. Incluye calendario y agenda, biblioteca multimedia, vista previa, cronogramas PDF y PowerPoint, respaldos y recordatorios. La publicación en redes es manual.

## Almacenamiento

Con DATABASE_URL, las publicaciónes y archivos se guardan en PostgreSQL. PANEL_USER y PANEL_PASSWORD protegen el panel. Consulta .env.example para las variables de Dokploy; nunca subas sus valores a Git.

Sin DATABASE_URL, se usa localStorage para publicaciónes e IndexedDB para archivos. Este modo no sincroniza dispositivos. Los respaldos conservan las plantillas antiguas por compatibilidad, aunque el editor ya no ofrece ese módulo.

El servidor rechaza guardados con versiones desactualizadas. El cliente impide guardados simultáneos e importaciones basadas en datos que cambiaron. Ante conflictos entre dispositivos, conserva el texto pendiente y recarga antes de guardar.

## Estructura

- components/calendar/: calendario, editor, biblioteca, cronogramas y recordatorios.
- lib/calendar.ts y lib/backup.ts: validación y compatibilidad de datos.
- lib/media.ts: biblioteca local o remota; las miniaturas consultan un archivo por identificador.
- lib/database.ts: pool PostgreSQL e inicialización transaccional de tablas.
- app/api/: rutas privadas de publicaciónes, archivos y suscripciones push.
- scripts/: generación de claves y envío programado de recordatorios.
- tests/: pruebas de datos, respaldos, rutas PostgreSQL y recordatorios.

## Desarrollo y validación

Ejecuta npm.cmd ci y npm.cmd run dev. Abre http://localhost:3000.
El despliegue usa Node.js 22; las pruebas requieren Node.js 24 por su soporte nativo de TypeScript y hooks de resolución.

- npm.cmd run check: ESLint y TypeScript.
- npm.cmd test: pruebas con PGlite temporal y servicio push simulado.
- npm.cmd run build: compilación de producción.
- npm.cmd run start: servidor de producción (requiere build).

## Recordatorios para iPhone

Consulta [la configuración de notificaciones](docs/iphone-push.md). El envío con la aplicación cerrada requiere claves VAPID y la tarea programada en Dokploy. Configurar las variables por sí solo no programa los envíos.
pruebas jrhe