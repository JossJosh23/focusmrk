# Cuenta del gestor de marketing

El acceso existente `PANEL_USER` / `PANEL_PASSWORD` queda como administrador de todas las empresas. No reemplaces esas variables para añadir al gestor.

Después de desplegar este código, abre **la terminal de la aplicación web** en Dokploy y ejecuta:

```sh
node scripts/create-marketing-account.cjs gestor_marketing Manabiche
```

El comando crea una cuenta independiente con rol `marketing_manager`, asignada a Manabiche, y muestra una contraseña aleatoria una sola vez. Guárdala en un gestor de contraseñas. Solo se almacena su hash scrypt con sal aleatoria; las sesiones también se almacenan mediante hash y expiran a las 12 horas. El usuario entra en la misma pantalla de inicio de sesión.

El comando requiere que ya exista contenido identificado como `Manabiche`. Si aún aparecen `Mi marca` o `manabicheoficial`, completa y verifica primero la migración documentada en `manabiche-migration.md`. No reasigna publicaciones ni archivos automáticamente. Una ejecución repetida rechaza el usuario existente sin cambiar su contraseña.

Las empresas se asignan al profesional, no forman parte de su nombre de usuario. `focus_account_companies` permite varias empresas por cuenta. Actualmente la asignación se realiza en PostgreSQL; la pantalla administrativa de usuarios todavía no está implementada.

Los permisos se verifican en el servidor: calendario, biblioteca, perfiles y cronogramas solo incluyen empresas asignadas. Al guardar se conservan las publicaciones de otras empresas. Las tareas y plantillas del gestor son independientes. YORCH mantiene acceso global al contenido empresarial; las tareas y plantillas personales del gestor no se muestran en la vista personal de YORCH.

La configuración global de notificaciones y push sigue reservada al administrador; el gestor conserva los recordatorios visibles del calendario. No se comparten las suscripciones del administrador con el gestor.

Para desactivar una cuenta, un administrador de PostgreSQL puede establecer `focus_accounts.enabled = false` para su ID. Se rechazan inmediatamente sus sesiones en solicitudes posteriores. Cerrar sesión revoca la sesión actual.

La creación está preparada en código; el comando debe ejecutarse contra la base de producción desde la aplicación desplegada para que exista la cuenta real. No ejecutes la creación contra una base equivocada. Incluye las nuevas tablas `focus_account*` en los respaldos completos habituales de PostgreSQL.
