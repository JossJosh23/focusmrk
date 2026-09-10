# Conectar FocusMRK con PostgreSQL en Dokploy

En el servicio de la **aplicación web**, abre Environment y guarda:

```dotenv
DATABASE_URL=URL_INTERNA_COPIADA_DEL_SERVICIO_POSTGRESQL
PANEL_USER=tu_usuario
PANEL_PASSWORD=una_contrasena_aleatoria_de_al_menos_16_caracteres
```

Usa la URL interna exacta de Dokploy, sin publicarla en Git ni en capturas. Si construyes la URL manualmente, codifica los caracteres especiales de la contraseña. No añadas `NEXT_PUBLIC_` a estas variables. La aplicación y PostgreSQL deben compartir la red interna de Dokploy. No hace falta publicar el puerto de PostgreSQL.

Despliega la versión actualizada de la aplicación. Abre su dominio **HTTPS** e introduce el usuario y contraseña en el diálogo de acceso del navegador (autenticación HTTP Basic). El usuario no debe contener dos puntos. Para cambiar las credenciales, cambia las variables y vuelve a desplegar.

Al abrir el calendario por primera vez, el servidor crea las tablas `focus_panel` y `focus_media` dentro de la base de datos indicada. El usuario de conexión necesita permiso para crear tablas. No se necesita ejecutar SQL manualmente. La conexión se abre en ejecución, no durante la compilación.

`focus_panel` conserva publicaciones, campos de marca y plantillas heredadas como JSONB, junto con una versión para detectar escrituras simultáneas. Los cronogramas se generan desde esas publicaciones; las opciones temporales de exportación no se guardan como documentos independientes. `focus_media` conserva archivos binarios y sus metadatos, con máximo 100 MB por archivo. Para bibliotecas grandes conviene migrar los binarios a almacenamiento S3.

## Migrar el respaldo existente

1. Abre **Cronogramas → Respaldo de datos → Importar respaldo**.
2. Selecciona tu JSON completo que contiene publicaciones y archivos.
3. Revisa el recuento y confirma. Se añaden copias nuevas; no se reemplazan publicaciones existentes. No importes repetidamente el mismo respaldo.
4. Comprueba las publicaciones y abre un archivo de la biblioteca desde otro dispositivo.

Los datos locales previos no se borran ni se envían automáticamente. Una vez habilitada `DATABASE_URL`, un fallo del servidor bloquea el guardado y muestra un error; no cambia silenciosamente al almacenamiento local. Sin `DATABASE_URL` se conserva el modo local anterior.

Configura copias de PostgreSQL en **Backups** de Dokploy y comprueba que el servicio tenga almacenamiento persistente. El respaldo SQL debe incluir ambas tablas, pues los archivos también están en la base de datos. El respaldo JSON de la aplicación sigue disponible para bibliotecas de hasta 180 MB.

## Comprobación

La barra lateral indica **PostgreSQL conectado** después de cargar los datos. Si no conecta, revisa las variables, el estado de PostgreSQL y la red interna. Una respuesta 503 al entrar indica credenciales incompletas o contraseña inferior a 16 caracteres. Una modificación desde otro dispositivo produce un aviso de conflicto: conserva tus cambios y recarga antes de volver a guardar.
