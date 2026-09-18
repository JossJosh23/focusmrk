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

- `npm.cmd run check`: ESLint, tipos y cinco pruebas de diseño/editor.
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

## Segunda revisión: calendario y editor

- Las acciones y errores del editor viven fuera de los paneles que se ocultan
  al cambiar a Vista previa móvil. Guardar sigue asociado al formulario nativo;
  los campos inválidos devuelven al usuario a Editar para corregirlos.
- El formulario se organiza en Contenido, Imagen o video y Programación.
  Notas y referencias continúan en opciones adicionales plegables.
- Elegir un archivo de biblioteca limpia el enlace multimedia anterior.
  Cambiar de publicación reinicia la simulación de vista previa.
- El calendario explica sus filtros rápidos y ofrece limpiar filtros o crear
  contenido cuando no hay resultados. Agrupa los posts por fecha una sola vez
  por cambio de datos, en vez de recorrer la lista por cada celda.
- Se retira la etiqueta HOY que competía con los dos controles de 44px en la
  cabecera de cada celda. Se conserva el círculo de acento y `aria-current="date"`.
- Una prueba de renderizado estático comprueba que Guardar apunta al formulario
  y que las acciones/errores quedan fuera del panel móvil ocultable. No simula
  clics, validación nativa ni el layout de un navegador.

## Jerarquía visual del calendario

- Navegación lateral oscura con tokens propios y pares de contraste comprobados.
- Encabezado con contexto, título de 36px (28px en móvil) y descripción breve.
- Indicadores independientes con números destacados, señal de interacción y
  borde violeta al seleccionar. Se conserva su comportamiento de filtrado.
- Más separación entre resumen y calendario; barras de herramientas y pies con
  superficies diferenciadas. El día actual conserva un fondo de acento suave.
- Corrección del avatar de empresa: texto de acento sobre fondo claro, en lugar
  de blanco sobre violeta pálido.

## Menú de usuario

- Icono circular de perfil inmediatamente a la derecha de la campana, con
  opciones Editar perfil, Cambiar contraseña, Notificaciones y Cerrar sesión.
- El desplegable usa controles nativos, admite Escape y se cierra al pulsar fuera.
  Los formularios se abren en un diálogo modal y protegen cambios sin guardar.
- El nombre visible se guarda por cuenta en el servidor; en modo local se guarda
  únicamente en el navegador. Editarlo no cambia el usuario ni los permisos.
- Las cuentas de marketing cambian contraseña tras verificar la actual. El cambio
  revoca todas sus sesiones y requiere iniciar sesión de nuevo. Login y cambio
  de contraseña bloquean la misma fila para evitar sesiones concurrentes antiguas.
- La contraseña administradora sigue gestionándose mediante `PANEL_PASSWORD`
  en el servidor. El diálogo explica esa limitación; no modifica variables de entorno.
- El modo local no tiene contraseña ni opción de cerrar una sesión inexistente.
