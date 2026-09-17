# Inventario CSS — Paso 1.B

Referencia: `DESIGN.md` y `app/tokens.css`. No se han aplicado tokens ni modificado las 12 hojas.

## Cómo leer la tabla

Cada fila identifica un literal distinto por declaración, con archivo, línea, selector y contexto responsive. Se incluyen colores, espacios, tamaños, radios y, adicionalmente, duraciones, números estructurales y unidades relativas. Los valores dentro de `var()` y las URL no se inventarían como hardcodes. Los colores dentro de gradientes y sombras sí se incluyen.

- **EXACTO**: existe una equivalencia numérica/cromática; no autoriza automáticamente su uso semántico.
- **PROPUESTA**: destino candidato que necesita confirmar su contexto.
- **AMBIGUO**: no hay correspondencia inequívoca; no se ha elegido un reemplazo.
- **CONFLICTO**: el valor actual contradice el sistema; corregirlo excede una sustitución que conserve medidas.
- **ESTRUCTURAL**: número/palabra de comportamiento; requiere distinguir geometría de estilo antes de decidir si necesita token.

## Decisiones pendientes

1. Mapear Aprobado y En revisión sin confundir aprobación editorial con programación.
2. Resolver la incompatibilidad entre conservar medidas/layout y elevar texto menor de 12px, ayudas a 14px, controles a 44px y espacios fuera de escala. No se redondean valores en este inventario.
3. Definir tokens faltantes para anchos de paneles, breakpoints, iconos, bordes, sombras, pesos, interlineados, opacidades, capas y proporciones, o autorizar explícitamente literales estructurales.
4. Distinguir colores de interfaz de colores de redes sociales, vista previa de teléfono y multimedia. No recolorear marcas automáticamente.
5. Eliminar duplicación de tokens globales al importar el sistema: globals.css todavía declara --accent, --background, --foreground, --muted y --border; una importación por sí sola no elimina esa competencia.

## Resumen

| Archivo | Filas | Exactos | Ambiguos | Conflictos | Propuestas | Estructurales |
|---|---:|---:|---:|---:|---:|---:|
| app/calendar-refinements.css | 325 | 75 | 182 | 11 | 3 | 54 |
| app/company-module.css | 125 | 25 | 76 | 5 | 0 | 19 |
| app/company-switcher.css | 139 | 18 | 89 | 5 | 0 | 27 |
| app/editor-modern.css | 298 | 40 | 215 | 6 | 0 | 37 |
| app/editor.css | 105 | 21 | 62 | 3 | 0 | 19 |
| app/globals.css | 1246 | 254 | 714 | 40 | 2 | 236 |
| app/login/login.css | 182 | 27 | 115 | 8 | 0 | 32 |
| app/media-gallery.css | 260 | 47 | 166 | 4 | 0 | 43 |
| app/my-day.css | 130 | 37 | 71 | 1 | 1 | 20 |
| app/notification-settings.css | 244 | 36 | 142 | 10 | 3 | 53 |
| app/notifications.css | 115 | 30 | 56 | 3 | 1 | 25 |
| app/schedule-studio.css | 144 | 33 | 77 | 2 | 0 | 32 |

