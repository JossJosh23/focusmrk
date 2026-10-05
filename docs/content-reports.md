# Informes de contenido

## Arquitectura y alcance

Ruta principal: `/dashboard/informes`. Detalle: `/dashboard/informes/publicacion/[id]`.
La navegación añade **Informes de contenido** y conserva los reportes y exportaciones de TikTok existentes.
Next.js App Router, PostgreSQL/pg, autenticación actual y diseño por tokens. No se añade Prisma, un sistema de roles paralelo ni dependencias de gráficas. Las gráficas SVG incluyen datos tabulares accesibles.

Secciones: resumen, formatos, evolución, publicaciones y detalle, video/retención, Top 5, audiencia, actividad, seguidores, comparación, orgánico/pagado, análisis y recomendaciones. Exportar abre la impresión del navegador, desde donde se puede guardar como PDF; no es una exportación PDF maquetada como el generador heredado de TikTok.

## Datos reales y DEMO

`mode=production` es el valor predeterminado. Lee el repositorio PostgreSQL. **Consultar redes** consulta las APIs de las cuentas conectadas y guarda publicaciones y observaciones. Funciona para Todas o una red seleccionada. Importa el período actual y anterior, manteniendo los datos separados por empresa y cuenta. El estado de cada red se conserva y un error de una red permite completar las demás.

Instagram: `/me/media`, historias activas cuando el período incluye hoy, perfil y `/[media-id]/insights` en `graph.instagram.com`. Likes/comentarios básicos, y vistas, alcance, compartidos, guardados, visitas/seguidores generados y tiempos de Reels según formato, antigüedad, permisos y respuesta de la API. Los tiempos de Reels se convierten de milisegundos a segundos. No se reconstruyen historias caducadas.

Facebook: únicamente la Página explícitamente seleccionada en Integraciones, `/[page-id]/published_posts` y `/[post-id]/insights` en `graph.facebook.com`. Likes, comentarios, compartidos y, cuando la versión/formato lo permite, `post_media_view` y `post_clicks`. No se usan métricas retiradas de alcance/impresiones ni se sustituyen por vistas. TikTok reutiliza `/api/tiktok`: videos paginados, vistas, likes, comentarios, compartidos, duración, descripción y miniatura. Los tres recolectores registran seguidores actuales cuando la API los entrega.

No se consultan anuncios, demografía, actividad de audiencia ni curvas de retención. Esas secciones permanecen No disponible. Los errores de permiso de insights conservan publicaciones básicas con aviso; los errores de token o límites abortan la actualización de esa red sin borrar observaciones guardadas. La paginación no sigue URLs arbitrarias ni devuelve datos truncados silenciosamente.

`mode=demo` genera un conjunto determinista en `lib/content-reports/demo.ts`, sin consultar ni escribir tablas de métricas o informes. Requiere la misma sesión y asignación de empresa que el modo real cuando PostgreSQL está habilitado. El análisis demo es temporal y se descarta al cambiar filtros; no se guarda en producción. Las ilustraciones demo se identifican como tales.

Faltantes: `null` / **No disponible**. Un cero solo es un dato recibido o un recuento explícito de publicaciones importadas. El resumen muestra el subtotal de valores recibidos y su cobertura (`N de M` publicaciones/observaciones); una publicación incompleta no oculta las cifras de otras. Se incluye un desglose por red y tarjetas independientes de likes, comentarios, compartidos y guardados. Si ningún valor existe, el subtotal sigue `null`.

Los totales estrictos de la API (`summary`), interacciones por publicación y engagement siguen no disponibles si falta algún sumando. `summaryCoverage` y `networkSummaries` contienen los subtotales, cantidades y redes con datos. **Interacciones registradas** es la suma de componentes recibidos (likes/comentarios/compartidos/guardados), identificada como subtotal de `N de M` valores de interacción cuando faltan componentes; no se usa para inferir engagement ni guardados de TikTok. Nuevos seguidores usa observaciones de la cuenta, sin mezclar seguidores atribuidos a publicaciones. La comparación añade cobertura de ambos períodos y suprime porcentajes si cualquiera es incompleto. Las gráficas y promedios estrictos siguen dejando huecos cuando falta un dato; no se sustituyen vistas por alcance.

Las cifras por publicación son acumuladas al momento de la última consulta y se agrupan por fecha de publicación en America/Guayaquil. No se presentan como actividad ocurrida durante cada día. La comparación de períodos compara grupos de publicaciones con sus cifras acumuladas, no actividad histórica. El alcance sumado puede repetir personas. El crecimiento requiere observaciones históricas y no se infieren ganados/perdidos a partir del saldo neto. Retención y demografía siguen no disponibles sin un adaptador que las entregue.

## Modelos PostgreSQL

Inicialización aditiva e idempotente en `reportDb()`, acorde con el patrón existente. Requiere permisos CREATE TABLE/INDEX del usuario de la aplicación. No modifica tablas, datos ni credenciales de las integraciones.

