# Consolidación del sistema visual

Esta revisión aplica el alcance ampliado aprobado: normalización visual y limpieza
de código, además de las sustituciones exactas de los pasos iniciales.

## Cambios por hoja

| Hoja actual | Trabajo realizado |
| --- | --- |
| `globals.css` | Tokens como fuente de valores; cuerpo de 16px; controles de 44px; estados compartidos; navegación móvil desplazable; integra calendario y recordatorios de `calendar-refinements.css`. |
| `editor.css` | Integra `editor-modern.css` y reglas del editor/previsualización antes repartidas en globals y refinements. Tipografía legible, campos y cabecera adaptables, densidad amplia. |
| `notifications.css` | Integra `notification-settings.css`; colores, tamaños, espacios y radios centralizados. |
| `my-day.css` | Tarjetas de densidad normal, metadatos legibles y controles consistentes. |
| `media-gallery.css` | Tarjetas, selección, acciones y diálogos usan tokens; conserva rejilla responsive. |
| `schedule-studio.css` | Estados con la misma paleta del calendario; tipografía y espaciado normalizados. |
| `company-switcher.css` | Elimina texto de 7px y normaliza selector, acciones y desplegable. |
| `company-module.css` | Formularios y guardado persistente consumen tokens. |
| `login/login.css` | Tipografía/contraste normalizados; los selectores decorativos de preview quedan acotados al login para no afectar al editor. |

Hay nueve hojas de interfaz, más un único archivo de tokens. Las tres hojas
eliminadas se integraron en sus propietarios; no se creó una hoja de overrides.
Se retiraron 36 reglas sin referencias y 15 declaraciones duplicadas conservando
la declaración posterior del mismo selector y contexto responsive.

## Componentes y archivos

- `module-navigation.tsx` comparte las seis opciones de escritorio y móvil y su tipo.
  Conserva el callback que protege la navegación con cambios pendientes.
- Los iconos de componentes consumen la escala `--icon-*`.
- Completar/reprogramar tareas y activar avisos son acciones secundarias. En
  cronogramas, Descargar PDF es la acción primaria; Crear publicación es secundaria.
- El formulario de tarea conserva Guardar como acción primaria mientras está abierto.
- Se corrigieron separadores visibles `?` del cronograma y texto de prueba del README.
- Se retiraron los cinco SVG de ejemplo sin referencias: `file`, `globe`, `next`,
  `vercel` y `window`. Se conserva `public/sw.js`.
- No se eliminaron módulos de plantillas, migraciones ni respaldos: siguen teniendo
  referencias y mantienen compatibilidad de datos existentes.

## Reglas y decisiones

`DESIGN.md` registra la normalización, el mapeo de estados y las excepciones
estructurales. Los colores de estado se heredan desde un único selector por estado.
Los radios geométricos y tamaños de panel no amplían la escala de espaciado.
El inventario del paso 1.B permanece como registro histórico, no como lista actual
de defectos pendientes.

## Validación

- `npm.cmd run check`: ESLint, tipos y cuatro pruebas del sistema visual.
- `npm.cmd test`: calendario, almacenamiento, migraciones, autenticación y push.
- `npm.cmd run build`: compilación de producción y generación de rutas.
- `git diff --check`: integridad del diff.

Las pruebas de diseño verifican imports y tokens existentes, ausencia de colores
y medidas fijas fuera de tokens, escala tipográfica, contraste de las parejas
definidas y mapeo único de estados. No sustituyen una comprobación del renderizado.

No hubo un navegador conectado disponible durante esta revisión. Queda pendiente
la inspección visual del calendario, editor, biblioteca y login en 320/390/768/1440px,
con teclado, textos largos, estados vacíos y contenido abundante. El contraste
completo de elementos superpuestos a imágenes también requiere esa revisión.
