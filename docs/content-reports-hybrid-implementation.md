# Informes de contenido: implementación híbrida

Implementado sobre el módulo existente de Focus MRKT. El informe usa publicaciones y capturas reales de PostgreSQL; las entradas manuales se guardan por separado. No se cambiaron los flujos OAuth ni se reemplazaron las métricas importadas.

## Uso

En localhost:3000, selecciona la empresa y abre Informes de contenido dentro del sistema. Mi día es el inicio; Cronograma aparece antes de Informes. La selección de empresa persiste y el selector muestra el logo guardado en el perfil. El acceso antiguo de Reportes se retiró de la navegación, conservando sus datos y backend.

El informe permite filtrar período, red y criterio del ranking. En Disponibilidad y datos pendientes puedes registrar métricas verificadas de un panel oficial. Cada registro exige fuente, fecha, unidad y confirmación de verificación. Puedes editarlo, eliminarlo de forma lógica, consultar su historial y escoger API o MANUAL cuando ambos valores existen. El detalle de publicación permite asignar categoría y objetivo editorial. Las metas se registran para meses completos y se comparan únicamente con resultados de cobertura completa.

Exportar utiliza la impresión del navegador: seleccionar Guardar como PDF. El encabezado, empresa, período y número de página los genera la hoja de estilos; desactiva los encabezados y pies adicionales del navegador.

## Archivos y responsabilidades

| Archivos | Responsabilidad |
| --- | --- |
| `lib/content-reports/hybrid.ts` | Catálogo de métricas, unidades, niveles, estados, validación, prioridad API/manual y títulos cortos sin alterar captions |
| `hybrid-schema.ts`, `hybrid-repository.ts` | Esquema aditivo, lecturas por empresa, transacciones, concurrencia, auditoría y persistencia |
| `executive.ts` | Indicadores ejecutivos, cobertura, promedios, comparación normalizada, formatos, objetivos, audiencia y datos pendientes |
| `hybrid-api.ts`, `app/api/reports/{manual-metrics,goals,classification}/route.ts` | Endpoints autenticados y protección de escritura |
| `repository.ts`, `api.ts`, `model.ts` | Integración con las consultas y el modelo existentes |
| `instagram-collector.ts`, `facebook-collector.ts` | Metadatos de disponibilidad, sin reemplazar llamadas OAuth |
| `components/content-reports/executive-report.tsx` | Vista ejecutiva compartida por pantalla y PDF y anexo técnico |
| `manual-data.tsx` | Formularios manuales, historial, decisiones de origen, categorías y metas |
| `dashboard.tsx`, `charts.tsx`, `app/content-reports.css` | Integración con filtros/detalle/sincronización y presentación responsive/impresa |
| `lib/account-access.ts` | Permisos de los nuevos endpoints por empresa asignada |
| `components/calendar/{module-navigation,marketing-calendar,company-selector,company-module,integrations-module}.tsx` | Navegación y contexto persistente de empresa |
| `app/dashboard/informes/page.tsx`, `app/dashboard/informes/publicacion/[id]/page.tsx`, `app/company-switcher.css` | Informe integrado y selector con logo |
| `scripts/render-content-report.cjs`, `scripts/inspect-content-report-pdf.cjs` | Generación de artefacto real y comprobación/renderizado del PDF |
| `tests/hybrid-reports.test.mjs`, `package.json` | Pruebas de cálculo, validación, persistencia y permisos |
| `.gitignore`, `eslint.config.mjs` | Exclusión de artefactos y dependencias temporales de QA |

## Migración y datos

`migrations/20261005_content_report_hybrid.sql` añade cuatro tablas, sin eliminar ni actualizar datos existentes:

- `focus_report_manual_metrics`: alcance ACCOUNT/PUBLICATION/PERIOD/AD, valor, unidad, fuente oficial, fecha del dato, nota, preferencia de origen, autores, versión y eliminación lógica.
- `focus_report_metric_audit`: acciones CREATE/UPDATE/DELETE/SOURCE_DECISION con estado anterior y posterior, actor y fecha.
- `focus_report_editorial`: categoría y objetivo manual por publicación, independiente de las importaciones.
- `focus_report_goals`: meta positiva por métrica, plataforma y mes completo, con versión y autor.

