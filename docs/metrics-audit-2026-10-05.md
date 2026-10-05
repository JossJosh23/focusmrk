# Auditoría de métricas de Focus MRKT

Fecha: 5 de octubre de 2026. Alcance: repositorio local, configuración local sin valores secretos y documentación oficial pública. **Solo auditoría; no se implementaron cambios.**

## 1. Conclusión técnica y límites de verificación

Los «No disponible» tienen causas distintas. Algunos campos ya se consultan y dependen de permisos, formato y respuesta; otros tienen un endpoint oficial que aún no está implementado; varios fueron retirados o no existen en la API conectada. Reautorizar todas las redes no resuelve esos tres últimos casos.

| Hallazgo comprobado en código | Consecuencia | Corrección propuesta, pendiente de aprobación |
|---|---|---|
| Instagram interpreta cualquier código 10 como falta de permiso. | Una Story con menos de cinco espectadores puede detener insights para el resto de la cuenta. | Distinguir falta de datos de esa Story de una denegación real y continuar. |
| No hay colector de account insights/audiencia de Instagram ni Page/video insights de Facebook. | Las tablas y pantallas existen, pero no reciben esos datos. | Implementar fuentes oficiales y contratos por nivel/formato. |
| TikTok usa Display API. | Solo entrega los contadores y metadatos públicos especificados en su esquema. | Conservar lo compatible; marcar lo demás como no soportado por esta integración. |
| TikTok elimina focus_tiktok_snapshots en cada reconexión exitosa. | Borra historial de la integración antigua; el historial nuevo de publicaciones no se borra en ese callback. | Conservar las observaciones antiguas y asociarlas a su cuenta de origen. |
| Meta Marketing API no está conectada. | Pauta, resultados y cuartiles publicitarios permanecen vacíos. | Conexión publicitaria independiente con ads_read y acceso a activos. |
| Las métricas son nullable sin motivo por campo. | Un null termina mezclando retiro, falta de permisos, falta de datos y errores. | Disponibilidad y procedencia por métrica. |
| Los períodos agrupan posts por fecha de publicación y leen contadores acumulados recientes. | No representan actividad ocurrida en el mes y pueden cambiar al volver a consultar un mes antiguo. | Etiquetar cohortes; separar series de actividad/snapshots y consultas al cierre. |

**No se verificaron en producción:** permisos efectivos, respuestas actuales, App Review/Advanced Access, tareas de la Página, tipo concreto Business/Creator, versión efectiva de Dokploy ni acceso a cuentas publicitarias. La captura anterior de «Conectado» no acredita todos esos requisitos. No se leyó la base del VPS ni se ejecutó una sincronización real durante esta auditoría.

No se imprimieron tokens, contraseñas ni secretos. No se cambiaron cuentas, OAuth, autenticación, base de datos, Facebook, Instagram o TikTok. El único archivo añadido es este informe.

## 2. Arquitectura, archivos y endpoints internos

| Archivos | Responsabilidad actual |
|---|---|
| [lib/instagram.ts](../lib/instagram.ts), [lib/meta.ts](../lib/meta.ts), [lib/tiktok.ts](../lib/tiktok.ts) | Configuración, cifrado, OAuth, perfil, tokens, permisos y tablas de conexiones. |
| [app/api/instagram/connect/route.ts](../app/api/instagram/connect/route.ts), [app/api/instagram/route.ts](../app/api/instagram/route.ts), [callback](../app/api/instagram/callback/route.ts) | Conectar Instagram, estado, actualizar, desconectar y retorno OAuth. |
| [app/api/meta/route.ts](../app/api/meta/route.ts), [callback](../app/api/meta/callback/route.ts) | Facebook: conectar, estado, consultar páginas, seleccionar, actualizar y desconectar. |
| [app/api/tiktok/route.ts](../app/api/tiktok/route.ts), [callback](../app/api/tiktok/callback/route.ts), [lib/tiktok-period.ts](../lib/tiktok-period.ts) | Login/Display TikTok, consulta antigua, informes por cohorte y rangos. |
| [instagram-collector.ts](../lib/content-reports/instagram-collector.ts), [facebook-collector.ts](../lib/content-reports/facebook-collector.ts) | Lectura de publicaciones y sus métricas; una observación de seguidores por sincronización. |
| [provider.ts](../lib/content-reports/provider.ts) | Peticiones Graph, timeout, paginación, errores seguros y valores escalares. |
| [sync.ts](../lib/content-reports/sync.ts) | Sincronización manual por red; importación de resultados y último estado. |
| [repository.ts](../lib/content-reports/repository.ts), [model.ts](../lib/content-reports/model.ts) | SQL, observaciones, agregaciones, cobertura, comparaciones y métricas calculadas. |
| [api.ts](../lib/content-reports/api.ts), app/api/reports/* | Validación de sesión/empresa, lectura de informes y notas. |
| [dashboard.tsx](../components/content-reports/dashboard.tsx), [charts.tsx](../components/content-reports/charts.tsx) | UI del informe, detalles, gráficos, autorización y subtotales con cobertura. |
| [app/dashboard/informes/page.tsx](../app/dashboard/informes/page.tsx), app/dashboard/informes/publicacion/[id]/page.tsx | Página del informe y vista de una publicación. |
| components/calendar/social-connection.tsx, integrations-module.tsx, meta-connection.tsx | UI de conexiones. No hay diagnóstico administrativo completo ni conexión Ads. |
| lib/database.ts, lib/account-access.ts, lib/reports.ts, lib/report-visual.ts, app/api/reports/route.ts | PostgreSQL, autorización existente y reportes anteriores; conviven con el módulo nuevo. |
| [demo.ts](../lib/content-reports/demo.ts) | Datos exclusivamente del modo demo explícito; no hay fallback automático a demo al fallar producción. |
| scripts/send-push-reminders.cjs, docs/iphone-push.md | Cron de notificaciones; no sincroniza métricas sociales. |

| Endpoint interno | Qué hace |
|---|---|
| /api/instagram/connect; /api/instagram; /api/instagram/callback | OAuth y acciones de Instagram. reports=1 solicita estadísticas. |
| /api/meta; /api/meta/callback | OAuth/acciones de Facebook. reports=1 añade read_insights. |
| /api/tiktok; /api/tiktok/callback | OAuth/estado/acciones Display; action=report consulta cohortes. |
| GET /api/reports/summary | Lee datos persistidos y construye el informe; no llama a redes por sí mismo. |
| GET /api/reports/publications; /publications/[id] | Listado/detalle desde PostgreSQL. |
| GET /api/reports/audience; /followers; /comparison; /ads; /top-content; /insights | Vistas del mismo dataset. **/ads no llama a Marketing API.** |
| POST /api/reports/insights | «Consultar redes»: sincroniza colectores y guarda publicaciones/observaciones. |
| PUT /api/reports/insights | Notas manuales, con control de versión; no obtiene métricas. |

Flujo de /dashboard/informes: sesión y empresa → GET summary → SQL → buildReport → UI. «Consultar redes» hace POST insights y después recarga summary. Rango máximo local: 366 días. El filtro usa America/Guayaquil. El permiso de acceso sigue el sistema existente de cuentas/empresas; las escrituras requieren la validación de origen y X-FocusMRK-Request.

No se encontraron modelos Prisma ni Prisma como ORM: se usa pg y SQL. No hay un scheduler/webhook de métricas implementado en los archivos revisados. Esto no certifica que nadie haya creado una tarea externa manualmente en Dokploy.

## 3. APIs, versiones, scopes y tokens

| Red | Integración real | Versión local | Scopes solicitados |
|---|---|---|---|
| Instagram | Instagram API with Instagram Login; graph.instagram.com. Business/Creator; no requiere Facebook Page para este flujo. | INSTAGRAM_GRAPH_VERSION=v26.0 | instagram_business_basic; desde Informes añade instagram_business_manage_insights. |
| Facebook | Facebook Login + Pages/Graph Insights. | META_GRAPH_VERSION=v24.0 | pages_show_list,pages_read_engagement; desde Informes añade read_insights. No solicita pages_manage_engagement ni ads_read. |
| TikTok | Login Kit + Display API. | Endpoints v2 | user.info.basic,user.info.stats,video.list. |
| Meta Ads | Sin conexión/colector implementado. | Ninguna versión publicitaria dedicada verificada. | No se solicita ads_read para un flujo Ads. |

La versión local de Facebook no coincide con Instagram. No se debe cambiar a v26 por simetría ni bajar una versión para intentar recuperar datos retirados.

| Variables leídas | Situación local sin divulgar valores |
|---|---|
| DATABASE_URL | Configurada. Host de PostgreSQL interno de Dokploy; la conexión desde el PC no fue validada. |
| INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI, INSTAGRAM_GRAPH_VERSION | Configuradas. Instagram usa exclusivamente sus credenciales. |
| META_APP_ID, META_APP_SECRET, META_REDIRECT_URI, META_GRAPH_VERSION | Configuradas. Corresponden a Facebook. |
| TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI | Configuradas. |
| INSTAGRAM_TOKEN_KEY, META_TOKEN_KEY, TIKTOK_TOKEN_KEY | No configuradas localmente; el código deriva la clave del secreto de cada proveedor. Cambiar esas claves sin migración impediría descifrar tokens existentes. |
| Documentación .env.example | No incluye todas las variables TikTok que sí utiliza el código; falta actualizar documentación después de aprobación. |

Scopes **solicitados** y **concedidos** son cosas distintas:

- Facebook lee /me/permissions y conserva los grants reales. Las tareas y acceso a la Página también condicionan Insights.
- /me/accounts solicita id,name,access_token; no solicita tasks. La tarea ANALYZE no se comprueba ni conserva explícitamente en el inventario actual.
- Instagram conserva permisos cuando OAuth los devuelve; si los omite, marca verificación desconocida. En el flujo de informes puede probar insights y registrar el acceso después de recibir una métrica real; pedir un scope no lo acredita.
- TikTok comprueba scope recibido en el intercambio y refresh; no se inspeccionó el token actual del VPS.
- Una pantalla «Conectado» refleja estado almacenado/expiración según proveedor; no es una validación completa de grants/activos ni de la vigencia remota en ese instante.

