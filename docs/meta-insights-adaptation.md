# Adaptación de insights Meta — 5 de octubre de 2026

Se conservan Instagram Login (`graph.instagram.com`, v26.0), Facebook Login/Page (v24.0), redirects, scopes solicitados y tokens. No se añade OAuth nuevo ni conexión de Meta Ads.

## Datos incorporados

- Instagram cuenta: views, reach, profile_views, accounts_engaged y total_interactions. Capturas actuales de follower_demographics por edad, sexo, ciudad y país; son cantidades originales, sin estimar segmentos ausentes ni convertirlas automáticamente a porcentajes.
- Instagram publicación: total_interactions oficial separado del cálculo de interacciones existente.
- Facebook página: page_media_view, page_views_total, page_post_engagements, page_daily_follows, page_follows, page_total_media_view_unique, page_video_views y page_video_view_time. Se conservan los intervalos devueltos por Meta y las unidades originales.
- Facebook publicación: post_total_media_view_unique separado del alcance y las visualizaciones.

`collectAccountInsights` consulta períodos de hasta 30 días por bloque. No suma espectadores únicos entre bloques ni reconstruye períodos mediante capturas actuales. Las métricas de cuenta se muestran en el anexo, separadas de los KPIs por publicación. Las fechas finales de las series conservan la zona horaria devuelta por Meta. Los nombres y valores originales adicionales de publicación se muestran en su detalle.

## Persistencia

La migración aditiva `migrations/20261005_account_insights.sql` crea `focus_account_insights`, con empresa, cuenta, fecha de captura, intervalo, alcance PERIOD/CURRENT_AUDIENCE y payload. El repositorio inicializa el mismo esquema. La escritura es transaccional y valida cuenta/plataforma; las consultas eligen la captura más reciente del mismo intervalo y alcance y respetan empresa/red. Las importaciones existentes y los datos manuales se conservan.

## Stories

Un error 10/200 local a una Story no desactiva las consultas de las siguientes publicaciones. Se guarda la Story con métricas ausentes y advertencia. Los errores globales de token o rate limit conservan su tratamiento existente. No se fuerza una reconexión por una métrica o Story restringida.

## Diagnóstico

`GET /api/reports/diagnostics?companyId=...` requiere la autenticación y asignación de empresa existentes. No renueva ni guarda tokens. El botón «Comprobar permisos y tokens» aparece dentro de Informes de contenido.

Facebook usa debug_token para usuario y página seleccionada. Distingue vencimiento de token y vencimiento del acceso a datos, y comprueba que los tokens correspondan a la app. Instagram prueba perfil e insights sin presentar esas capacidades como una lista completa de scopes. Los permisos configurados proceden de la declaración del administrador, no de una consulta del panel de Meta. Los permisos declarados pero ausentes reciben REAUTHORIZATION_REQUIRED individualmente; una función de informes sigue READY si dispone de todos sus permisos necesarios. Los resultados no contienen tokens, secretos ni errores brutos del proveedor.

## Verificación real

En localhost, Manabiche sincronizó correctamente Instagram (19 publicaciones, incluidas las del período comparativo) y Facebook (17). Las consultas posteriores devolvieron dos capturas de cuenta de Instagram —período y audiencia actual— y una de Facebook; todas las métricas de cuenta incorporadas devolvieron datos disponibles. El diagnóstico confirmó acceso a insights para ambas conexiones y detectó pages_manage_metadata ausente en Facebook.

Pasaron lint, tipos, pruebas de diseño, la suite de informes (incluidos OAuth/sincronización), y build de producción. Se añadieron pruebas de Story restringida seguida de contenido válido, cero real, series sin sumas ficticias, demografía parcial, persistencia/idempotencia y rechazo de lectura/escritura entre empresas.

## Límites

La lista completa de scopes de Instagram sigue sin una inspección independiente soportada en este diagnóstico: se muestra explícitamente como no disponible. Stories activas de bajo volumen deben comprobarse con contenido real cuando exista. No se añadieron curvas de retención, replays rechazados, métricas retiradas ni estadísticas específicas de objetos Video/Reel de Facebook no verificadas. Meta Ads requiere ads_read y asignación de cuenta publicitaria antes de implementarse.