| Modelo | Tabla |
| --- | --- |
| Company / asignaciones | `focus_companies`, `focus_account_companies` existentes |
| SocialAccount | `focus_content_accounts` |
| SocialPublication | `focus_social_publications` |
| PublicationMetric | `focus_publication_metrics` |
| AudienceMetric | `focus_audience_metrics` |
| FollowerMetric | `focus_follower_metrics` |
| AdMetric | `focus_ad_metrics` |
| ContentReport | `focus_content_reports` |
| ReportRecommendation | `focus_report_recommendations` |
| Estado de consulta por red | `focus_content_syncs` |

Claves compuestas y referencias incluyen `company_id`, por lo que las métricas no pueden referenciar publicaciones o cuentas de otra empresa. Las métricas se almacenan en JSONB tipado, con fechas e identificadores relacionales indexados. El recolector hace escrituras en una transacción. Las observaciones de publicación se conservan; la vista usa la última. Para expandir colectores se debe mantener esta atribución y normalizar datos con `emptyMetrics()`/`numeric()`.

## API y permisos

GET `/api/reports/summary`, `/publications`, `/publications/[id]`, `/audience`, `/followers`, `/top-content`, `/comparison`, `/ads`, `/insights` (todos bajo `/api/reports`).

Parámetros: `companyId` (nombre de empresa usado por el sistema actual), `platform=Todas|Instagram|Facebook|TikTok`, `startDate`, `endDate`, `mode=production|demo`. Máximo 366 días. `top-content` acepta `sort=reach|views|engagement|shares|saves|followersGained`.

PUT `/api/reports/insights` guarda `{worked, improve, recommendations, version}`. Conflictos devuelven 409; cada texto admite 5000 caracteres. POST al mismo endpoint sincroniza las redes seleccionadas y devuelve `{imported, results}` con estado, avisos y errores seguros por red. Si todas fallan devuelve 502; los éxitos parciales devuelven 200. Escrituras requieren `X-FocusMRK-Request: 1` y pasan la validación existente de origen/sesión. Se prohíben escrituras demo.

**Autorizar métricas de Instagram/Facebook** inicia el OAuth existente con `reports=1`. Es el único caso que añade `instagram_business_manage_insights` o `read_insights`; las conexiones ordinarias conservan sus scopes básicos, credenciales, state y callbacks. Instagram usa exclusivamente `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` y `INSTAGRAM_REDIRECT_URI`; Facebook conserva las variables META. No hace falta añadir variables de entorno para los informes. Los permisos adicionales deben estar habilitados para la app/cuenta en Meta; el acceso de cuentas fuera de los roles de prueba depende de la configuración y aprobación del proveedor. Si se rechazan, la conexión básica puede seguir funcionando y el informe explica los campos ausentes.

Instagram iniciado desde Informes guarda un retorno interno validado en el `context` del state: empresa, red, fechas y modo. Después de autorizar o cancelar vuelve a `/dashboard/informes` en el origen configurado del callback, con esos filtros. No acepta destinos externos ni otra empresa; el destino no se obtiene de parámetros del callback. Las conexiones iniciadas desde Integraciones y estados anteriores siguen volviendo a Integraciones. No cambia `INSTAGRAM_REDIRECT_URI`.

El aviso al regresar distingue permiso de estadísticas concedido, no concedido o no confirmado. Si OAuth omite `permissions`, no se infiere concesión desde el scope solicitado: la conexión conserva `permissionsVerified=false`. Sólo una solicitud explícita desde Informes permite verificarlo al pulsar **Consultar redes**, usando insights de publicaciones obtenidas desde `/me/media`. Una métrica real, incluido cero, confirma el acceso; entonces se guarda el permiso comprobado si el token y la cuenta siguen vigentes e iguales. Denegaciones detienen la prueba, y un período sin métricas no registra concesión. Facebook conserva su retorno existente.

Propietario: acceso global. Cuentas de marketing: solo empresas asignadas, con capacidades de edición existentes. El proyecto no tiene actualmente roles cliente de solo lectura o administrador de empresa diferenciados; no se inventan. Cuando se incorporen deben añadirse permisos de escritura a `reportHandler` sin ampliar el alcance de lectura.

`source=manual` se registra para recomendaciones. `source=ai` queda reservado para un servicio futuro; hoy no se afirma que el análisis lo genere IA.

## Verificación y despliegue

`npm run check`, `npm run build`, `npm run test:content-reports`. Las pruebas usan PGlite y respuestas de API simuladas para validar esquema, claves por empresa, autorización, CSRF, versiones, importación, colectores, errores parciales y separación demo/real. También se verifican las regresiones de Facebook, Instagram y reportes heredados. No sustituyen una consulta real en el VPS con permisos concedidos.

Después del redeploy, abrir Informes de contenido, seleccionar empresa y **Datos reales**. Autorizar métricas de Instagram/Facebook, regresar al informe y pulsar **Consultar redes**. Revisar el estado de cada red; la tabla muestra el período seleccionado y la comparación utiliza las publicaciones del anterior importadas en la misma consulta. Facebook necesita una Página seleccionada. Para crecimiento registrar observaciones a lo largo del tiempo; consultar el pasado hoy no crea seguidores históricos.

Localhost no resuelve el nombre interno de PostgreSQL de Dokploy: necesita conexión accesible/túnel para datos reales y sesión de cuentas de marketing. No se modifica `.env.local` para ocultar esa limitación.
