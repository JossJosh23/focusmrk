# Migración del panel existente a Manabiche

Esta migración se ejecuta **manualmente**, nunca al abrir la aplicación, compilar o desplegar. No se ha ejecutado en producción.

## Qué cambia

- Crea `focus_organizations` con el identificador estable `manabiche`.
- Registra el `PANEL_USER` actual en `focus_users`, con proveedor de autenticación `panel_env`. No copia contraseñas a la base, no las cambia y no crea credenciales nuevas.
- Relaciona ese usuario con Manabiche en `focus_memberships`, con rol `marketing_manager`.
- Asigna el panel (publicaciones y plantillas) y todos los archivos existentes a Manabiche. Solo cambia la etiqueta `brand` de publicaciones/archivos y añade columnas de pertenencia; conserva identificadores, fechas, textos, estados, enlaces y bytes.
- Incrementa la versión del calendario para rechazar guardados de pestañas abiertas antes de la migración.
- Mantiene tareas, notificaciones, perfiles antiguos, suscripciones push y configuraciones sin cambios.
- Registra el resultado, las cantidades y SHA-256 del respaldo en `focus_migrations`.
- El panel actualizado muestra la identidad del gestor y selecciona Manabiche al cargar.

**Alcance de esta primera fase:** sigue existiendo una única credencial de acceso, la configurada en Dokploy. El rol es la asociación inicial, no un sistema terminado de permisos ni aislamiento de varios clientes. No crear accesos para terceros hasta implementar sesiones individuales, autorización por empresa en todas las rutas y migrar la separación del calendario global. Los nombres de empresa del selector siguen siendo claves de compatibilidad; la ficha puede cambiar su nombre visible sin reasignar contenido.

## 1. Antes de tocar producción

1. Confirmar la rama real de despliegue en Dokploy (`main` y `mian` son nombres distintos).
2. Conservar los valores actuales de `DATABASE_URL`, `PANEL_USER` y `PANEL_PASSWORD`. No pegarlos en chats, comandos ni Git.
3. Reservar una pausa de edición: cerrar otras pestañas/dispositivos y pausar el envío programado de recordatorios durante la migración final.
4. Revisar el resultado de `--check`: **todo** lo listado se asignará a Manabiche. Si hay otra empresa real, detenerse; este script no decide qué contenido pertenece a cuál.

## 2. Respaldo sin S3

Hay dos posibilidades. Nunca sustituir el respaldo por una exportación parcial de publicaciones.

### Desde la terminal del contenedor PostgreSQL de Dokploy

Verificar que `POSTGRES_USER` y `POSTGRES_DB` están definidos, sin mostrar contraseñas. En la terminal **de la base**, no la terminal de la web:

```sh
test -n "$POSTGRES_USER" && test -n "$POSTGRES_DB"
```

Si no termina correctamente, confirmar los nombres en General de PostgreSQL antes de continuar; no adivinarlos. Con la edición pausada, generar el respaldo completo:

```sh
umask 077
backup_file="/tmp/focusmrk-before-manabiche-$(date +%Y%m%d-%H%M%S).dump"
pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl --file="$backup_file" && pg_restore --list "$backup_file" > "$backup_file.list" && printf 'Respaldo: %s\n' "$backup_file"
```

El respaldo incluye `focus_media.data`, donde se almacenan imágenes/videos. No incluye usuarios/roles del servidor PostgreSQL. Si aparece un error de autenticación, detenerse y revisar el acceso local del contenedor; no editar contraseñas para resolverlo.

**Descargar este archivo fuera del contenedor y del servidor.** `/tmp` no es almacenamiento duradero. Desde una terminal del servidor, un operador puede localizar los contenedores con `docker ps` y copiar con `docker cp CONTENEDOR_POSTGRES:/tmp/NOMBRE.dump /RUTA_PRIVADA/NOMBRE.dump`; después descargar por SFTP. Sustituir únicamente los nombres/rutas confirmados, sin usar las credenciales de conexión como argumentos. No desplegar/recrear PostgreSQL antes de extraerlo.

