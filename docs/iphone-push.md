# Avisos al iPhone

## Preparar Dokploy

Las claves se generan una sola vez ejecutando `node scripts/create-push-keys.cjs`. El archivo `.env.push.generated` queda fuera de Git y el comando no reemplaza un archivo existente. Copia sus variables al Environment de la **aplicación web**, conservando DATABASE_URL y PANEL_USER/PANEL_PASSWORD. Reemplaza `VAPID_SUBJECT` por `mailto:tu-correo-real` (un correo de contacto). No compartas VAPID_PRIVATE_KEY ni regeneres las claves en cada despliegue.

Guarda las variables y despliega la aplicación. No hace falta abrir puertos ni crear una API pública de cron.

En **Schedule Jobs**, crea una tarea de tipo **Application**, asociada al contenedor de FocusMRK:

- Nombre: `Recordatorios FocusMRK`
- Expresión cron: `* * * * *`
- Comando: `node /app/scripts/send-push-reminders.cjs`

La tarea usa las variables del contenedor y consulta PostgreSQL cada minuto. Selecciona Application, no Server: el archivo está dentro del contenedor. Comprueba los logs de la tarea después de ejecutarla manualmente.

REMINDER_TIMEZONE determina la zona de los horarios del calendario: por defecto America/Guayaquil. El calendario usa horas locales del dispositivo al editar; configura los dispositivos con esa misma zona. La tarea consulta las publicaciones entre ahora y los próximos 30 minutos, omite Publicado y no envía publicaciones cuya hora ya pasó. Si creas un post a menos de 30 minutos, se avisará en la siguiente ejecución.

## Activar en iPhone

1. En iOS 16.4 o posterior, abre el dominio HTTPS en Safari.
2. Compartir → Añadir a pantalla de inicio (abrir como aplicación web).
3. Abre el icono e inicia sesión con las credenciales del panel.
4. Recordatorios → Configurar avisos → Avisos al celular → Activar en este dispositivo.
5. Acepta el permiso y pulsa Enviar prueba. Este envío ocurre solo al pulsar el botón.
6. Crea una publicación de prueba a unos 31 minutos, cierra FocusMRK y espera la ejecución de la tarea.

La prueba de envío verifica el dispositivo; no verifica que la tarea esté programada. Cada dispositivo debe suscribirse por separado. Para dejar de recibir avisos usa Desactivar en este dispositivo. Las notificaciones respetan Concentración, permisos y conectividad de iOS.

## Funcionamiento y límites

Las tablas focus_push_subscriptions y focus_push_deliveries se crean al registrar el primer dispositivo. No se guardan respuestas privadas en caché offline. Solo el service worker, el manifiesto y el icono son públicos; las rutas de datos y configuración requieren el acceso personal.

Una exclusión mutua en PostgreSQL evita ejecuciones simultáneas de la tarea. Los envíos aceptados se registran por dispositivo, publicación, fecha y hora; reprogramar permite un nuevo aviso. Se reintenta un fallo transitorio en el próximo minuto y se eliminan suscripciones caducadas (404/410). Si el proceso cae después de que el proveedor acepte el envío pero antes de registrar el resultado, puede repetirse; no se garantiza entrega exactamente una vez. Las etiquetas ayudan a agrupar avisos iguales.

Los registros de envíos se limpian después de 90 días. Si borras una publicación o la marcas como Publicado justo después de iniciar una ejecución, un aviso ya enviado no puede retirarse. Los avisos no publican en redes sociales. El resumen diario queda fuera de esta primera versión.

Fuentes: [Apple Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) y [Schedule Jobs de Dokploy](https://docs.dokploy.com/docs/core/schedule-jobs).