Las referencias compuestas incluyen empresa; los índices impiden entradas activas duplicadas en el mismo alcance. Se reutilizan las capturas existentes en `focus_publication_metrics`, sin una nueva tabla de snapshots. La inicialización del repositorio aplica el mismo SQL idempotente al acceder al informe. La base conectada ya inicializó estas tablas; no se introdujeron datos manuales ficticios.

El archivo `20261005_content_report_hybrid.archive-rollback.sql` es una reversión opcional que archiva por renombrado las tablas nuevas y sus índices, conservando su contenido. No se ejecutó. Usarlo solamente después de volver a una versión anterior de la aplicación; restaurar requiere invertir esos nombres sin tablas activas en conflicto.

## API y permisos

| Endpoint | Métodos |
| --- | --- |
| `/api/reports/manual-metrics` | GET registros; GET con id historial; POST crear; PUT corregir/decidir origen; DELETE eliminación lógica |
| `/api/reports/goals` | GET, POST, PUT |
| `/api/reports/classification` | GET, PUT |

Usan el contexto autenticado existente, autorización de empresa y protección CSRF de escritura. El actor se deriva del servidor. Las modificaciones verifican versión y devuelven conflicto ante edición concurrente. Los endpoints no permiten escribir en DEMO. No se exponen tokens de conexión en el informe ni en los artefactos.

## Cálculos y disponibilidad

Los datos distinguen API, MANUAL, CALCULATED y MISSING. API tiene prioridad por defecto; un cambio explícito puede seleccionar MANUAL conservando ambos valores y la auditoría. Un dato de período nunca se reparte entre publicaciones. Cero válido se conserva; ausencia nunca se convierte en cero.

Los totales parciales muestran cobertura y se identifican como subtotales. La comparación normalizada usa promedios por publicación con datos comparables completos; una base cero o ausente no produce un porcentaje inventado. El volumen publicado y la eficiencia se muestran por separado. Alcance no equivale a audiencia única entre redes. Los gráficos no mezclan métricas con definiciones distintas.

La evolución acumulada corresponde a resultados de publicaciones agrupados por su fecha. Actividad dentro del mes exige capturas exactas de sus límites en zona Ecuador; sin esas capturas se informa histórico insuficiente. Crecimiento neto no se presenta como seguidores ganados. Las metas no reciben cumplimiento numérico con cobertura incompleta.

Las métricas calculadas sin insumos, no soportadas, de otro nivel o retiradas no se ofrecen como campos manuales arbitrarios. Las métricas de video no se piden para publicaciones estáticas. Audiencia y actividad mantienen alcance de cuenta; los porcentajes de varias cuentas no se suman. Los datos de pauta manual se muestran separados del resultado orgánico para evitar duplicación.

## PDF y verificación

PDF real de Manabiche, septiembre de 2026: 41 publicaciones, 10 páginas ejecutivas A4 y 5 páginas de anexo A3 horizontal. La vista compartida incluye portada/logo, indicadores, plataformas, formatos, ganador/Top 5, resultados inferiores, comparaciones, aprendizajes, recomendaciones y disponibilidad. El anexo conserva la tabla completa y metodología. Se renderizaron todas las páginas y se revisaron visualmente; numeración y encabezados verificados.

Validaciones completadas: `npm run check` (lint, tipos y 5 pruebas de diseño), `npm test` (suite completa, incluidos sincronización, permisos y OAuth), seis pruebas híbridas y compilación de producción `npm run build`. Las pruebas híbridas usan PostgreSQL aislado PGlite para CRUD/auditoría/versiones, decisiones de origen, metas, clasificación, resistencia a resincronización y rechazo de acceso entre empresas. La API real devolvió el informe de producción correctamente.

## Limitaciones y siguientes mejoras

No hubo una sesión de navegador automatizable disponible para recorrer interactivamente todos los formularios. Se validaron endpoints/cálculos en pruebas aisladas y el PDF mediante renderizado real; queda recomendable un recorrido manual de formularios en localhost.

Los permisos y métricas disponibles dependen de cada plataforma. Registros importados antiguos sin metadatos detallados conservan estados genéricos hasta una próxima sincronización. No se reconstruyen capturas históricas que nunca existieron. Meta Ads requiere conexión propia para datos automáticos de pauta. No se calculan inferencias causales de rendimiento.

Mejoras recomendadas: capturas programadas en los límites mensuales, conexión de Meta Ads, ampliar la clasificación editorial real y completar únicamente pendientes verificados. La claridad de los comparativos mejora a medida que existe una cobertura histórica consistente.
