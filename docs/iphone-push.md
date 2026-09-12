# Avisos al iPhone

## Preparar Dokploy

Las claves se generan una sola vez ejecutando `node scripts/create-push-keys.cjs`. El archivo `.env.push.generated` queda fuera de Git y el comando no reemplaza un archivo existente. Copia sus variables al Environment de la **aplicación web**, conservando DATABASE_URL y PANEL_USER/PANEL_PASSWORD. Reemplaza `VAPID_SUBJECT` por `mailto:tu-correo-real` (un correo de contacto). No compartas VAPID_PRIVATE_KEY ni regeneres las claves en cada despliegue.

Guarda las variables y despliega la aplicación. No hace falta abrir puertos ni crear una API pública de cron.

En **Schedule Jobs**, crea una tarea de tipo **Application**, asociada al contenedor de FocusMRK:

- Nombre: `Recordatorios FocusMRK`
- Expresión cron: `* * * * *`
- Comando: `node /app/scripts/send-push-reminders.cjs`

La tarea usa las variables del contenedor y consulta PostgreSQL cada minuto. Selecciona Application, no Server: el archivo está dentro del contenedor. Comprueba los logs de la tarea después de ejecutarla manualmente.

REMINDER_TIMEZONE determina la zona de los avisos: por defecto America/Guayaquil. El módulo muestra esa zona. El calendario usa horas locales del dispositivo al editar; configura los dispositivos con esa misma zona. Los avisos de 30 minutos se sustituyen por reglas diarias que consultan las fechas y estados del contenido.

## Configurar los avisos

En **Notificaciones**, debajo de Cronogramas, configura el resumen matinal, pendientes de hoy, contenido por revisar y publicaciones atrasadas. Cada tipo permite elegir su primer horario y su intensidad:

- Desactivada: ningún envío.
- Suave: un envío por día.
- Normal: hasta dos envíos, separados por cuatro horas.
- Intensa: hasta cuatro envíos, separados por dos horas.

La pantalla muestra los horarios resultantes. Solo se envían dentro del horario permitido, sin cruzar medianoche, y mientras haya pendientes de ese tipo. El máximo es por tipo, por lo que activar varios suma sus avisos. Las preferencias se guardan en PostgreSQL y se aplican a todos los dispositivos registrados. Por defecto: resumen a las 08:00 y pendientes de hoy a las 10:00 y 14:00; revisiones y atrasadas están desactivadas. Horario permitido: 08:00 a 20:00.

El resumen incluye contenido no publicado con fecha de hoy o anterior. Las revisiones incluyen solo contenido en revisión con fecha de hoy o anterior. Las atrasadas son publicaciones de días anteriores. No son tareas independientes con fechas de preparación. Al marcar como Publicado, el contenido deja de incluirse en los siguientes envíos.

## Activar en iPhone

1. En iOS 16.4 o posterior, abre el dominio HTTPS en Safari.
2. Compartir → Añadir a pantalla de inicio (abrir como aplicación web).
3. Abre el icono e inicia sesión con las credenciales del panel.
4. Notificaciones → Conectar mi iPhone → Activar en este dispositivo.
5. Acepta el permiso y pulsa Enviar prueba. Este envío ocurre solo al pulsar el botón.
6. Crea una publicación pendiente para hoy. Configura el primer aviso de Pendientes de hoy unos minutos más adelante, dentro del horario permitido, guarda, cierra FocusMRK y espera la ejecución de la tarea.

La prueba de envío verifica el dispositivo; no verifica que la tarea esté programada. Cada dispositivo debe suscribirse por separado. Para dejar de recibir avisos usa Desactivar en este dispositivo. Las notificaciones respetan Concentración, permisos y conectividad de iOS.

## Funcionamiento y límites

Las tablas focus_push_subscriptions y focus_push_deliveries se crean al registrar el primer dispositivo. No se guardan respuestas privadas en caché offline. Solo el service worker, el manifiesto y el icono son públicos; las rutas de datos y configuración requieren el acceso personal.

Una exclusión mutua en PostgreSQL evita ejecuciones simultáneas de la tarea. Los envíos aceptados se registran por dispositivo, tipo, fecha y horario. Se reintenta un fallo transitorio durante la hora posterior a cada horario y dentro de las horas permitidas; no se recupera un día completo de avisos atrasados. Se eliminan suscripciones caducadas (404/410). Si el proceso cae después de que el proveedor acepte el envío pero antes de registrar el resultado, puede repetirse; no se garantiza entrega exactamente una vez. Las etiquetas agrupan avisos del mismo tipo y día. El proveedor puede conservar cada aviso hasta una hora, limitada por el fin del horario permitido.

Los registros de envíos se limpian después de 90 días. Si borras una publicación o la marcas como Publicado justo después de iniciar una ejecución, un aviso ya enviado no puede retirarse. Los avisos no publican en redes sociales. Al tocarlos se abre el módulo Notificaciones. El contador del icono se actualiza al recibir un aviso y al cargar o cambiar el calendario donde esté disponible la Badging API; no hay sincronización silenciosa garantizada entre dispositivos.

La intensidad cambia la frecuencia, no el volumen, la vibración ni la permanencia del aviso. La web no puede fijar notificaciones o utilizar Dynamic Island; esta última requiere una aplicación iOS con Live Activities.

Fuentes: [Apple Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) y [Schedule Jobs de Dokploy](https://docs.dokploy.com/docs/core/schedule-jobs).