### Desde un entorno con Node, PostgreSQL cliente y acceso a la base

Con `DATABASE_URL` ya configurado como variable privada:

```sh
npm run db:backup -- /ruta/privada/focusmrk-before-manabiche.dump
```

Requiere `pg_dump` y `pg_restore` de versión compatible (pg_dump no puede exportar un servidor de versión principal más nueva). El script no instala herramientas ni las presupone en la imagen de Dokploy, no sobrescribe un archivo existente y no imprime secretos. Si faltan, utilizar la terminal PostgreSQL de arriba o un entorno de mantenimiento con los clientes instalados.

## 3. Ensayo obligatorio en una copia

Restaurar el archivo en **otra base vacía**, usando `pg_restore --no-owner --no-acl --exit-on-error`. Nunca probar la restauración contra producción. Verificar que se pueden abrir publicaciones, imágenes y videos. Un `pg_restore --list` correcto comprueba que el archivo se puede leer, pero no sustituye esta restauración real.

Apuntar `DATABASE_URL` del entorno de pruebas a esa copia, manteniendo el mismo `PANEL_USER`. No ejecutar el cron push en pruebas. Ejecutar desde el proyecto actualizado:

```sh
npm run migrate:manabiche -- --check
```

Solo lee: muestra cantidades, empresas/etiquetas detectadas y huella del contenido. Después:

```sh
npm run migrate:manabiche -- --apply --all-content-is-manabiche --backup /ruta/privada/focusmrk-before-manabiche.dump
```

El archivo debe ser accesible en este entorno y `pg_restore` estar instalado: el comando revisa que el archivo contiene los datos de `focus_panel` y `focus_media`. No acredita por sí solo que sea el respaldo más reciente o de la base correcta; comprobarlo durante el ensayo. No subirlo al repositorio ni a `public/`.

Revisar el calendario completo, la biblioteca y las descargas. Iniciar sesión con las mismas credenciales. El indicador superior debe mostrar el usuario como gestor de marketing de Manabiche. Probar crear un post y subir un archivo **en la copia**.

## 4. Producción (con asistencia)

1. Pausar edición y cron; generar y extraer un respaldo final reciente.
2. Desplegar la versión probada, manteniendo el servicio PostgreSQL, el volumen y sus variables intactos. El despliegue **no migra**.
3. En un entorno de mantenimiento con Node, `pg`, `pg_restore`, el código de esta versión y acceso privado a la base, ejecutar `--check` contra producción.
4. Confirmar las cantidades y aplicar con `--apply --all-content-is-manabiche --backup RUTA_DEL_RESPALDO_FINAL`.
5. Verificar `posts`, `files`, `bytes`, `templates`, y la huella en el resultado. El comando verifica nuevamente dentro de la transacción y revierte si encuentra pérdidas, archivos faltantes, tamaños incoherentes o identidades en conflicto.
6. Recargar todas las pestañas. Verificar acceso y contenido, reactivar cron y edición.

La operación es transaccional y repetible: una segunda ejecución para el mismo usuario no vuelve a cambiar marcas/versiones. No eliminar su entrada en `focus_migrations`. Si falla, guardar el mensaje (sin secretos) y detenerse; no forzar cambios en tablas.

## Recuperación

Si la transacción falla antes del COMMIT, se revierte automáticamente. Si aparece un problema después, pausar escrituras, conservar también una copia del estado posterior y restaurar el respaldo previo en **otra base**; verificarla y cambiar la conexión junto con la versión de la aplicación con asistencia. No ejecutar `DROP`, `--clean` o una restauración sobre la base activa. Restaurar el respaldo pierde cualquier edición posterior al respaldo: por eso la pausa de edición es necesaria.

Referencias: [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).
