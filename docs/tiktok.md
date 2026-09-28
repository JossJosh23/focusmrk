# Conexión de TikTok

En Dokploy, configurar en el servicio de Next.js:

```env
TIKTOK_CLIENT_KEY=<client key del Sandbox>
TIKTOK_CLIENT_SECRET=<client secret del Sandbox>
TIKTOK_REDIRECT_URI=https://focusmrkt.tgxlabs.io/api/tiktok/callback
```

Se requieren DATABASE_URL y la autenticación del panel. No usar el prefijo NEXT_PUBLIC para estas variables. Los tokens se cifran con AES-256-GCM, vinculados a la empresa. Por defecto la clave se deriva del Client secret. Opcionalmente se puede configurar TIKTOK_TOKEN_KEY como secreto aleatorio independiente antes de conectar cuentas. Cambiar esa clave o el Client secret usado como clave requiere volver a conectar las cuentas existentes.

En el portal TikTok: Login Kit para Web, la misma Redirect URI exacta, permisos user.info.basic, user.info.stats y video.list; añadir la cuenta de prueba a Target Users y aplicar los cambios.

Después de desplegar:

1. Iniciar sesión en FocusMRK, abrir Empresa y seleccionar la empresa correcta.
2. Pulsar Conectar TikTok y autorizar la cuenta incluida en Target Users con los tres permisos.
3. Al volver a FocusMRK, pulsar Actualizar métricas. También está disponible en Reportes.
4. Comprobar el nombre de la cuenta, seguidores y videos. Los contadores son acumulados al consultar. Se muestran hasta 20 videos públicos recientes, con aviso cuando hay más; no son totales mensuales ni de toda la cuenta.
5. Probar cancelar la autorización, renovar la conexión y desconectar. Desconectar intenta revocar en TikTok y elimina tokens, consultas guardadas y autorizaciones pendientes de esa empresa. Los reportes independientes no se eliminan.

Cada actualización manual guarda un registro con fecha en focus_tiktok_snapshots. No hay tarea programada de sincronización ni cálculo histórico mensual: los datos anteriores a la primera consulta no pueden reconstruirse. El formulario de reportes sigue permitiendo transcribir métricas verificadas para el periodo elegido; no se sobrescribe con contadores acumulados.

Las tablas se crean automáticamente. Los estados de OAuth caducan en 10 minutos, se usan una sola vez y se vinculan a la sesión que inició la autorización. Cada acceso comprueba los permisos actuales sobre la empresa. Los tokens solo salen del servidor hacia los endpoints oficiales de TikTok. La renovación y desconexión se serializan por empresa en PostgreSQL.

Las pruebas automatizadas simulan TikTok; la autorización real requiere el dominio desplegado. Tras probar el flujo, grabar la demostración real para revisión de producción y actualizar las credenciales al cambiar de entorno. No compartir secretos en capturas o registros.

Documentación: https://developers.tiktok.com/docs/en/login-kit-web y https://developers.tiktok.com/docs/en/oauth-user-access-token-management