Todos cifran tokens con AES-256-GCM, clave derivada y AAD ligada a empresa. State está vinculado a sesión/empresa, se guarda como digest, vence a los diez minutos y se consume una sola vez. Se utilizan locks de conexión para evitar sustituciones concurrentes.

| Proveedor | Endpoint OAuth/token/perfil | Renovación actual |
|---|---|---|
| Instagram | https://www.instagram.com/oauth/authorize; POST https://api.instagram.com/oauth/access_token; GET https://graph.instagram.com/access_token; GET https://graph.instagram.com/refresh_access_token; GET /v26.0/me | Long-lived con ig_exchange_token. Refresh al consultar si sigue vigente, tiene ≥24 h y quedan ≤7 días; no cron. |
| Facebook | https://www.facebook.com/v24.0/dialog/oauth; https://graph.facebook.com/v24.0/oauth/access_token; /debug_token cuando falta vigencia; /me/permissions; /me/accounts | Intercambio corto/largo al conectar. No refresh automático periódico; reconectar al expirar. Expiración nula solo tras debug_token válido con expires_at=0 y data_access_expires_at=0; noExpiration es un indicador local. |
| TikTok | https://www.tiktok.com/v2/auth/authorize/; POST https://open.tiktokapis.com/v2/oauth/token/; GET /v2/user/info/; POST /v2/video/list/; POST /v2/oauth/revoke/ | Refresh antes de consulta cuando corresponde; conserva token rotado y verifica el mismo open_id. |

Los IDs se conservan como strings; Meta/Instagram tienen protección frente a redondeo de IDs numéricos. TikTok exige IDs string en informes, pero sus contadores int64 usan JSON Number sin una comprobación uniforme de entero seguro: riesgo de robustez, no pérdida observada.

## 4. Persistencia y semántica actual

| Tablas | Qué guardan |
|---|---|
| focus_instagram_states/connections; focus_meta_states/connections; focus_tiktok_states/connections | State, tokens cifrados, permisos/expiración cuando existen y snapshot de perfil. |
| focus_tiktok_snapshots | Histórico de la integración anterior. Actualmente el callback de reconexión lo elimina por empresa. |
| focus_content_accounts | Cuenta por empresa/plataforma; solo Instagram, Facebook, TikTok. |
| focus_social_publications | Metadatos y payload actual, identidad única por empresa/red/external_post_id. |
| focus_publication_metrics | Capturas acumuladas por publicación y timestamp; conserva varias observaciones. |
| focus_follower_metrics | Observación por cuenta/día; una nueva consulta el mismo día reemplaza la observación de ese día. gained/lost permanecen null. |
| focus_audience_metrics | Tabla/payload disponibles, pero sin colector/importación real encontrados. |
| focus_ad_metrics | Tabla/payload disponibles, pero sin colector/importación real encontrados. |
| focus_content_reports; focus_report_recommendations | Notas/versiones y recomendaciones manuales. |
| focus_content_syncs | Último estado por red/empresa; sobrescribe intentos anteriores. capturedAt cambia también al fallar: fecha del último intento, no último éxito. Sin historial detallado de errores. |

La importación de cada red es transaccional y valida empresa/cuenta; una red que falla no borra el resultado de las otras. Las capturas de publicaciones no se reemplazan por ceros. Sí se actualizan metadatos del post.

Problemas de interpretación que requieren corrección explícita:

1. SQL elige la última captura sin limitarla a la fecha de cierre del período. La curva diaria agrupa por fecha de publicación, no por fecha de visualización.
2. Comparar cohortes publicadas en meses distintos mezcla antigüedad de los posts. Es válido como comparación de cohortes etiquetada, no como actividad mensual.
3. Sumar alcance de posts/redes no da personas únicas del período. También sería incorrecto sumar reach publicitario diario/de anuncios para obtener reach único de cuenta.
4. Interacciones locales = likes + comentarios + compartidos + guardados. Falta un componente → total estricto null; el dashboard muestra subtotal recibido y cobertura, correctamente identificado. No es total_interactions oficial.
5. engagement() devuelve 0 cuando reach=0: ese cociente es indefinido. Debe seguir null, sin tasa inventada.
6. «Nuevos seguidores» del resumen usa AccountMetric.gained, no los follows atribuidos a un post. Todos los colectores actuales dejan gained null; una métrica de follows del post no llenará ese KPI por sí sola.
7. Los gráficos de audiencia se etiquetan como porcentajes. Los futuros recuentos de API necesitan unidad/denominador explícitos; no cargar counts en una barra marcada %.
8. No hay evidencia para paid=false: los colectores guardan paid=null y campaignId=null. La clasificación desconocida es correcta.
9. metricValue solo extrae un escalar. No importa desgloses, objetos demográficos, curvas ni varias muestras diarias.
10. El modelo de anuncios no tiene IDs de cuenta publicitaria/Ad/Creative/Ad Set/Campaign, desglose, atribución o fuente. El helper numeric rechaza numeric strings, frecuentes en Marketing API.

Datos solicitados pero no conservados en el nuevo historial: following_count, video_count, likes_count y display_name de TikTok como observaciones de cuenta; descripciones/unidades/períodos/desgloses de insights Meta; estructura completa de hijos de carrusel de Instagram. No se puede afirmar que un dato no solicitado «llegue» en producción: audiencia/ads no se consultan.

## 5. Convenciones de las matrices

**AVAILABLE** significa soportado por el contrato oficial y, cuando se indica «consulta», implementado en código. No confirma datos ni permisos efectivos del VPS.

- WITH_RESTRICTIONS / FORMAT_ONLY: población, formato, antigüedad, propiedad y permisos condicionan la respuesta.
- ACCOUNT_LEVEL_ONLY: no debe colocarse en una publicación.
- DEPRECATED: conservar histórico, no intentar nuevas consultas con nombres retirados.
- NOT_SUPPORTED: contrato auditado no ofrece ese dato. No equivale a error de sistema.
- OTHER_API: requiere otra conexión/fuente; no se habilita añadiendo un scope arbitrario.
- VALIDATION_PENDING: documentación incompleta/contradictoria o contrato concreto no certificado; no prometer su implementación.
- DERIVED: cálculo propio sobre datos oficiales; mostrar fórmula y cobertura, sin presentarlo como contador nativo.

En las columnas siguientes, «ninguno» significa **no hay petición actual para esa métrica**. Permisos son los requeridos, no una afirmación de grants reales. Las filas de Ads de Instagram/Facebook remiten a la matriz Meta Ads completa, que cubre cada campo pedido.

## 6. INSTAGRAM

### Endpoints y permisos de la matriz

B = instagram_business_basic. I = B + instagram_business_manage_insights.

M(campo) = GET https://graph.instagram.com/v26.0/{media-id}/insights?metric=campo, acumulado del contenido.
U(campo) = GET https://graph.instagram.com/v26.0/{ig-user-id}/insights, estadísticas de cuenta con período/metric_type/desglose compatibles con cada campo.

Listado actual: /me/media y /me/stories; perfil /me?fields=id,user_id,username,followers_count. Solo Stories activas cuando el rango incluye hoy. Carrusel: consultar el padre; los hijos no ofrecen insights independientes.