## app/calendar-refinements.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .workspace .calendar-page | padding-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 2 | .workspace .calendar-page .interactive-stats .stat | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 2 | .workspace .calendar-page .interactive-stats .stat | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 3 | .interactive-stats .stat > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 3 | .interactive-stats .stat > span | color: #665b75 | #665b75 | EXACTO | --neutral-600; equivalencia de valor, revisar función semántica |
| 4 | .workspace .calendar-page .interactive-stats .stat[aria-pressed=true] | background: #f1ebfd | #f1ebfd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .workspace .calendar-page .interactive-stats .stat[aria-pressed=true] | box-shadow: inset 0 -3px #7954d4 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .workspace .calendar-page .interactive-stats .stat[aria-pressed=true] | box-shadow: inset 0 -3px #7954d4 | -3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 4 | .workspace .calendar-page .interactive-stats .stat[aria-pressed=true] | box-shadow: inset 0 -3px #7954d4 | #7954d4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .workspace .calendar-page .interactive-stats .stat:hover | background: #f7f3fd | #f7f3fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .workspace .calendar-controls.simplified-controls | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 7 | .calendar-navigation-row, .calendar-search-row | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 10 | .workspace .simplified-controls .month-navigation h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 11 | .calendar-search-row .search-field | flex: 0 1 260px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 11 | .calendar-search-row .search-field | flex: 0 1 260px | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 11 | .calendar-search-row .search-field | flex: 0 1 260px | 260px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .calendar-filter-toggle b | min-width: 20px | 20px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .calendar-filter-toggle b | height: 20px | 20px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .calendar-filter-toggle b | border-radius: 10px | 10px | EXACTO | --radius-md |
| 12 | .calendar-filter-toggle b | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 12 | .calendar-filter-toggle b | background: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 12 | .calendar-filter-toggle b | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 13 | .calendar-clear-filters | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 13 | .calendar-clear-filters | background: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 13 | .calendar-clear-filters | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 13 | .calendar-clear-filters | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 13 | .calendar-clear-filters | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 14 | .calendar-filter-panel:not([hidden]) | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 14 | .calendar-filter-panel:not([hidden]) | padding: 14px 0 0 | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 14 | .calendar-filter-panel:not([hidden]) | padding: 14px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 14 | .calendar-filter-panel:not([hidden]) | border-top: 1px solid #eae4f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 14 | .calendar-filter-panel:not([hidden]) | border-top: 1px solid #eae4f1 | #eae4f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 15 | .workspace .calendar-filter-panel .status-filter | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 17 | .calendar-filter-panel .filter-buttons button | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 18 | .calendar-paid-filter | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 18 | .calendar-paid-filter | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 18 | .calendar-paid-filter | color: #665b75 | #665b75 | EXACTO | --neutral-600; equivalencia de valor, revisar función semántica |
| 19 | .workspace .calendar-page .week-view .day-cell | min-height: 340px | 340px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 20 | @media (max-width: 640px) → .calendar-navigation-row > .segmented-control | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 20 | @media (max-width: 640px) → .calendar-navigation-row > .segmented-control button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | @media (max-width: 640px) → .calendar-search-row .search-field | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | @media (max-width: 640px) → .calendar-search-row .search-field | min-width: 150px | 150px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 20 | @media (max-width: 640px) → .workspace .calendar-page .interactive-stats .stat | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 20 | @media (max-width: 640px) → .interactive-stats .stat > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 21 | .workspace-topbar | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 21 | .workspace-topbar | padding: 12px 24px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 21 | .workspace-topbar | padding: 12px 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 21 | .workspace-topbar | padding: 12px 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 22 | .workspace-topbar .session-actions | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .reminder-bell | width: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 23 | .reminder-bell | height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 23 | .reminder-bell | border: 1px solid #fecdd3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 23 | .reminder-bell | border: 1px solid #fecdd3 | #fecdd3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .reminder-bell | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 23 | .reminder-bell | color: #be123c | #be123c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .reminder-bell | background: #fff1f2 | #fff1f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .reminder-bell:hover | background: #ffe4e6 | #ffe4e6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .reminder-bell:hover | border-color: #fda4af | #fda4af | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .reminder-badge | top: -5px | -5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .reminder-badge | right: -6px | -6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .reminder-badge | min-width: 19px | 19px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .reminder-badge | height: 19px | 19px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .reminder-badge | padding: 0 4px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .reminder-badge | padding: 0 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 25 | .reminder-badge | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 25 | .reminder-badge | background: #be123c | #be123c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .reminder-badge | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 25 | .reminder-badge | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 25 | .reminder-badge | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .reminder-badge | border: 2px solid white | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .reminder-badge | border: 2px solid white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 26 | .reminder-panel.reminder-popover | inset: 68px 24px auto auto | 68px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 26 | .reminder-panel.reminder-popover | inset: 68px 24px auto auto | 24px | EXACTO | --space-6; validar densidad si es padding |
| 26 | .reminder-panel.reminder-popover | inset: 68px 24px auto auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .reminder-panel.reminder-popover | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 26 | .reminder-panel.reminder-popover | width: min(420px, calc(100vw - 32px)) | 420px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | width: min(420px, calc(100vw - 32px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .reminder-panel.reminder-popover | width: min(420px, calc(100vw - 32px)) | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | max-height: calc(100dvh - 88px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .reminder-panel.reminder-popover | max-height: calc(100dvh - 88px) | 88px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .reminder-panel.reminder-popover | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 26 | .reminder-panel.reminder-popover | border: 1px solid #e8e3ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | border: 1px solid #e8e3ef | #e8e3ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 26 | .reminder-panel.reminder-popover | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 26 | .reminder-panel.reminder-popover | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 26 | .reminder-panel.reminder-popover | box-shadow: 0 16px 48px #30203f26 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 26 | .reminder-panel.reminder-popover | box-shadow: 0 16px 48px #30203f26 | 16px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | box-shadow: 0 16px 48px #30203f26 | 48px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .reminder-panel.reminder-popover | box-shadow: 0 16px 48px #30203f26 | #30203f26 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .reminder-popover-heading | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 28 | .reminder-popover-heading strong | font-size: 16px | 16px | EXACTO | --font-size-md |
| 29 | .reminder-popover-heading p | margin: 5px 0 0 | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 29 | .reminder-popover-heading p | margin: 5px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 30 | .reminder-popover > .secondary-button | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 30 | .reminder-popover > .secondary-button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 31 | @media (max-width: 640px) → .workspace-topbar | padding: 12px 16px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 31 | @media (max-width: 640px) → .workspace-topbar | padding: 12px 16px 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 31 | @media (max-width: 640px) → .workspace-topbar | padding: 12px 16px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 31 | @media (max-width: 640px) → .reminder-panel.reminder-popover | right: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 31 | @media (max-width: 640px) → .reminder-panel.reminder-popover | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 32 | .reminder-center > summary | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 32 | .reminder-center > summary | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 33 | .reminder-center > summary::after | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 33 | .reminder-center > summary::after | font-size: 16px | 16px | EXACTO | --font-size-md |
| 35 | .reminder-center > summary strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 36 | .reminder-center .reminder-urgent | background: #fff0ec | #fff0ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .reminder-center .reminder-urgent | color: #a7543c | #a7543c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .reminder-center .reminder-urgent | padding: 4px 8px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 36 | .reminder-center .reminder-urgent | padding: 4px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 36 | .reminder-center .reminder-urgent | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 36 | .reminder-center .reminder-urgent | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 37 | .reminder-empty | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 37 | .reminder-empty | padding: 20px 8px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 37 | .reminder-empty | padding: 20px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 37 | .reminder-empty | color: #548b75 | #548b75 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .reminder-empty strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 38 | .reminder-empty strong | color: #3e5d50 | #3e5d50 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .reminder-empty p | margin: 4px 0 0 | 4px | EXACTO | --space-1; validar densidad si es padding |
| 38 | .reminder-empty p | margin: 4px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 38 | .reminder-empty p | color: #77857d | #77857d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 39 | .reminder-tabs | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 39 | .reminder-tabs | margin: 16px 0 10px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 39 | .reminder-tabs | margin: 16px 0 10px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 39 | .reminder-tabs | margin: 16px 0 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 40 | .reminder-tabs button | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 40 | .reminder-tabs button | border: 1px solid #eee7f5 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 40 | .reminder-tabs button | border: 1px solid #eee7f5 | #eee7f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 40 | .reminder-tabs button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 40 | .reminder-tabs button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 40 | .reminder-tabs button | padding: 7px 10px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 40 | .reminder-tabs button | padding: 7px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 40 | .reminder-tabs button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 40 | .reminder-tabs button | color: #746780 | #746780 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .reminder-tabs button[aria-pressed=true] | color: #7750a6 | #7750a6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .reminder-tabs button[aria-pressed=true] | background: #f1eafa | #f1eafa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .reminder-tabs button[aria-pressed=true] | border-color: #dbc8ef | #dbc8ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .reminder-tabs b | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 42 | .reminder-center .reminder-items | max-height: 320px | 320px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 42 | .reminder-center .reminder-items | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 43 | .reminder-center .reminder-items li button | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 43 | .reminder-center .reminder-items li button | background: #faf9fc | #faf9fc | EXACTO | --neutral-50; equivalencia de valor, revisar función semántica |
| 43 | .reminder-center .reminder-items li button | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 43 | .reminder-center .reminder-items li button | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 43 | .reminder-center .reminder-items li button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 44 | .reminder-time | font-size: 13px | 13px | CONFLICTO | Posible ayuda/metadato: --font-size-meta/help exige 14px; revisar contexto |
| 44 | .reminder-time | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 44 | .reminder-time | color: #655176 | #655176 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 44 | .reminder-time | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 45 | .reminder-center .reminder-time small, .reminder-center .reminder-post small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 45 | .reminder-center .reminder-time small, .reminder-center .reminder-post small | margin-top: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 45 | .reminder-center .reminder-time small, .reminder-center .reminder-post small | color: #84788e | #84788e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 45 | .reminder-center .reminder-time small, .reminder-center .reminder-post small | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .reminder-post | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .reminder-post | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .reminder-post strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 46 | .reminder-post strong | color: #4c3b59 | #4c3b59 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .reminder-more | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .reminder-more | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 47 | .reminder-more | color: #7b579e | #7b579e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .reminder-more | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 47 | .reminder-more | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 48 | .reminder-settings | border-top: 1px solid #eee8f3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .reminder-settings | border-top: 1px solid #eee8f3 | #eee8f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .reminder-settings | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 48 | .reminder-settings | padding-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 49 | .reminder-settings > summary | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 49 | .reminder-settings > summary | color: #83768f | #83768f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .reminder-settings > summary | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 50 | .reminder-settings p | color: #83778c | #83778c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 50 | .reminder-settings p | max-width: 750px | 750px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 51 | .push-settings | padding: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 51 | .push-settings | padding: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .push-settings > strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 51 | .push-settings > strong | color: #654680 | #654680 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 51 | .push-settings .template-actions | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 51 | .push-settings + details > summary | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 51 | .push-settings + details > summary | color: #85758f | #85758f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 52 | .post-title-row | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 52 | .post-title-row | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 53 | .post-title-row strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 53 | .post-title-row strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 53 | .post-title-row strong | color: #3e304d | #3e304d | EXACTO | --neutral-800; equivalencia de valor, revisar función semántica |
| 53 | .post-title-row strong | -webkit-line-clamp: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 54 | .post-thumbnail | flex: 0 0 42px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 54 | .post-thumbnail | flex: 0 0 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .post-thumbnail | width: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .post-thumbnail | height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .post-thumbnail | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 54 | .post-thumbnail | background: #eee7fa | #eee7fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 55 | .video-thumbnail | color: #805cac | #805cac | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .day-more | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 56 | .day-more | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 56 | .day-more | background: #eee7f8 | #eee7f8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .day-more | color: #705099 | #705099 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .day-more | padding: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 56 | .day-more | margin-top: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 56 | .day-more | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 58 | @media (max-width: 640px) → .agenda-card .post-title-row | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 58 | @media (max-width: 640px) → .agenda-card .post-title-row | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 59 | .workspace .calendar-page .page-heading | margin-bottom: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | .workspace .calendar-page h1 | font-size: 25px | 25px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 60 | .workspace .calendar-page h1 | letter-spacing: -.7px | -.7px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 60 | .workspace .calendar-page h1 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 61 | .workspace .calendar-page .stats-grid | gap: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 61 | .workspace .calendar-page .stats-grid | border: 1px solid #e8e3ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 61 | .workspace .calendar-page .stats-grid | border: 1px solid #e8e3ef | #e8e3ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 61 | .workspace .calendar-page .stats-grid | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 61 | .workspace .calendar-page .stats-grid | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 61 | .workspace .calendar-page .stats-grid | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 62 | .workspace .calendar-page .stat | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 62 | .workspace .calendar-page .stat | border-right: 1px solid #eee9f4 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 62 | .workspace .calendar-page .stat | border-right: 1px solid #eee9f4 | #eee9f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 62 | .workspace .calendar-page .stat | border-radius: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 62 | .workspace .calendar-page .stat | min-height: 60px | 60px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 62 | .workspace .calendar-page .stat | padding: 12px 16px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 62 | .workspace .calendar-page .stat | padding: 12px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 62 | .workspace .calendar-page .stat | box-shadow: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 63 | .workspace .calendar-page .stat:last-child | border-right: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 64 | .workspace .calendar-page .stat > div | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 65 | .workspace .calendar-page .stat > div > span | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 65 | .workspace .calendar-page .stat > div > span | min-height: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 65 | .workspace .calendar-page .stat > div > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 65 | .workspace .calendar-page .stat > div > span | color: #665b75 | #665b75 | EXACTO | --neutral-600; equivalencia de valor, revisar función semántica |
| 66 | .workspace .calendar-page .stat strong | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 66 | .workspace .calendar-page .stat strong | font-size: 24px | 24px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 66 | .workspace .calendar-page .stat strong | color: #463456 | #463456 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 67 | .workspace .calendar-page .stat-icon, .workspace .calendar-page .stat small | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | .workspace .calendar-page .reminder-panel | padding: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | .workspace .calendar-page .reminder-panel | padding: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 68 | .workspace .calendar-page .reminder-panel | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .workspace .calendar-controls | gap: 12px 20px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 69 | .workspace .calendar-controls | gap: 12px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .workspace .calendar-controls | padding: 14px 18px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .workspace .calendar-controls | padding: 14px 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .workspace .calendar-controls | background: #fdfcfe | #fdfcfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 69 | .workspace .calendar-controls | border-radius: 14px 14px 0 0 | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 69 | .workspace .calendar-controls | border-radius: 14px 14px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 71 | .workspace .calendar-controls .calendar-filters | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 72 | .workspace .calendar-controls .view-toolbar | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 72 | .workspace .calendar-controls .view-toolbar | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 72 | .workspace .calendar-controls .view-toolbar | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 73 | .workspace .calendar-controls .month-navigation | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 74 | .workspace .calendar-controls .month-navigation h2 | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 74 | .workspace .calendar-controls .month-navigation h2 | margin-right: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 74 | .workspace .calendar-controls .month-navigation h2 | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 75 | .workspace .calendar-controls .status-filter | margin-left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 75 | .workspace .calendar-controls .status-filter | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 76 | .workspace .calendar-controls .search-field | width: 210px | 210px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 77 | .workspace .calendar-controls .search-field input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 77 | .workspace .calendar-controls .search-field input | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 78 | .workspace .calendar-page .weekdays > div | padding-block: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 78 | .workspace .calendar-page .weekdays > div | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 78 | .workspace .calendar-page .weekdays > div | color: #655a75 | #655a75 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 79 | .workspace .calendar-page .day-cell | min-height: clamp(100px, 11vh, 122px) | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 79 | .workspace .calendar-page .day-cell | min-height: clamp(100px, 11vh, 122px) | 11vh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 79 | .workspace .calendar-page .day-cell | min-height: clamp(100px, 11vh, 122px) | 122px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 79 | .workspace .calendar-page .day-cell | padding: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 80 | .workspace .calendar-page .day-heading | margin-bottom: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 80 | .workspace .calendar-page .day-heading | min-height: 26px | 26px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 81 | .workspace .calendar-page .day-number | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 81 | .workspace .calendar-page .day-number | color: #514462 | #514462 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 82 | .workspace .calendar-page .outside-month .day-number | color: #92909e | #92909e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 83 | .workspace .calendar-page .is-today .day-number | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 84 | .workspace .calendar-page .is-today | background: #f7f2fe | #f7f2fe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 85 | .workspace .calendar-page .content-item .post-card | padding: 8px 9px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 85 | .workspace .calendar-page .content-item .post-card | padding: 8px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 85 | .workspace .calendar-page .content-item .post-card | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 85 | .workspace .calendar-page .content-item .post-card | border-color: #e4dced | #e4dced | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 85 | .workspace .calendar-page .content-item .post-card | border-left: 3px solid #a39aae | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 85 | .workspace .calendar-page .content-item .post-card | border-left: 3px solid #a39aae | #a39aae | EXACTO | --neutral-400; equivalencia de valor, revisar función semántica |
| 85 | .workspace .calendar-page .content-item .post-card | box-shadow: 0 2px 5px #3e284908 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 85 | .workspace .calendar-page .content-item .post-card | box-shadow: 0 2px 5px #3e284908 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 85 | .workspace .calendar-page .content-item .post-card | box-shadow: 0 2px 5px #3e284908 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 85 | .workspace .calendar-page .content-item .post-card | box-shadow: 0 2px 5px #3e284908 | #3e284908 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 85 | .workspace .calendar-page .content-item .post-card | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 86 | .workspace .calendar-page .content-item[data-status="En revisión"] .post-card | border-left-color: #d49b35 | #d49b35 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 87 | .workspace .calendar-page .content-item[data-status="Aprobado"] .post-card | border-left-color: #4a9d79 | #4a9d79 | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 88 | .workspace .calendar-page .content-item[data-status="Publicado"] .post-card | border-left-color: #6b88c8 | #6b88c8 | PROPUESTA | --state-published-border; requiere unificar color actual |
| 89 | .workspace .calendar-page .post-card > strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 89 | .workspace .calendar-page .post-card > strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 89 | .workspace .calendar-page .post-card > strong | color: #3e304d | #3e304d | EXACTO | --neutral-800; equivalencia de valor, revisar función semántica |
| 90 | .workspace .calendar-page .post-card time, .workspace .calendar-page .post-details, .workspace .calendar-page .workflow-status | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 91 | .workspace .calendar-page .post-details | color: #74657e | #74657e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 92 | .workspace .calendar-page .post-card:hover | border-color: #bba2df | #bba2df | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 92 | .workspace .calendar-page .post-card:hover | background: #faf7ff | #faf7ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 93 | .workspace .calendar-page .calendar-footer | padding: 10px 14px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 93 | .workspace .calendar-page .calendar-footer | padding: 10px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 93 | .workspace .calendar-page .calendar-footer | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 95 | .editor-dialog.schedule-editor .social-phone | max-width: clamp(205px, calc((100dvh - 390px) * .58), 294px) | 205px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 95 | .editor-dialog.schedule-editor .social-phone | max-width: clamp(205px, calc((100dvh - 390px) * .58), 294px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 95 | .editor-dialog.schedule-editor .social-phone | max-width: clamp(205px, calc((100dvh - 390px) * .58), 294px) | 390px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 95 | .editor-dialog.schedule-editor .social-phone | max-width: clamp(205px, calc((100dvh - 390px) * .58), 294px) | .58 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 95 | .editor-dialog.schedule-editor .social-phone | max-width: clamp(205px, calc((100dvh - 390px) * .58), 294px) | 294px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 96 | .editor-dialog.schedule-editor .social-phone.immersive | max-width: clamp(190px, calc((100dvh - 335px) * .5625), 294px) | 190px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 96 | .editor-dialog.schedule-editor .social-phone.immersive | max-width: clamp(190px, calc((100dvh - 335px) * .5625), 294px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 96 | .editor-dialog.schedule-editor .social-phone.immersive | max-width: clamp(190px, calc((100dvh - 335px) * .5625), 294px) | 335px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 96 | .editor-dialog.schedule-editor .social-phone.immersive | max-width: clamp(190px, calc((100dvh - 335px) * .5625), 294px) | .5625 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 96 | .editor-dialog.schedule-editor .social-phone.immersive | max-width: clamp(190px, calc((100dvh - 335px) * .5625), 294px) | 294px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 97 | .editor-dialog.schedule-editor .social-preview .preview-settings | margin-bottom: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 98 | .editor-dialog.schedule-editor .social-preview .social-caption | max-height: 110px | 110px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 98 | .editor-dialog.schedule-editor .social-preview .social-caption | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 99 | .editor-dialog.schedule-editor .social-preview .immersive-caption .social-caption | max-height: 90px | 90px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 100 | @media (max-width: 1250px) → .workspace .calendar-controls .view-toolbar | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 100 | @media (max-width: 1250px) → .workspace .calendar-controls .view-toolbar | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 100 | @media (max-width: 1250px) → .workspace .calendar-controls .status-filter | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 102 | @media (max-width: 640px) → .workspace .calendar-page h1 | font-size: 22px | 22px | EXACTO | --font-size-xl |
| 103 | @media (max-width: 640px) → .workspace .calendar-page .stat | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 103 | @media (max-width: 640px) → .workspace .calendar-page .stat | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 103 | @media (max-width: 640px) → .workspace .calendar-page .stat | min-height: 52px | 52px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 103 | @media (max-width: 640px) → .workspace .calendar-page .stat | border-bottom: 1px solid #eee9f4 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 103 | @media (max-width: 640px) → .workspace .calendar-page .stat | border-bottom: 1px solid #eee9f4 | #eee9f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 104 | @media (max-width: 640px) → .workspace .calendar-page .stat:nth-child(even) | border-right: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 105 | @media (max-width: 640px) → .workspace .calendar-page .stat strong | font-size: 21px | 21px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 106 | @media (max-width: 640px) → .workspace .calendar-controls | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 106 | @media (max-width: 640px) → .workspace .calendar-controls | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 107 | @media (max-width: 640px) → .workspace .calendar-controls .calendar-filters, .workspace .calendar-controls .search-field | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 108 | @media (max-width: 640px) → .workspace .calendar-controls .status-filter | margin-left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 109 | @media (max-width: 640px) → .workspace .calendar-controls .view-toolbar | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 110 | @media (max-width: 640px) → .editor-dialog.schedule-editor .social-phone, .editor-dialog.schedule-editor .social-phone.immersive | max-width: 270px | 270px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 20 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 31 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 58 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 100 | @media | condición: (max-width: 1250px) | 1250px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 101 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/company-module.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .company-module-selector | max-width: 300px | 300px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .company-module-selector | margin: 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .company-module-selector | margin: 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .company-module-selector .company-switcher | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 2 | .company-profile-form | grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 2 | .company-profile-form | grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 2 | .company-profile-form | gap: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 3 | .company-profile-form fieldset | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .company-profile-form fieldset | border: 1px solid #e6dff0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .company-profile-form fieldset | border: 1px solid #e6dff0 | #e6dff0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 3 | .company-profile-form fieldset | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 3 | .company-profile-form fieldset | padding: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 3 | .company-profile-form fieldset | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 3 | .company-profile-form fieldset | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .company-profile-form h2 | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 4 | .company-profile-form h2 | font-size: 17px | 17px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 4 | .company-profile-form h2 | margin: 0 0 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .company-profile-form h2 | margin: 0 0 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .company-profile-form h2 | color: #4d3a61 | #4d3a61 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .company-profile-form label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .company-profile-form label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 5 | .company-profile-form label | color: #6e5a80 | #6e5a80 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .company-profile-form label | margin: 16px 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 5 | .company-profile-form label | margin: 16px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .company-profile-form label > span | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 6 | .company-profile-form input, .company-profile-form textarea | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 6 | .company-profile-form input, .company-profile-form textarea | border: 1px solid #e6dfee | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .company-profile-form input, .company-profile-form textarea | border: 1px solid #e6dfee | #e6dfee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .company-profile-form input, .company-profile-form textarea | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 6 | .company-profile-form input, .company-profile-form textarea | padding: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 6 | .company-profile-form input, .company-profile-form textarea | background: #fdfbff | #fdfbff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .company-profile-form input, .company-profile-form textarea | color: #46354f | #46354f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-logo-row | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 7 | .company-logo-row | padding: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 7 | .company-logo-row | padding: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .company-logo | width: 96px | 96px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 7 | .company-logo | height: 96px | 96px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 7 | .company-logo | border: 1px dashed #d6c7e9 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 7 | .company-logo | border: 1px dashed #d6c7e9 | #d6c7e9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-logo | background: #f6f1fc | #f6f1fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-logo | color: #9973c7 | #9973c7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-logo | border-radius: 18px | 18px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 7 | .company-logo | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .company-logo img | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 7 | .company-logo img | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 8 | .company-profile-form .company-logo-upload | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .company-profile-form .company-logo-upload | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .company-profile-form .company-logo-upload | margin: 0 0 6px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .company-profile-form .company-logo-upload | margin: 0 0 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .company-logo-upload input | padding: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .company-logo-upload input | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 8 | .company-logo-row small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 8 | .company-logo-row small | color: #9683a3 | #9683a3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 8 | .company-remove-logo | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .company-remove-logo | background: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 8 | .company-remove-logo | color: #b14665 | #b14665 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 8 | .company-remove-logo | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 8 | .company-remove-logo | padding: 8px 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 8 | .company-remove-logo | padding: 8px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 9 | .company-profile-form a | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 9 | .company-profile-form a | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 9 | .company-profile-form a | color: #7950b9 | #7950b9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-socials > p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 10 | .company-socials > p | color: #897696 | #897696 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-social-card | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 10 | .company-social-card | border: 1px solid #ece5f4 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 10 | .company-social-card | border: 1px solid #ece5f4 | #ece5f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-social-card | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 10 | .company-social-card | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 10 | .company-social-card > div | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .company-social-icon | width: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 10 | .company-social-icon | height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 10 | .company-social-icon | background: #f5f0fc | #f5f0fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-social-icon | color: #8061ba | #8061ba | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-social-icon | border-radius: 10px | 10px | EXACTO | --radius-md |
| 10 | .company-social-card strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 10 | .company-link-status | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 10 | .company-link-status | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 10 | .company-link-status | color: #877594 | #877594 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-link-status | background: #f5f1f9 | #f5f1f9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-link-status | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 10 | .company-link-status | padding: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .company-social-card > small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 10 | .company-social-card > small | color: #95879f | #95879f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-social-card > small | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .company-social-card > small | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 11 | .company-connection-note | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .company-connection-note | background: #f7f4fb | #f7f4fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .company-connection-note | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .company-connection-note | border-radius: 10px | 10px | EXACTO | --radius-md |
| 11 | .company-connection-note | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 11 | .company-connection-note | color: #7d6a8e | #7d6a8e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .company-connection-note p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 11 | .company-connection-note p | margin-bottom: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-save-bar | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-save-bar | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-save-bar | bottom: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 12 | .company-save-bar | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 12 | .company-save-bar | padding: 16px 20px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 12 | .company-save-bar | padding: 16px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 12 | .company-save-bar | border: 1px solid #e6dcf0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .company-save-bar | border: 1px solid #e6dcf0 | #e6dcf0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .company-save-bar | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 12 | .company-save-bar | background: #fffffff5 | #fffffff5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .company-save-bar | box-shadow: 0 5px 22px #30203f12 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-save-bar | box-shadow: 0 5px 22px #30203f12 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .company-save-bar | box-shadow: 0 5px 22px #30203f12 | 22px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 12 | .company-save-bar | box-shadow: 0 5px 22px #30203f12 | #30203f12 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .company-save-bar > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 12 | .company-save-bar > span | color: #836795 | #836795 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .company-empty | padding: 60px 20px | 60px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 13 | .company-empty | padding: 60px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 13 | .company-empty | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 13 | .company-empty | border: 1px dashed #dfd4ed | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 13 | .company-empty | border: 1px dashed #dfd4ed | #dfd4ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .company-empty | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 13 | .company-empty | color: #9275b1 | #9275b1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .company-empty h2 | color: #594269 | #594269 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .company-empty h2 | font-size: 20px | 20px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 13 | .company-empty p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 14 | @media (max-width: 1000px) → .company-profile-form | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 15 | @media (max-width: 640px) → .company-profile-form fieldset | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | @media (max-width: 640px) → .company-logo-upload input | max-width: 240px | 240px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 14 | @media | condición: (max-width: 1000px) | 1000px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 15 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/company-switcher.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .company-selector.company-switcher | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .company-selector.company-switcher | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .company-selector.company-switcher | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 1 | .company-selector.company-switcher | margin: -8px -4px 24px | -8px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .company-selector.company-switcher | margin: -8px -4px 24px | -4px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .company-selector.company-switcher | margin: -8px -4px 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 3 | .company-menu > summary | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 3 | .company-menu > summary | padding: 11px 9px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 3 | .company-menu > summary | padding: 11px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 3 | .company-menu > summary | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 3 | .company-menu > summary | border: 1px solid #e9e3f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .company-menu > summary | border: 1px solid #e9e3f1 | #e9e3f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 3 | .company-menu > summary | border-radius: 13px | 13px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 3 | .company-menu > summary | background: linear-gradient(125deg, #fff, #f8f5ff) | 125deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 3 | .company-menu > summary | background: linear-gradient(125deg, #fff, #f8f5ff) | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 3 | .company-menu > summary | background: linear-gradient(125deg, #fff, #f8f5ff) | #f8f5ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 3 | .company-menu > summary | box-shadow: 0 3px 9px #38265405 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .company-menu > summary | box-shadow: 0 3px 9px #38265405 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .company-menu > summary | box-shadow: 0 3px 9px #38265405 | 9px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .company-menu > summary | box-shadow: 0 3px 9px #38265405 | #38265405 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .company-menu > summary::-webkit-details-marker | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 5 | .company-menu > summary:hover, .company-menu[open] > summary | border-color: #c8b5ec | #c8b5ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .company-menu > summary:hover, .company-menu[open] > summary | background: #f8f4ff | #f8f4ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .company-avatar | width: 33px | 33px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .company-avatar | height: 33px | 33px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .company-avatar | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 6 | .company-avatar | border-radius: 10px | 10px | EXACTO | --radius-md |
| 6 | .company-avatar | background: linear-gradient(140deg, #8d66e1, #6545c3) | 140deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 6 | .company-avatar | background: linear-gradient(140deg, #8d66e1, #6545c3) | #8d66e1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .company-avatar | background: linear-gradient(140deg, #8d66e1, #6545c3) | #6545c3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .company-avatar | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 6 | .company-avatar | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 6 | .company-avatar | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 6 | .company-avatar | box-shadow: 0 3px 8px #7251c32a | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 6 | .company-avatar | box-shadow: 0 3px 8px #7251c32a | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .company-avatar | box-shadow: 0 3px 8px #7251c32a | 8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .company-avatar | box-shadow: 0 3px 8px #7251c32a | #7251c32a | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-trigger-text | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .company-trigger-text | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .company-trigger-text small | color: #9b8bab | #9b8bab | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-trigger-text small | font-size: 7px | 7px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 7 | .company-trigger-text small | letter-spacing: .8px | .8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 7 | .company-trigger-text small | margin-bottom: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 7 | .company-trigger-text strong | color: #49365e | #49365e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .company-trigger-text strong | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 7 | .company-trigger-text strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .company-chevron | color: #9c8caf | #9c8caf | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 8 | .company-chevron | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .company-chevron | transition: transform .15s | .15s | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 8 | .company-menu[open] .company-chevron | transform: rotate(180deg) | 180deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 9 | .company-dropdown | top: calc(100% + 8px) | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 9 | .company-dropdown | top: calc(100% + 8px) | 8px | EXACTO | --space-2; validar densidad si es padding |
| 9 | .company-dropdown | left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 9 | .company-dropdown | z-index: 50 | 50 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 9 | .company-dropdown | width: min(280px, calc(100vw - 40px)) | 280px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .company-dropdown | width: min(280px, calc(100vw - 40px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 9 | .company-dropdown | width: min(280px, calc(100vw - 40px)) | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .company-dropdown | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 9 | .company-dropdown | border: 1px solid #e5ddef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .company-dropdown | border: 1px solid #e5ddef | #e5ddef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 9 | .company-dropdown | border-radius: 15px | 15px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 9 | .company-dropdown | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 9 | .company-dropdown | box-shadow: 0 14px 44px #2e17452b | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 9 | .company-dropdown | box-shadow: 0 14px 44px #2e17452b | 14px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .company-dropdown | box-shadow: 0 14px 44px #2e17452b | 44px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .company-dropdown | box-shadow: 0 14px 44px #2e17452b | #2e17452b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-dropdown-heading | padding: 5px 5px 12px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .company-dropdown-heading | padding: 5px 5px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 10 | .company-dropdown-heading | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 10 | .company-dropdown-heading | color: #645174 | #645174 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-dropdown-heading > span | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 10 | .company-dropdown-heading > span | padding: 3px 7px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .company-dropdown-heading > span | padding: 3px 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .company-dropdown-heading > span | background: #f3eff9 | #f3eff9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-dropdown-heading > span | color: #8c78a1 | #8c78a1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .company-dropdown-heading > span | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 11 | .company-switcher .company-search | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .company-switcher .company-search | border: 1px solid #eee8f5 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 11 | .company-switcher .company-search | border: 1px solid #eee8f5 | #eee8f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .company-switcher .company-search | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 11 | .company-switcher .company-search | padding: 0 9px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 11 | .company-switcher .company-search | padding: 0 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .company-switcher .company-search | color: #9b8bac | #9b8bac | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .company-switcher .company-search | background: #faf8fd | #faf8fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .company-switcher .company-search input | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-switcher .company-search input | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 12 | .company-switcher .company-search input | padding: 10px 0 | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 12 | .company-switcher .company-search input | padding: 10px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .company-switcher .company-search input | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 13 | .company-options | max-height: min(280px, 42dvh) | 280px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 13 | .company-options | max-height: min(280px, 42dvh) | 42dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 13 | .company-options | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 13 | .company-options | margin: 7px 0 | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 13 | .company-options | margin: 7px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 14 | .company-options > button | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 14 | .company-options > button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 14 | .company-options > button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 14 | .company-options > button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 14 | .company-options > button | padding: 10px 8px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 14 | .company-options > button | padding: 10px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 14 | .company-options > button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 14 | .company-options > button | color: #64516f | #64516f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 14 | .company-options > button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 15 | .company-options > button:hover | background: #f8f5fc | #f8f5fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 15 | .company-options > button.is-current | background: #f0e9fc | #f0e9fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 15 | .company-options > button.is-current | color: #734ab7 | #734ab7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 16 | .company-options > button > span:nth-child(2) | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | .company-options > button > span:nth-child(2) | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | .company-options small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 16 | .company-options small | opacity: .7 | .7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | .company-options small | margin-top: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 16 | .company-option-icon | width: 29px | 29px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 16 | .company-option-icon | height: 29px | 29px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 16 | .company-option-icon | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 16 | .company-option-icon | background: #f7f4fc | #f7f4fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 16 | .company-option-icon | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 17 | .company-switcher .company-no-results | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 17 | .company-switcher .company-no-results | color: #95869f | #95869f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 17 | .company-switcher .company-no-results | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 18 | .company-create | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 18 | .company-create | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 18 | .company-create | padding: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 18 | .company-create | border: 1px dashed #d8c8ed | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 18 | .company-create | border: 1px dashed #d8c8ed | #d8c8ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 18 | .company-create | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 18 | .company-create | background: #fbf9ff | #fbf9ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 18 | .company-create | color: #7a50b7 | #7a50b7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 18 | .company-create | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 18 | .company-create | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 19 | .company-switcher > form | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 19 | .company-switcher > form | border: 1px solid #e7dcf4 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 19 | .company-switcher > form | border: 1px solid #e7dcf4 | #e7dcf4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 19 | .company-switcher > form | border-radius: 10px | 10px | EXACTO | --radius-md |
| 19 | .company-switcher > form | background: #faf7ff | #faf7ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 20 | @media (max-width: 1024px) → .mobile-company-selector .company-selector.company-switcher | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | @media (max-width: 1024px) → .mobile-company-selector .company-selector.company-switcher | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | @media (max-width: 1024px) → .company-trigger-text strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 21 | @media (prefers-reduced-motion: reduce) → .company-chevron | transition: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 20 | @media | condición: (max-width: 1024px) | 1024px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/editor-modern.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | padding: 14px 16px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | padding: 14px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | border: 1px solid #dfd2f5 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | border: 1px solid #dfd2f5 | #dfd2f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | background: #f7f2ff | #f7f2ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 2 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 3 | .editor-dialog.schedule-editor .paid-toggle-prominent > input | width: 19px | 19px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .editor-dialog.schedule-editor .paid-toggle-prominent > input | height: 19px | 19px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .editor-dialog.schedule-editor .paid-toggle-prominent > input | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .editor-dialog.schedule-editor .paid-toggle-prominent > span | color: #65439b | #65439b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .editor-dialog.schedule-editor .paid-toggle-prominent > span | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 4 | .editor-dialog.schedule-editor .paid-toggle-prominent > span | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-dialog.schedule-editor .paid-toggle-prominent small | color: #78678d | #78678d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent.is-paid | background: #ede3fc | #ede3fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 6 | .editor-dialog.schedule-editor .editor-fields .paid-toggle-prominent.is-paid | border-color: #a784d9 | #a784d9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 7 | .link-preview-embed | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 7 | .link-preview-embed | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 7 | .link-preview-embed | min-height: 240px | 240px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 7 | .link-preview-embed | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 8 | .link-preview-embed iframe | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .link-preview-embed iframe | min-height: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .link-preview-embed iframe | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 8 | .link-preview-embed iframe | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 9 | .link-preview-embed > a | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 9 | .link-preview-embed > a | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 9 | .link-preview-embed > a | color: #6744cc | #6744cc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .link-preview-error | padding: 24px 18px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 10 | .link-preview-error | padding: 24px 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .link-preview-error | background: #f5f3fa | #f5f3fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .link-preview-error | color: #504661 | #504661 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .link-preview-error | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 10 | .link-preview-error | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .link-preview-error | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 11 | .link-preview-error a | color: #6744cc | #6744cc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .editor-dialog.schedule-editor details.day-posts | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 12 | .editor-dialog.schedule-editor details.day-posts | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .editor-dialog.schedule-editor details.day-posts | padding-block: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 13 | .editor-dialog.schedule-editor details.day-posts .day-post-list | margin-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 14 | .editor-dialog.schedule-editor .compact-schedule | grid-template-columns: 1.2fr 1fr 1fr | 1.2fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 14 | .editor-dialog.schedule-editor .compact-schedule | grid-template-columns: 1.2fr 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 14 | .editor-dialog.schedule-editor .compact-schedule | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .preview-adjustments | margin: 12px 0 18px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 15 | .preview-adjustments | margin: 12px 0 18px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 15 | .preview-adjustments | margin: 12px 0 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .preview-adjustments | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 15 | .preview-adjustments | color: #61516f | #61516f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 16 | .preview-adjustments > summary | padding: 8px 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 16 | .preview-adjustments > summary | padding: 8px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 17 | .preview-adjustments .preview-settings | margin: 8px 0 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 17 | .preview-adjustments .preview-settings | margin: 8px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 18 | .editor-dialog.schedule-editor .editor-advanced | background: #f8f8fb | #f8f8fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 19 | @media (max-width: 640px) → .editor-dialog.schedule-editor .compact-schedule | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 19 | @media (max-width: 640px) → .editor-dialog.schedule-editor .compact-schedule > label:last-child | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 19 | @media (max-width: 640px) → .editor-dialog.schedule-editor .compact-schedule > label:last-child | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | .editor-status | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 20 | .editor-status | margin-right: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 20 | .editor-status | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 20 | .editor-status | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 20 | .editor-status | color: #80718f | #80718f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | .editor-status select | max-width: 155px | 155px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 21 | .editor-status select | padding: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 21 | .editor-status select | padding: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 21 | .editor-status select | border: 1px solid #d9c8ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 21 | .editor-status select | border: 1px solid #d9c8ef | #d9c8ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | .editor-status select | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 21 | .editor-status select | background: #f2eafb | #f2eafb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | .editor-status select | color: #72499c | #72499c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | .editor-status select | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 22 | .editor-status[data-status="Aprobado"] select, .editor-status[data-status="Publicado"] select | background: #e6f6ee | #e6f6ee | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 22 | .editor-status[data-status="Aprobado"] select, .editor-status[data-status="Publicado"] select | border-color: #b7dfcb | #b7dfcb | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 22 | .editor-status[data-status="Aprobado"] select, .editor-status[data-status="Publicado"] select | color: #25704e | #25704e | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 23 | .editor-status[data-status="En revisión"] select | background: #fff5df | #fff5df | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .editor-status[data-status="En revisión"] select | border-color: #eed79e | #eed79e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .editor-status[data-status="En revisión"] select | color: #8d661c | #8d661c | EXACTO | --state-warning; equivalencia de valor, revisar función semántica |
| 24 | .preview-empty-button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .preview-empty-button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .preview-empty-button:focus-visible | outline: 3px solid #9774d2 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .preview-empty-button:focus-visible | outline: 3px solid #9774d2 | #9774d2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .preview-empty-button:focus-visible | outline-offset: -4px | -4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .preview-library-button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .preview-library-button | margin: 16px auto 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 26 | .preview-library-button | margin: 16px auto 0 | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 26 | .preview-library-button | margin: 16px auto 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 27 | .picker-brand | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | @media (max-width: 640px) → .editor-status | margin-right: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | @media (max-width: 640px) → .editor-status > span | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 28 | @media (max-width: 640px) → .editor-status select | max-width: 118px | 118px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 28 | @media (max-width: 640px) → .editor-status select | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 28 | @media (max-width: 640px) → .editor-status select | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 28 | @media (max-width: 640px) → .editor-dialog .editor-title-icon | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 29 | .editor-dialog.schedule-editor.split-editor | border: 1px solid #e7e4f0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 29 | .editor-dialog.schedule-editor.split-editor | border: 1px solid #e7e4f0 | #e7e4f0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 29 | .editor-dialog.schedule-editor.split-editor | border-radius: 24px | 24px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 29 | .editor-dialog.schedule-editor.split-editor | box-shadow: 0 32px 100px #20153b40 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 29 | .editor-dialog.schedule-editor.split-editor | box-shadow: 0 32px 100px #20153b40 | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 29 | .editor-dialog.schedule-editor.split-editor | box-shadow: 0 32px 100px #20153b40 | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 29 | .editor-dialog.schedule-editor.split-editor | box-shadow: 0 32px 100px #20153b40 | #20153b40 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .editor-dialog.schedule-editor .editor-heading | padding: 18px 24px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 30 | .editor-dialog.schedule-editor .editor-heading | padding: 18px 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 30 | .editor-dialog.schedule-editor .editor-heading | background: linear-gradient(110deg, #faf8ff, #f4f8ff) | 110deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 30 | .editor-dialog.schedule-editor .editor-heading | background: linear-gradient(110deg, #faf8ff, #f4f8ff) | #faf8ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .editor-dialog.schedule-editor .editor-heading | background: linear-gradient(110deg, #faf8ff, #f4f8ff) | #f4f8ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .editor-dialog.schedule-editor .editor-heading | border-bottom: 1px solid #e9e5f2 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 30 | .editor-dialog.schedule-editor .editor-heading | border-bottom: 1px solid #e9e5f2 | #e9e5f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 31 | .editor-title-group | gap: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 32 | .editor-title-icon | width: 43px | 43px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .editor-title-icon | height: 43px | 43px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .editor-title-icon | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 32 | .editor-title-icon | background: linear-gradient(145deg, #8b61ed, #6044ce) | 145deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .editor-title-icon | background: linear-gradient(145deg, #8b61ed, #6044ce) | #8b61ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 32 | .editor-title-icon | background: linear-gradient(145deg, #8b61ed, #6044ce) | #6044ce | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 32 | .editor-title-icon | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 32 | .editor-title-icon | box-shadow: 0 5px 12px #7950d926 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .editor-title-icon | box-shadow: 0 5px 12px #7950d926 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .editor-title-icon | box-shadow: 0 5px 12px #7950d926 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .editor-title-icon | box-shadow: 0 5px 12px #7950d926 | #7950d926 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 33 | .editor-dialog.schedule-editor .editor-heading .eyebrow | margin-bottom: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 33 | .editor-dialog.schedule-editor .editor-heading .eyebrow | color: #8069a8 | #8069a8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 33 | .editor-dialog.schedule-editor .editor-heading .eyebrow | font-size: 9px | 9px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 33 | .editor-dialog.schedule-editor .editor-heading .eyebrow | letter-spacing: .13em | .13em | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 34 | .editor-dialog.schedule-editor .editor-heading h2 | font-size: 21px | 21px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 34 | .editor-dialog.schedule-editor .editor-heading h2 | letter-spacing: -.5px | -.5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 34 | .editor-dialog.schedule-editor .editor-heading h2 | color: #29213b | #29213b | EXACTO | --neutral-900; equivalencia de valor, revisar función semántica |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | border: 1px solid #e5dfef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | border: 1px solid #e5dfef | #e5dfef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | width: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 35 | .editor-dialog.schedule-editor .editor-heading .icon-button | height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 36 | .editor-dialog.schedule-editor .day-posts | gap: 10px 16px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .editor-dialog.schedule-editor .day-posts | gap: 10px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 36 | .editor-dialog.schedule-editor .day-posts | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .editor-dialog.schedule-editor .day-posts | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 36 | .editor-dialog.schedule-editor .day-posts | margin-top: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .editor-dialog.schedule-editor .day-posts | background: #f6f2fd | #f6f2fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .editor-dialog.schedule-editor .day-posts | border: 1px solid #eee7fa | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 36 | .editor-dialog.schedule-editor .day-posts | border: 1px solid #eee7fa | #eee7fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .editor-dialog.schedule-editor .day-posts | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 37 | .editor-dialog.schedule-editor .day-posts p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 37 | .editor-dialog.schedule-editor .day-posts p | color: #796490 | #796490 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .editor-dialog.schedule-editor .day-post-list | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 39 | .editor-dialog.schedule-editor .day-post-list button | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 39 | .editor-dialog.schedule-editor .day-post-list button | border-color: #e7dcf6 | #e7dcf6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 39 | .editor-dialog.schedule-editor .day-post-list button | color: #72549f | #72549f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 40 | .editor-dialog.schedule-editor .editor-fields | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 40 | .editor-dialog.schedule-editor .editor-fields | padding-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 41 | .editor-dialog.schedule-editor .editor-fields label | color: #504661 | #504661 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .editor-dialog.schedule-editor .editor-fields label | font-weight: 500 | 500 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | border-color: #e5e0ed | #e5e0ed | EXACTO | --neutral-200; equivalencia de valor, revisar función semántica |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | background: #fcfbfe | #fcfbfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | padding: 11px 13px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | padding: 11px 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | color: #342a44 | #342a44 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .editor-dialog.schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .editor-dialog.schedule-editor .editor-fields textarea, .editor-dialog.schedule-editor .editor-fields select | transition: border-color .15s, box-shadow .15s | .15s | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 43 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea)::placeholder | color: #a29aac | #a29aac | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 44 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea, select):focus-visible | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 44 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea, select):focus-visible | border-color: #a88ae0 | #a88ae0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 44 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline: 3px solid #eee7fb | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 44 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline: 3px solid #eee7fb | #eee7fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 44 | .editor-dialog.schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline-offset: 1px | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 45 | .editor-dialog.schedule-editor .editor-fields .publication-copy | min-height: 135px | 135px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 45 | .editor-dialog.schedule-editor .editor-fields .publication-copy | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 45 | .editor-dialog.schedule-editor .editor-fields .publication-copy | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 45 | .editor-dialog.schedule-editor .editor-fields .publication-copy | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .editor-dialog.schedule-editor .format-options | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 47 | .editor-dialog.schedule-editor .format-options label | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .editor-dialog.schedule-editor .format-options label | background: #fcfbfe | #fcfbfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .editor-dialog.schedule-editor .format-options label | border-color: #e6e0ef | #e6e0ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .editor-dialog.schedule-editor .format-options label | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 47 | .editor-dialog.schedule-editor .format-options label | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | background: #eee6fc | #eee6fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | color: #7143ba | #7143ba | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | border-color: #bc9ae9 | #bc9ae9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | box-shadow: 0 2px 5px #7950d912 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | box-shadow: 0 2px 5px #7950d912 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | box-shadow: 0 2px 5px #7950d912 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .editor-dialog.schedule-editor .format-options label.selected | box-shadow: 0 2px 5px #7950d912 | #7950d912 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | border: 1px solid #eae5f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | border: 1px solid #eae5f1 | #eae5f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | background: #fdfcfe | #fdfcfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | padding: 12px 14px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 49 | .editor-dialog.schedule-editor .editor-disclosure | padding: 12px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 50 | .editor-dialog.schedule-editor .editor-disclosure > summary | color: #61516f | #61516f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 50 | .editor-dialog.schedule-editor .editor-disclosure > summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 51 | .editor-dialog.schedule-editor .editor-disclosure > summary::marker | color: #9877c7 | #9877c7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 52 | .editor-dialog.schedule-editor .editor-disclosure[open] | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 52 | .editor-dialog.schedule-editor .editor-disclosure[open] | border-color: #d9c9ed | #d9c9ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 53 | .editor-dialog.schedule-editor .editor-disclosure summary small | color: #998ba8 | #998ba8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 54 | .editor-dialog.schedule-editor .editor-actions | padding: 13px 24px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 54 | .editor-dialog.schedule-editor .editor-actions | padding: 13px 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 54 | .editor-dialog.schedule-editor .editor-actions | border-color: #eee9f4 | #eee9f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 54 | .editor-dialog.schedule-editor .editor-actions | box-shadow: 0 -8px 22px #ffffffd9 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 54 | .editor-dialog.schedule-editor .editor-actions | box-shadow: 0 -8px 22px #ffffffd9 | -8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .editor-dialog.schedule-editor .editor-actions | box-shadow: 0 -8px 22px #ffffffd9 | 22px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .editor-dialog.schedule-editor .editor-actions | box-shadow: 0 -8px 22px #ffffffd9 | #ffffffd9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 55 | .editor-dialog.schedule-editor :is(.primary-button, .secondary-button, .danger-button) | min-height: 40px | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 55 | .editor-dialog.schedule-editor :is(.primary-button, .secondary-button, .danger-button) | border-radius: 11px | 11px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 55 | .editor-dialog.schedule-editor :is(.primary-button, .secondary-button, .danger-button) | transition: background .15s, box-shadow .15s | .15s | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 56 | .editor-dialog.schedule-editor .primary-button | background: linear-gradient(115deg, #895be0, #6744cc) | 115deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 56 | .editor-dialog.schedule-editor .primary-button | background: linear-gradient(115deg, #895be0, #6744cc) | #895be0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .editor-dialog.schedule-editor .primary-button | background: linear-gradient(115deg, #895be0, #6744cc) | #6744cc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .editor-dialog.schedule-editor .primary-button | box-shadow: 0 4px 12px #7550c92b | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 56 | .editor-dialog.schedule-editor .primary-button | box-shadow: 0 4px 12px #7550c92b | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 56 | .editor-dialog.schedule-editor .primary-button | box-shadow: 0 4px 12px #7550c92b | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 56 | .editor-dialog.schedule-editor .primary-button | box-shadow: 0 4px 12px #7550c92b | #7550c92b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .editor-dialog.schedule-editor .primary-button:hover:not(:disabled) | background: #6740b9 | #6740b9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .editor-dialog.schedule-editor .primary-button:hover:not(:disabled) | box-shadow: 0 5px 16px #7550c942 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 57 | .editor-dialog.schedule-editor .primary-button:hover:not(:disabled) | box-shadow: 0 5px 16px #7550c942 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .editor-dialog.schedule-editor .primary-button:hover:not(:disabled) | box-shadow: 0 5px 16px #7550c942 | 16px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .editor-dialog.schedule-editor .primary-button:hover:not(:disabled) | box-shadow: 0 5px 16px #7550c942 | #7550c942 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 58 | .editor-dialog.schedule-editor .secondary-button | border-color: #e5dfed | #e5dfed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 58 | .editor-dialog.schedule-editor .secondary-button | color: #73647f | #73647f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 58 | .editor-dialog.schedule-editor .secondary-button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 59 | .editor-dialog.schedule-editor .danger-button | background: #fff1f4 | #fff1f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 59 | .editor-dialog.schedule-editor .danger-button | color: #c74b69 | #c74b69 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | 65% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | 25% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | #e7def8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | 60% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | .editor-dialog.schedule-editor .social-preview | background: radial-gradient(ellipse at 65% 25%, #e7def8, transparent 60%), #f5f3fa | #f5f3fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .editor-dialog.schedule-editor .social-preview | border-color: #e9e2f2 | #e9e2f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .editor-dialog.schedule-editor .social-preview | padding: 20px 22px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | .editor-dialog.schedule-editor .social-preview | padding: 20px 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 61 | .editor-dialog .preview-heading | color: #4b3b60 | #4b3b60 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 62 | .editor-dialog .preview-heading > span | color: #8c7aa1 | #8c7aa1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 62 | .editor-dialog .preview-heading > span | background: #ebe4f5 | #ebe4f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 62 | .editor-dialog .preview-heading > span | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 62 | .editor-dialog .preview-heading > span | padding: 5px 9px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 62 | .editor-dialog .preview-heading > span | padding: 5px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 62 | .editor-dialog .preview-heading > span | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 63 | .editor-dialog .preview-networks | padding: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 63 | .editor-dialog .preview-networks | border-radius: 13px | 13px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 63 | .editor-dialog .preview-networks | background: #eae4f2 | #eae4f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 63 | .editor-dialog .preview-networks | gap: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 64 | .editor-dialog .preview-networks button | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 64 | .editor-dialog .preview-networks button | border-color: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 64 | .editor-dialog .preview-networks button | border-radius: 10px | 10px | EXACTO | --radius-md |
| 64 | .editor-dialog .preview-networks button | color: #85738d | #85738d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | color: #7545b6 | #7545b6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | box-shadow: 0 2px 8px #3f245016 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | box-shadow: 0 2px 8px #3f245016 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | box-shadow: 0 2px 8px #3f245016 | 8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | box-shadow: 0 2px 8px #3f245016 | #3f245016 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 65 | .editor-dialog .preview-networks button[aria-pressed=true] | border-color: #f5f0fa | #f5f0fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 66 | .editor-dialog .preview-settings select | background: #ffffffbd | #ffffffbd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 66 | .editor-dialog .preview-settings select | border-color: #e1d9ed | #e1d9ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 66 | .editor-dialog .preview-settings select | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 67 | .editor-dialog .social-phone | max-width: 294px | 294px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 67 | .editor-dialog .social-phone | border-width: 4px | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 67 | .editor-dialog .social-phone | border-color: #302a39 | #302a39 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 67 | .editor-dialog .social-phone | box-shadow: 0 18px 40px #49306321 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | .editor-dialog .social-phone | box-shadow: 0 18px 40px #49306321 | 18px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 67 | .editor-dialog .social-phone | box-shadow: 0 18px 40px #49306321 | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 67 | .editor-dialog .social-phone | box-shadow: 0 18px 40px #49306321 | #49306321 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 68 | .editor-dialog .social-empty | background: linear-gradient(150deg, #f0ebf8, #e8edf7) | 150deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | .editor-dialog .social-empty | background: linear-gradient(150deg, #f0ebf8, #e8edf7) | #f0ebf8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 68 | .editor-dialog .social-empty | background: linear-gradient(150deg, #f0ebf8, #e8edf7) | #e8edf7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 68 | .editor-dialog .social-empty | color: #9386a9 | #9386a9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 68 | .editor-dialog .social-empty | padding: 25px | 25px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | .editor-dialog .social-empty | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 69 | .editor-dialog .social-empty > svg | width: 48px | 48px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 69 | .editor-dialog .social-empty > svg | height: 48px | 48px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 69 | .editor-dialog .social-empty > svg | padding: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .editor-dialog .social-empty > svg | background: #ffffffb0 | #ffffffb0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 69 | .editor-dialog .social-empty > svg | border-radius: 15px | 15px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 69 | .editor-dialog .social-empty > svg | color: #9a7fc1 | #9a7fc1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 70 | .editor-dialog .preview-note | max-width: 310px | 310px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 70 | .editor-dialog .preview-note | margin: 14px auto 0 | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 70 | .editor-dialog .preview-note | margin: 14px auto 0 | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 70 | .editor-dialog .preview-note | margin: 14px auto 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 70 | .editor-dialog .preview-note | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 71 | .editor-dialog .media-controls | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 71 | .editor-dialog .media-controls | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 71 | .editor-dialog .media-controls | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 72 | .editor-dialog .media-controls > label:last-child | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 72 | .editor-dialog .media-controls > label:last-child | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 73 | .editor-dialog input[type=file]::file-selector-button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 73 | .editor-dialog input[type=file]::file-selector-button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 73 | .editor-dialog input[type=file]::file-selector-button | padding: 7px 9px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 73 | .editor-dialog input[type=file]::file-selector-button | padding: 7px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 73 | .editor-dialog input[type=file]::file-selector-button | margin-right: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 73 | .editor-dialog input[type=file]::file-selector-button | background: #eee5fc | #eee5fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 73 | .editor-dialog input[type=file]::file-selector-button | color: #734aaa | #734aaa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 75 | @media (max-width: 640px) → .editor-dialog.schedule-editor .editor-heading, .editor-dialog.schedule-editor .editor-fields, .editor-dialog.schedule-editor .editor-actions | padding-inline: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 76 | @media (max-width: 640px) → .editor-dialog.schedule-editor .editor-heading h2 | font-size: 19px | 19px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 77 | @media (max-width: 640px) → .editor-dialog .media-controls | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 78 | @media (max-width: 640px) → .editor-title-icon | width: 36px | 36px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 78 | @media (max-width: 640px) → .editor-title-icon | height: 36px | 36px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 78 | @media (max-width: 640px) → .editor-title-icon | border-radius: 11px | 11px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 80 | @media (prefers-reduced-motion: reduce) → .editor-dialog.schedule-editor :is(input, textarea, select, button) | transition: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 19 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 28 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 74 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/editor.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .editor-dialog | width: min(680px, calc(100vw - 24px)) | 680px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | width: min(680px, calc(100vw - 24px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .editor-dialog | width: min(680px, calc(100vw - 24px)) | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | max-height: calc(100dvh - 40px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .editor-dialog | max-height: calc(100dvh - 40px) | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .editor-dialog | margin: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .editor-dialog | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 1 | .editor-dialog | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .editor-dialog | box-shadow: 0 30px 100px #28203933 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .editor-dialog | box-shadow: 0 30px 100px #28203933 | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | box-shadow: 0 30px 100px #28203933 | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .editor-dialog | box-shadow: 0 30px 100px #28203933 | #28203933 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 2 | .editor-dialog::backdrop | background: #26223588 | #26223588 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 2 | .editor-dialog::backdrop | backdrop-filter: blur(3px) | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .editor-heading | padding: 24px 26px 18px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 3 | .editor-heading | padding: 24px 26px 18px | 26px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 3 | .editor-heading | padding: 24px 26px 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 3 | .editor-heading h2 | font-size: 23px | 23px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 3 | .editor-heading h2 | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .editor-heading h2 | margin: 8px 0 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 3 | .editor-heading h2 | margin: 8px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .day-posts | margin: 0 26px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .day-posts | margin: 0 26px | 26px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .day-posts | padding: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .day-posts | background: #f7f5fc | #f7f5fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .day-posts | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 4 | .day-posts p | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 4 | .day-posts p | color: #8c7f9d | #8c7f9d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .day-posts p | margin: 0 0 9px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .day-posts p | margin: 0 0 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .day-post-list | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .day-post-list button | gap: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 4 | .day-post-list button | border: 1px solid #e6dff5 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 4 | .day-post-list button | border: 1px solid #e6dff5 | #e6dff5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .day-post-list button | border-radius: 5px | 5px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 4 | .day-post-list button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 4 | .day-post-list button | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 4 | .day-post-list button | padding: 6px 8px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .day-post-list button | padding: 6px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 4 | .day-post-list button | max-width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 4 | .day-post-list .selected | background: #eae2ff | #eae2ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .day-post-list .selected | color: #7256b1 | #7256b1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 4 | .day-post-list .selected | border-color: #cbb8ee | #cbb8ee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .editor-fields | padding: 24px 26px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 5 | .editor-fields | padding: 24px 26px | 26px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-fields | gap: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-fields > label, .form-row > label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .editor-fields > label, .form-row > label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 5 | .editor-fields > label, .form-row > label | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | border: 1px solid #dddde8 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | border: 1px solid #dddde8 | #dddde8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | padding: 11px 12px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | padding: 11px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | color: #343142 | #343142 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 5 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields textarea | min-height: 80px | 80px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .editor-fields textarea | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields small | color: #9991a6 | #9991a6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .editor-fields small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 5 | .editor-fields small | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields small | line-height: 1.5 | 1.5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .form-row | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 5 | .form-row | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-fields fieldset | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields fieldset | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields fieldset | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields legend | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 5 | .editor-fields legend | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-fields legend | margin-bottom: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .network-options | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .network-option | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .network-option | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .network-option | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 5 | .network-option | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .network-option | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 5 | .network-option | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 5 | .network-option.checked | background: #f6f2ff | #f6f2ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .network-option.checked | border-color: #cfc2f4 | #cfc2f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .network-option.checked | color: #765bb2 | #765bb2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | input[type=checkbox] | width: 15px | 15px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | input[type=checkbox] | height: 15px | 15px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .editor-fields .paid-toggle | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-fields .paid-toggle | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 5 | .editor-fields .paid-toggle | background: #faf9fd | #faf9fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .editor-fields .paid-toggle | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 5 | .paid-toggle small | margin-top: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 5 | .copy-preview | padding: 15px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .copy-preview | background: #f7f6fa | #f7f6fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .copy-preview | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 5 | .copy-preview p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .copy-preview p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 5 | .copy-preview p | margin-bottom: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .editor-actions | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .editor-actions | padding: 17px 26px | 17px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-actions | padding: 17px 26px | 26px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .editor-actions | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .editor-actions | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 5 | .editor-actions | bottom: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .action-spacer | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |

## app/globals.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 13 | :root | --background: #f8f9fc | #f8f9fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | :root | --foreground: #202333 | #202333 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | :root | --accent: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 13 | :root | --muted: #707586 | #707586 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | :root | --border: #eceef3 | #eceef3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 14 | @theme inline | --font-sans: "Segoe UI", Arial, Helvetica, sans-serif | "Segoe UI", Arial, Helvetica, sans-serif | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 14 | @theme inline | --font-mono: Consolas, monospace | Consolas, monospace | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 16 | body | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | body | font-family: var(--font-sans) | var(--font-sans) | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 16 | body | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 18 | button, a, input, select, textarea | -webkit-tap-highlight-color: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 19 | button | transition: background 180ms, border-color 180ms, box-shadow 180ms, transform 180ms, color 180ms | 180ms | AMBIGUO | Duración sin equivalencia exacta |
| 20 | button:disabled | opacity: .45 | .45 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 21 | :focus-visible | outline: 3px solid #ac98ed | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 21 | :focus-visible | outline: 3px solid #ac98ed | #ac98ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | :focus-visible | outline-offset: 3px | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 22 | button svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .workspace | min-height: 100dvh | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .sidebar | top: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .sidebar | width: 210px | 210px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 24 | .sidebar | height: 100dvh | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .sidebar | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .sidebar | border-right: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 24 | .sidebar | background: #fdfdfe | #fdfdfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .sidebar | padding: 30px 18px 22px | 30px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 24 | .sidebar | padding: 30px 18px 22px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 24 | .sidebar | padding: 30px 18px 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .brand | color: #242334 | #242334 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .brand | text-decoration: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 25 | .brand | font-size: 25px | 25px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 25 | .brand | font-weight: 750 | 750 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .brand | letter-spacing: -1.3px | -1.3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .brand | margin: 0 8px 28px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .brand | margin: 0 8px 28px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 25 | .brand | margin: 0 8px 28px | 28px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 27 | .brand-symbol | width: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .brand-symbol | height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .brand-symbol | margin-right: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 27 | .brand-symbol | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 27 | .brand-symbol | border-radius: 10px | 10px | EXACTO | --radius-md |
| 27 | .brand-symbol | font-size: 29px | 29px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 29 | .nav-active | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 29 | .nav-active | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 29 | .nav-active | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 29 | .nav-active | color: #694ac3 | #694ac3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 29 | .nav-active | border-radius: 10px | 10px | EXACTO | --radius-md |
| 29 | .nav-active | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 29 | .nav-active | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 30 | .nav-dot | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 30 | .nav-dot | width: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 30 | .nav-dot | height: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 30 | .nav-dot | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .local-dot | background: #5caa8c | #5caa8c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 32 | .local-dot | width: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .local-dot | height: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .local-dot | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .local-dot | margin-right: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 33 | .main-content | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 33 | .main-content | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | .company-selector | margin: -8px 0 22px | -8px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | .company-selector | margin: -8px 0 22px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | .company-selector | margin: -8px 0 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | .company-selector | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 34 | .company-selector | border: 1px solid #e8e0f3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 34 | .company-selector | border: 1px solid #e8e0f3 | #e8e0f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 34 | .company-selector | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 34 | .company-selector | background: #f8f5fd | #f8f5fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 34 | .company-selector | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 35 | .company-selector label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 35 | .company-selector label > span | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 35 | .company-selector label > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 35 | .company-selector label > span | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 35 | .company-selector label > span | color: #86719f | #86719f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .company-selector select, .company-selector input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 36 | .company-selector select, .company-selector input | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 36 | .company-selector select, .company-selector input | padding: 9px 6px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .company-selector select, .company-selector input | padding: 9px 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .company-selector select, .company-selector input | border: 1px solid #e4d9f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 36 | .company-selector select, .company-selector input | border: 1px solid #e4d9f1 | #e4d9f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .company-selector select, .company-selector input | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 36 | .company-selector select, .company-selector input | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 36 | .company-selector select, .company-selector input | color: #4f376b | #4f376b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 36 | .company-selector select, .company-selector input | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 37 | .company-selector .company-add | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 37 | .company-selector .company-add | margin-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 37 | .company-selector .company-add | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 37 | .company-selector .company-add | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 37 | .company-selector .company-add | color: #7652b2 | #7652b2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 37 | .company-selector .company-add | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 37 | .company-selector .company-add | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 38 | .company-selector form | margin-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .company-selector form > div | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .company-selector form > div | margin-top: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .company-selector form button | padding: 7px 10px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .company-selector form button | padding: 7px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .company-selector form button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 38 | .company-selector form button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 38 | .company-selector form button | background: #eae1f8 | #eae1f8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .company-selector form button | color: #69479c | #69479c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .company-selector p | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 38 | .company-selector p | color: #b13b56 | #b13b56 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 39 | .mobile-company-selector | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 40 | @media (max-width: 1024px) → .workspace-topbar .mobile-company-selector | margin-right: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 40 | @media (max-width: 1024px) → .workspace-topbar .mobile-company-selector | max-width: 240px | 240px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 40 | @media (max-width: 1024px) → .workspace-topbar .mobile-company-selector | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 40 | @media (max-width: 1024px) → .mobile-company-selector .company-selector | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 40 | @media (max-width: 1024px) → .mobile-company-selector .company-selector | padding: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 41 | .session-actions | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 41 | .session-actions | padding: 12px 24px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 41 | .session-actions | padding: 12px 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 41 | .session-actions | padding: 12px 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 42 | .session-actions > span | color: #a33243 | #a33243 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .session-actions > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 43 | .session-identity | gap: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 43 | .session-identity | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 43 | .session-identity | color: #5f4877 | #5f4877 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 43 | .session-identity small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 43 | .session-identity small | color: #8b779e | #8b779e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 45 | .page-content | max-width: 1720px | 1720px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 45 | .page-content | margin: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 45 | .page-content | padding: 20px 32px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 45 | .page-content | padding: 20px 32px | 32px | EXACTO | --space-8; validar densidad si es padding |
| 46 | .page-heading | gap: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 46 | .page-heading | margin-bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 47 | .eyebrow | font-size: 9px | 9px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 47 | .eyebrow | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .eyebrow | color: #8066b7 | #8066b7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .eyebrow | letter-spacing: 1.8px | 1.8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | h1 | margin: 5px 0 | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 48 | h1 | margin: 5px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 48 | h1 | font-size: clamp(25px, 2vw, 30px) | 25px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 48 | h1 | font-size: clamp(25px, 2vw, 30px) | 2vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 48 | h1 | font-size: clamp(25px, 2vw, 30px) | 30px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 48 | h1 | line-height: 1.2 | 1.2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 48 | h1 | letter-spacing: -1.25px | -1.25px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | h1 | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 49 | .page-heading p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 49 | .page-heading p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 49 | .page-heading p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 50 | .primary-button, .secondary-button, .danger-button | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 50 | .primary-button, .secondary-button, .danger-button | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 50 | .primary-button, .secondary-button, .danger-button | padding: 11px 17px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 50 | .primary-button, .secondary-button, .danger-button | padding: 11px 17px | 17px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 50 | .primary-button, .secondary-button, .danger-button | border-radius: 10px | 10px | EXACTO | --radius-md |
| 50 | .primary-button, .secondary-button, .danger-button | border: 1px solid transparent | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 50 | .primary-button, .secondary-button, .danger-button | border: 1px solid transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 50 | .primary-button, .secondary-button, .danger-button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 50 | .primary-button, .secondary-button, .danger-button | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .primary-button | color: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | 7px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | #7053d619 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 51 | .primary-button | box-shadow: 0 3px 7px #7053d619, inset 0 1px #ffffff16 | #ffffff16 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 52 | .primary-button:hover:not(:disabled) | background: #6345c8 | #6345c8 | EXACTO | --accent-hover; equivalencia de valor, revisar función semántica |
| 52 | .primary-button:hover:not(:disabled) | transform: translateY(-1px) | -1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .primary-button:hover:not(:disabled) | box-shadow: 0 5px 12px #7053d623 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 52 | .primary-button:hover:not(:disabled) | box-shadow: 0 5px 12px #7053d623 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .primary-button:hover:not(:disabled) | box-shadow: 0 5px 12px #7053d623 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .primary-button:hover:not(:disabled) | box-shadow: 0 5px 12px #7053d623 | #7053d623 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 53 | .primary-button:active:not(:disabled) | transform: scale(.98) | .98 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 54 | .secondary-button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 54 | .secondary-button | border-color: #e3e5ec | #e3e5ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 54 | .secondary-button | color: #555b6a | #555b6a | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 54 | .secondary-button:hover | background: #f5f5fa | #f5f5fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 55 | .danger-button | color: #b34153 | #b34153 | EXACTO | --state-error; equivalencia de valor, revisar función semántica |
| 55 | .danger-button | background: #fff3f5 | #fff3f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .stats-grid | grid-template-columns: repeat(4, minmax(0, 1fr)) | 4 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 56 | .stats-grid | grid-template-columns: repeat(4, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 56 | .stats-grid | grid-template-columns: repeat(4, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 56 | .stats-grid | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 56 | .stats-grid | margin-bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 57 | .stat | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 57 | .stat | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .stat | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 57 | .stat | padding: 12px 16px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 57 | .stat | padding: 12px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 57 | .stat | min-height: 88px | 88px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .stat | box-shadow: 0 2px 3px #20233302 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 57 | .stat | box-shadow: 0 2px 3px #20233302 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .stat | box-shadow: 0 2px 3px #20233302 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .stat | box-shadow: 0 2px 3px #20233302 | #20233302 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .stat | transition: box-shadow 180ms | 180ms | AMBIGUO | Duración sin equivalencia exacta |
| 58 | .stat:hover | box-shadow: 0 3px 12px #20233306 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 58 | .stat:hover | box-shadow: 0 3px 12px #20233306 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 58 | .stat:hover | box-shadow: 0 3px 12px #20233306 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 58 | .stat:hover | box-shadow: 0 3px 12px #20233306 | #20233306 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 59 | .stat-icon | right: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 59 | .stat-icon | top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 59 | .stat-icon | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 59 | .stat-icon | border-radius: 10px | 10px | EXACTO | --radius-md |
| 59 | .stat-icon svg | width: 17px | 17px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 59 | .stat-icon svg | height: 17px | 17px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 60 | .purple | background: #f0ecfb | #f0ecfb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .purple | color: #8668c8 | #8668c8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .amber | background: #fcf4e5 | #fcf4e5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .amber | color: #b88835 | #b88835 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .green | background: #edf7f1 | #edf7f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .green | color: #4e977b | #4e977b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .rose | background: #fcf0f3 | #fcf0f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .rose | color: #c4768b | #c4768b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 61 | .stat > div > span | padding-right: 32px | 32px | EXACTO | --space-8; validar densidad si es padding |
| 61 | .stat > div > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 61 | .stat > div > span | color: #646978 | #646978 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 62 | .stat strong | font-size: 26px | 26px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 62 | .stat strong | line-height: 1.15 | 1.15 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 62 | .stat strong | letter-spacing: -.6px | -.6px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 62 | .stat strong | margin-top: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 62 | .stat strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 63 | .stat small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 63 | .stat small | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 63 | .stat small | letter-spacing: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 63 | .stat small | margin-top: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 63 | .stat small | line-height: 1.4 | 1.4 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 64 | .calendar-panel | border: 1px solid #e6e8ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 64 | .calendar-panel | border: 1px solid #e6e8ef | #e6e8ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 64 | .calendar-panel | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 64 | .calendar-panel | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 64 | .calendar-panel | box-shadow: 0 3px 14px #20233303 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 64 | .calendar-panel | box-shadow: 0 3px 14px #20233303 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 64 | .calendar-panel | box-shadow: 0 3px 14px #20233303 | 14px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 64 | .calendar-panel | box-shadow: 0 3px 14px #20233303 | #20233303 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 65 | .calendar-toolbar | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 65 | .calendar-toolbar | padding: 20px 22px 16px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 65 | .calendar-toolbar | padding: 20px 22px 16px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 65 | .calendar-toolbar | padding: 20px 22px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 66 | .month-navigation | gap: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 67 | .month-navigation h2 | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 67 | .month-navigation h2 | letter-spacing: -.4px | -.4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 67 | .month-navigation h2 | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | .month-navigation h2 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | .month-navigation h2 | min-width: 165px | 165px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 68 | .month-arrows | gap: 2px | 2px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 69 | .icon-button | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 69 | .icon-button | width: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 69 | .icon-button | height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 69 | .icon-button | border: 1px solid transparent | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 69 | .icon-button | border: 1px solid transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 69 | .icon-button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 69 | .icon-button | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 69 | .icon-button | color: #697082 | #697082 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 70 | .icon-button:hover, .today-button:hover | background: #f3f0fa | #f3f0fa | EXACTO | --neutral-100; equivalencia de valor, revisar función semántica |
| 71 | .today-button | min-height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 71 | .today-button | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 71 | .today-button | color: #606575 | #606575 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 71 | .today-button | border: 1px solid #e6e8ee | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 71 | .today-button | border: 1px solid #e6e8ee | #e6e8ee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 71 | .today-button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 71 | .today-button | padding: 7px 12px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 71 | .today-button | padding: 7px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 71 | .today-button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 72 | .calendar-filters | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 73 | .search-field | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 73 | .search-field | height: 39px | 39px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 73 | .search-field | border: 1px solid #e6e8ee | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 73 | .search-field | border: 1px solid #e6e8ee | #e6e8ee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 73 | .search-field | border-radius: 10px | 10px | EXACTO | --radius-md |
| 73 | .search-field | padding: 8px 12px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 73 | .search-field | padding: 8px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 73 | .search-field | color: #818696 | #818696 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 73 | .search-field | transition: box-shadow 180ms, border-color 180ms | 180ms | AMBIGUO | Duración sin equivalencia exacta |
| 74 | .search-field:focus-within | border-color: #b5a0ec | #b5a0ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 74 | .search-field:focus-within | box-shadow: 0 0 0 3px #7053d612 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 74 | .search-field:focus-within | box-shadow: 0 0 0 3px #7053d612 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 74 | .search-field:focus-within | box-shadow: 0 0 0 3px #7053d612 | #7053d612 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 75 | .search-field input | width: 185px | 185px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 75 | .search-field input | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 75 | .search-field input | border: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 75 | .search-field input | outline: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 75 | .search-field input | background: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 75 | .search-field input::placeholder | color: #858999 | #858999 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 76 | .view-toolbar | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 76 | .view-toolbar | padding: 0 22px 16px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 76 | .view-toolbar | padding: 0 22px 16px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 76 | .view-toolbar | padding: 0 22px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 77 | .segmented-control | padding: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 77 | .segmented-control | gap: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 77 | .segmented-control | background: #f5f5f9 | #f5f5f9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 77 | .segmented-control | border-radius: 10px | 10px | EXACTO | --radius-md |
| 78 | .segmented-control button | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 78 | .segmented-control button | min-height: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 78 | .segmented-control button | padding: 6px 14px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 78 | .segmented-control button | padding: 6px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 78 | .segmented-control button | border: 1px solid transparent | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 78 | .segmented-control button | border: 1px solid transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 78 | .segmented-control button | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 78 | .segmented-control button | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 78 | .segmented-control button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 78 | .segmented-control button | color: #6d7180 | #6d7180 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 79 | .segmented-control button[aria-pressed=true] | background: #f1edfc | #f1edfc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 79 | .segmented-control button[aria-pressed=true] | color: #6948bc | #6948bc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 79 | .segmented-control button[aria-pressed=true] | border-color: #e5dcf8 | #e5dcf8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 79 | .segmented-control button[aria-pressed=true] | box-shadow: 0 1px 3px #38235d0a | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 79 | .segmented-control button[aria-pressed=true] | box-shadow: 0 1px 3px #38235d0a | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 79 | .segmented-control button[aria-pressed=true] | box-shadow: 0 1px 3px #38235d0a | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 79 | .segmented-control button[aria-pressed=true] | box-shadow: 0 1px 3px #38235d0a | #38235d0a | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 80 | .filter-buttons | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 81 | .filter-buttons button | min-width: 36px | 36px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 81 | .filter-buttons button | min-height: 36px | 36px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 81 | .filter-buttons button | padding: 8px 10px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 81 | .filter-buttons button | padding: 8px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 81 | .filter-buttons button | border: 1px solid #e8eaf0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 81 | .filter-buttons button | border: 1px solid #e8eaf0 | #e8eaf0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 81 | .filter-buttons button | border-radius: 10px | 10px | EXACTO | --radius-md |
| 81 | .filter-buttons button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 81 | .filter-buttons button | color: #747889 | #747889 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 81 | .filter-buttons button | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 82 | .filter-buttons button:hover | background: #f7f5fc | #f7f5fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 82 | .filter-buttons button[aria-pressed=true] | background: #f1edfc | #f1edfc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 82 | .filter-buttons button[aria-pressed=true] | color: #6948bc | #6948bc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 82 | .filter-buttons button[aria-pressed=true] | border-color: #ddd2f5 | #ddd2f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 83 | .social-icon | color: #707385 | #707385 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 83 | .social-icon.active | color: #6948bc | #6948bc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 85 | .tooltip::after | z-index: 20 | 20 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 85 | .tooltip::after | bottom: calc(100% + 8px) | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 85 | .tooltip::after | bottom: calc(100% + 8px) | 8px | EXACTO | --space-2; validar densidad si es padding |
| 85 | .tooltip::after | left: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 85 | .tooltip::after | transform: translateX(-50%) | -50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 85 | .tooltip::after | pointer-events: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 85 | .tooltip::after | background: #303040 | #303040 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 85 | .tooltip::after | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 85 | .tooltip::after | padding: 6px 9px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 85 | .tooltip::after | padding: 6px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 85 | .tooltip::after | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 85 | .tooltip::after | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 85 | .tooltip::after | line-height: 1.3 | 1.3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 85 | .tooltip::after | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 85 | .tooltip::after | opacity: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 85 | .tooltip::after | transition: opacity 150ms, visibility 150ms | 150ms | EXACTO | --duration-fast |
| 86 | .tooltip:hover::after, button:focus-visible .tooltip::after, label:focus-within .tooltip::after | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 86 | .tooltip:hover::after, button:focus-visible .tooltip::after, label:focus-within .tooltip::after | transition-delay: 250ms | 250ms | EXACTO | --duration-slow |
| 87 | .calendar-scroll | overflow-x: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 87 | .calendar-scroll | scrollbar-color: #d6d0e4 #f8f7fb | #d6d0e4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 87 | .calendar-scroll | scrollbar-color: #d6d0e4 #f8f7fb | #f8f7fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 88 | .calendar-grid | min-width: 770px | 770px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 88 | .weekdays, .days-grid | grid-template-columns: repeat(7, minmax(0, 1fr)) | 7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 88 | .weekdays, .days-grid | grid-template-columns: repeat(7, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 88 | .weekdays, .days-grid | grid-template-columns: repeat(7, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 89 | .weekdays | border-block: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 89 | .weekdays | background: #fcfcfe | #fcfcfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 89 | .weekdays > div | padding: 11px 13px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 89 | .weekdays > div | padding: 11px 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 89 | .weekdays > div | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 89 | .weekdays > div | font-weight: 550 | 550 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 89 | .weekdays > div | color: #737889 | #737889 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 90 | .day-cell | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 90 | .day-cell | min-height: clamp(125px, 15vh, 162px) | 125px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 90 | .day-cell | min-height: clamp(125px, 15vh, 162px) | 15vh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 90 | .day-cell | min-height: clamp(125px, 15vh, 162px) | 162px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 90 | .day-cell | border-right: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 90 | .day-cell | border-bottom: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 90 | .day-cell | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 90 | .day-cell | transition: background 180ms | 180ms | AMBIGUO | Duración sin equivalencia exacta |
| 91 | .day-cell:hover | background: #fcfbff | #fcfbff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 91 | .day-cell:nth-child(7n) | border-right: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 91 | .day-cell:nth-last-child(-n+7) | border-bottom: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 92 | .outside-month, .outside-month:hover | background: #fafbfc | #fafbfc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 92 | .is-today | background: #fdfbff | #fdfbff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 93 | .day-heading | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 93 | .day-heading | min-height: 30px | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 93 | .day-heading | margin-bottom: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 94 | .day-number | width: 28px | 28px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 94 | .day-number | height: 28px | 28px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 94 | .day-number | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 94 | .day-number | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 94 | .day-number | border: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 94 | .day-number | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 94 | .day-number | color: #626879 | #626879 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 94 | .day-number | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 94 | .day-number | font-weight: 550 | 550 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 95 | .day-number:hover:not(:disabled) | background: #f0ebfa | #f0ebfa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 95 | .is-today .day-number | color: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 96 | .today-label | color: #8065b9 | #8065b9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 96 | .today-label | font-size: 8px | 8px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 96 | .today-label | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 96 | .today-label | letter-spacing: .6px | .6px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 97 | .day-add | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 97 | .day-add | width: 27px | 27px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 97 | .day-add | height: 27px | 27px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 97 | .day-add | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 97 | .day-add | border: 1px solid #e4dcef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 97 | .day-add | border: 1px solid #e4dcef | #e4dcef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 97 | .day-add | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 97 | .day-add | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 97 | .day-add | color: #8065b4 | #8065b4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 97 | .day-add | opacity: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 98 | .day-cell:hover .day-add, .day-cell:focus-within .day-add | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 98 | .day-add:hover | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 99 | .day-content | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 99 | .content-item | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 100 | .post-card | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 100 | .post-card | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 100 | .post-card | border: 1px solid #eae7f0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 100 | .post-card | border: 1px solid #eae7f0 | #eae7f0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 100 | .post-card | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 100 | .post-card | background: #fbfafd | #fbfafd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 100 | .post-card | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 101 | .post-card:hover | background: #f8f6fc | #f8f6fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 101 | .post-card:hover | transform: translateY(-1px) | -1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 101 | .post-card:hover | box-shadow: 0 3px 8px #35274f0b | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 101 | .post-card:hover | box-shadow: 0 3px 8px #35274f0b | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 101 | .post-card:hover | box-shadow: 0 3px 8px #35274f0b | 8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 101 | .post-card:hover | box-shadow: 0 3px 8px #35274f0b | #35274f0b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 102 | .post-top | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 102 | .post-top | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 102 | .post-networks | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 103 | .post-top time | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 103 | .post-top time | color: #747789 | #747789 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 104 | .post-card > strong | -webkit-line-clamp: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 104 | .post-card > strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 104 | .post-card > strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 104 | .post-card > strong | line-height: 1.45 | 1.45 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 104 | .post-card > strong | color: #353344 | #353344 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 105 | .post-details | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 105 | .post-details | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 105 | .post-details | color: #767384 | #767384 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 106 | .paid-icon, .attachment-icon | color: #9a7840 | #9a7840 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 106 | .attachment-icon | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 106 | .attachment-icon | color: #7b6b9e | #7b6b9e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 107 | .workflow-status | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 107 | .workflow-status | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 107 | .workflow-status | line-height: 1.4 | 1.4 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 107 | .workflow-status | color: #777a87 | #777a87 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 107 | .workflow-status | font-weight: 500 | 500 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 108 | .status-dot | width: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 108 | .status-dot | height: 5px | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 108 | .status-dot | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 108 | .status-dot | background: currentColor | currentColor | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 108 | .status-dot | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 109 | .workflow-status[data-status="En revisión"] | color: #a7742c | #a7742c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 109 | .workflow-status[data-status="Aprobado"] | color: #428365 | #428365 | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 109 | .workflow-status[data-status="Publicado"] | color: #24664f | #24664f | PROPUESTA | --state-published; requiere unificar color actual |
| 110 | .empty-day | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 110 | .empty-day | min-height: 45px | 45px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 110 | .empty-day | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 110 | .empty-day | border: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 110 | .empty-day | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 110 | .empty-day | color: #8a76af | #8a76af | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 110 | .empty-day | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 110 | .empty-day | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 111 | .empty-day span | opacity: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 111 | .empty-day:hover span, .empty-day:focus-visible span | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 112 | .calendar-footer | padding: 14px 22px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 112 | .calendar-footer | padding: 14px 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 112 | .calendar-footer | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 112 | .calendar-footer | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 112 | .calendar-footer | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 113 | .calendar-tip | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 113 | .calendar-tip | margin: 17px 0 0 | 17px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 113 | .calendar-tip | margin: 17px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 113 | .calendar-tip | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 113 | .calendar-tip | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 114 | .calendar-tip > span | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 114 | .calendar-tip strong | font-weight: 500 | 500 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 114 | .calendar-tip strong | color: #666073 | #666073 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 114 | .calendar-tip small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 115 | .empty-month-note | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 115 | .empty-month-note | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 115 | .empty-month-note | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 115 | .empty-month-note | background: #fcfbfe | #fcfbfe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 115 | .empty-month-note | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 116 | .error-banner, .form-error | background: #fff2f3 | #fff2f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 116 | .error-banner, .form-error | color: #a33243 | #a33243 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 116 | .error-banner, .form-error | padding: 12px 16px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 116 | .error-banner, .form-error | padding: 12px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 116 | .error-banner, .form-error | border-radius: 10px | 10px | EXACTO | --radius-md |
| 116 | .error-banner, .form-error | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 116 | .error-banner, .form-error | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 116 | .error-banner | margin-bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 117 | .toast-region | z-index: 50 | 50 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 117 | .toast-region | right: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 117 | .toast-region | bottom: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 117 | .toast-region | max-width: calc(100vw - 32px) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 117 | .toast-region | max-width: calc(100vw - 32px) | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 118 | .toast | gap: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 118 | .toast | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 118 | .toast | border: 1px solid #e3e9e6 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 118 | .toast | border: 1px solid #e3e9e6 | #e3e9e6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 118 | .toast | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 118 | .toast | box-shadow: 0 6px 25px #253d2f12 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 118 | .toast | box-shadow: 0 6px 25px #253d2f12 | 6px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 118 | .toast | box-shadow: 0 6px 25px #253d2f12 | 25px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 118 | .toast | box-shadow: 0 6px 25px #253d2f12 | #253d2f12 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 118 | .toast | padding: 10px 12px 10px 16px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 118 | .toast | padding: 10px 12px 10px 16px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 118 | .toast | padding: 10px 12px 10px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 118 | .toast | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 118 | .toast | animation: toast-in 180ms ease-out | 180ms | AMBIGUO | Duración sin equivalencia exacta |
| 118 | .toast | animation: toast-in 180ms ease-out | ease-out | EXACTO | --ease-out |
| 118 | .toast > svg | color: #448767 | #448767 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 119 | @keyframes toast-in → from | opacity: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 119 | @keyframes toast-in → from | transform: translateY(5px) | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 119 | @keyframes toast-in → to | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 119 | @keyframes toast-in → to | transform: translateY(0) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 120 | .agenda-list | padding: 0 22px 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 120 | .agenda-list | padding: 0 22px 20px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 120 | .agenda-list | padding: 0 22px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 120 | .agenda-day | margin-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 120 | .agenda-day-heading | margin-bottom: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 121 | .agenda-day h3 | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 121 | .agenda-day h3 | font-weight: 550 | 550 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 121 | .agenda-day h3 | color: #686575 | #686575 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 121 | .agenda-day h3 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 122 | .agenda-post | margin-bottom: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 122 | .agenda-post | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 122 | .agenda-post | border-radius: 10px | 10px | EXACTO | --radius-md |
| 122 | .agenda-post | padding: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 123 | .agenda-card | grid-template-columns: 120px minmax(120px, 1fr) 100px 100px | 120px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 123 | .agenda-card | grid-template-columns: 120px minmax(120px, 1fr) 100px 100px | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 123 | .agenda-card | grid-template-columns: 120px minmax(120px, 1fr) 100px 100px | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 123 | .agenda-card | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 123 | .agenda-card | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 123 | .agenda-card | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 123 | .agenda-card | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 124 | .reference-link | color: #6947b9 | #6947b9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 124 | .reference-link | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 124 | .reference-link | text-underline-offset: 3px | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 124 | .agenda-post .reference-link | margin: 0 12px 9px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 124 | .agenda-post .reference-link | margin: 0 12px 9px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 124 | .agenda-post .reference-link | margin: 0 12px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 124 | .agenda-post .reference-link | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 125 | .editor-dialog | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 125 | .editor-dialog | box-shadow: 0 20px 80px #28203925 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 125 | .editor-dialog | box-shadow: 0 20px 80px #28203925 | 20px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 125 | .editor-dialog | box-shadow: 0 20px 80px #28203925 | 80px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 125 | .editor-dialog | box-shadow: 0 20px 80px #28203925 | #28203925 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 125 | .editor-dialog::backdrop | background: #22253755 | #22253755 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 125 | .editor-dialog::backdrop | backdrop-filter: blur(4px) | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 126 | .editor-heading h2 | font-size: 24px | 24px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 126 | .editor-heading h2 | letter-spacing: -.6px | -.6px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 127 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | border-color: #e0e2ea | #e0e2ea | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 127 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | border-radius: 10px | 10px | EXACTO | --radius-md |
| 127 | .editor-fields input:not([type=checkbox]), .editor-fields textarea, .editor-fields select | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 128 | .editor-fields input:focus, .editor-fields textarea:focus, .editor-fields select:focus | outline: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 128 | .editor-fields input:focus, .editor-fields textarea:focus, .editor-fields select:focus | border-color: #ae98e2 | #ae98e2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 128 | .editor-fields input:focus, .editor-fields textarea:focus, .editor-fields select:focus | box-shadow: 0 0 0 3px #7053d612 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 128 | .editor-fields input:focus, .editor-fields textarea:focus, .editor-fields select:focus | box-shadow: 0 0 0 3px #7053d612 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 128 | .editor-fields input:focus, .editor-fields textarea:focus, .editor-fields select:focus | box-shadow: 0 0 0 3px #7053d612 | #7053d612 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 129 | .network-option | border-radius: 10px | 10px | EXACTO | --radius-md |
| 129 | .day-post-list button | padding: 8px 10px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 129 | .day-post-list button | padding: 8px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 129 | .day-post-list button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 129 | .day-posts | background: #f8f6fc | #f8f6fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 129 | .day-posts p | color: #70637f | #70637f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 130 | @media (max-width: 1200px) → .sidebar | width: 178px | 178px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 130 | @media (max-width: 1200px) → .sidebar | padding-inline: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 130 | @media (max-width: 1200px) → .page-content | padding: 18px 22px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 130 | @media (max-width: 1200px) → .page-content | padding: 18px 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 130 | @media (max-width: 1200px) → .stat | padding: 12px 14px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 130 | @media (max-width: 1200px) → .stat | padding: 12px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 130 | @media (max-width: 1200px) → .stat-icon | right: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 130 | @media (max-width: 1200px) → .stat > div > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 130 | @media (max-width: 1200px) → .page-heading p | max-width: 450px | 450px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 130 | @media (max-width: 1200px) → .agenda-card | grid-template-columns: 100px minmax(100px, 1fr) 80px 85px | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 130 | @media (max-width: 1200px) → .agenda-card | grid-template-columns: 100px minmax(100px, 1fr) 80px 85px | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 130 | @media (max-width: 1200px) → .agenda-card | grid-template-columns: 100px minmax(100px, 1fr) 80px 85px | 80px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 130 | @media (max-width: 1200px) → .agenda-card | grid-template-columns: 100px minmax(100px, 1fr) 80px 85px | 85px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 130 | @media (max-width: 1200px) → .agenda-card | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 131 | @media (max-width: 1024px) → .sidebar | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 131 | @media (max-width: 1024px) → .stats-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 131 | @media (max-width: 1024px) → .stats-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 131 | @media (max-width: 1024px) → .stats-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 131 | @media (max-width: 1024px) → .stat | min-height: 88px | 88px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 131 | @media (max-width: 1024px) → .stat | padding: 12px 14px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 131 | @media (max-width: 1024px) → .stat | padding: 12px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 131 | @media (max-width: 1024px) → .stat > div > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 131 | @media (max-width: 1024px) → .page-heading p | max-width: 400px | 400px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .page-content | padding: 16px 14px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .page-content | padding: 16px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .page-heading | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .page-heading | margin-bottom: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .page-heading h1 | font-size: 26px | 26px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 132 | @media (max-width: 640px) → .page-heading p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 132 | @media (max-width: 640px) → .page-heading .primary-button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .page-heading .primary-button | min-height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 132 | @media (max-width: 640px) → .stats-grid | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .stats-grid | margin-bottom: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .stat | min-height: 96px | 96px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .stat-icon | top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .stat-icon | right: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat-icon | padding: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat-icon svg | width: 14px | 14px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .stat-icon svg | height: 14px | 14px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .stat > div > span | min-height: 28px | 28px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .stat > div > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 132 | @media (max-width: 640px) → .stat > div > span | padding-right: 25px | 25px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat strong | font-size: 24px | 24px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 132 | @media (max-width: 640px) → .stat strong | margin-top: 2px | 2px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .stat small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 132 | @media (max-width: 640px) → .calendar-toolbar | padding: 16px 12px 12px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .calendar-toolbar | padding: 16px 12px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .calendar-toolbar | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .month-navigation | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .month-navigation | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .month-navigation h2 | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .month-navigation h2 | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .month-navigation h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 132 | @media (max-width: 640px) → .icon-button | width: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .icon-button | height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .today-button | min-height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .calendar-filters, .search-field | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .search-field input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .search-field input | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .search-field | height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .view-toolbar | padding: 0 12px 14px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .view-toolbar | padding: 0 12px 14px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .view-toolbar | padding: 0 12px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .view-toolbar | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .segmented-control button | min-height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .segmented-control button | padding: 6px 10px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .segmented-control button | padding: 6px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .filter-buttons | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .filter-buttons button | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .filter-buttons button | min-width: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 132 | @media (max-width: 640px) → .filter-buttons button | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .calendar-footer | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .calendar-footer | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 132 | @media (max-width: 640px) → .calendar-tip > span | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .agenda-list | padding: 0 12px 12px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-list | padding: 0 12px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .agenda-card | grid-template-columns: minmax(0, 1fr) auto | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-card | grid-template-columns: minmax(0, 1fr) auto | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .agenda-card | grid-template-columns: minmax(0, 1fr) auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .agenda-card | gap: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .agenda-card | gap: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .agenda-card | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .agenda-card .post-top | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-card .post-top | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-card > strong | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-card > strong | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .agenda-card > strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 132 | @media (max-width: 640px) → .agenda-day h3 | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 132 | @media (max-width: 640px) → .editor-fields, .editor-heading | padding: 20px 16px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .editor-fields, .editor-heading | padding: 20px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .editor-heading h2 | font-size: 22px | 22px | EXACTO | --font-size-xl |
| 132 | @media (max-width: 640px) → .day-posts | margin-inline: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .editor-actions | padding: 14px 16px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .editor-actions | padding: 14px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .editor-actions .primary-button | flex-grow: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 132 | @media (max-width: 640px) → .form-row | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .network-option | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .network-option | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 132 | @media (max-width: 640px) → .action-spacer | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 132 | @media (max-width: 640px) → .toast-region | right: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .toast-region | bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 132 | @media (max-width: 640px) → .toast | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 133 | @media (hover: none), (pointer: coarse) → .day-add | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 133 | @media (hover: none), (pointer: coarse) → .day-add | width: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 133 | @media (hover: none), (pointer: coarse) → .day-add | height: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 133 | @media (hover: none), (pointer: coarse) → .day-number | width: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 133 | @media (hover: none), (pointer: coarse) → .day-number | height: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 133 | @media (hover: none), (pointer: coarse) → .day-cell | min-height: 132px | 132px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 134 | @media (prefers-reduced-motion: reduce) → *, *::before, *::after | transition: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 134 | @media (prefers-reduced-motion: reduce) → *, *::before, *::after | animation: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 136 | .status-filter | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 136 | .status-filter | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 136 | .status-filter | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 137 | .status-filter select | min-height: 36px | 36px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 137 | .status-filter select | max-width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 137 | .status-filter select | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 137 | .status-filter select | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 137 | .status-filter select | padding: 7px 10px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 137 | .status-filter select | padding: 7px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 137 | .status-filter select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 138 | .day-cell.drop-target | background: #eee8fc | #eee8fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 138 | .day-cell.drop-target | box-shadow: inset 0 0 0 2px #aa92e8 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 138 | .day-cell.drop-target | box-shadow: inset 0 0 0 2px #aa92e8 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 138 | .day-cell.drop-target | box-shadow: inset 0 0 0 2px #aa92e8 | #aa92e8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 140 | fieldset.editor-fields | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 140 | fieldset.editor-fields | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 140 | fieldset.editor-fields | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 141 | .template-panel | background: #faf9fd | #faf9fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 141 | .template-panel | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 141 | .template-panel | border-radius: 10px | 10px | EXACTO | --radius-md |
| 141 | .template-panel | padding: 12px 14px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 141 | .template-panel | padding: 12px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 142 | .template-panel summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 142 | .template-panel summary | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 142 | .template-panel summary | color: #665182 | #665182 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 143 | .template-panel summary span | margin-left: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 144 | .template-panel fieldset | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 144 | .template-panel fieldset | padding: 14px 0 0 | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 144 | .template-panel fieldset | padding: 14px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 144 | .template-panel fieldset | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 144 | .template-panel fieldset | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 144 | .template-panel fieldset | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 145 | .template-panel label | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 145 | .template-panel label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 146 | .template-actions | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 147 | .template-panel p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 147 | .template-panel p | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 148 | .visual-preview | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 148 | .visual-preview | padding-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 148 | .visual-preview | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 148 | .visual-preview-grid | grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 148 | .visual-preview-grid | grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 148 | .visual-preview-grid | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 148 | .visual-preview-grid | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 149 | .visual-preview img | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 149 | .visual-preview img | height: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 149 | .visual-preview img | max-height: 340px | 340px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 149 | .visual-preview img | border-radius: 10px | 10px | EXACTO | --radius-md |
| 149 | .visual-preview img | background: #f6f4fa | #f6f4fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 149 | .preview-copy | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 149 | .preview-copy | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 149 | .preview-copy | margin-block: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 149 | .preview-fallback | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 149 | .preview-fallback | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 149 | .preview-fallback | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 149 | .preview-fallback | background: #f7f5fb | #f7f5fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 149 | .preview-fallback | border-radius: 10px | 10px | EXACTO | --radius-md |
| 150 | @media (max-width: 640px) → .status-filter | margin-left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 150 | @media (max-width: 640px) → .visual-preview-grid | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 150 | @media (max-width: 640px) → .visual-preview img | max-height: 260px | 260px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 151 | .personal-tools, .reminder-panel | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 151 | .personal-tools, .reminder-panel | border-radius: 10px | 10px | EXACTO | --radius-md |
| 151 | .personal-tools, .reminder-panel | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 151 | .personal-tools, .reminder-panel | padding: 11px 14px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 151 | .personal-tools, .reminder-panel | padding: 11px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 151 | .personal-tools, .reminder-panel | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 152 | .personal-tools > summary, .reminder-panel > summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 152 | .personal-tools > summary, .reminder-panel > summary | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 152 | .personal-tools > summary, .reminder-panel > summary | color: #67527f | #67527f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 153 | .reminder-panel summary span | margin-left: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 153 | .reminder-panel summary span | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 154 | .personal-actions | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 154 | .personal-actions | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 154 | .personal-actions | padding: 14px 0 | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 154 | .personal-actions | padding: 14px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 154 | .personal-actions | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 155 | .personal-tools p, .reminder-panel p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 155 | .personal-tools p, .reminder-panel p | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 155 | .personal-tools small, .reminder-panel small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 156 | .backup-upload | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 156 | .backup-upload | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 156 | .backup-upload input | max-width: 240px | 240px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 157 | .import-preview | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 157 | .import-preview | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 157 | .import-preview | background: #f7f4fd | #f7f4fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 157 | .import-preview | margin-block: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 157 | .import-preview button | margin-right: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 158 | .media-library | margin-top: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 158 | .media-library | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 158 | .media-library | padding-top: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 159 | .media-controls | grid-template-columns: repeat(3, minmax(0, 1fr)) | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 159 | .media-controls | grid-template-columns: repeat(3, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 159 | .media-controls | grid-template-columns: repeat(3, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 159 | .media-controls | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 159 | .media-controls | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 160 | .media-controls label | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 160 | .media-controls label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 160 | .media-controls label | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 161 | .media-controls input, .media-controls select, .reminder-panel select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 162 | .media-grid | grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) | 180px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 162 | .media-grid | grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 162 | .media-grid | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 162 | .media-grid | max-height: 500px | 500px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 162 | .media-grid | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 162 | .media-grid | padding: 8px 2px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 162 | .media-grid | padding: 8px 2px | 2px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 163 | .media-item | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 163 | .media-item | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 163 | .media-item | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 163 | .media-item | border-radius: 10px | 10px | EXACTO | --radius-md |
| 163 | .media-item | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 164 | .media-item.selected | border-color: #aa92e8 | #aa92e8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 164 | .media-item.selected | background: #f7f4fd | #f7f4fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 164 | .media-item strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 165 | .media-item img, .media-item video | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 165 | .media-item img, .media-item video | height: 145px | 145px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 165 | .media-item img, .media-item video | background: #f5f5f9 | #f5f5f9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 165 | .media-item img, .media-item video | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 165 | .media-item .template-actions | margin-top: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 166 | .visual-preview video | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 166 | .visual-preview video | max-height: 340px | 340px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 166 | .visual-preview video | background: #17171b | #17171b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 166 | .visual-preview video | border-radius: 10px | 10px | EXACTO | --radius-md |
| 167 | .reminder-panel .template-actions | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 167 | .reminder-panel label | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 167 | .reminder-panel label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 167 | .reminder-panel select | width: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 168 | .reminder-panel h3 | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 168 | .reminder-panel h3 | margin: 16px 0 8px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 168 | .reminder-panel h3 | margin: 16px 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 168 | .reminder-panel h3 | margin: 16px 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 168 | .reminder-panel ul | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 168 | .reminder-panel ul | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 168 | .reminder-panel ul | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 168 | .reminder-panel li button | background: #faf9fd | #faf9fd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 168 | .reminder-panel li button | color: #565064 | #565064 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 168 | .reminder-panel li button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 168 | .reminder-panel li button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 168 | .reminder-panel li button | padding: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 168 | .reminder-panel li button | padding: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 168 | .reminder-panel li button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 168 | .reminder-panel li button | margin: 3px 0 | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 168 | .reminder-panel li button | margin: 3px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 168 | .reminder-panel li button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 169 | @media (max-width: 640px) → .media-controls | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 169 | @media (max-width: 640px) → .reminder-panel summary span | margin: 6px 0 0 | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 169 | @media (max-width: 640px) → .reminder-panel summary span | margin: 6px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 169 | @media (max-width: 640px) → .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 169 | @media (max-width: 640px) → .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 169 | @media (max-width: 640px) → .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 169 | @media (max-width: 640px) → .media-item | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 169 | @media (max-width: 640px) → .media-item .secondary-button, .media-item .danger-button | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 169 | @media (max-width: 640px) → .media-item .secondary-button, .media-item .danger-button | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 170 | .module-nav | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 171 | .module-nav button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 171 | .module-nav button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 172 | .nav-item | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 172 | .nav-item | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 172 | .nav-item | border-radius: 10px | 10px | EXACTO | --radius-md |
| 172 | .nav-item | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 172 | .nav-item | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 172 | .nav-item | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 173 | .nav-item:hover | background: #f4f1fa | #f4f1fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 174 | .mobile-module-nav | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 175 | .media-library-module | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 175 | .media-library-module | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 175 | .media-library-module | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 175 | .media-library-module | padding: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 175 | .media-library-module | margin-top: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 176 | .library-summary | gap: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 176 | .library-summary | padding-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 176 | .library-summary | margin-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 176 | .library-summary | border-bottom: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 176 | .library-summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 177 | .library-summary strong | font-size: 22px | 22px | EXACTO | --font-size-xl |
| 177 | .library-summary strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 177 | .library-summary strong | margin-right: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 178 | .library-search | grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 178 | .library-search | grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) | 2fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 178 | .library-search | grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 178 | .library-search | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 178 | .library-search | margin: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 178 | .library-search | margin: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 179 | .library-search label | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 179 | .library-search label | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 179 | .library-search label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 180 | .library-search input, .library-search select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 180 | .library-search input, .library-search select | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 180 | .library-search input, .library-search select | min-height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 180 | .library-search input, .library-search select | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 180 | .library-search input, .library-search select | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 180 | .library-search input, .library-search select | padding: 8px 10px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 180 | .library-search input, .library-search select | padding: 8px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 180 | .library-search input, .library-search select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 181 | .media-library-module .media-grid | max-height: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 181 | .media-library-module .media-grid | grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) | 230px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 181 | .media-library-module .media-grid | grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 181 | .media-library-module .media-grid | padding-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 182 | .media-library-module .media-item img, .media-library-module .media-item video | height: 190px | 190px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 183 | @media (max-width: 1024px) → .mobile-module-nav | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 183 | @media (max-width: 1024px) → .mobile-module-nav | padding: 12px 22px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 183 | @media (max-width: 1024px) → .mobile-module-nav | padding: 12px 22px 0 | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 183 | @media (max-width: 1024px) → .mobile-module-nav | padding: 12px 22px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | padding: 10px 14px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | padding: 10px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button[aria-pressed=true] | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 183 | @media (max-width: 1024px) → .mobile-module-nav button[aria-pressed=true] | border-color: #ded4f3 | #ded4f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 184 | @media (max-width: 640px) → .mobile-module-nav | padding-inline: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 184 | @media (max-width: 640px) → .mobile-module-nav button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 184 | @media (max-width: 640px) → .media-library-module | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 184 | @media (max-width: 640px) → .library-summary | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 184 | @media (max-width: 640px) → .library-summary strong | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 184 | @media (max-width: 640px) → .library-search | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 184 | @media (max-width: 640px) → .media-library-module .media-grid | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | grid-template-columns: minmax(0, 1fr) 420px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 186 | .split-editor[open] | grid-template-columns: minmax(0, 1fr) 420px | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | grid-template-columns: minmax(0, 1fr) 420px | 420px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 186 | .split-editor[open] | grid-template-rows: auto auto minmax(0, 1fr) | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | grid-template-rows: auto auto minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 186 | .split-editor[open] | grid-template-rows: auto auto minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | width: min(1200px, calc(100vw - 24px)) | 1200px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 186 | .split-editor[open] | width: min(1200px, calc(100vw - 24px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | width: min(1200px, calc(100vw - 24px)) | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 186 | .split-editor[open] | height: calc(100dvh - 24px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 186 | .split-editor[open] | height: calc(100dvh - 24px) | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 187 | .split-editor > .editor-heading | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 187 | .split-editor > .editor-heading | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 188 | .split-editor > .day-posts | grid-column: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 188 | .split-editor > .day-posts | grid-row: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 189 | .split-editor > form | grid-column: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 189 | .split-editor > form | grid-row: 3 | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 189 | .split-editor > form | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 189 | .split-editor > form | min-height: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 190 | .split-editor > .social-preview | grid-column: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 190 | .split-editor > .social-preview | grid-row: 2 / 4 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 190 | .split-editor > .social-preview | grid-row: 2 / 4 | 4 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 190 | .split-editor > .social-preview | overflow-y: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 190 | .split-editor > .social-preview | min-height: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 190 | .split-editor > .social-preview | border-left: 1px solid #e1e5ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 190 | .split-editor > .social-preview | border-left: 1px solid #e1e5ef | #e1e5ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 190 | .split-editor > .social-preview | background: #f1f3f7 | #f1f3f7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 190 | .split-editor > .social-preview | padding: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 191 | .editor-mobile-tabs | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 192 | .preview-heading | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 192 | .preview-heading | margin-bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 193 | .preview-heading span, .preview-note | color: #737d91 | #737d91 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 193 | .preview-heading span, .preview-note | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 194 | .preview-networks | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 194 | .preview-networks | margin-bottom: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 195 | .preview-networks button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 195 | .preview-networks button | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 195 | .preview-networks button | padding: 9px 6px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 195 | .preview-networks button | padding: 9px 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 195 | .preview-networks button | border: 1px solid #dce1ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 195 | .preview-networks button | border: 1px solid #dce1ec | #dce1ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 195 | .preview-networks button | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 195 | .preview-networks button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 195 | .preview-networks button | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 196 | .preview-networks button[aria-pressed=true] | background: #282138 | #282138 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 196 | .preview-networks button[aria-pressed=true] | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 196 | .preview-networks button[aria-pressed=true] | border-color: #282138 | #282138 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 197 | .preview-settings | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 197 | .preview-settings | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 197 | .preview-settings | margin-bottom: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 198 | .preview-settings label | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 198 | .preview-settings label | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 198 | .preview-settings label | color: #616b80 | #616b80 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 199 | .preview-settings select | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 199 | .preview-settings select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 199 | .preview-settings select | border: 1px solid #dce1ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 199 | .preview-settings select | border: 1px solid #dce1ec | #dce1ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 199 | .preview-settings select | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 199 | .preview-settings select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 199 | .preview-settings select | color: #30394c | #30394c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 199 | .preview-settings select | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 199 | .preview-settings select | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 201 | .social-phone | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 201 | .social-phone | max-width: 350px | 350px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 201 | .social-phone | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 201 | .social-phone | border: 5px solid #20232b | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 201 | .social-phone | border: 5px solid #20232b | #20232b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 201 | .social-phone | border-radius: 30px | 30px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 201 | .social-phone | box-shadow: 0 12px 30px #20232b18 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 201 | .social-phone | box-shadow: 0 12px 30px #20232b18 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 201 | .social-phone | box-shadow: 0 12px 30px #20232b18 | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 201 | .social-phone | box-shadow: 0 12px 30px #20232b18 | #20232b18 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 201 | .social-phone | color: #17191e | #17191e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 202 | .phone-status | padding: 10px 19px 5px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 202 | .phone-status | padding: 10px 19px 5px | 19px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 202 | .phone-status | padding: 10px 19px 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 202 | .phone-status | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 202 | .phone-status | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 203 | .social-app-name | padding: 10px 13px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 203 | .social-app-name | padding: 10px 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 203 | .social-app-name | font-size: 19px | 19px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 203 | .social-app-name | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 203 | .social-app-name | border-bottom: 1px solid #eee | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 203 | .social-app-name | border-bottom: 1px solid #eee | #eee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 204 | .social-app-name span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 205 | .facebook .social-app-name | color: #1877f2 | #1877f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 206 | .social-profile | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 206 | .social-profile | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 206 | .social-profile | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 207 | .social-profile > div | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 207 | .social-profile > div | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 208 | .social-profile small | color: #7b8090 | #7b8090 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 208 | .social-profile small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 209 | .social-avatar | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 209 | .social-avatar | width: 30px | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 209 | .social-avatar | height: 30px | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 209 | .social-avatar | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 209 | .social-avatar | background: #eee7fb | #eee7fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 209 | .social-avatar | color: #6d4ca8 | #6d4ca8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 209 | .social-avatar | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 210 | .social-media | background: #e8ebf1 | #e8ebf1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 211 | .social-media > img, .social-media > video | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 211 | .social-media > img, .social-media > video | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 211 | .social-media > img, .social-media > video | max-height: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 211 | .social-media > img, .social-media > video | border-radius: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 214 | .social-empty | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 214 | .social-empty | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 214 | .social-empty | padding: 30px | 30px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 214 | .social-empty | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 214 | .social-empty | color: #788298 | #788298 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 215 | .social-media > p | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 215 | .social-media > p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 216 | .social-caption | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 216 | .social-caption | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 216 | .social-caption | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 216 | .social-caption | padding: 10px 12px 16px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 216 | .social-caption | padding: 10px 12px 16px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 216 | .social-caption | padding: 10px 12px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 217 | .social-actions | gap: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 217 | .social-actions | padding: 12px 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 217 | .social-actions | padding: 12px 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 217 | .social-actions | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 218 | .social-bookmark | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 219 | .phone-home | height: 4px | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 219 | .phone-home | width: 100px | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 219 | .phone-home | border-radius: 4px | 4px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 219 | .phone-home | margin: 14px auto 8px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 219 | .phone-home | margin: 14px auto 8px | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 219 | .phone-home | margin: 14px auto 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 219 | .phone-home | background: #262932 | #262932 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 220 | .immersive | background: #101116 | #101116 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 220 | .immersive | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 221 | .immersive .social-app-name | border-color: #303037 | #303037 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 222 | .immersive .social-media | background: #191c25 | #191c25 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 223 | .immersive .phone-home | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 224 | .immersive-profile | top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 224 | .immersive-profile | left: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 224 | .immersive-profile | right: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 224 | .immersive-profile | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 224 | .immersive-profile | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 224 | .immersive-profile | text-shadow: 0 1px 4px #000 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 224 | .immersive-profile | text-shadow: 0 1px 4px #000 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 224 | .immersive-profile | text-shadow: 0 1px 4px #000 | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 224 | .immersive-profile | text-shadow: 0 1px 4px #000 | #000 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 224 | .immersive-profile | pointer-events: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 225 | .immersive-actions | right: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 225 | .immersive-actions | bottom: 140px | 140px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 225 | .immersive-actions | gap: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 225 | .immersive-actions | filter: drop-shadow(0 1px 3px #000) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 225 | .immersive-actions | filter: drop-shadow(0 1px 3px #000) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 225 | .immersive-actions | filter: drop-shadow(0 1px 3px #000) | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 225 | .immersive-actions | filter: drop-shadow(0 1px 3px #000) | #000 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 225 | .immersive-actions | pointer-events: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 226 | .immersive-caption | bottom: 36px | 36px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 226 | .immersive-caption | left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 226 | .immersive-caption | right: 42px | 42px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 226 | .immersive-caption | padding: 20px 12px 8px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 226 | .immersive-caption | padding: 20px 12px 8px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 226 | .immersive-caption | padding: 20px 12px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 226 | .immersive-caption | background: linear-gradient(transparent, #000b) | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 226 | .immersive-caption | background: linear-gradient(transparent, #000b) | #000b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 226 | .immersive-caption | pointer-events: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 227 | .immersive-caption .social-caption | padding: 0 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 227 | .immersive-caption .social-caption | padding: 0 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 227 | .immersive-caption .social-caption | max-height: 100px | 100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 228 | .immersive-caption > span | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 228 | .immersive-caption > span | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 229 | .preview-note | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 229 | .preview-note | margin: 16px 0 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 229 | .preview-note | margin: 16px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 231 | @media (max-width: 850px) → .split-editor[open] | grid-template-columns: minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 231 | @media (max-width: 850px) → .split-editor[open] | grid-template-columns: minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 231 | @media (max-width: 850px) → .split-editor[open] | grid-template-rows: auto auto auto minmax(0, 1fr) | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 231 | @media (max-width: 850px) → .split-editor[open] | grid-template-rows: auto auto auto minmax(0, 1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 231 | @media (max-width: 850px) → .split-editor[open] | grid-template-rows: auto auto auto minmax(0, 1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | grid-row: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | padding: 10px 16px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | padding: 10px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | border-bottom: 1px solid #e1e5ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 232 | @media (max-width: 850px) → .editor-mobile-tabs | border-bottom: 1px solid #e1e5ef | #e1e5ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | border: 1px solid #dce1ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | border: 1px solid #dce1ec | #dce1ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | padding: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 233 | @media (max-width: 850px) → .editor-mobile-tabs button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 234 | @media (max-width: 850px) → .editor-mobile-tabs button[aria-pressed=true] | color: #5940aa | #5940aa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 234 | @media (max-width: 850px) → .editor-mobile-tabs button[aria-pressed=true] | background: #f0ebfc | #f0ebfc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 234 | @media (max-width: 850px) → .editor-mobile-tabs button[aria-pressed=true] | border-color: #cdbcec | #cdbcec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 235 | @media (max-width: 850px) → .split-editor > .day-posts | grid-row: 3 | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 236 | @media (max-width: 850px) → .split-editor > form | grid-row: 4 | 4 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 237 | @media (max-width: 850px) → .split-editor > .social-preview | grid-column: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 237 | @media (max-width: 850px) → .split-editor > .social-preview | grid-row: 3 / 5 | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 237 | @media (max-width: 850px) → .split-editor > .social-preview | grid-row: 3 / 5 | 5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 237 | @media (max-width: 850px) → .split-editor > .social-preview | border-left: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 237 | @media (max-width: 850px) → .split-editor > .social-preview | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 238 | @media (max-width: 850px) → .split-editor.show-form > .social-preview, .split-editor.show-preview > form, .split-editor.show-preview > .day-posts | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 240 | .schedule-config | grid-template-columns: repeat(3, minmax(0, 1fr)) | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 240 | .schedule-config | grid-template-columns: repeat(3, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 240 | .schedule-config | grid-template-columns: repeat(3, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 240 | .schedule-config | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 240 | .schedule-config | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 240 | .schedule-config | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 240 | .schedule-config | padding: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 240 | .schedule-config | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 241 | .schedule-config label | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 241 | .schedule-config label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 242 | .schedule-config .schedule-title | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 242 | .schedule-config .schedule-title | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 243 | .schedule-config input, .schedule-config select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 243 | .schedule-config input, .schedule-config select | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 243 | .schedule-config input, .schedule-config select | padding: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 243 | .schedule-config input, .schedule-config select | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 243 | .schedule-config input, .schedule-config select | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 243 | .schedule-config input, .schedule-config select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 244 | .schedule-downloads | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 244 | .schedule-downloads | margin: 20px 0 10px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 244 | .schedule-downloads | margin: 20px 0 10px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 244 | .schedule-downloads | margin: 20px 0 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 245 | .schedule-downloads strong | margin-right: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 245 | .schedule-downloads strong | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 246 | .schedule-help | font-size: 12px | 12px | CONFLICTO | Posible ayuda/metadato: --font-size-meta/help exige 14px; revisar contexto |
| 246 | .schedule-help | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 247 | .schedule-list | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 247 | .schedule-list | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 247 | .schedule-list | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 247 | .schedule-list | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 247 | .schedule-list | margin: 18px 0 | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 247 | .schedule-list | margin: 18px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 248 | .schedule-select-all | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 248 | .schedule-select-all | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 248 | .schedule-select-all | padding-bottom: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 249 | .schedule-item | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 249 | .schedule-item | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 249 | .schedule-item | padding: 16px 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 249 | .schedule-item | padding: 16px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 250 | .schedule-item > div | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 250 | .schedule-item > div | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 250 | .schedule-item > div | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 251 | .schedule-item small, .schedule-item span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 252 | .schedule-item strong | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 253 | @media (max-width: 640px) → .schedule-config | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 253 | @media (max-width: 640px) → .schedule-config | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 253 | @media (max-width: 640px) → .schedule-downloads strong | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 253 | @media (max-width: 640px) → .mobile-module-nav button | padding-inline: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 253 | @media (max-width: 640px) → .mobile-module-nav button | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 255 | .schedule-editor | width: min(720px, calc(100vw - 24px)) | 720px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 255 | .schedule-editor | width: min(720px, calc(100vw - 24px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 255 | .schedule-editor | width: min(720px, calc(100vw - 24px)) | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 255 | .schedule-editor | max-height: calc(100dvh - 24px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 255 | .schedule-editor | max-height: calc(100dvh - 24px) | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 255 | .schedule-editor | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 255 | .schedule-editor | scrollbar-color: #bac6dc transparent | #bac6dc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 255 | .schedule-editor | scrollbar-color: #bac6dc transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 256 | .schedule-editor .editor-heading | padding: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 256 | .schedule-editor .editor-heading | background: #f7f9ff | #f7f9ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 256 | .schedule-editor .editor-heading | border-bottom: 1px solid #dce4f4 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 256 | .schedule-editor .editor-heading | border-bottom: 1px solid #dce4f4 | #dce4f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 257 | .schedule-editor .editor-heading .eyebrow | color: #4c60ff | #4c60ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 257 | .schedule-editor .editor-heading .eyebrow | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 257 | .schedule-editor .editor-heading .eyebrow | letter-spacing: .08em | .08em | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 257 | .schedule-editor .editor-heading .eyebrow | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 258 | .schedule-editor .editor-heading h2 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 258 | .schedule-editor .editor-heading h2 | font-size: 22px | 22px | EXACTO | --font-size-xl |
| 258 | .schedule-editor .editor-heading h2 | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 259 | .schedule-editor .editor-fields | padding: 22px 24px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 259 | .schedule-editor .editor-fields | padding: 22px 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 259 | .schedule-editor .editor-fields | gap: 15px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 260 | .schedule-editor .editor-fields label | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 260 | .schedule-editor .editor-fields label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 261 | .schedule-editor .form-row | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 261 | .schedule-editor .form-row | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 261 | .schedule-editor .form-row | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 261 | .schedule-editor .form-row | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | border: 1px solid #cad5eb | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | border: 1px solid #cad5eb | #cad5eb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | border-radius: 11px | 11px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | padding: 11px 13px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | padding: 11px 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | line-height: 1.5 | 1.5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 262 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select, .schedule-editor .editor-fields textarea | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 263 | .schedule-editor .editor-fields input:not([type=checkbox]):not([type=radio]), .schedule-editor .editor-fields select | min-height: 43px | 43px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 264 | .schedule-editor .editor-fields textarea | min-height: 76px | 76px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 264 | .schedule-editor .editor-fields textarea | scrollbar-color: #bac6dc transparent | #bac6dc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 264 | .schedule-editor .editor-fields textarea | scrollbar-color: #bac6dc transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 265 | .schedule-editor .editor-fields .publication-copy | min-height: 108px | 108px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 266 | .schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline: 2px solid #b5c1ff | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 266 | .schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline: 2px solid #b5c1ff | #b5c1ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 266 | .schedule-editor .editor-fields :is(input, textarea, select):focus-visible | outline-offset: 2px | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 266 | .schedule-editor .editor-fields :is(input, textarea, select):focus-visible | border-color: #788aff | #788aff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 266 | .schedule-editor .editor-fields :is(input, textarea, select):focus-visible | box-shadow: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 267 | .schedule-editor .editor-fields small | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 267 | .schedule-editor .editor-fields small | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 268 | .schedule-editor .editor-fields legend | margin-bottom: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 268 | .schedule-editor .editor-fields legend | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 269 | .format-options | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 270 | .schedule-editor .format-options label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 270 | .schedule-editor .format-options label | min-width: 105px | 105px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 270 | .schedule-editor .format-options label | min-height: 41px | 41px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 270 | .schedule-editor .format-options label | padding: 9px 16px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 270 | .schedule-editor .format-options label | padding: 9px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 270 | .schedule-editor .format-options label | border: 1px solid #d6def1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 270 | .schedule-editor .format-options label | border: 1px solid #d6def1 | #d6def1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 270 | .schedule-editor .format-options label | border-radius: 11px | 11px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 270 | .schedule-editor .format-options label | color: #63718d | #63718d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 271 | .format-options input | opacity: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 271 | .format-options input | width: 1px | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 271 | .format-options input | height: 1px | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 272 | .schedule-editor .format-options .selected | color: #294cff | #294cff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 272 | .schedule-editor .format-options .selected | border-color: #536dff | #536dff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 272 | .schedule-editor .format-options .selected | background: #eef4ff | #eef4ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 273 | .format-options label:focus-within | outline: 2px solid #b5c1ff | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 273 | .format-options label:focus-within | outline: 2px solid #b5c1ff | #b5c1ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 273 | .format-options label:focus-within | outline-offset: 2px | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 274 | .schedule-editor .network-options | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 275 | .schedule-editor .network-option | padding: 7px 10px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 275 | .schedule-editor .network-option | padding: 7px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 276 | .schedule-editor .paid-toggle | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 276 | .schedule-editor .paid-toggle | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 276 | .schedule-editor .paid-toggle | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 277 | .editor-disclosure | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 277 | .editor-disclosure | padding-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 277 | .editor-disclosure | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 278 | .editor-disclosure > summary, .schedule-editor .day-posts summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 278 | .editor-disclosure > summary, .schedule-editor .day-posts summary | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 278 | .editor-disclosure > summary, .schedule-editor .day-posts summary | color: #526181 | #526181 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 279 | .editor-disclosure > summary small | margin-left: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 279 | .editor-disclosure > summary small | font-weight: 400 | 400 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 280 | .optional-fields | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 280 | .optional-fields | margin-top: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 281 | .optional-fields > label | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 282 | .schedule-editor .day-posts | margin: 12px 24px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 282 | .schedule-editor .day-posts | margin: 12px 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 282 | .schedule-editor .day-posts | margin: 12px 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 282 | .schedule-editor .day-posts | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 282 | .schedule-editor .day-posts | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 283 | .schedule-editor .day-post-list | margin-top: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 284 | .schedule-editor .editor-actions | padding: 12px 24px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 284 | .schedule-editor .editor-actions | padding: 12px 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 284 | .schedule-editor .editor-actions | z-index: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 285 | .schedule-editor .visual-preview | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 286 | .schedule-editor .visual-preview > .eyebrow | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 288 | @media (max-width: 640px) → .schedule-editor .editor-heading, .schedule-editor .editor-fields, .schedule-editor .editor-actions | padding-inline: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 289 | @media (max-width: 640px) → .schedule-editor .day-posts | margin-inline: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 291 | @media (max-width: 640px) → .schedule-editor .format-options label | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 291 | @media (max-width: 640px) → .schedule-editor .format-options label | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 291 | @media (max-width: 640px) → .schedule-editor .format-options label | padding-inline: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 292 | @media (max-width: 640px) → .editor-disclosure > summary small | margin: 5px 0 0 14px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 292 | @media (max-width: 640px) → .editor-disclosure > summary small | margin: 5px 0 0 14px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 292 | @media (max-width: 640px) → .editor-disclosure > summary small | margin: 5px 0 0 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 40 | @media | condición: (max-width: 1024px) | 1024px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 130 | @media | condición: (max-width: 1200px) | 1200px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 131 | @media | condición: (max-width: 1024px) | 1024px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 132 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 133 | @media | condición: (hover: none), (pointer: coarse) | none | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 150 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 169 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 183 | @media | condición: (max-width: 1024px) | 1024px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 184 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 230 | @media | condición: (max-width: 850px) | 850px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 253 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 287 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/login/login.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .login-page | min-height: 100dvh | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-page | grid-template-columns: 1.05fr 1fr | 1.05fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-page | grid-template-columns: 1.05fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-page | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .login-story | padding: 48px clamp(32px,6vw,100px) 28px | 48px | EXACTO | --space-12; validar densidad si es padding |
| 1 | .login-story | padding: 48px clamp(32px,6vw,100px) 28px | 32px | EXACTO | --space-8; validar densidad si es padding |
| 1 | .login-story | padding: 48px clamp(32px,6vw,100px) 28px | 6vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-story | padding: 48px clamp(32px,6vw,100px) 28px | 100px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-story | padding: 48px clamp(32px,6vw,100px) 28px | 28px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-story | background: #f0ecfa | #f0ecfa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-brand | color: #282139 | #282139 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-brand | text-decoration: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-brand | font-size: 28px | 28px | EXACTO | --font-size-2xl |
| 1 | .login-brand | font-weight: 750 | 750 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-brand | letter-spacing: -1.4px | -1.4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-brand>span | width: 39px | 39px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-brand>span | height: 40px | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-brand>span | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .login-brand>span | background: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .login-brand>span | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .login-brand>span | margin-right: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-brand>span | font-size: 32px | 32px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-brand b | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .login-story-copy | max-width: 460px | 460px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-story-copy | margin: auto 0 | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-story-copy | margin: auto 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-story-copy | padding: 65px 0 | 65px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-story-copy | padding: 65px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-kicker | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .login-kicker | font-weight: 750 | 750 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-kicker | letter-spacing: 2px | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-kicker | color: #8064b1 | #8064b1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-story h1 | font-size: clamp(38px,4.2vw,62px) | 38px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-story h1 | font-size: clamp(38px,4.2vw,62px) | 4.2vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-story h1 | font-size: clamp(38px,4.2vw,62px) | 62px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-story h1 | line-height: 1.12 | 1.12 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-story h1 | letter-spacing: -2.8px | -2.8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-story h1 | margin: 22px 0 | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-story h1 | margin: 22px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-story h1 | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-story h1 em | font-style: normal | normal | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-story h1 em | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .login-story-copy>p | color: #777084 | #777084 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-story-copy>p | font-size: 15px | 15px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-story-copy>p | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-story-copy>p | max-width: 335px | 335px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-preview | margin-top: 40px | 40px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-preview | padding: 23px | 23px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-preview | border: 1px solid #fff | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-preview | border: 1px solid #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .login-preview | border-radius: 18px | 18px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .login-preview | background: #ffffffb8 | #ffffffb8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-preview | box-shadow: 0 18px 55px #5c428b0b | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-preview | box-shadow: 0 18px 55px #5c428b0b | 18px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-preview | box-shadow: 0 18px 55px #5c428b0b | 55px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-preview | box-shadow: 0 18px 55px #5c428b0b | #5c428b0b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-preview | transform: rotate(-3deg) | -3deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .preview-heading | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .preview-heading | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .preview-heading | color: #554568 | #554568 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-heading>span:last-child | color: #9b7dd6 | #9b7dd6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-days,.preview-grid | grid-template-columns: repeat(5,minmax(0,1fr)) | 5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .preview-days,.preview-grid | grid-template-columns: repeat(5,minmax(0,1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .preview-days,.preview-grid | grid-template-columns: repeat(5,minmax(0,1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .preview-days,.preview-grid | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .preview-days | margin: 20px 0 9px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .preview-days | margin: 20px 0 9px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .preview-days | margin: 20px 0 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .preview-days | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .preview-days | color: #aaa0b6 | #aaa0b6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-grid>span | height: 37px | 37px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .preview-grid>span | background: #f5f2fa | #f5f2fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-grid>span | border-radius: 5px | 5px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .preview-grid>span | font-size: 8px | 8px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .preview-grid .filled | background: #e7dcfa | #e7dcfa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-grid .filled | color: #7551ae | #7551ae | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-grid .filled:nth-child(10) | background: #e0f0e8 | #e0f0e8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-grid .filled:nth-child(10) | color: #548771 | #548771 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-note | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .preview-note | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .preview-note | color: #8b8197 | #8b8197 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-note span | color: #9776ce | #9776ce | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .preview-note span | margin-right: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-story-footer | color: #93859f | #93859f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-story-footer | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .login-access | padding: 64px 36px | 64px | EXACTO | --space-16; validar densidad si es padding |
| 1 | .login-access | padding: 64px 36px | 36px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-form-wrap | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-form-wrap | max-width: 360px | 360px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-access h2 | font-size: 34px | 34px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-access h2 | letter-spacing: -1.3px | -1.3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-access h2 | line-height: 1.2 | 1.2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-access h2 | margin: 16px 0 12px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .login-access h2 | margin: 16px 0 12px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-access h2 | margin: 16px 0 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .login-access h2 | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-intro | color: #85808f | #85808f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-intro | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 1 | .login-intro | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-intro | margin-bottom: 36px | 36px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-form>label | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-form>label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .login-form>label | margin: 22px 0 9px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-form>label | margin: 22px 0 9px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-form>label | margin: 22px 0 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-input | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .login-input | border: 1px solid #e4e0ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input | border: 1px solid #e4e0ec | #e4e0ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input | border-radius: 10px | 10px | EXACTO | --radius-md |
| 1 | .login-input | padding: 0 14px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input | padding: 0 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-input | color: #aaa1b8 | #aaa1b8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input | background: #fefeff | #fefeff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input | min-height: 50px | 50px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input:focus-within | border-color: #9c80d9 | #9c80d9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input:focus-within | box-shadow: 0 0 0 3px #7053d612 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input:focus-within | box-shadow: 0 0 0 3px #7053d612 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input:focus-within | box-shadow: 0 0 0 3px #7053d612 | #7053d612 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-input input | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input input | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input input | outline: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-input input | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 1 | .login-input input | color: #342d42 | #342d42 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input input | height: 50px | 50px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input input | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 1 | .login-input input::placeholder | color: #aaa4b3 | #aaa4b3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-input button | min-width: 32px | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input button | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-input button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input button | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 1 | .login-input button | color: #92889f | #92889f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-submit | margin-top: 28px | 28px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-submit | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .login-submit | min-height: 50px | 50px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-submit | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-submit | border-radius: 10px | 10px | EXACTO | --radius-md |
| 1 | .login-submit | background: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .login-submit | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .login-submit | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .login-submit | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .login-submit | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-submit | box-shadow: 0 5px 12px #7053d625 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-submit | box-shadow: 0 5px 12px #7053d625 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-submit | box-shadow: 0 5px 12px #7053d625 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-submit | box-shadow: 0 5px 12px #7053d625 | #7053d625 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-submit:hover:not(:disabled) | background: #6245c4 | #6245c4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-submit:hover:not(:disabled) | transform: translateY(-1px) | -1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-security | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-security | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .login-security | color: #9991a3 | #9991a3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-security | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-help | border-top: 1px solid #eeeaf3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .login-help | border-top: 1px solid #eeeaf3 | #eeeaf3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-help | margin-top: 35px | 35px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-help | padding-top: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .login-help | color: #9890a1 | #9890a1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-help | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .login-help | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-access footer | bottom: 28px | 28px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .login-access footer | color: #aaa3b3 | #aaa3b3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .login-access footer | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .login-form .form-error | margin: 16px 0 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .login-form .form-error | margin: 16px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .login-input>svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:760px) → .login-page | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:760px) → .login-story | padding: 25px 26px | 25px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:760px) → .login-story | padding: 25px 26px | 26px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:760px) → .login-story | background: #f0ecfa | #f0ecfa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | @media (max-width:760px) → .login-story-copy,.login-story-footer | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:760px) → .login-brand | font-size: 24px | 24px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | @media (max-width:760px) → .login-brand>span | width: 33px | 33px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | @media (max-width:760px) → .login-brand>span | height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | @media (max-width:760px) → .login-brand>span | font-size: 28px | 28px | EXACTO | --font-size-2xl |
| 1 | @media (max-width:760px) → .login-access | padding: 48px 25px 75px | 48px | EXACTO | --space-12; validar densidad si es padding |
| 1 | @media (max-width:760px) → .login-access | padding: 48px 25px 75px | 25px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:760px) → .login-access | padding: 48px 25px 75px | 75px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:760px) → .login-access | min-height: calc(100dvh - 84px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:760px) → .login-access | min-height: calc(100dvh - 84px) | 84px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | @media (max-width:760px) → .login-access h2 | font-size: 31px | 31px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | @media (max-width:760px) → .login-access footer | bottom: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | @media | condición: (max-width:760px) | 760px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/media-gallery.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 2 | .gallery-bulk | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 2 | .gallery-bulk | padding: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 2 | .gallery-bulk | padding: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 2 | .gallery-bulk | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 2 | .gallery-bulk | color: #726180 | #726180 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 3 | .gallery-bulk label | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .gallery-selection | z-index: 2 | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .gallery-selection | right: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .gallery-selection | top: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 5 | .gallery-selection | padding: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 5 | .gallery-selection | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 5 | .gallery-selection | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 6 | .gallery-selection input | width: 18px | 18px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .gallery-selection input | height: 18px | 18px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 6 | .gallery-selection input | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .gallery-meta button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .gallery-meta button | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 7 | .gallery-meta button | padding: 4px 7px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 7 | .gallery-meta button | padding: 4px 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .gallery-meta button:disabled | opacity: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 8 | .gallery-meta button:disabled | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 9 | .gallery-small-dialog | width: min(520px, calc(100vw - 32px)) | 520px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 9 | .gallery-small-dialog | width: min(520px, calc(100vw - 32px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 9 | .gallery-small-dialog | width: min(520px, calc(100vw - 32px)) | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 10 | .gallery-name-field | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .gallery-name-field | padding: 12px 20px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 10 | .gallery-name-field | padding: 12px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 10 | .gallery-name-field | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 11 | .gallery-name-field input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 11 | .gallery-name-field input | min-height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 11 | .gallery-name-field input | border: 1px solid #dfd6ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 11 | .gallery-name-field input | border: 1px solid #dfd6ec | #dfd6ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .gallery-name-field input | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 11 | .gallery-name-field input | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 12 | .gallery-name-field small | color: #81728d | #81728d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .gallery-usage | padding: 0 20px 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 13 | .gallery-usage | padding: 0 20px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 14 | .gallery-usage > p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 14 | .gallery-usage > p | color: #81728d | #81728d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 15 | .gallery-usage article | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .gallery-usage article | border: 1px solid #e8e0f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 15 | .gallery-usage article | border: 1px solid #e8e0f1 | #e8e0f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 15 | .gallery-usage article | border-radius: 10px | 10px | EXACTO | --radius-md |
| 15 | .gallery-usage article | margin-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .gallery-usage article | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 16 | .gallery-usage article p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 16 | .gallery-usage article p | color: #81728d | #81728d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 17 | .gallery-usage article button | margin-top: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 18 | .gallery-library.is-dragging | outline: 3px dashed #8a64dc | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 18 | .gallery-library.is-dragging | outline: 3px dashed #8a64dc | #8a64dc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 18 | .gallery-library.is-dragging | outline-offset: -4px | -4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 18 | .gallery-library.is-dragging | background: #f7f2ff | #f7f2ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 19 | .gallery-header | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 19 | .gallery-header | margin-bottom: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 20 | .gallery-header h2 | margin: 0 0 5px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | .gallery-header h2 | margin: 0 0 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 20 | .gallery-header h2 | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 20 | .gallery-header h2 | letter-spacing: -.4px | -.4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 21 | .gallery-header p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 21 | .gallery-header p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 21 | .gallery-header p | color: #757084 | #757084 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 22 | .gallery-toolbar | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 23 | .gallery-search | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .gallery-search | min-width: 180px | 180px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 23 | .gallery-search | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 23 | .gallery-search | padding: 0 13px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .gallery-search | padding: 0 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 23 | .gallery-search | height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 23 | .gallery-search | border: 1px solid #e6e2ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 23 | .gallery-search | border: 1px solid #e6e2ef | #e6e2ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .gallery-search | border-radius: 10px | 10px | EXACTO | --radius-md |
| 23 | .gallery-search | color: #8b8397 | #8b8397 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .gallery-search | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 24 | .gallery-library .gallery-search input | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .gallery-library .gallery-search input | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .gallery-library .gallery-search input | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .gallery-library .gallery-search input | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 24 | .gallery-library .gallery-search input | padding: 10px 0 | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 24 | .gallery-library .gallery-search input | padding: 10px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .gallery-library .gallery-search input | color: #302a3d | #302a3d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .gallery-library .gallery-search input | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 25 | .gallery-filters | gap: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 25 | .gallery-filters | background: #f4f2f8 | #f4f2f8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .gallery-filters | padding: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 25 | .gallery-filters | border-radius: 10px | 10px | EXACTO | --radius-md |
| 26 | .gallery-filters button | min-height: 34px | 34px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 26 | .gallery-filters button | padding: 7px 13px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 26 | .gallery-filters button | padding: 7px 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 26 | .gallery-filters button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 26 | .gallery-filters button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 26 | .gallery-filters button | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 26 | .gallery-filters button | color: #776d86 | #776d86 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 26 | .gallery-filters button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 27 | .gallery-filters button[aria-pressed=true] | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 27 | .gallery-filters button[aria-pressed=true] | color: #6e46c4 | #6e46c4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .gallery-filters button[aria-pressed=true] | box-shadow: 0 2px 5px #35204a12 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 27 | .gallery-filters button[aria-pressed=true] | box-shadow: 0 2px 5px #35204a12 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .gallery-filters button[aria-pressed=true] | box-shadow: 0 2px 5px #35204a12 | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .gallery-filters button[aria-pressed=true] | box-shadow: 0 2px 5px #35204a12 | #35204a12 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .gallery-filters button[aria-pressed=true] | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 28 | .gallery-drop-hint | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | .gallery-drop-hint | color: #81778e | #81778e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 28 | .gallery-drop-hint | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 28 | .gallery-drop-hint | margin: 15px 0 5px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | .gallery-drop-hint | margin: 15px 0 5px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 28 | .gallery-drop-hint | margin: 15px 0 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 29 | .gallery-drop-hint > span | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 29 | .gallery-drop-hint > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 30 | .gallery-message | padding: 10px 14px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 30 | .gallery-message | padding: 10px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 30 | .gallery-message | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 30 | .gallery-message | background: #f0ebfb | #f0ebfb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .gallery-message | color: #614297 | #614297 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .gallery-message | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 31 | .media-library.gallery-library .media-grid | grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) | 220px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 31 | .media-library.gallery-library .media-grid | grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 31 | .media-library.gallery-library .media-grid | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .media-library.gallery-library .media-grid | padding: 18px 2px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .media-library.gallery-library .media-grid | padding: 18px 2px | 2px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .media-library.gallery-library .media-grid | max-height: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .media-library.gallery-library .media-item | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .media-library.gallery-library .media-item | gap: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .media-library.gallery-library .media-item | border-radius: 15px | 15px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 32 | .media-library.gallery-library .media-item | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 32 | .media-library.gallery-library .media-item | box-shadow: 0 3px 12px #38204806 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .media-library.gallery-library .media-item | box-shadow: 0 3px 12px #38204806 | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .media-library.gallery-library .media-item | box-shadow: 0 3px 12px #38204806 | 12px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 32 | .media-library.gallery-library .media-item | box-shadow: 0 3px 12px #38204806 | #38204806 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 33 | .gallery-thumbnail | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 33 | .gallery-thumbnail | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 33 | .gallery-thumbnail | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 33 | .gallery-thumbnail | border-radius: 14px 14px 0 0 | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 33 | .gallery-thumbnail | border-radius: 14px 14px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 33 | .gallery-thumbnail | background: #f3f2f6 | #f3f2f6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 33 | .gallery-thumbnail | aspect-ratio: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | .media-library.gallery-library .gallery-thumbnail :is(img, video) | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 34 | .media-library.gallery-library .gallery-thumbnail :is(img, video) | height: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 34 | .media-library.gallery-library .gallery-thumbnail :is(img, video) | border-radius: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | .media-library.gallery-library .gallery-thumbnail :is(img, video) | pointer-events: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 35 | .gallery-type | left: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 35 | .gallery-type | top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 35 | .gallery-type | gap: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 35 | .gallery-type | padding: 5px 8px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 35 | .gallery-type | padding: 5px 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 35 | .gallery-type | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 35 | .gallery-type | background: #ffffffed | #ffffffed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 35 | .gallery-type | color: #564963 | #564963 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 35 | .gallery-type | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 35 | .gallery-type | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 36 | .gallery-card-info | padding: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 36 | .gallery-card-info | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 37 | .gallery-card-info > strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 38 | .gallery-meta | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 38 | .gallery-meta | margin: 8px 0 14px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 38 | .gallery-meta | margin: 8px 0 14px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 38 | .gallery-meta | margin: 8px 0 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .gallery-meta | color: #8a8194 | #8a8194 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 38 | .gallery-meta | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 39 | .asset-in-use | color: #7650b3 | #7650b3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 39 | .asset-in-use | background: #f1eafa | #f1eafa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 39 | .asset-in-use | padding: 3px 7px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 39 | .asset-in-use | padding: 3px 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 39 | .asset-in-use | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 40 | .asset-available | color: #42816a | #42816a | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .gallery-card-actions | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 42 | .gallery-card-actions > .secondary-button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 42 | .gallery-card-actions > .secondary-button | background: #f8f5fe | #f8f5fe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .gallery-card-actions > .secondary-button | border-color: #e7def6 | #e7def6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .gallery-card-actions > .secondary-button | color: #6e49af | #6e49af | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 43 | .gallery-menu | margin-left: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 44 | .gallery-menu > summary | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 44 | .gallery-menu > summary | width: 40px | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 44 | .gallery-menu > summary | height: 40px | 40px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 44 | .gallery-menu > summary | border: 1px solid #eae5f0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 44 | .gallery-menu > summary | border: 1px solid #eae5f0 | #eae5f0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 44 | .gallery-menu > summary | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 44 | .gallery-menu > summary | color: #766a84 | #766a84 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 45 | .gallery-menu > summary::-webkit-details-marker | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 46 | .gallery-menu[open] > summary | background: #f1eafa | #f1eafa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .gallery-menu > div | bottom: 46px | 46px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 47 | .gallery-menu > div | right: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .gallery-menu > div | z-index: 5 | 5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .gallery-menu > div | width: 155px | 155px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 47 | .gallery-menu > div | padding: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 47 | .gallery-menu > div | border: 1px solid #eae5f0 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 47 | .gallery-menu > div | border: 1px solid #eae5f0 | #eae5f0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .gallery-menu > div | border-radius: 10px | 10px | EXACTO | --radius-md |
| 47 | .gallery-menu > div | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 47 | .gallery-menu > div | box-shadow: 0 8px 28px #33204424 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 47 | .gallery-menu > div | box-shadow: 0 8px 28px #33204424 | 8px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 47 | .gallery-menu > div | box-shadow: 0 8px 28px #33204424 | 28px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 47 | .gallery-menu > div | box-shadow: 0 8px 28px #33204424 | #33204424 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .gallery-menu button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 48 | .gallery-menu button | min-height: 38px | 38px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .gallery-menu button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 48 | .gallery-menu button | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 48 | .gallery-menu button | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 48 | .gallery-menu button | padding: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 48 | .gallery-menu button | padding: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 48 | .gallery-menu button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 48 | .gallery-menu button | color: #574967 | #574967 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .gallery-menu button:hover | background: #f6f3fa | #f6f3fa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 49 | .gallery-menu .gallery-delete | color: #bf3659 | #bf3659 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 50 | .gallery-empty | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 50 | .gallery-empty | padding: 48px 20px | 48px | EXACTO | --space-12; validar densidad si es padding |
| 50 | .gallery-empty | padding: 48px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 50 | .gallery-empty | color: #87769e | #87769e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 50 | .gallery-empty | border: 1px dashed #ded4ed | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 50 | .gallery-empty | border: 1px dashed #ded4ed | #ded4ed | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 50 | .gallery-empty | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 51 | .gallery-empty strong | color: #584369 | #584369 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 51 | .gallery-empty p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .gallery-empty p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 52 | .gallery-viewer | width: min(960px, calc(100vw - 32px)) | 960px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .gallery-viewer | width: min(960px, calc(100vw - 32px)) | 100vw | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 52 | .gallery-viewer | width: min(960px, calc(100vw - 32px)) | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .gallery-viewer | max-height: calc(100dvh - 32px) | 100dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 52 | .gallery-viewer | max-height: calc(100dvh - 32px) | 32px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .gallery-viewer | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 52 | .gallery-viewer | margin: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 52 | .gallery-viewer | border: 1px solid #e7e1ef | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .gallery-viewer | border: 1px solid #e7e1ef | #e7e1ef | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 52 | .gallery-viewer | border-radius: 18px | 18px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 52 | .gallery-viewer | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 52 | .gallery-viewer | color: #302a3d | #302a3d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 53 | .gallery-viewer::backdrop | background: #171122bb | #171122bb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 53 | .gallery-viewer::backdrop | backdrop-filter: blur(5px) | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .gallery-viewer header, .gallery-viewer footer | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 54 | .gallery-viewer header, .gallery-viewer footer | padding: 14px 20px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 54 | .gallery-viewer header, .gallery-viewer footer | padding: 14px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 55 | .gallery-viewer header strong | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 55 | .gallery-viewer header strong | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 56 | .gallery-viewer footer | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 56 | .gallery-viewer footer | color: #84758e | #84758e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .gallery-viewer-media | background: #17141e | #17141e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .gallery-viewer-media | min-height: 160px | 160px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 58 | .gallery-viewer-media :is(img, video) | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 58 | .gallery-viewer-media :is(img, video) | height: min(65dvh, 700px) | 65dvh | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 58 | .gallery-viewer-media :is(img, video) | height: min(65dvh, 700px) | 700px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 59 | .gallery-viewer-media p | color: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 59 | .gallery-viewer-media p | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | @media (max-width: 640px) → .gallery-header | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | @media (max-width: 640px) → .gallery-header h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 60 | @media (max-width: 640px) → .gallery-header .primary-button | padding-inline: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 60 | @media (max-width: 640px) → .gallery-toolbar | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | @media (max-width: 640px) → .gallery-search | flex-basis: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | @media (max-width: 640px) → .gallery-filters | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | @media (max-width: 640px) → .gallery-filters button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | @media (max-width: 640px) → .gallery-drop-hint > span | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | @media (max-width: 640px) → .gallery-drop-hint > span | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | @media (max-width: 640px) → .media-library.gallery-library .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | @media (max-width: 640px) → .media-library.gallery-library .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | @media (max-width: 640px) → .media-library.gallery-library .media-grid | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | @media (max-width: 640px) → .media-library.gallery-library .media-grid | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | @media (max-width: 640px) → .gallery-card-info | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | @media (max-width: 640px) → .gallery-card-actions > .secondary-button | padding: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 60 | @media (max-width: 640px) → .gallery-card-actions > .secondary-button | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 61 | @media (max-width: 380px) → .media-library.gallery-library .media-grid | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 60 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 61 | @media | condición: (max-width: 380px) | 380px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/my-day.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .my-day | max-width: 1100px | 1100px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-overview | gap: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-overview | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 1 | .day-overview | padding: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .day-overview | border: 1px solid #e3daf7 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-overview | border: 1px solid #e3daf7 | #e3daf7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-overview | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 1 | .day-overview | margin: 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .day-overview | margin: 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-overview | color: #7053a5 | #7053a5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-overview>div | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-overview strong | font-size: 19px | 19px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .day-overview p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-overview p | margin: 8px 0 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .day-overview p | margin: 8px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-tabs,.day-actions | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .day-tabs | margin: 24px 0 18px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .day-tabs | margin: 24px 0 18px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-tabs | margin: 24px 0 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-tabs [aria-pressed=true] | background: #ede6fc | #ede6fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-tabs [aria-pressed=true] | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .day-tabs [aria-pressed=true] | border-color: #c6b7e6 | #c6b7e6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task-list | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-task | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .day-task | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-task | border-left: 4px solid #cec6de | 4px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-task | border-left: 4px solid #cec6de | #cec6de | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .day-task | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-task[data-priority=urgent] | border-left-color: #bf647d | #bf647d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task[data-priority=important] | border-left-color: #b29454 | #b29454 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task h2 | font-size: 17px | 17px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .day-task h2 | margin: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .day-task h2 | margin: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-task-top | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .day-task-top | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .day-priority | padding: 5px 9px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-priority | padding: 5px 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-priority | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .day-priority | background: #f6f2fb | #f6f2fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-priority | color: #796397 | #796397 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task[data-priority=urgent] .day-priority | background: #fff0f4 | #fff0f4 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task[data-priority=urgent] .day-priority | color: #ac4f6c | #ac4f6c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-task .day-actions | margin-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .day-post-link | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-post-link | background: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .day-post-link | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-post-link | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-post-link | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .day-post-link | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-snoozed | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-snoozed | color: #9a793e | #9a793e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-snoozed | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-editor | padding: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .day-editor | border: 1px solid #ded4f3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-editor | border: 1px solid #ded4f3 | #ded4f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-editor | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .day-editor | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .day-editor | margin: 20px 0 | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-editor | margin: 20px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor h2 | font-size: 19px | 19px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .day-editor h2 | margin: 0 0 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor h2 | margin: 0 0 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-editor fieldset | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor fieldset | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor fieldset | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor fieldset | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-editor label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .day-editor label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-editor label | margin-bottom: 15px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-editor input,.day-editor select | border: 1px solid #dfdbe8 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-editor input,.day-editor select | border: 1px solid #dfdbe8 | #dfdbe8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-editor input,.day-editor select | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .day-editor input,.day-editor select | min-height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 1 | .day-editor input,.day-editor select | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-editor input,.day-editor select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .day-editor input,.day-editor select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .day-form-row | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .day-form-row | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .day-editor p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-editor p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-empty | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .day-empty | border: 1px dashed #dfd9eb | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-empty | border: 1px dashed #dfd9eb | #dfd9eb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-empty | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .day-empty | padding: 40px 20px | 40px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-empty | padding: 40px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-empty | color: #8c7fa3 | #8c7fa3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .day-empty h2 | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 1 | .day-empty p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .day-empty p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-publications | margin: 30px 0 | 30px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-publications | margin: 30px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .day-publications>h2 | font-size: 18px | 18px | EXACTO | --font-size-lg |
| 1 | .day-publications>p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .day-publication | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .day-publication | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .day-publication | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .day-publication | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .day-publication | border-radius: 10px | 10px | EXACTO | --radius-md |
| 1 | .day-publication | padding: 15px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .day-publication | margin-top: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .day-publication small | margin-top: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-health | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-health | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-health | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-health | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-health | margin: 20px 0 | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-health | margin: 20px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-health h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 1 | .notification-health p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-health p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-limit | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .notification-limit | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-limit | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-limit | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-limit | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-limit | margin-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-limit | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .notification-limit input | width: 80px | 80px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-limit small | flex-basis: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:640px) → .day-overview | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:640px) → .day-overview>div | min-width: 180px | 180px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | @media (max-width:640px) → .day-overview>button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:640px) → .day-form-row | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:640px) → .day-form-row | gap: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:640px) → .day-task | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | @media (max-width:640px) → .day-actions>button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:640px) → .day-editor | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media | condición: (max-width:640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/notification-settings.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .notify-redesign | max-width: 1200px | 1200px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 2 | .notify-redesign h2 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 2 | .notify-redesign h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 2 | .notify-redesign h2 | letter-spacing: -.3px | -.3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 3 | .notify-redesign h3 | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .notify-redesign h3 | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 4 | .notify-redesign .notification-fieldset | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 5 | .notify-device, .notify-custom, .notify-diagnostics | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 5 | .notify-device, .notify-custom, .notify-diagnostics | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .notify-device, .notify-custom, .notify-diagnostics | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 6 | .notify-device | margin: 24px 0 20px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 6 | .notify-device | margin: 24px 0 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 6 | .notify-device | margin: 24px 0 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 7 | .notify-redesign summary | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 7 | .notify-redesign summary | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 7 | .notify-redesign summary | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .notify-redesign summary::-webkit-details-marker | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 9 | .notify-redesign summary > span:not(.notify-step) | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .notify-redesign summary strong | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 11 | .notify-redesign summary small | margin-top: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .notify-redesign summary small | font-size: 12px | 12px | CONFLICTO | Posible ayuda/metadato: --font-size-meta/help exige 14px; revisar contexto |
| 11 | .notify-redesign summary small | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .notify-redesign summary > svg | color: #958aa7 | #958aa7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 12 | .notify-redesign summary > svg | transition: transform .2s | .2s | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 13 | .notify-redesign details[open] > summary > svg | transform: rotate(180deg) | 180deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 14 | .notify-step | width: 30px | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 14 | .notify-step | height: 30px | 30px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 14 | .notify-step | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 14 | .notify-step | background: #f0ebfc | #f0ebfc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 14 | .notify-step | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 14 | .notify-step | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 14 | .notify-step | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 14 | .notify-step | font-weight: 700 | 700 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 15 | .notify-device-body | padding: 0 22px 22px 64px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 15 | .notify-device-body | padding: 0 22px 22px 64px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .notify-device-body | padding: 0 22px 22px 64px | 64px | EXACTO | --space-16; validar densidad si es padding |
| 16 | .notify-device-body > p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 17 | .notify-device-body .push-settings | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 18 | .notify-layout | grid-template-columns: minmax(0, 1fr) 300px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 18 | .notify-layout | grid-template-columns: minmax(0, 1fr) 300px | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 18 | .notify-layout | grid-template-columns: minmax(0, 1fr) 300px | 300px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 18 | .notify-layout | gap: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 19 | .notify-main | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 19 | .notify-main | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 20 | .notify-section | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 20 | .notify-section | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 20 | .notify-section | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 20 | .notify-section | padding: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 21 | .notify-section-heading | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 21 | .notify-section-heading | margin-bottom: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 22 | .notify-section-heading > svg | color: #8b79a5 | #8b79a5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 22 | .notify-section-heading > svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .notify-section-heading p | margin: 5px 0 0 | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 23 | .notify-section-heading p | margin: 5px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .notify-section-heading p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 23 | .notify-section-heading p | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .notify-presets | grid-template-columns: repeat(3, minmax(0, 1fr)) | 3 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .notify-presets | grid-template-columns: repeat(3, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 24 | .notify-presets | grid-template-columns: repeat(3, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .notify-presets | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .notify-presets button | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .notify-presets button | padding: 15px 12px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 25 | .notify-presets button | padding: 15px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 25 | .notify-presets button | border: 1px solid #e6e1ec | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .notify-presets button | border: 1px solid #e6e1ec | #e6e1ec | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 25 | .notify-presets button | border-radius: 11px | 11px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 25 | .notify-presets button | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 26 | .notify-presets button:hover | background: #faf8ff | #faf8ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 26 | .notify-presets button:hover | border-color: #baaae0 | #baaae0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .notify-presets button[aria-pressed=true] | border-color: #9477d9 | #9477d9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .notify-presets button[aria-pressed=true] | background: #f5f0ff | #f5f0ff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .notify-presets button[aria-pressed=true] | box-shadow: 0 0 0 1px #9477d9 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 27 | .notify-presets button[aria-pressed=true] | box-shadow: 0 0 0 1px #9477d9 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .notify-presets button[aria-pressed=true] | box-shadow: 0 0 0 1px #9477d9 | #9477d9 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 28 | .notify-presets button > span | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | .notify-presets button > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 28 | .notify-presets button > span | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 29 | .notify-presets small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 29 | .notify-presets small | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 30 | .notify-presets b | font-weight: 500 | 500 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 30 | .notify-presets b | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 30 | .notify-presets b | color: #8063b0 | #8063b0 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 30 | .notify-presets b | margin-top: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 30 | .notify-presets b | padding-top: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .notify-hint | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 31 | .notify-hint | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 31 | .notify-hint | margin: 14px 0 0 | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .notify-hint | margin: 14px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .notify-window | grid-template-columns: 1fr auto 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .notify-window | grid-template-columns: 1fr auto 1fr 1fr | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 32 | .notify-window | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 33 | .notify-window > span | padding-bottom: 15px | 15px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 33 | .notify-window > span | color: #b5abbe | #b5abbe | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 34 | .notify-redesign label | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 34 | .notify-redesign label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 34 | .notify-redesign label | color: #5e556b | #5e556b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 35 | .notify-redesign input, .notify-redesign select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 35 | .notify-redesign input, .notify-redesign select | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 35 | .notify-redesign input, .notify-redesign select | min-height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 35 | .notify-redesign input, .notify-redesign select | padding: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 35 | .notify-redesign input, .notify-redesign select | border: 1px solid #ded9e8 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 35 | .notify-redesign input, .notify-redesign select | border: 1px solid #ded9e8 | #ded9e8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 35 | .notify-redesign input, .notify-redesign select | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 35 | .notify-redesign input, .notify-redesign select | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 35 | .notify-redesign input, .notify-redesign select | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 36 | .notify-redesign [aria-invalid=true] | border-color: #bc6276 | #bc6276 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 37 | .notify-field-error | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 37 | .notify-field-error | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 37 | .notify-field-error | color: #a44059 | #a44059 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 37 | .notify-field-error | margin: 10px 0 0 | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 37 | .notify-field-error | margin: 10px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 38 | .notify-rule | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 38 | .notify-rule | border-top: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 39 | .notify-rule-head | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 40 | .notify-rule-head p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 40 | .notify-rule-head p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 40 | .notify-rule-head p | margin: 6px 0 0 | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 40 | .notify-rule-head p | margin: 6px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 41 | .notify-switch | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 41 | .notify-switch | width: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 41 | .notify-switch | min-height: 28px | 28px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 41 | .notify-switch | background: #e4e0ea | #e4e0ea | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 41 | .notify-switch | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 41 | .notify-switch | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 41 | .notify-switch | padding: 4px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 42 | .notify-switch span | width: 20px | 20px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 42 | .notify-switch span | height: 20px | 20px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 42 | .notify-switch span | border-radius: 50% | 50% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 42 | .notify-switch span | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 42 | .notify-switch span | box-shadow: 0 1px 3px #3c28572b | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 42 | .notify-switch span | box-shadow: 0 1px 3px #3c28572b | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 42 | .notify-switch span | box-shadow: 0 1px 3px #3c28572b | 3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 42 | .notify-switch span | box-shadow: 0 1px 3px #3c28572b | #3c28572b | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 42 | .notify-switch span | transition: transform .2s | .2s | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 43 | .notify-switch[aria-checked=true] | background: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 44 | .notify-switch[aria-checked=true] span | transform: translateX(16px) | 16px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 45 | .notify-rule-fields | grid-template-columns: 1fr 1.5fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 45 | .notify-rule-fields | grid-template-columns: 1fr 1.5fr | 1.5fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 45 | .notify-rule-fields | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 45 | .notify-rule-fields | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 46 | .notify-rule-note | margin: 12px 0 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 46 | .notify-rule-note | margin: 12px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .notify-rule-note | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 46 | .notify-rule-note | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 46 | .notify-rule-note | color: #8b7b9d | #8b7b9d | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .notify-preview | top: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 47 | .notify-preview | border: 1px solid #e5dcf5 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 47 | .notify-preview | border: 1px solid #e5dcf5 | #e5dcf5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .notify-preview | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 47 | .notify-preview | background: #fcfaff | #fcfaff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 47 | .notify-preview | padding: 21px | 21px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 48 | .notify-preview-limit | border-bottom: 1px solid #e9e1f3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 48 | .notify-preview-limit | border-bottom: 1px solid #e9e1f3 | #e9e1f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .notify-preview-limit | padding-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 48 | .notify-preview-limit | color: #7652b8 | #7652b8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 48 | .notify-preview-limit | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 49 | .notify-preview-limit strong | font-size: 17px | 17px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 50 | .notify-preview-limit > span | flex-basis: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 50 | .notify-preview-limit > span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 50 | .notify-preview-limit > span | color: #8d7ba6 | #8d7ba6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 51 | .notify-timeline | list-style: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 51 | .notify-timeline | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .notify-timeline | margin: 20px 0 | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 51 | .notify-timeline | margin: 20px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 51 | .notify-timeline | gap: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 52 | .notify-timeline li | grid-template-columns: 44px 1fr | 44px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 52 | .notify-timeline li | grid-template-columns: 44px 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 52 | .notify-timeline li | gap: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 53 | .notify-timeline time | color: #7d62a3 | #7d62a3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 53 | .notify-timeline time | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 53 | .notify-timeline time | font-weight: 650 | 650 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 53 | .notify-timeline time | padding-top: 2px | 2px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 54 | .notify-timeline li > div | border-left: 2px solid #e0d4f2 | 2px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 54 | .notify-timeline li > div | border-left: 2px solid #e0d4f2 | #e0d4f2 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 54 | .notify-timeline li > div | padding-left: 11px | 11px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 55 | .notify-timeline li span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 55 | .notify-timeline li span | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 55 | .notify-timeline li span | color: #726580 | #726580 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 56 | .notify-timeline li span + span | margin-top: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 57 | .notify-preview-tip | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 57 | .notify-preview-tip | border-top: 1px solid #e9e1f3 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 57 | .notify-preview-tip | border-top: 1px solid #e9e1f3 | #e9e1f3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 57 | .notify-preview-tip | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 57 | .notify-preview-tip | padding-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 57 | .notify-preview-tip | color: #8c74ae | #8c74ae | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 58 | .notify-preview-tip svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 59 | .notify-preview-tip p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 59 | .notify-preview-tip p | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 59 | .notify-preview-tip p | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | .notify-savebar | bottom: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 60 | .notify-savebar | z-index: 5 | 5 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | .notify-savebar | margin: 22px 0 | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | .notify-savebar | margin: 22px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | .notify-savebar | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 60 | .notify-savebar | border: 1px solid #e5dfee | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 60 | .notify-savebar | border: 1px solid #e5dfee | #e5dfee | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .notify-savebar | box-shadow: 0 5px 22px #3520470c | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 60 | .notify-savebar | box-shadow: 0 5px 22px #3520470c | 5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 60 | .notify-savebar | box-shadow: 0 5px 22px #3520470c | 22px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 60 | .notify-savebar | box-shadow: 0 5px 22px #3520470c | #3520470c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 60 | .notify-savebar | padding: 16px 20px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 60 | .notify-savebar | padding: 16px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 60 | .notify-savebar | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 60 | .notify-savebar | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 61 | .notify-savebar strong | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 62 | .notify-savebar span | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 62 | .notify-savebar span | margin-top: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 63 | .notify-savebar > div:last-child | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 64 | .notify-diagnostics | margin-bottom: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 65 | .notify-diagnostics > div | padding: 0 20px 20px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 65 | .notify-diagnostics > div | padding: 0 20px 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 66 | .notify-diagnostics p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 66 | .notify-diagnostics p | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | @media (max-width:1000px) → .notify-layout | grid-template-columns: minmax(0,1fr) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | @media (max-width:1000px) → .notify-layout | grid-template-columns: minmax(0,1fr) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 67 | @media (max-width:1000px) → .notify-timeline | grid-template-columns: repeat(2,minmax(0,1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | @media (max-width:1000px) → .notify-timeline | grid-template-columns: repeat(2,minmax(0,1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 67 | @media (max-width:1000px) → .notify-timeline | grid-template-columns: repeat(2,minmax(0,1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-presets | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-presets button | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-presets button | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-presets b | padding-top: 3px | 3px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-section | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-window | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-window > span | display: none | none | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-rule-fields | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-savebar | bottom: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 68 | @media (max-width:640px) → .notify-savebar | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-savebar > div:last-child | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-savebar button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 68 | @media (max-width:640px) → .notify-device-body | padding: 0 18px 18px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 68 | @media (max-width:640px) → .notify-device-body | padding: 0 18px 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-timeline | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 68 | @media (max-width:640px) → .notify-redesign summary | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 68 | @media (max-width:640px) → .notify-switch | min-height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 68 | @media (max-width:640px) → .notify-switch | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 68 | @media (max-width:640px) → .notify-switch::before | inset: 8px 0 | 8px | EXACTO | --space-2; validar densidad si es padding |
| 68 | @media (max-width:640px) → .notify-switch::before | inset: 8px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 68 | @media (max-width:640px) → .notify-switch::before | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 68 | @media (max-width:640px) → .notify-switch::before | background: #e4e0ea | #e4e0ea | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 68 | @media (max-width:640px) → .notify-switch[aria-checked=true] | background: transparent | transparent | ESTRUCTURAL | Sin token equivalente; conservar comportamiento sujeto a aprobación |
| 68 | @media (max-width:640px) → .notify-switch[aria-checked=true]::before | background: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 67 | @media | condición: (max-width:1000px) | 1000px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 68 | @media | condición: (max-width:640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/notifications.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .notification-module | max-width: 1150px | 1150px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-device | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .notification-device | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-device | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .notification-device | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 1 | .notification-device | padding: 10px 14px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-device | padding: 10px 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-device | border-radius: 20px | 20px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-explainer | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-explainer | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 1 | .notification-explainer | border: 1px solid #e4dbf8 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-explainer | border: 1px solid #e4dbf8 | #e4dbf8 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-explainer | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-explainer | padding: 22px | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-explainer | margin: 24px 0 | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .notification-explainer | margin: 24px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-explainer | color: #645090 | #645090 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-explainer>svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-explainer p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-explainer p | margin: 7px 0 | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-explainer p | margin: 7px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-explainer p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .notification-explainer small | font-size: 12px | 12px | CONFLICTO | Posible ayuda/metadato: --font-size-meta/help exige 14px; revisar contexto |
| 1 | .notification-explainer small | color: #80728f | #80728f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-fieldset | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-fieldset | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-fieldset | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-fieldset | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-fieldset:disabled | opacity: .65 | .65 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-hours | gap: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 1 | .notification-hours | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-hours | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-hours | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-hours | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-hours | margin-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-hours>div | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-hours p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-hours p | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-hours p | margin: 6px 0 | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-hours p | margin: 6px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-hours label | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-hours label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-module input,.notification-card select | padding: 10px 12px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-module input,.notification-card select | padding: 10px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .notification-module input,.notification-card select | border: 1px solid #e2ddeb | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-module input,.notification-card select | border: 1px solid #e2ddeb | #e2ddeb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-module input,.notification-card select | border-radius: 9px | 9px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-module input,.notification-card select | min-height: 44px | 44px | PROPUESTA | --control-min-size solo si corresponde a un control |
| 1 | .notification-module input,.notification-card select | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-cards | grid-template-columns: 1fr 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .notification-cards | gap: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-card | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-card | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-card | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-card | padding: 23px | 23px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-card-heading | gap: 13px | 13px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-card-heading | min-height: 105px | 105px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-kind-icon | background: #f1edfa | #f1edfa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-kind-icon | color: #7053d6 | #7053d6 | EXACTO | --accent; equivalencia de valor, revisar función semántica |
| 1 | .notification-kind-icon | border-radius: 12px | 12px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-kind-icon | width: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-kind-icon | height: 42px | 42px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-kind-icon | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-card h2,.notification-connect h2 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 1 | .notification-card h2,.notification-connect h2 | margin: 0 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-card h2,.notification-connect h2 | margin: 0 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .notification-card h2,.notification-connect h2 | letter-spacing: -.3px | -.3px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-card-heading p | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-card-heading p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-card-heading p | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-intensity-label | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-intensity-label | margin: 14px 0 8px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-intensity-label | margin: 14px 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-intensity-label | margin: 14px 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 1 | .notification-intensity-label | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-card select | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .notification-card select | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .notification-time | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .notification-time | font-size: 12px | 12px | CONFLICTO | Posible ayuda/metadato: --font-size-meta/help exige 14px; revisar contexto |
| 1 | .notification-time | margin-top: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-schedule | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 1 | .notification-schedule | color: #8066a5 | #8066a5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-schedule | background: #f8f6fc | #f8f6fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-schedule | padding: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 1 | .notification-schedule | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-schedule | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-schedule | margin: 16px 0 0 | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .notification-schedule | margin: 16px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-save | gap: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .notification-save | padding: 22px 0 | 22px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-save | padding: 22px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-save>span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-connect | padding: 23px | 23px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-connect | border: 1px solid var(--border) | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .notification-connect | background: white | white | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 1 | .notification-connect | border-radius: 14px | 14px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 1 | .notification-connect | margin-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | .notification-connect>p,.notification-footnote | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 1 | .notification-connect>p,.notification-footnote | line-height: 1.8 | 1.8 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .notification-message | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | .notification-message | background: #f0ecfc | #f0ecfc | EXACTO | --accent-subtle; equivalencia de valor, revisar función semántica |
| 1 | .notification-message | color: #644b9c | #644b9c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 1 | .notification-message | border-radius: 10px | 10px | EXACTO | --radius-md |
| 1 | .notification-message | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 1 | .mobile-module-nav | overflow-x: auto | auto | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .mobile-module-nav>button | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:640px) → .notification-cards | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:640px) → .notification-hours | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:640px) → .notification-hours>div | flex-basis: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | @media (max-width:640px) → .notification-hours label | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:640px) → .notification-card-heading | min-height: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | @media (max-width:640px) → .notification-card-heading | margin-bottom: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media (max-width:640px) → .notification-explainer | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 1 | @media (max-width:640px) → .notification-card | padding: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 1 | @media | condición: (max-width:640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |

## app/schedule-studio.css

| Línea | Selector / contexto | Propiedad y declaración actual | Literal | Estado | Token / decisión pendiente |
|---:|---|---|---|---|---|
| 1 | .schedule-workspace | grid-template-columns: minmax(0, 1fr) 320px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 1 | .schedule-workspace | grid-template-columns: minmax(0, 1fr) 320px | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 1 | .schedule-workspace | grid-template-columns: minmax(0, 1fr) 320px | 320px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 1 | .schedule-workspace | gap: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 2 | .schedule-main | min-width: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .schedule-studio .schedule-config | grid-template-columns: repeat(2, minmax(0, 1fr)) | 2 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .schedule-studio .schedule-config | grid-template-columns: repeat(2, minmax(0, 1fr)) | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .schedule-studio .schedule-config | grid-template-columns: repeat(2, minmax(0, 1fr)) | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 3 | .schedule-studio .schedule-config | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 3 | .schedule-studio .schedule-config | padding-top: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 4 | .schedule-section-heading | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 4 | .schedule-section-heading | font-size: 14px | 14px | EXACTO | --font-size-sm |
| 4 | .schedule-section-heading | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .schedule-section-heading | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 4 | .schedule-section-heading | color: #443652 | #443652 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .schedule-section-heading > span | width: 24px | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .schedule-section-heading > span | height: 24px | 24px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 5 | .schedule-section-heading > span | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 5 | .schedule-section-heading > span | background: #eee7fb | #eee7fb | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .schedule-section-heading > span | color: #7650bd | #7650bd | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 5 | .schedule-section-heading > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 6 | legend.schedule-section-heading | padding: 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 6 | legend.schedule-section-heading | padding: 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 7 | .schedule-presets | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .schedule-presets | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 7 | .schedule-presets | gap: 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 8 | .schedule-presets button | border: 1px solid #e8e1f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 8 | .schedule-presets button | border: 1px solid #e8e1f1 | #e8e1f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 8 | .schedule-presets button | border-radius: 8px | 8px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 8 | .schedule-presets button | background: #fff | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 8 | .schedule-presets button | padding: 9px 12px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 8 | .schedule-presets button | padding: 9px 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 8 | .schedule-presets button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 8 | .schedule-presets button | color: #79698a | #79698a | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 9 | .schedule-presets button[aria-pressed=true] | background: #efe8fc | #efe8fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 9 | .schedule-presets button[aria-pressed=true] | border-color: #d5c1f5 | #d5c1f5 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 9 | .schedule-presets button[aria-pressed=true] | color: #6943aa | #6943aa | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 10 | .schedule-validation | grid-column: 1 / -1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .schedule-validation | grid-column: 1 / -1 | -1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .schedule-validation | margin: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 10 | .schedule-validation | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 10 | .schedule-validation | color: #ae3655 | #ae3655 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 11 | .schedule-studio .schedule-list | margin: 20px 0 0 | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 11 | .schedule-studio .schedule-list | margin: 20px 0 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 12 | .schedule-list-heading | gap: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 12 | .schedule-list-heading | margin-bottom: 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 13 | .schedule-list-heading > span | color: #897995 | #897995 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 13 | .schedule-list-heading > span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 14 | .schedule-selection-bar | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 14 | .schedule-selection-bar | padding-bottom: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 15 | .schedule-selection-bar .schedule-select-all | padding: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | .schedule-selection-bar > button | border: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 16 | .schedule-selection-bar > button | background: #f5f1fc | #f5f1fc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 16 | .schedule-selection-bar > button | color: #72509f | #72509f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 16 | .schedule-selection-bar > button | border-radius: 7px | 7px | AMBIGUO | Radio fuera de escala; no redondear sin aprobación |
| 16 | .schedule-selection-bar > button | padding: 8px 10px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 16 | .schedule-selection-bar > button | padding: 8px 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 16 | .schedule-selection-bar > button | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 17 | .schedule-item.is-excluded | background: #faf9fc | #faf9fc | EXACTO | --neutral-50; equivalencia de valor, revisar función semántica |
| 17 | .schedule-item.is-excluded strong | color: #978d9f | #978d9f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 18 | .schedule-post-tags | gap: 6px | 6px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | border-radius: 6px | 6px | EXACTO | --radius-sm |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | background: #f2eff7 | #f2eff7 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | color: #78658c | #78658c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | padding: 4px 7px | 4px | EXACTO | --space-1; validar densidad si es padding |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | padding: 4px 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | font-size: 10px | 10px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 19 | .schedule-post-tags > span, .schedule-post-tags > b | font-weight: 500 | 500 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 20 | .schedule-post-tags > span[data-status="Aprobado"] | background: #eaf7ef | #eaf7ef | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 20 | .schedule-post-tags > span[data-status="Aprobado"] | color: #367d59 | #367d59 | AMBIGUO | Mapeo de estado pendiente; no asignar scheduled/warning automáticamente |
| 21 | .schedule-post-tags > b | background: #fff1df | #fff1df | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 21 | .schedule-post-tags > b | color: #9b692c | #9b692c | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 22 | .schedule-empty | padding: 36px 16px | 36px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 22 | .schedule-empty | padding: 36px 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 22 | .schedule-empty | color: #9b83bc | #9b83bc | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .schedule-empty h3 | font-size: 16px | 16px | EXACTO | --font-size-md |
| 23 | .schedule-empty h3 | color: #574068 | #574068 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .schedule-empty h3 | margin: 16px 0 8px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 23 | .schedule-empty h3 | margin: 16px 0 8px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .schedule-empty h3 | margin: 16px 0 8px | 8px | EXACTO | --space-2; validar densidad si es padding |
| 23 | .schedule-empty p | font-size: 13px | 13px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 23 | .schedule-empty p | color: #87788f | #87788f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 23 | .schedule-empty p | line-height: 1.7 | 1.7 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .schedule-empty p | max-width: 340px | 340px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 23 | .schedule-empty p | margin: 0 0 18px | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 23 | .schedule-empty p | margin: 0 0 18px | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 24 | .schedule-export-card | top: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 24 | .schedule-export-card | padding: 24px | 24px | EXACTO | --space-6; validar densidad si es padding |
| 24 | .schedule-export-card | border: 1px solid #e1d6f1 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 24 | .schedule-export-card | border: 1px solid #e1d6f1 | #e1d6f1 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .schedule-export-card | border-radius: 16px | 16px | EXACTO | --radius-lg |
| 24 | .schedule-export-card | background: linear-gradient(145deg, #fcfaff, #fff) | 145deg | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 24 | .schedule-export-card | background: linear-gradient(145deg, #fcfaff, #fff) | #fcfaff | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 24 | .schedule-export-card | background: linear-gradient(145deg, #fcfaff, #fff) | #fff | EXACTO | --surface; equivalencia de valor, revisar función semántica |
| 25 | .schedule-export-card h2 | font-size: 20px | 20px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 25 | .schedule-export-card h2 | line-height: 1.35 | 1.35 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 25 | .schedule-export-card h2 | letter-spacing: -.5px | -.5px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 25 | .schedule-export-card h2 | margin: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 25 | .schedule-export-card h2 | margin: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 26 | .schedule-export-period | gap: 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 26 | .schedule-export-period | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 26 | .schedule-export-period | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 26 | .schedule-export-period | color: #8b7999 | #8b7999 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 26 | .schedule-export-period svg | flex-shrink: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 27 | .schedule-export-count | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 27 | .schedule-export-count | padding: 18px 0 | 18px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 27 | .schedule-export-count | padding: 18px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 27 | .schedule-export-count | border-top: 1px solid #ede6f6 | 1px | AMBIGUO | Dimensión geométrica, icono, borde, sombra o layout sin token por función |
| 27 | .schedule-export-count | border-top: 1px solid #ede6f6 | #ede6f6 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 27 | .schedule-export-count | margin-top: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 28 | .schedule-export-count strong | font-size: 40px | 40px | AMBIGUO | Fuera de escala tipográfica; normalizar cambia tamaño |
| 28 | .schedule-export-count strong | color: #7050b3 | #7050b3 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 28 | .schedule-export-count strong | font-weight: 600 | 600 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 28 | .schedule-export-count span | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 28 | .schedule-export-count span | color: #80708e | #80708e | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 29 | .schedule-export-summary | gap: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 29 | .schedule-export-summary | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 29 | .schedule-export-summary | color: #786389 | #786389 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 29 | .schedule-export-summary span | gap: 5px | 5px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 30 | .schedule-export-card .schedule-help | margin: 20px 0 | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 30 | .schedule-export-card .schedule-help | margin: 20px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 30 | .schedule-export-card > button | width: 100% | 100% | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 30 | .schedule-export-card > button | margin-bottom: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 31 | .schedule-export-card > small | font-size: 11px | 11px | CONFLICTO | Inferior al mínimo; decidir 12px o --font-size-meta/help (14px) según uso |
| 31 | .schedule-export-card > small | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 31 | .schedule-export-card > small | color: #87768f | #87768f | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 32 | .schedule-export-message | color: #6c4996 | #6c4996 | AMBIGUO | Sin equivalencia exacta; elegir rol (texto/superficie/borde/acento/estado/sombra/marca) antes de migrar |
| 32 | .schedule-export-message | font-size: 12px | 12px | EXACTO | --font-size-xs |
| 32 | .schedule-export-message | line-height: 1.6 | 1.6 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 32 | .schedule-export-message | margin-bottom: 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 33 | @media (max-width: 1050px) → .schedule-workspace | grid-template-columns: 1fr | 1fr | AMBIGUO | Unidad relativa, palabra clave o función sin token aprobado; preservar geometría requiere decisión |
| 33 | @media (max-width: 1050px) → .schedule-export-count | margin-top: 10px | 10px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 33 | @media (max-width: 1050px) → .schedule-export-count | padding: 12px 0 | 12px | EXACTO | --space-3; validar densidad si es padding |
| 33 | @media (max-width: 1050px) → .schedule-export-count | padding: 12px 0 | 0 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | @media (max-width: 640px) → .schedule-studio .schedule-config | padding: 16px | 16px | EXACTO | --space-4; validar densidad si es padding |
| 34 | @media (max-width: 640px) → .schedule-studio .schedule-config | gap: 12px | 12px | EXACTO | --space-3; validar densidad si es padding |
| 34 | @media (max-width: 640px) → .schedule-studio .schedule-list | padding: 14px | 14px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | @media (max-width: 640px) → .schedule-presets button | flex: 1 | 1 | ESTRUCTURAL | Número sin unidad: revisar función (cero, fracción, peso, capa, opacidad, línea, proporción); no asignar por similitud |
| 34 | @media (max-width: 640px) → .schedule-presets button | padding: 9px 7px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | @media (max-width: 640px) → .schedule-presets button | padding: 9px 7px | 7px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | @media (max-width: 640px) → .schedule-export-card | padding: 20px | 20px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 34 | @media (max-width: 640px) → .schedule-studio .schedule-item | gap: 9px | 9px | AMBIGUO | Espacio fuera de escala, negativo o cero dimensional; falta decisión |
| 33 | @media | condición: (max-width: 1050px) | 1050px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
| 34 | @media | condición: (max-width: 640px) | 640px | AMBIGUO | Breakpoint sin token; conservar umbral requiere ampliar sistema |
