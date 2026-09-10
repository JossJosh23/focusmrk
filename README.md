# FocusMRK

Gestor local de contenido para las redes sociales de una marca. El módulo actual es un calendario editorial mensual; no publica automáticamente en las redes.

## Funciones

- Mes actual según la fecha local del dispositivo, navegación entre meses y botón Hoy.
- Crear, editar y eliminar varias publicaciones en una fecha.
- Instagram, TikTok y Facebook; una o varias redes por publicación.
- Formatos Post, Reel e Historia; pauta u orgánico.
- Título, fecha, hora prevista, estado, copy y footer con contactos/sucursales.
- Vista previa del texto, búsqueda y filtro por red social.
- Guardado local y validación de los datos recuperados.
- Confirmación antes de eliminar o descartar cambios del editor.

Los datos se guardan en `localStorage`, bajo `focusmrk.publications.v1`. Permanecen al recargar, pero no se sincronizan entre dispositivos y se pierden si se borran los datos del sitio. El estado Publicado se marca manualmente. La hora prevista no programa un envío real. Si otra pestaña modifica los datos, el calendario impide sobrescribirlos y pide recargar.

## Estructura

- `app/`: ruta principal, layout y estilos globales.
- `components/calendar/marketing-calendar.tsx`: calendario, filtros y persistencia local.
- `components/calendar/post-editor.tsx`: formulario y gestión de publicaciones del día.
- `lib/calendar.ts`: tipos, opciones, cálculo de fechas y validación del almacenamiento.
- `tests/calendar.test.mjs`: pruebas de fechas y datos guardados.
- `public/`: recursos estáticos.

## Desarrollo

```powershell
npm.cmd ci
npm.cmd run dev
```

Abre http://localhost:3000. Usa `npm.cmd` en PowerShell si `npm.ps1` está bloqueado; en otras terminales puedes utilizar `npm`.

## Validación y producción

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd run start
```

`check` ejecuta ESLint y TypeScript. Las pruebas utilizan el soporte nativo de TypeScript de Node.js 24. `start` requiere una compilación previa. Las fuentes son del sistema y no necesitan descargas durante la compilación.

## Próximas mejoras

1. Footer reutilizable por marca, con contactos y sucursales configurables.
2. Imágenes, videos y enlaces a los materiales de cada publicación.
3. Revisión y aprobación de contenido antes de marcarlo como listo.
4. Base de datos y cuentas para compartir el calendario y conservar copias de seguridad.
5. Integraciones con redes sociales para publicación automática, con estados reales de envío.