Fuente de compatibilidades de publicaciones/video: [Media Insights oficial](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights). Fuente de cuenta/audiencia: [User Insights oficial](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights). Flujo: [Instagram Login](https://developers.facebook.com/documentation/instagram-platform/overview).

### Publicaciones

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Reach | AVAILABLE_WITH_RESTRICTIONS: Feed/Reels/Stories | M(reach); consulta | Igual | I | Código 10 de Story puede desactivar toda la cuenta. | Aislar error; conservar reach por media, no suma única de cuenta. |
| Impressions | DEPRECATED para contenido actual | Ninguno | Ninguno para media reciente | I | null correcto pero mensaje genérico. | Mostrar retirada; preservar histórico. |
| Views | AVAILABLE_WITH_RESTRICTIONS: Feed/Reels/Stories | M(views); consulta | Igual | I | Mismo riesgo de Story/permiso. | Mantener definición views; no renombrar como impressions/plays. |
| Plays | DEPRECATED | Ninguno | Ninguno con nombre antiguo | — | No existe campo independiente vigente equivalente. | No rellenar con views bajo etiqueta plays. |
| Likes | AVAILABLE: Feed/Reels | like_count y M(likes); consulta | Igual | B/I | Stories no tienen este campo del contrato. | Estado por formato; no cero. |
| Comments | AVAILABLE: Feed/Reels | comments_count y M(comments); consulta | Igual | B/I | Respuestas de Stories tienen otra semántica/campo. | Mantener comentarios; no mezclar replies. |
| Shares | AVAILABLE_WITH_RESTRICTIONS | M(shares); consulta | Igual | I | Puede faltar por formato/acceso/datos. | Guardar motivo individual. |
| Saves | AVAILABLE: Feed/Reels | M(saved); consulta | Igual | I | Sin valor en Stories. | Conservar mapeo saved→saves y estado de formato. |
| Clicks | FORMAT_ONLY; acciones concretas | Ninguno | M(link_clicks) Stories; M(profile_activity) con action_type | I | Falta implementación; no hay contador genérico universal. | Separar clics en enlaces y acciones de perfil. |
| Profile visits atribuibles al post | FORMAT_ONLY: Feed/Stories | M(profile_visits) POST/CAROUSEL/STORY | Igual según producto | I | Reels no soporta este campo; VIDEO Feed no entra en la rama extra actual. | Matriz por media_product_type, sin prometer visitas Reel. |
| Followers gained atribuibles al post | FORMAT_ONLY: Feed/Stories | M(follows) POST/CAROUSEL/STORY | Igual según producto | I | No equivale a seguidores netos/gained de cuenta. VIDEO Feed omitido en rama actual. | Guardar atribución separada; no llenar KPI de cuenta con este dato. |
| Engagement: contador antiguo | DEPRECATED | No lo consulta; UI usa tasa local | M(total_interactions), como campo distinto | I | Mezcla nombre de contador retirado con tasa calculada. | Separar total oficial, subtotal y porcentaje. |
| Engagement rate | DERIVED | Fórmula local, sin endpoint propio | Fórmula explícita y compatible | Componentes I | reach=0 genera 0; componentes ausentes impiden tasa completa. | null con denominador cero; no tasa sobre subtotal silencioso. |
| Total interactions | AVAILABLE_WITH_RESTRICTIONS | Ninguno; suma propia de cuatro componentes | M(total_interactions) | I | Se omite contador oficial. | Guardarlo independiente de la suma/subtotal. |

Meta identifica expresamente comments, likes, views y total_interactions de media como orgánicos; no se generaliza esa clasificación a todos los campos. Los campos total_likes/total_comments/total_views que incluyen promoción están documentados para Instagram API with Facebook Login, no para el token Instagram Login actual. Eso no prueba que el contenido nunca haya sido promovido. [Restricciones de Media Insights](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights).

### Video/Reels

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Video views | AVAILABLE_WITH_RESTRICTIONS | M(views) | Igual | I | video_views antiguo retirado. | Mantener nombre/definición vigente. |
| 3-second views | NOT_SUPPORTED orgánico certificado | Ninguno | Ninguno orgánico | — | No contador oficial comprobado. | No derivar de views/skip rate. |
| Average watch time | FORMAT_ONLY: Reels | M(ig_reels_avg_watch_time) | Igual | I | Ya consulta; unidades del payload real no verificadas aquí. | Conservar/verificar unidad oficial; hoy convierte /1000 a segundos. |
| Total watch time | FORMAT_ONLY: Reels | M(ig_reels_video_view_total_time) | Igual | I | Ya consulta; incluye repeticiones. | Registrar unidad/definición, no inferir duración. |
| Completion rate | NOT_SUPPORTED orgánico auditado | Ninguno | Ninguno orgánico certificado | — | Modelo espera averageWatchPercentage/completePlays sin fuente. | No usar promedio/duración como tasa de completados. |
| Retention: curva completa | NOT_SUPPORTED orgánico auditado | Ninguno | Ninguno para curva completa | — | No fuente de curva. | Mostrar no proporcionada; reels_skip_rate sería métrica distinta. |
| 25% | OTHER_API: anuncios, no media orgánico | Ninguno | Marketing Insights si hay Ad | ads_read | Campo orgánico inexistente auditado. | Ver matriz Meta Ads; no atribuir al orgánico. |
| 50% | OTHER_API: anuncios | Ninguno | Marketing Insights si hay Ad | ads_read | Igual | Igual. |
| 75% | OTHER_API: anuncios | Ninguno | Marketing Insights si hay Ad | ads_read | Igual | Igual. |
| 95% | OTHER_API: anuncios | Ninguno | Marketing Insights si hay Ad | ads_read | Igual | Igual. |
| 100% | OTHER_API: anuncios | Ninguno | Marketing Insights si hay Ad | ads_read | No completePlays orgánico verificable. | Guardar consumo del Ad separado. |

Replays: clips_replays_count e ig_reels_aggregated_all_plays_count fueron retirados; views no es un contador separado de repeticiones. reels_skip_rate existe como abandono inicial durante tres segundos; no es la curva de retención ni un conteo de vistas de tres segundos. [Media Insights](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights).

### Cuenta

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Total followers | AVAILABLE, estado actual | /me fields=followers_count; consulta | Igual + snapshots diarios | B | Observación tomada al sincronizar; no histórico retrospectivo. | Captura periódica con fecha real. |
| Followers gained | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno; gained=null | U(follows_and_unfollows) + desglose | I | No colector; umbral ≥100 seguidores. | Guardar altas oficiales, separadas de neto y follows del post. |
| Followers lost | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno; lost=null | U(follows_and_unfollows) + desglose | I | No colector; no puede recuperarse con una resta. | Guardar bajas reales solo si devueltas. |
| Profile visits de cuenta | DEPRECATED: profile_views | Ninguno | Sin reemplazo directo certificado | I | profile_links_taps no equivale a visita. | No cambiarle el nombre; permitir taps como métrica distinta. |
| Accounts reached | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | U(reach) | I | No implementado. | Consultar alcance de cuenta directamente; no sumar posts. |
| Accounts engaged | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | U(accounts_engaged) | I | No implementado. | Mantener cuentas únicas distintas de total de eventos. |

Datos de cuenta con ventanas/metric_type propios: por ejemplo period=day y metric_type=total_value cuando el contrato lo indica. Hay conservación limitada, normalmente hasta 90 días, demoras y respuestas vacías; no prometer recuperar cualquier mes pasado. Reach/accounts_engaged de cuenta pueden incluir anuncios. [Guía oficial de Insights](https://developers.facebook.com/documentation/instagram-platform/insights).

### Audiencia

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Gender | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | U(follower_demographics / engaged_audience_demographics), breakdown=gender | I | Sin colector/parser/importación. | Conservar población, ventana y recuentos. |
| Age | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | Misma familia, breakdown=age | I | Igual | Distribución con cobertura; no rellenar segmentos omitidos. |
| City | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | Misma familia, breakdown=city | I | Igual | Top ciudades no es población completa. |
| Country | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | Misma familia, breakdown=country | I | Igual | No confundir país de seguidores con audiencia de Ads. |
| Followers vs non-followers | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | U(reach), follow_type; U(views), follower_type | I | Modelo solo prevé followersReach/nonFollowersReach. | Conservar dimensión/UNKNOWN y distinguir reach de views. |
| Active hours | VALIDATION_PENDING, documentada con restricciones | Ninguno | U(online_followers), confirmar contrato v26 | I | Docs menciona restricción sin tabla completa accesible. | Validar período/estructura antes de prometer heatmap. |
| Active days | NOT_SUPPORTED como campo independiente certificado | Ninguno | Solo observaciones fechadas si contrato oficial las permite | I si existe fuente | No fuente directa demostrada. | No fabricar días desde horas agregadas ni calendario de posts. |

Demografía: umbral de 100 seguidores o 100 interacciones según población; top 45 resultados, solo población con datos demográficos disponibles y posible retraso de hasta 48 h. online_followers tiene ventana de 30 días. Las ventanas retiradas de engaged/reached demographics no deben reutilizarse; para engaged_audience_demographics, this_week/this_month describen ventanas móviles de 7/30 días, no calendario. [User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights), [Changelog](https://developers.facebook.com/documentation/instagram-platform/changelog).

Parámetros recomendados: demographics usa period=lifetime, metric_type=total_value, timeframe y breakdown, sin since/until; follows_and_unfollows usa period=day, metric_type=total_value, breakdown=follow_type y since/until. Validar timeframe admitido por la población concreta. profile_activity: FEED/STORY; shares y total_interactions: FEED/REELS/STORY. [Contrato User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights), [Media Insights](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights).

### Ads de Instagram

Gasto, alcance publicitario, impresiones, clics, link clicks, CTR, CPC, CPM, frecuencia, mensajes, leads, conversiones, costo por resultado, vistas, retención y 25/50/75/95/100 requieren **Meta Marketing API**. Endpoint actual: ninguno. Estado actual de esa conexión: NOT_CONNECTED. Permiso: ads_read y acceso a la cuenta publicitaria. Problema/acción por cada campo: matriz de la sección 9; filtrar publisher_platform/placement cuando se quiera atribuir entrega a Instagram. No obtener datos de Instagram Ads con su token Instagram Login.

### Retiradas y excepción histórica

engagement/carousel_album_* retirados en v18+ y globalmente desde 11/12/2023. video_views/profile_views y métricas de cuenta relacionadas retirados en v21+ y globalmente desde 08/01/2025. plays/replays/impressions retirados en v22+ y globalmente desde 21/04/2025. [Changelog oficial](https://developers.facebook.com/documentation/instagram-platform/changelog).

Hay discrepancia documental para impressions de media anterior al 02/07/2024: el changelog condiciona la excepción a v21 o anteriores; la referencia actual de media no repite esa condición de versión. **No se certifica recuperación histórica en v26.** No bajar versión ni borrar históricos. Una prueba autorizada de esa excepción sería validación posterior.


## 7. FACEBOOK

### Endpoints y permisos de la matriz

Versión local v24.0. Usar versión configurada, sin intentar evitar retiros globales bajándola.

B = acceso a la Página/Page token; OAuth actual pide pages_show_list,pages_read_engagement.
I = pages_read_engagement,read_insights, Page token y tarea ANALYZE.
V = Video Insights documenta pages_manage_engagement,read_insights, Page token y ANALYZE. **pages_manage_engagement no se solicita hoy**; verificar aprobación/acceso antes de añadirlo.

P(campo) = GET graph.facebook.com/v24.0/{post-id}/insights?metric=campo&period=lifetime.
A(campo) = GET /v24.0/{page-id}/insights, período compatible.
VI(campo) = GET /v24.0/{video-id}/video_insights?metric=campo.

Actual: /{page-id}?fields=id,followers_count; /{page-id}/published_posts con likes/comments/shares; P(post_media_view,post_clicks). No consultas A ni VI. Solo la Página seleccionada de la empresa.

Fuentes: [Insights v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/insights/?locale=en_US), [Page Insights y permisos](https://developers.facebook.com/documentation/pages-api/platforminsights/page.md), [Video Insights v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/video/video_insights/?locale=en_US).

### Publicaciones

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Reach tradicional | DEPRECATED: post_impressions_*_unique | Ninguno | Sin equivalente idéntico; P(post_total_media_view_unique) es otra métrica | I | Alcance antiguo retirado. | Crear espectadores únicos separado, sin renombrarlo como reach. |
| Impressions tradicional | DEPRECATED: post_impressions y familia | Ninguno | Sin equivalente idéntico | I | null correcto. | Mostrar retirada; conservar históricos. |
| Views | AVAILABLE | P(post_media_view); consulta | Igual | I | Puede faltar por acceso/formato. | Mantener views; no impressions. |
| Plays | FORMAT_ONLY: Reels | Ninguno | VI(blue_reels_play_count / fb_reels_total_plays) | V | No video collector. | Separar iniciales y totales con repeticiones. |
| Likes | AVAILABLE_WITH_RESTRICTIONS | published_posts likes.limit(0).summary(true); consulta | Expansión vigente o reacciones por tipo | B/I | Incluye LIKE/CARE y estimación/privacidad según docs; no todas las reacciones. | Conservar definición; reacciones como campo distinto. |
| Comments | AVAILABLE_WITH_RESTRICTIONS | comments.limit(0).summary(true); consulta | Igual; VI(post_video_social_actions) Reels | B/V | Summary no acredita todos los eventos/replies. | Preservar semántica de contador y superficie. |
| Shares | AVAILABLE_WITH_RESTRICTIONS | shares.count; consulta | Igual; VI(post_video_social_actions) Reels | B/V | Ausencia no es cero. | Estado individual y relación Reel. |
| Saves | NOT_SUPPORTED en Post Insights auditado | Ninguno | Ninguno certificado | — | No campo genérico verificado. | No inventar post_saves. |
| Clicks | AVAILABLE | P(post_clicks); consulta | Igual; P(post_clicks_by_type) detalle | I | Ignora tipos, no equivale a link clicks. | Mantener total y separar tipos. |
| Profile visits por post | ACCOUNT_LEVEL_ONLY para visitas de Página | Ninguno | A(page_views_total) | I | No atribución general post→visita. | Métrica de cuenta; null por post. |
| Followers gained por post | FORMAT_ONLY: Reels | Ninguno | VI(post_video_followers) | V | Sin video collector. | Atribución Reel separada de altas de Página. |
| Engagement | RESTRICTED, definición necesaria | Suma local si completa | A(page_post_engagements), solo actividad de cuenta | I/componentes | Saves faltante; contador de cuenta no sustituye post. | Subtotal explícito con nivel/fórmula. |
| Engagement rate | DERIVED | Interacciones/reach, normalmente null | Fórmula definida, no campo universal | Componentes | Reach retirado impide esta tasa. | No sustituir denominador por views silenciosamente. |
| Total interactions | DERIVED/RESTRICTED | Suma propia y cobertura | Componentes/reacciones documentados | B/I/V | No total_interactions genérico certificado. | No declarar subtotal como total oficial. |

Reacciones: falta /{post-id}?fields=reactions.limit(0).summary(total_count), tipos, o P(post_reactions_by_type_total). No sumar likes otra vez a reacciones que ya los incluyen. La expansión de likes sigue documentada, aunque el GET directo al edge likes haya sido retirado. [Likes v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/object/likes/), [Reactions v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/object/reactions/).

post_clicks aparece vigente; no se confirmó retirada. post_media_view ofrece is_from_ads/is_from_followers, todavía no consultados. post_total_media_view_unique son espectadores únicos, con definición diferente de reach. [Referencia vigente](https://developers.facebook.com/docs/graph-api/reference/insights/?locale=en_US).

### Videos/Reels

Faltan todas estas peticiones y el permiso V documentado. Descubrir IDs de video/Reel mediante edges oficiales y guardar relación verificada con el post; no añadir object_id antiguo indiscriminadamente a published_posts.

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Video views | FORMAT_ONLY/AVAILABLE | Ninguno | VI(total_video_views); Reels, contadores propios | V | Sin video collector. | Definición por formato. |
| 3-second views | FORMAT_ONLY: video | Ninguno | VI(total_video_views); P(post_video_views) si compatible | V/I | No consulta. | ≥3 s o umbral de clip corto; no inicio Reel ≥1 ms. |
| Average watch time | FORMAT_ONLY/AVAILABLE | Ninguno | VI(total_video_avg_time_watched); Reel post_video_avg_time_watched | V | No consulta. | Milisegundos, unidad explícita; puede incluir repeticiones. |
| Total watch time | FORMAT_ONLY/AVAILABLE | Ninguno | VI(total_video_view_total_time); Reel post_video_view_time | V | No consulta. | Guardar tiempo, unidad y definición. |
| Completion rate | DERIVED/RESTRICTED | Ninguno | VI(total_video_complete_views), definición/denominador compatibles | V | Cuenta ≥97%, no 100%; no tasa universal. | Etiquetar ≥97%, no completos 100%. |
| Retention | FORMAT_ONLY/AVAILABLE | Ninguno | VI(total_video_retention_graph); Reel post_video_retention_graph | V | Parser no admite curva. | Conservar bins/porcentajes oficiales. |
| 25% | RESTRICTED: curva, no contador orgánico estándar | Ninguno | Punto de curva recibido que represente el tramo | V | No equivale a Ads quartile count. | No interpolar como oficial ni generar conteos. |
| 50% | RESTRICTED: curva | Ninguno | Igual | V | Igual | Guardar solo tramo real. |
| 75% | RESTRICTED: curva | Ninguno | Igual | V | Igual | Igual. |
| 95% | RESTRICTED: curva | Ninguno | Igual | V | No equivale a ≥97%. | Mantener distinción. |
| 100% | NOT_SUPPORTED como contador orgánico estándar certificado | Ninguno | Punto final de curva si existe; Ads p100 es otra fuente | V/Ads | Porcentaje final no es contador de completos. | No fabricar completePlays 100%. |

Videos: curva de 40 intervalos; Reels otra estructura. Un video compartido puede devolver cero restringido, sin demostrar ausencia de consumo. Videos personales/grupos no tienen este endpoint. [Video Insights](https://developers.facebook.com/docs/graph-api/reference/video/video_insights/?locale=en_US), [Post v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/post/).

### Cuenta

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Total followers | AVAILABLE | /{page-id} fields=followers_count; consulta | Igual; A(page_follows) day | B/I | Snapshot al consultar. | Captura diaria sin reconstrucción ficticia. |
| Followers gained | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | A(page_daily_follows / page_daily_follows_unique) | I | Sin colector; unique documenta estimación/definición incompleta. | Validar semántica; no prometer altas exactas. |
| Followers lost | ACCOUNT_LEVEL_ONLY_WITH_RESTRICTIONS | Ninguno | A(page_daily_unfollows_unique) | I | Fuente puede ser estimada, no consultada. | Etiquetar estimación oficial o null si se exigen exactos. |
| Page/profile visits | ACCOUNT_LEVEL_ONLY/AVAILABLE | Ninguno | A(page_views_total), day/week/days_28 | I | No Page Insights. | Agregar serie de cuenta. |
| Accounts reached tradicional | DEPRECATED | Ninguno | A(page_total_media_view_unique), métrica distinta | I | Reach antiguo retirado. | Espectadores únicos separado. |
| Accounts engaged | DEPRECATED: page_engaged_users | Ninguno | No equivalente único; page_post_engagements mide eventos | I | Sin equivalente vigente certificado. | No convertir eventos en personas. |

Page Insights tiene requisitos de acceso/población, generalmente ≥100 likes; demografía con umbral de 100 personas, solicitudes hasta 90 días, histórico hasta dos años según dato y posible demora de 24 h. Interacciones Reel no están incluidas en page_post_engagements: usar su fuente propia. [Referencia Insights v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/insights/?locale=en_US).

### Audiencia

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Gender de seguidores | DEPRECATED | Ninguno | No reemplazo directo; VI(total_video_views_by_age_bucket_and_gender) es audiencia video | V si video | Sin demografía equivalente de seguidores. | Separar audiencia de video. |
| Age de seguidores | DEPRECATED | Ninguno | Misma alternativa video | V si video | Igual | No poblar seguidores desde espectadores. |
| City de seguidores | ACCOUNT_LEVEL_ONLY/VALIDATION_PENDING | Ninguno | A(page_follows_city), sustitución oficial | I | Tabla actual no desarrolla contrato completo. | Validar campo/período antes de prometerlo. |
| Country de seguidores | ACCOUNT_LEVEL_ONLY/VALIDATION_PENDING | Ninguno | A(page_follows_country); video total_video_views_by_country_id aparte | I/V | Poblaciones distintas; detalle incompleto. | Preservar población/nivel. |
| Followers vs non-followers | RESTRICTED: vistas | Ninguno | P(post_media_view)/A(page_media_view), is_from_followers | I | Modelo espera reach, no views. | Campos separados/unidad correcta. |
| Active hours | VALIDATION_PENDING, sin campo vigente certificado | Ninguno | Ninguno certificado | — | page_fans_online antiguo no probado vigente. | No implementar nombres históricos a ciegas. |
| Active days | VALIDATION_PENDING, sin campo vigente certificado | Ninguno | Ninguno certificado | — | Calendario posts no es actividad de fans. | Mantener motivo de falta de dato. |

[Retiradas oficiales](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics.md), [Video Insights v24](https://developers.facebook.com/docs/graph-api/reference/v24.0/video/video_insights/?locale=en_US).

### Ads de Facebook y fechas de retirada

Todos los campos Ads pedidos se analizan individualmente en sección 9. Actual: ningún endpoint; OTHER_API/NOT_CONNECTED; ads_read y cuenta publicitaria autorizada. Filtrar entrega Facebook mediante publisher_platform/placement, sin confundir Ad con post.

Retiradas documentadas: 14/03/2024 para page_engaged_users y edad/sexo de fans/follows; 15/11/2025 para familias de impressions no únicas/fans históricos.

Discrepancia oficial sobre alcance único: Deprecated Metrics indica 15/06/2025; guía/referencia 15/06/2026; changelog v25 lo vincula a v26; changelog v26 fecha lanzamiento 29/07/2026. **No se certifica fecha efectiva única**, sí retiro global ya aplicable a esta auditoría. v24 no permite recuperar legítimamente métricas retiradas. El comentario local «v25+ removed» simplifica esa cronología. [Retiradas](https://developers.facebook.com/documentation/pages-api/platforminsights/page/deprecated-metrics.md), [v25](https://developers.facebook.com/docs/graph-api/changelog/version25.0/), [v26](https://developers.facebook.com/docs/graph-api/changelog/version26.0/).

## 8. TIKTOK

### API, endpoint y permiso

**Login Kit + Display API v2**. No es Content Posting, Research, Accounts ni Marketing. Ser Business no convierte un token Display en analítica avanzada.

T = POST https://open.tiktokapis.com/v2/video/list/, fields explícitos, video.list.
U = GET https://open.tiktokapis.com/v2/user/info/, user.info.basic/user.info.stats según campo.
TM = GET https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/, conexión independiente con token/advertiser_id autorizado.

NS = **NOT_SUPPORTED_BY_TIKTOK_API**, exclusivamente para Display actual. No afirma imposibilidad en todas las APIs TikTok.

Fuentes: [Video Object](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-object), [Video List](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list), [User Info](https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info), [Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes).

### Publicaciones

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Reach | NS | Ninguno | Ninguno Display | — | Sin unique reach. | No proporcionado por Display. |
| Impressions | NS | Ninguno | Ninguno Display | — | Campo ausente. | No rellenar desde views. |
| Views | AVAILABLE | T(view_count); consulta | Igual | video.list | Contador acumulado actual. | Mantener captura/definición. |
| Plays independiente | NS | Ninguno | Ninguno Display | — | No contador distinto de view_count. | No duplicar como otra métrica oficial. |
| Likes | AVAILABLE | T(like_count); consulta | Igual | video.list | Sin carencia estructural. | Estado real por respuesta. |
| Comments | AVAILABLE | T(comment_count); consulta | Igual | video.list | Igual | Mantener. |
| Shares | AVAILABLE | T(share_count); consulta | Igual | video.list | Igual | Mantener. |
| Saves | NS | Ninguno | Ninguno Display | — | Favorites/guardados ausentes. | No estimar. |
| Clicks | NS | Ninguno | Ninguno Display | — | Ausente. | No declarar error de sistema. |
| Profile visits por post | NS | Ninguno | Ninguno Display | — | Sin atribución. | No estimar. |
| Followers gained por post | NS | Ninguno | Ninguno Display | — | Sin atribución. | No usar variación total. |
| Engagement nativo | NS | Ninguno; suma local | Ninguno como contador nativo | — | No campo engagement. | Subtotal con fórmula explícita. |
| Engagement rate por reach | NS/DERIVED_NO_INPUT | Fórmula local null | Ninguno para tasa por reach | — | Falta reach. | No cambiar denominador silenciosamente. |
| Total interactions oficial | NS | Suma local null por saves | Ninguno nativo; subtotal likes+comments+shares | video.list componentes | Sin total oficial recibido. | Subtotal de tres componentes, definición visible. |

### Video

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Video views | AVAILABLE | T(view_count) | Igual | video.list | Ya guarda. | Mantener. |
| 3-second views | NS | Ninguno | Ninguno Display | — | Umbral ausente. | No inferir desde views. |
| Average watch time | NS | Ninguno | Ninguno Display | — | Ausente. | No proporcionado por esta API. |
| Total watch time | NS | Ninguno | Ninguno Display | — | Ausente. | Igual. |
| Completion rate | NS | Ninguno | Ninguno Display | — | Ausente. | No fórmula incompatible. |
| Retention | NS | Ninguno | Ninguno Display | — | Ausente. | No curva inventada. |
| 25% | NS | Ninguno | Ninguno Display | — | Ausente. | No usar Ads como orgánico. |
| 50% | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| 75% | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| 95% | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| 100% | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| Duration | AVAILABLE | T(duration) | Igual | video.list | Ya guarda segundos. | Mantener. |
| Cover image | AVAILABLE con TTL | T(cover_image_url) | Igual; /v2/video/query/ para renovar por ID si se aprueba | video.list | URL expira, TTL oficial seis horas. | No tratar miniatura persistida como permanente. |

Título/descripción/share_url/fecha/duración ya se conservan. Display lista videos públicos; Stories/LIVE/privados no están soportados por este colector. [Video Object](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-object).

### Cuenta

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Total followers | AVAILABLE | U(follower_count); consulta | Igual + snapshots | user.info.stats | Captura manual. | Captura periódica. |
| Followers gained | NS | Ninguno; gained=null | Ninguno Display | — | Totales no identifican altas. | No neto como ganados. |
| Followers lost | NS | Ninguno; lost=null | Ninguno Display | — | Totales no identifican bajas. | Mantener null. |
| Profile visits | NS | Ninguno | Ninguno Display | — | Ausente. | No proporcionado por esta API. |
| Accounts reached | NS | Ninguno | Ninguno Display | — | Ausente. | Igual. |
| Accounts engaged | NS | Ninguno | Ninguno Display | — | Eventos no son personas únicas. | Igual. |
| Following count | AVAILABLE | U(following_count); consulta | Igual | user.info.stats | Nuevo historial lo descarta. | Ampliar snapshots. |
| Account likes count | AVAILABLE | U(likes_count); consulta | Igual | user.info.stats | Solo perfil/snapshot antiguo. | Total de cuenta, no nuevos likes del período. |
| Account video count | AVAILABLE | U(video_count); consulta | Igual | user.info.stats | Sin historial nuevo. | Guardar total observado. |

Neto = final−inicial solo entre observaciones reales. El código ya distingue neto/gained/lost; falta regularidad histórica. username/biografía/verificación necesitan user.info.profile no solicitado; no habilita reach/watch time.

### Audiencia

| Métrica | Estado | Endpoint actual | Endpoint recomendado | Permiso | Problema actual | Acción recomendada |
|---|---|---|---|---|---|---|
| Gender | NS | Ninguno | Ninguno Display | — | No campo. | No proporcionado; Accounts requiere contrato distinto. |
| Age | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| City | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| Country | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| Followers vs non-followers | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| Active hours | NS | Ninguno | Ninguno Display | — | Igual | Igual. |
| Active days | NS | Ninguno | Ninguno Display | — | Igual | Igual. |

### Ads

En todas las filas: endpoint actual ninguno; permiso token Marketing + advertiser_id autorizado, distinto de Display; problema otra conexión no implementada; acción validar contrato Marketing por dimensión/objetivo antes de implementar. No scope Display certificado para estos datos.

| Métrica | Estado actual/API | Endpoint recomendado/condición |
|---|---|---|
| Spend | OTHER_API/NOT_CONNECTED; NS Display | TM, gasto oficial. |
| Reach | OTHER_API/NOT_CONNECTED | TM; puede ser estimación oficial, etiquetar. |
| Impressions | OTHER_API/NOT_CONNECTED | TM, entrega publicitaria. |
| Clicks | OTHER_API/NOT_CONNECTED | TM, definición de clic. |
| Link clicks | OTHER_API/VALIDATION_PENDING campo exacto | TM, separar destination/link/all clicks. |
| CTR | OTHER_API/NOT_CONNECTED | TM, tipo de clic/denominador. |
| CPC | OTHER_API/NOT_CONNECTED | TM, moneda/tipo de clic. |
| CPM | OTHER_API/NOT_CONNECTED | TM, moneda/impresiones. |
| Frequency | OTHER_API/VALIDATION_PENDING combinación informe | TM, confirmar dimensiones; no sumar ratios. |
| Messages | OTHER_API/VALIDATION_PENDING | TM según objetivo/producto; no promesa universal. |
| Leads | OTHER_API/VALIDATION_PENDING | TM según evento/objetivo. |
| Conversions | OTHER_API/NOT_CONNECTED | TM según evento/atribución. |
| Cost per result | OTHER_API/VALIDATION_PENDING | TM, resultado definido por objetivo. |
| Video views | OTHER_API/NOT_CONNECTED | TM, umbrales diferentes de Display. |
| Video retention | OTHER_API/VALIDATION_PENDING curva completa | No curva universal certificada; solo métricas verificadas. |
| 25% | OTHER_API/NOT_CONNECTED | TM; documentado en Ads. |
| 50% | OTHER_API/NOT_CONNECTED | TM; documentado en Ads. |
| 75% | OTHER_API/NOT_CONNECTED | TM; documentado en Ads. |
| 95% | VALIDATION_PENDING, sin campo certificado | No prometer ni interpolar. |
| 100% | OTHER_API/NOT_CONNECTED | TM; documentado en Ads. |

Ads documenta gasto/reach/impressions/clicks/conversions y video 25/50/75/100, 2/6 segundos y tiempos medios. No se certifican aquí todos los nombres de fields para cada dimensión/objetivo, ni 95%/3 segundos. [SDK oficial Reporting](https://github.com/tiktok/tiktok-business-api-sdk/blob/main/js_sdk/docs/ReportingApi.md), [Métricas Ads](https://ads.tiktok.com/help/article/basic-data?lang=en), [Video Ads](https://ads.tiktok.com/resources/help/article/video-play?lang=en-0), [Reach oficial](https://ads.tiktok.com/resources/help/article/what-is-reach?lang=lt-LT).

### Alternativas y fallos actuales

Accounts API de API for Business admite cuentas propias Business y Personal; solicitudes/ampliaciones con TikTok Accounts requieren Accounts API Access Application desde 20/03/2026. Sus tablas detalladas de campos/scopes no quedaron accesibles para certificar todo el contrato. No añadir video.insights arbitrariamente a Display. [Accounts Overview](https://business-api.tiktok.com/portal/docs/accounts-api-overview/v1.3).

Research no corresponde a este producto comercial. Content Posting añade publicación, no insights avanzados. [Research FAQ](https://developers.tiktok.com/docs/en/research-api-faq), [Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes).

- [Callback](../app/api/tiktok/callback/route.ts) borra focus_tiktok_snapshots y vacía snapshot en cada OAuth exitoso. Preservar histórico con open_id de origen para no mezclar cuentas al reconectar otra.
- api() pierde HTTP/error.code/message/log_id; permisos/token/rate limit terminan genéricos. Conservar diagnóstico seguro, incluidos scope_not_authorized, scope_permission_missed, access_token_invalid y rate_limit_exceeded. [Errores](https://developers.tiktok.com/docs/en/tiktok-api-v2-error-handling).
- GET connected solo verifica fila, no vigencia remota/scopes.
- Informes: 20 videos por página, hasta 100 páginas por cohorte; si no se completa el rango dentro del límite, lanza error y no importa esa cohorte parcial. El sync antiguo solo toma primera página de 20 y hasMore. Distinguir límite fallido de cobertura completada.
- Snapshots manuales sin job de analítica encontrado; allowlist de respuesta antigua no es tan estricta como importador nuevo.


## 9. META ADS / PAUTA

### Conexión y contrato recomendado

**Estado actual: NOT_CONNECTED / colector no implementado.** /api/reports/ads lee SQL; no llama a Marketing API. No hay selección de cuenta publicitaria, grant Ads verificado ni inventario de Ad/Creative/Campaign/Ad Set.

Permiso A = ads_read y acceso real al activo publicitario. Para clientes externos puede requerir Advanced Access/App Review y requisitos de negocio de Meta. ads_management es de gestión y no debe solicitarse automáticamente para informes de solo lectura; business_management depende de la operación de inventario de activos, no sustituye ads_read. [Autorización Marketing API](https://developers.facebook.com/docs/marketing-api/get-started/authorization/).

AI(fields) = GET https://graph.facebook.com/{version-publicitaria-validada}/act_{ad-account-id}/insights?fields=fields&level=ad&time_range=...; también existen /{ad-id}/insights, /{adset-id}/insights y /{campaign-id}/insights.

Referencia pública vigente: v26. No hay versión Ads efectiva implementada. Antes de integrar, validar compatibilidad de campos con la versión elegida; configurar el nuevo servicio sin cambiar el OAuth/versión Facebook existente por este motivo.

Consultar rango, nivel, time_increment, moneda, zona horaria de cuenta, objetivo y configuración de atribución. Los insights devuelven numerosos numeric strings y arrays; no usar numeric/metricValue actual sin adaptador. Requests pueden necesitar paginación/consulta asíncrona según volumen.

Fuentes: [Insights](https://developers.facebook.com/docs/marketing-api/insights/), [Campos actuales de Ad Account Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights), [Breakdowns](https://developers.facebook.com/docs/marketing-api/insights/breakdowns/).

### Matriz Ads solicitada

En **cada fila**, Endpoint actual = ninguno y Focus no la obtiene; permiso = A. AVAILABLE describe capacidad de la API, no estado operativo actual. «Restricciones» incluyen activo autorizado, evento/objetivo, formato, combinaciones de breakdown y atribución.

| Métrica | Estado API | Endpoint recomendado | Problema actual | Acción recomendada |
|---|---|---|---|---|
| Spend | AVAILABLE; proveedor lo define estimado | AI(spend,account_currency) | No conexión; modelo carece de cuenta publicitaria. | Conservar moneda y definición; no anunciar exactitud superior al proveedor. |
| Reach | AVAILABLE_WITH_RESTRICTIONS, estimado oficial | AI(reach) | Sin consulta. | Usar alcance al nivel/rango apropiado; no sumar únicos de Ads/días. |
| Impressions | AVAILABLE | AI(impressions) | Sin consulta. | Mantener impresiones publicitarias distintas de views del post. |
| Clicks | AVAILABLE | AI(clicks) | Sin consulta. | Etiquetar todos los clics. |
| Link clicks | AVAILABLE_WITH_RESTRICTIONS | AI(inline_link_clicks) | Sin campo separado en modelo. | Separar clics a destinos/enlaces; ventana propia documentada. |
| CTR | AVAILABLE | AI(ctr) | Cálculo UI actual sin datos; usa todos los clics. | Distinguir CTR de todos los clics de link CTR; no promedio simple de ratios. |
| CPC | AVAILABLE | AI(cpc) | Sin datos. | Todos los clics; moneda y nivel explícitos. |
| CPM | AVAILABLE | AI(cpm) | Sin datos. | Costo por mil impresiones, moneda correcta. |
| Frequency | AVAILABLE_WITH_RESTRICTIONS, estimado oficial | AI(frequency) | Modelo sin campo. | Nivel/rango propios; no suma/promedio no ponderado. |
| Messages | AVAILABLE_WITH_RESTRICTIONS | AI(actions), action_type de mensajería compatible | Sin parser ni evento/objetivo. | Conservar tipo realmente recibido; no sumar variantes superpuestas. |
| Leads | AVAILABLE_WITH_RESTRICTIONS | AI(actions/conversions), tipo de lead según superficie | Modelo sin definición de evento. | Distinguir leads de formularios/web/otros; verificar action_type real. |
| Conversions | AVAILABLE_WITH_RESTRICTIONS | AI(conversions,actions,action_values) | Arrays no compatibles con escalar genérico. | Evento y ventana de atribución explícitos; no suma universal de todas las acciones. |
| Cost per result | AVAILABLE_WITH_RESTRICTIONS | AI(cost_per_result,results); cost_per_action_type para acción definida | Actual calcula spend/results sin objetivo. | Conservar arrays/result type; elegir denominador coherente con objetivo. |
| Video views | FORMAT_ONLY/AVAILABLE | AI(video_play_actions); otros umbrales con campos específicos | Sin consulta. | Starts no equivalen a vista de 3 s; no duplicar contador. |
| Video retention | FORMAT_ONLY/AVAILABLE | AI(video_play_curve_actions) | Parser/modelo sin histogramas publicitarios. | Conservar bins oficiales, no interpolación presentada como API. |
| 25% | FORMAT_ONLY/AVAILABLE | AI(video_p25_watched_actions) | Sin consulta. | Conservar AdsActionStats y definición, incluye saltos al punto. |
| 50% | FORMAT_ONLY/AVAILABLE | AI(video_p50_watched_actions) | Sin consulta. | Igual. |
| 75% | FORMAT_ONLY/AVAILABLE | AI(video_p75_watched_actions) | Sin consulta. | Igual. |
| 95% | FORMAT_ONLY/AVAILABLE | AI(video_p95_watched_actions) | Sin consulta. | Igual; no equiparar a completado orgánico de Facebook ≥97%. |
| 100% | FORMAT_ONLY/AVAILABLE | AI(video_p100_watched_actions) | Sin consulta. | Incluye saltos al punto; no garantiza reproducción continua completa. |

Los campos exactos anteriores y sus tipos están documentados en [Ad Account Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights). Mensajes/leads requieren interpretar los tipos de actions que la cuenta realmente devuelve; no se certifica una lista exhaustiva de action_type aplicable a cualquier objetivo.

Meta marca algunas métricas como estimadas o en desarrollo. «Dato oficial» no significa «conteo exacto». Guardar y mostrar esa calificación; si el producto excluye toda estimación, esos campos deben permanecer sin valor utilizable, aunque exista una estimación oficial. Focus no debe generar estimaciones propias.

### Publicación/video/cuenta/audiencia bajo Marketing API

Marketing reporta **entrega y acciones atribuidas a anuncios**, no reemplaza los insights orgánicos ni las estadísticas del perfil. Endpoint actual ninguno y permiso A en todos los casos publicitarios.

| Grupo / métrica | Estado / endpoint recomendado | Problema y acción |
|---|---|---|
| Publicación: Reach | AVAILABLE del Ad, AI(reach) | No es reach orgánico del post; conservar fuente Ads. |
| Publicación: Impressions | AVAILABLE del Ad, AI(impressions) | No revive impressions retiradas de Instagram/Facebook orgánico. |
| Publicación: Views | FORMAT_ONLY, AI(video_play_actions/campo de umbral compatible) | No hay views universal idéntico al del post. |
| Publicación: Plays | FORMAT_ONLY, AI(video_play_actions) | Contador starts publicitario, con definición independiente. |
| Publicación: Likes | RESTRICTED, actions si devuelve reacción/tipo compatible | No reemplazar likes del perfil/post; no prometer likes exactos desde todas las reacciones. |
| Publicación: Comments | RESTRICTED, AI(actions), tipo compatible | Comentarios atribuidos a Ads, no todo comentario histórico del post. |
| Publicación: Shares | RESTRICTED, AI(actions), tipo compatible | Identificar acción real, no inventar mapping si no vuelve. |
| Publicación: Saves | VALIDATION_PENDING del tipo de acción/superficie | No campo universal certificado; no prometer relleno de saves orgánico. |
| Publicación: Clicks | AVAILABLE, AI(clicks/inline_link_clicks) | Separar tipos. |
| Publicación: Profile visits | RESTRICTED/VALIDATION_PENDING según destino/acción | No contador universal certificado por post; no equiparar link click a visita. |
| Publicación: Followers gained | RESTRICTED/VALIDATION_PENDING según acción/superficie | No total universal de nuevos seguidores orgánicos. |
| Publicación: Engagement | RESTRICTED, AI(actions) según tipo de engagement | Definición publicitaria, no sumar indiscriminadamente acciones. |
| Publicación: Engagement rate | DERIVED | Numerador/denominador publicitarios coherentes; no tasa orgánica del post. |
| Publicación: Total interactions | RESTRICTED/DEFINITION_REQUIRED | No total_interactions Instagram universal; separar acciones Ads por tipo. |
| Video: Video views | FORMAT_ONLY, AI(video_play_actions/campo de umbral) | Precisión de umbral/starts. |
| Video: 3-second views | VALIDATION_PENDING del contrato/tipo exacto | No se certificó aquí un campo directo vigente; no inventar video_3_sec_watched_actions. |
| Video: Average watch time | FORMAT_ONLY/AVAILABLE, AI(video_avg_time_watched_actions) | Array; incluye repetición; unidad oficial explícita. |
| Video: Total watch time | NOT_VERIFIED como campo directo en contrato consultado | No inferir avg×views sin denominador oficial coincidente. |
| Video: Completion rate | DERIVED/RESTRICTED | No tasa universal; p100 incluye saltos, requiere definición del cálculo. |
| Video: Retention | FORMAT_ONLY/AVAILABLE, AI(video_play_curve_actions) | Histogramas por segundos/rangos, no curva orgánica. |
| Video: 25% | FORMAT_ONLY/AVAILABLE, AI(video_p25_watched_actions) | Conteos Ads, no espectadores continuos garantizados. |
| Video: 50% | FORMAT_ONLY/AVAILABLE, AI(video_p50_watched_actions) | Igual. |
| Video: 75% | FORMAT_ONLY/AVAILABLE, AI(video_p75_watched_actions) | Igual. |
| Video: 95% | FORMAT_ONLY/AVAILABLE, AI(video_p95_watched_actions) | Igual. |
| Video: 100% | FORMAT_ONLY/AVAILABLE, AI(video_p100_watched_actions) | Igual. |
| Cuenta: Total followers | OTHER_API: perfil orgánico | No usar Ads para total followers actual del perfil. |
| Cuenta: Followers gained | OTHER_API para altas totales del perfil | Acciones Ads no contienen todas las altas orgánicas. |
| Cuenta: Followers lost | OTHER_API para bajas totales del perfil | No restar actions para inventar bajas. |
| Cuenta: Profile visits | RESTRICTED para atribución publicitaria; OTHER_API para total perfil | No confundir visitas atribuidas con todas las visitas. |
| Cuenta: Accounts reached | AVAILABLE en cuenta publicitaria, AI(reach) | Personas/cuentas alcanzadas por Ads, no alcance total del perfil. |
| Cuenta: Accounts engaged | NOT_SUPPORTED como equivalente orgánico universal certificado | Actions son eventos; no cuentas únicas orgánicas. |
| Audiencia: Gender | AVAILABLE_WITH_RESTRICTIONS, AI con breakdown=gender | Audiencia de entrega publicitaria, no seguidores del perfil. |
| Audiencia: Age | AVAILABLE_WITH_RESTRICTIONS, breakdown=age | Igual. |
| Audiencia: City | VALIDATION_PENDING; sin city genérico certificado | region/dma no equivalen a city; no convertirlos. |
| Audiencia: Country | AVAILABLE_WITH_RESTRICTIONS, breakdown=country | Ubicación de audiencia Ads. |
| Audiencia: Followers vs non-followers | VALIDATION_PENDING por producto/breakdown | No desglose universal certificado; validar combinaciones específicas. |
| Audiencia: Active hours | NOT_SUPPORTED como actividad de seguidores; delivery hourly sí | hourly_stats_aggregated_by_advertiser_time_zone/audience_time_zone mide entrega, no fans conectados. |
| Audiencia: Active days | NOT_SUPPORTED como actividad de seguidores; time_increment=1 sí | Serie diaria de Ads no equivale a seguidores activos. |

Campos/histogramas: [Ad Account Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights). Audiencia/entrega y combinaciones: [Breakdowns oficial](https://developers.facebook.com/docs/marketing-api/insights/breakdowns/). Las filas VALIDATION_PENDING requieren validar documentación/payload concreto antes de implementar, no consultas especulativas en producción.

### Relación Post/Reel → Creative → Ad → Ad Set → Campaign

Inventario propuesto: /act_{account-id}/ads con campos id,adset_id,campaign_id,creative; consultar el Creative y guardar los IDs de activos y variantes devueltos.

Campos oficiales relevantes del Creative:

- effective_object_story_id: Page post efectivo utilizado por el anuncio, incluso si es una publicación oculta.
- object_story_id: post existente; puede ser null cuando la pieza se crea mediante object_story_spec.
- effective_instagram_media_id: media Instagram usado por el anuncio.
- object_story_spec, asset_feed_spec y variantes: pueden involucrar múltiples piezas/destinos, no una única publicación.
- instagram_permalink_url: apoyo de identificación, no sustituye un ID verificado.

[Referencia oficial Ad Creative](https://developers.facebook.com/docs/marketing-api/reference/ad-creative/?locale=en_US).

Guardar relaciones muchos-a-muchos con ad_account_id,ad_id,creative_id,adset_id,campaign_id,external_post_id/ig_media_id, versión, fecha de observación y evidencia. Conservar IDs como strings.

Clasificación propuesta:

- «Usada en un anuncio»: relación Creative↔post demostrada.
- «Entrega pagada observada»: relación demostrada más entrega/spend/impressions del Ad en rango consultado.
- «Promocionada»: solo si la API aporta evidencia que permita distinguir promoción de otras formas de uso publicitario.
- «Solo orgánica»: no inferir de que el inventario autorizado no encontró Ads; puede ser incompleto.
- «Sin clasificación»: conservar paid=null cuando falta evidencia.

La naturaleza orgánica de una métrica no demuestra que la pieza nunca haya tenido pauta. No restar reach Ads de reach combinado para fabricar alcance orgánico: audiencias únicas, ventanas y definiciones pueden superponerse.

## 10. Históricos: diseño propuesto, sin migración aplicada

Ya existen capturas de métricas de posts y seguidores. Ampliarlas de forma aditiva en PostgreSQL, conservando tablas y hechos anteriores. No adoptar Prisma solo para este cambio.

SocialAccountSnapshot propuesto:

| Campo | Semántica |
|---|---|
| id,companyId,socialAccountId,platform,externalAccountId | Identidad y aislamiento de empresa/cuenta. |
| date,capturedAt,createdAt,timezone | Día de observación, timestamp real y zona; distinguir período consultado. |
| followers,following | Totales observados oficiales; null cuando no se obtienen. |
| profileViews,reach,impressions,accountsEngaged | Solo si la fuente/nivel/versión ofrece ese dato; snapshot de total no sustituye actividad diaria. |
| followersGained,followersLost | Datos directos de API con definición/ventana; nunca inferidos solo desde totals. |
| periodStart,periodEnd,source,apiVersion,availability,definitions | Procedencia, cobertura, motivos y unidad. |

Conservar múltiples capturas con timestamp; una vista diaria puede seleccionar la última captura exitosa sin borrar observaciones. Añadir claves/índices compuestos por empresa, cuenta, plataforma, fecha y captura. Una reconexión a otra cuenta no debe mezclar series ni borrar la anterior.

Plan de captura: job diario de perfiles, jobs de métricas con ventanas compatibles y controles de cuotas; Stories requieren capturas más frecuentes mientras están accesibles. No es el cron de push. Instagram Login no ofrece story_insights webhook para este flujo; no crear una dependencia de ese webhook. Tokens se refrescan según contrato, no con expiración inventada.

followersNetGrowth = followersEnd − followersStart entre observaciones reales, con sus fechas expuestas. Sin snapshot inicial/final, NO_DATA. No rellenar huecos, extrapolar ni usar max(0,diferencia) para inventar ganados/perdidos. El neto puede ser negativo. Una disminución/corrección de un contador acumulado no se convierte silenciosamente en cero.

Para actividad del período, preferir insights oficiales por intervalo cuando existen. Diferencias entre snapshots de contadores acumulados requieren una definición y cobertura explícitas; no equivalen automáticamente al historial oficial de actividad. Para «estado al cierre» consultar solo capturas ≤cierre; si no existe captura, no reconstruirla.

## 11. Disponibilidad, diagnóstico y logs propuestos

### Contrato por métrica

Propuesta de respuesta, no código implementado:

~~~json
{
  "value": null,
  "status": "NOT_SUPPORTED",
  "reasonCode": "NOT_SUPPORTED_BY_TIKTOK_API",
  "reason": "Display API no proporciona alcance único",
  "platform": "TikTok",
  "level": "media",
  "source": "TikTok Display API",
  "apiVersion": "v2",
  "unit": "accounts",
  "capturedAt": null
}
~~~

Separar capacidad del contrato de estado de la última consulta. AVAILABLE no garantiza completitud/frescura; NOT_CONNECTED no significa no soportado. Conservar coverage y subtotales explícitos existentes.

| Estado | Evidencia necesaria | Texto orientativo |
|---|---|---|
| AVAILABLE | Valor oficial válido, incluso cero recibido realmente | Valor, fuente y fecha. |
| NO_DATA | Consulta compatible sin datos/umbral o cobertura histórica insuficiente | Sin datos para este período. |
| NOT_SUPPORTED | Campo ausente del contrato actual | No proporcionado por TikTok Display API, por ejemplo. |
| MISSING_PERMISSION | Grant faltante/rechazo inequívoco del proveedor | Permiso requerido. |
| DEPRECATED | Retirada vigente documentada | Métrica retirada por Meta. |
| ACCOUNT_LEVEL_ONLY | Métrica de cuenta solicitada en post | Disponible solo a nivel de cuenta. |
| MEDIA_TYPE_NOT_SUPPORTED | Campo incompatible con el producto/formato | No disponible para este formato. |
| NOT_CONNECTED | No conexión/activo autorizado para esa fuente | Conecta la cuenta correspondiente. |
| API_ERROR | Error operativo real: token, cuota, red, respuesta inválida | Error al consultar la red social. |
| PENDING_SYNC | Colector implementado pero sin captura válida reciente | Pendiente de sincronización. |

Extensiones recomendadas: NOT_IMPLEMENTED o reasonCode=COLLECTOR_NOT_IMPLEMENTED para un endpoint aún no construido; VALIDATION_PENDING para un contrato que falta certificar; calidad/partial independiente del estado. Evitar «Pendiente de sincronización» si pulsar Consultar redes nunca puede llenar el campo sin desarrollar el colector.

El scope general no puede inferirse solo desde un code 10. Aislar errores por media/métrica y formato; clasificar Stories con espectadores insuficientes como NO_DATA, no revocar acceso de toda la cuenta. Conservar último valor histórico con su fecha, separándolo del fallo del nuevo intento.

### Diagnóstico administrativo

No existe actualmente el apartado completo solicitado. Propuesta dentro de Integraciones → Diagnóstico, con el rol administrador existente y aislamiento por empresa:

- Proveedor/API/versión; configuración presente sin valores secretos.
- Cuenta/activo seleccionado y estado de conexión.
- Token: expiración conocida y última verificación remota por separado. «No expirado localmente» no equivale a «válido según proveedor».
- Scopes solicitados, recibidos y verificados; fecha/evidencia y scopes faltantes por capacidad.
- Tarea de Página/acceso al ad account cuando corresponda.
- Último intento, último éxito y último éxito parcial separados: lastAttemptAt/lastSuccessAt; el capturedAt actual incluye intentos fallidos.
- Última publicación consultada y cobertura/paginación.
- Capacidades soportadas, permisos faltantes, formatos excluidos y retiros.
- Errores recientes seguros con etapa, HTTP, código/subcódigo y request/log_id.
- Estado separado Meta Ads; no representarlo mediante la tarjeta Facebook conectada.

No mostrar tokens, secretos, app token, appsecret_proof, authorization code, state o cookies. No crear un esquema paralelo de autenticación.

### Logs

Hoy existen diagnósticos OAuth de Instagram/Facebook y log content_report_sync con plataforma/etapa/HTTP/código en errores. No hay trazabilidad de éxito y disponibilidad por cada métrica/media. TikTok pierde detalles del proveedor antes de registrarlos. focus_content_syncs sobrescribe el último estado.

Proponer eventos estructurados con companyId interno, accountId, publicationId/externalId autorizado, stage, API/version, endpoint **como plantilla sin query sensible**, metricsRequested/Returned/Unavailable, availabilityReasons, HTTP, código/subcódigo, mensaje saneado, providerRequestId, capturedAt y duración.

Los IDs públicos no son tokens, pero su exposición sigue limitada al contexto administrativo/empresa. Usar allowlist y saneamiento; no registrar la URL completa de intercambio/refresh o bearer/app secret. Guardar historial acotado de intentos seguros y contadores agregados de diagnóstico, sin persistir indiscriminadamente respuestas con datos personales.

## 12. Propuesta de implementación, pendiente de aprobación

1. Corregir clasificación de Stories, preservar histórico TikTok en reconexión y eliminar tasa artificial cuando reach=0. Mantener OAuth actual, cuentas y tokens.
2. Introducir disponibilidad/procedencia por métrica y estado parcial por sync; preservar payloads históricos.
3. Instagram: total_interactions oficial; account insights/follows/unfollows y demografía con parser de desgloses. Verificar online_followers y unidades antes de prometer mapas.
4. Facebook: reacciones y tipos de clics/vistas; Page Insights y colector separado de videos/Reels. Validar permiso V y relaciones de IDs, sin reemplazar retiradas por métricas con otra definición.
5. Snapshots/jobs aditivos con timestamps y cobertura; conservar neto separado de altas/bajas.
6. Meta Ads: conexión/activo/ads_read independiente, inventario creativo y colector Insights. Modelo de atribución, moneda, nivel y relación muchos-a-muchos antes de pintar datos pagados.
7. TikTok: mantener Display compatible y motivos NS. Accounts/Marketing como integraciones opcionales separadas, solo tras verificar aprobación/contratos oficiales. No Research.
8. UI/diagnóstico/logs después de contratos backend, con textos por estado y distinción orgánico/Ads.
9. Validación focalizada: Story code 10 vs permiso real; formatos y períodos; numeric strings/arrays; ≥97% vs 100%; cero real vs null; retención sin interpolación; permisos desconocidos; reconexión sin borrar históricos; token rotado; aislamiento de empresas; as-of histórico; paginación/cuotas; Ads sin evidencia permanece desconocido.

No se ejecutaron builds/tests ni peticiones autenticadas: esta fase revisa contratos/código y agrega documentación. Las pruebas funcionales y migraciones corresponden a implementación aprobada.

## 13. Tabla resumen solicitada

«Focus la obtiene» significa consulta/importación implementada, no respuesta comprobada del VPS. Para el detalle de cada métrica, endpoint y permiso, usar las matrices anteriores.

| Red | Métrica | API la soporta | Focus la obtiene | Problema | Solución |
|---|---|---|---|---|---|
| Instagram | Reach, views | Sí, restricciones | Sí | Stories code 10 puede cortar insights; grants reales sin verificar | Aislar error y conservar estado por media. |
| Instagram | Likes, comments, shares, saves | Sí por formato | Sí | Formatos/grants/datos distintos | Matriz y estado individual. |
| Instagram | Total interactions oficial | Sí | No | Usa suma propia | Campo oficial independiente. |
| Instagram | Impressions, plays/replays antiguos | Retirados en versión actual | No | Deprecación | No recuperar por nombres antiguos; preservar histórico. |
| Instagram | Watch time medio/total | Reels | Sí | Verificar unidad/payload real | Registrar unidad/definición, mantener formato. |
| Instagram | 3 s, completion, retención/cuadros orgánicos | No certificados en media actual | No | API no los entrega con ese contrato | No inventar; cuartiles Ads separados. |
| Instagram | Visitas/follows del post | Feed/Stories | Sí en rama POST/CAROUSEL/STORY | No métricas Reel; VIDEO Feed omitido | Compatibilidad por producto. |
| Instagram | Clicks específicos | Stories/perfil, restringidos | No | Sin colector | link_clicks/profile_activity separados. |
| Instagram | Total followers | Sí | Sí, manual | Sin captura diaria garantizada | Snapshots. |
| Instagram | Ganados/perdidos cuenta, reach/accounts engaged | Sí, restricciones | No | Falta account insights | Endpoint y parser por nivel. |
| Instagram | Visitas cuenta profile_views | Retirada | No | Sin equivalente directo certificado | No renombrar taps como visitas. |
| Instagram | Demografía | Sí, umbrales/ventanas | No | Sin colector/importación | Demografía con población/cobertura. |
| Instagram | Active hours/days | Horas con contrato pendiente; días no campo directo certificado | No | Contrato incompleto | Validar antes de prometer mapa. |
| Facebook | Views, post clicks | Sí | Sí | Grants/datos reales no verificados | Mantener campos; tipos/desgloses. |
| Facebook | Likes/comments/shares | Sí, semánticas/restricciones | Sí | No todas las reacciones | Incorporar reacciones separado. |
| Facebook | Reach/impressions tradicionales | Retiradas | No | Deprecación global | Etiqueta retirada; viewers no son reach. |
| Facebook | Saves genérico | No verificado en contrato actual | No | Campo ausente | No inventar. |
| Facebook | Videos/Reels: plays/watch time/retention/follows | Sí por formato | No | Falta colector VI y scope V solicitado | Video IDs/endpoint/permiso documentado. |
| Facebook | Completion 100% orgánico | No contador estándar certificado | No | Completes documentado es ≥97% | No etiquetar 97 como 100. |
| Facebook | Page followers | Sí | Sí, manual | Histórico discontinuo | Snapshots. |
| Facebook | Page visits/altas/bajas | Sí, restricciones/estimación según campo | No | Falta Page Insights | Consultar/validar semántica y calidad. |
| Facebook | Accounts engaged/edad/género seguidores antiguos | Retirados | No | Sin reemplazo idéntico | No mezclar espectadores del video. |
| Facebook | City/country seguidores | Sustituciones oficiales con validación pendiente | No | Contrato incompleto | Validar antes de implementar. |
| Facebook | Follower/non-follower views | Sí, restringido | No | Desgloses omitidos | No mapear vistas a alcance. |
| Facebook | Active hours/days | Sin contrato vigente certificado | No | Nombre antiguo no comprobado | Mantener motivo, no reconstruir. |
| TikTok | Views/likes/comments/shares/duration/cover | Sí Display | Sí | Covers expiran; lifetime/cohortes | Mantener y explicar cobertura/TTL. |
| TikTok | Total followers | Sí Display | Sí, manual | Sin continuidad histórica | Snapshot diario. |
| TikTok | Following/account likes/video count | Sí Display | Solicita, no nuevo historial | Descarte en importador | Guardar observaciones. |
| TikTok | Reach/impressions/saves/clicks/profile visits | No Display | No | No soportado por integración | Texto NS; no API_ERROR. |
| TikTok | Gained/lost/retention/watch time/demografía/actividad | No Display | No | Otra API/contrato necesario | Mantener null; auditar Accounts opcional. |
| TikTok | Crecimiento neto | Cálculo de observaciones reales | Sí si hay cobertura | No recuperar inicial inexistente | No sustituir ganados/perdidos. |
| TikTok | Ads | Marketing separado | No | No conexión; campos/objetivos por validar | Integración propia si se aprueba. |
| Meta Ads | Spend/reach/impressions/clicks/link clicks/CTR/CPC/CPM/frequency | Sí, algunas estimadas por proveedor | No | No integración Ads | ads_read, activo y colector. |
| Meta Ads | Messages/leads/conversions/results/cost | Sí, objetivo/evento/atribución | No | Sin parser/tipo de resultado | Mantener arrays y definiciones. |
| Meta Ads | Video starts/avg watch/retention/25/50/75/95/100 | Sí por formato | No | Sin colector/modelo | Ads Insights, no orgánico. |
| Meta Ads | Uso publicitario de una publicación | Relaciones Creative/Ad | No | Sin inventario/evidencia | Muchos-a-muchos y entrega observada. |

## 14. Validación pendiente y aprobación

Para cerrar la validación operativa posterior hacen falta evidencias seguras de producción: versiones efectivas, grants, tareas/activos autorizados, tipo de cuenta, última captura y respuestas saneadas de métricas representativas. No pegar ni mostrar tokens, cookies, secretos o DATABASE_URL. No se necesita volver a desconectar todas las cuentas para hacer esa comprobación.

La auditoría permite decidir qué implementar y qué mantener sin dato. Los contratos señalados VALIDATION_PENDING están expresamente fuera de una promesa de disponibilidad hasta confirmar fuente/payload oficial.

**No se implementó código ni se hizo redeploy. Se espera aprobación del usuario antes de ejecutar la propuesta.**

