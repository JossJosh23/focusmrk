# Sistema de diseño — FocusMRK

Este archivo es la fuente de verdad. Cualquier valor visual sale de aquí.
Prohibido hardcodear colores, espacios, tamaños o radios en componentes.

## Regla de oro

No se crean hojas CSS nuevas de sobrescritura. Si algo necesita un
override, el problema está en el token o en el componente base.

## Tokens de color

Neutros (escala violeta desaturada):
--neutral-50 … --neutral-900 (5-7 pasos)
Acento:
--accent, --accent-hover, --accent-subtle, --accent-contrast
Semánticos (uno por estado, mismo color en TODA la app):
--state-draft, --state-scheduled, --state-published,
--state-error, --state-warning
Cada semántico con su par -bg y -border derivado.

## Estados de publicación

"Publicado" usa el MISMO color en calendario, editor y selector.
Nada de azul en un lado y verde en otro. Lo mismo para el resto.

## Escala tipográfica

Mínimo absoluto: 12px. Nada de 7px, 9px ni 10px.
Escala: 12 / 14 / 16 / 18 / 22 / 28 / 36
Body por defecto: 16px. Metadatos y ayudas: 14px, nunca menos.
Máximo 2 familias tipográficas.
Ancho de línea de texto corrido: 60-75 caracteres.

## Espaciado

Escala de 4px: 4, 8, 12, 16, 24, 32, 48, 64
Densidades declaradas (elegir una por contexto, no improvisar):

- compacta (celdas de calendario): padding 8px
- normal (tarjetas, tareas): padding 16px
- amplia (formularios): padding 24px

## Controles

Área táctil mínima: 44x44px. Si el control se ve de 32px,
se amplía con padding o pseudo-elemento, no se deja en 32.
Radios: --radius-sm 6px, --radius-md 10px, --radius-lg 16px

## Contraste

Texto normal: 4.5:1 mínimo. Texto grande: 3:1.
Placeholders incluidos — no son decoración, son información.

## Jerarquía de acciones

Un solo botón primario por vista. En listas de items repetidos,
las acciones por tarjeta van como secundarias o terciarias.
Si un elemento es interactivo (filtros, indicadores), debe verse
interactivo: cursor, hover, estado activo visible.

## Movimiento

Transiciones 150-250ms, ease-out. Respetar prefers-reduced-motion
(ya está implementado, mantenerlo).

## Conservar

Foco visible, etiquetas accesibles, Agenda móvil, opciones
avanzadas plegables, guardado persistente.

## Aplicación y mantenimiento

- La navegación lateral usa `--sidebar-background` (neutral-900), texto blanco,
  texto secundario neutral-200 y hover neutral-800. El contenido conserva superficies
  claras. Las tarjetas de indicadores tienen borde de acento al estar seleccionadas.

- `app/tokens.css` contiene los valores del sistema. Las hojas de componentes
  consumen tokens; no se añaden hojas de correcciones visuales.
- Borrador usa `state-draft`; En revisión usa `state-warning`; Aprobado usa
  `state-scheduled` como color de contenido listo (no implica publicación
  automática); Publicado usa `state-published`. Se conservan los estados de datos.
- Los tamaños de letra inferiores a 14px se normalizan a 14px en la interfaz.
  El cuerpo usa 16px. Las demás medidas tipográficas se ajustan a la escala.
- Los espacios se ajustan al paso más cercano de la escala; en un empate se
  elige el mayor. Las densidades declaradas tienen prioridad en sus contextos.
- Las dimensiones geométricas de paneles, miniaturas y previsualizaciones
  tienen tokens `--size-*` separados del espaciado. No son pasos de padding.
  Los tokens `--border-width-*`, `--icon-*`, `--shadow-*`, `--line-height-*`,
  `--font-weight-*` y `--tracking-*` completan los roles del sistema.
- Se permiten cero, porcentajes, fracciones de grid, proporciones de medios,
  coordenadas relativas y palabras estructurales como `auto`, `none`,
  `transparent` y `currentColor`: expresan comportamiento, no nuevos colores.
- Los umbrales responsive existentes se conservan: 380, 640, 760, 850, 1000,
  1024, 1050 y 1250px. Se declaran literalmente solo en condiciones `@media`,
  que no aceptan `var()` como sustitución de esos umbrales.
- Los radios de controles/tarjetas usan 6/10/16px. El círculo y la silueta del
  teléfono tienen tokens geométricos propios, sin ampliar la escala de tarjetas.
- El área mínima de controles es 44px. Las casillas conservan su tamaño visual
  dentro de etiquetas de 44px; las casillas independientes amplían su caja.
- Colores de marca dentro de simulaciones y exportaciones no representan estados
  de la aplicación. Las exportaciones conservan sus unidades y estilos de documento.
- Una acción primaria por contexto: guardar en un formulario, descargar en
  cronogramas o crear en una vista. Las acciones de tarjetas son secundarias.
