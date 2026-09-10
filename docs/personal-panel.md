# Herramientas personales

El panel principal utiliza los datos locales y ya no muestra cuentas ni colaboración. La integración compartida anterior permanece en el código, pero no está activa en esta pantalla.

## Biblioteca

- Abre **Biblioteca y respaldos** para subir imágenes o videos y asignarles una marca. También puedes subir y seleccionar archivos desde el editor.
- Se admiten JPEG, PNG, WebP, GIF, AVIF, MP4, WebM y QuickTime, hasta 100 MB por archivo. La reproducción de video depende de los códecs del navegador; si no puede mostrarlo se ofrece descarga.
- Seleccionar un archivo asigna su marca al post. Puedes quitar la asociación sin borrar el archivo.
- Los archivos se almacenan como Blob en IndexedDB, no como URLs temporales ni en localStorage. Las publicaciones guardan el identificador y conservan sus referencias al recargar.
- No se permite eliminar archivos asociados a publicaciones guardadas. La biblioteca permite descargar archivos individuales.

## Respaldos y PDF

- **Descargar respaldo completo** incluye todos los meses, plantillas y los archivos de toda la biblioteca en un JSON versionado. Hasta 180 MB de archivos originales por respaldo; la importación admite JSON de hasta 250 MB.
- La importación valida el documento y muestra una confirmación con cantidades. Añade copias nuevas y remapea sus identificadores: no reemplaza contenido existente. Importarlo dos veces genera duplicados.
- Si faltan archivos referenciados, el respaldo no se genera ni se acepta como completo. Si los archivos se copian pero el navegador rechaza guardar el calendario, se informa y las publicaciones anteriores se conservan; los archivos copiados quedan disponibles en la biblioteca.
- **Exportar selección a PDF** genera una agenda cronológica con marca, fecha, hora, estado, redes, copy, contactos y enlaces, aplicando los filtros del mes visible. Los archivos binarios no se incrustan en el PDF; están en el respaldo. La fuente PDF admite caracteres latinos y español; los emojis no se incluyen.

## Recordatorios

- El panel muestra publicaciones próximas (15, 30 o 60 minutos), pendientes en revisión y publicaciones cuyo horario venció durante las últimas 24 horas.
- Se usa la hora local del dispositivo. Un post marcado como Publicado deja de generar avisos de publicación.
- **Activar notificaciones del navegador** solicita permiso. Cada horario se notifica una sola vez y la revisión pendiente se recuerda una vez al día. Las preferencias y los avisos enviados se conservan localmente.
- La aplicación debe permanecer abierta. No hay correo, tareas de servidor ni notificaciones push con el navegador cerrado. Los navegadores pueden retrasar los temporizadores de pestañas en segundo plano.

Los datos y archivos permanecen en este navegador y dominio. Borrar los datos del sitio o cambiar de dispositivo requiere restaurar un respaldo. El uso personal y el almacenamiento local no añaden por sí solos una restricción de acceso al dominio; esa protección se configura por separado en el alojamiento si se necesita.
