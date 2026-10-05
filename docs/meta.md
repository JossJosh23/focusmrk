# Facebook e Instagram independientes

Focus MRKT utiliza autenticación propia. Las autorizaciones sociales requieren una sesión de Focus y acceso a la empresa; no crean usuarios ni sustituyen el login del panel.

## Facebook

Se conserva el flujo existente: Facebook Login, Graph API en graph.facebook.com, /me/accounts, selección de Página y Page Access Token. El callback no cambia:

https://focusmrkt.tgxlabs.io/api/meta/callback

Variables privadas en Dokploy:

```env
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://focusmrkt.tgxlabs.io/api/meta/callback
META_GRAPH_VERSION=
META_TOKEN_KEY=
```

META_TOKEN_KEY es opcional. Conserva la clave y las credenciales usadas para cifrar las conexiones actuales. No cambies el App Secret sin preparar la reconexión si es la clave efectiva.

Los permisos solicitados son pages_show_list y pages_read_engagement. Ya no se solicita instagram_basic, no se descubre instagram_business_account y no se consulta Instagram con tokens de Página. Los permisos de Instagram concedidos previamente a la app no se revocan globalmente: si se desea retirarlos, el usuario debe hacerlo en Meta y reconectar Facebook.

Se mantienen las métricas existentes de seguidores y me gusta por Página. Este cambio no añade consultas de publicaciones, insights ni publicación automática; requerirían sus endpoints y permisos correspondientes.

## Instagram directo

Producto: Instagram API with Instagram Login / Business Login for Instagram. Cuenta profesional Business o Creator; no requiere una Página de Facebook. No se utiliza Instagram Basic Display ni el flujo de Instagram con Facebook Login.

```env
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=https://focusmrkt.tgxlabs.io/api/instagram/callback
INSTAGRAM_GRAPH_VERSION=
INSTAGRAM_TOKEN_KEY=
```

Obtén Instagram App ID y Instagram App Secret del producto Instagram configurado en Meta Developers. No asumas que son las credenciales de Facebook. Cada versión debe ser compatible con su producto y usar el formato vXX.0 con un número real. INSTAGRAM_TOKEN_KEY es opcional y, si no se configura, se usa INSTAGRAM_APP_SECRET con derivación específica para Instagram. Cambiar la clave requiere reconectar.

Configura la URI exacta de retorno en el producto Instagram. En desarrollo, añade y acepta los roles de prueba que indique el panel. Para cuentas externas, completa App Review, acceso avanzado y los requisitos de verificación que Meta exija. Registra también /privacy, /terms y /data-deletion como URLs legales (esta última es una URL de instrucciones, no un callback automático de eliminación).

El único permiso solicitado es instagram_business_basic. Esta entrega conecta y consulta el identificador y username; no añade publicación, mensajes, comentarios ni informes de insights. Esas funciones requieren permisos adicionales aprobados y sus propias implementaciones. Las cuentas personales no están admitidas y este producto tiene limitaciones para anuncios y etiquetado.

Flujo implementado:

El botón Conectar/Reconectar Instagram llama a POST /api/instagram/connect?company=... con la sesión actual y X-FocusMRK-Request: 1. Ese endpoint reutiliza el flujo existente de /api/instagram; las acciones de consulta, actualización y desconexión permanecen en /api/instagram. No se crea otro esquema ni otro almacenamiento de OAuth.

1. OAuth en https://www.instagram.com/oauth/authorize, desactivando el acceso alternativo con Facebook.
2. Intercambio del código mediante POST a https://api.instagram.com/oauth/access_token.
3. Intercambio del token propio de Instagram mediante ig_exchange_token en https://graph.instagram.com/access_token.
4. Consulta del perfil en graph.instagram.com con el token de Instagram; se valida la identidad antes de guardar la conexión.
5. Renovación mediante ig_refresh_token al actualizar la cuenta cuando quedan como máximo siete días y el token tiene al menos 24 horas. Un token vencido requiere reconexión. No existe un cron de renovación: una cuenta sin actividad puede vencer.

No copies tokens en variables públicas ni en comandos, capturas o logs. El servidor solo devuelve una URL de autorización sin secretos y datos expresamente permitidos de la conexión. Los mensajes de error no incluyen respuestas completas de los proveedores.

## Base de datos y compatibilidad

Las tablas existentes focus_meta_connections y focus_meta_states se conservan exclusivamente para Facebook; no se renombran ni se eliminan. Se añaden provider (facebook), external_id (Página seleccionada), permissions, expires_at, connected_at y status a focus_meta_connections. Los tokens siguen cifrados con el formato y la clave existentes.

En la primera consulta configurada de una conexión antigua se completa expires_at desde el token cifrado, se conserva el Page Access Token y se retiran los antiguos campos de Instagram del token y snapshot. Las autorizaciones antiguas de Instagram no se copian a la nueva integración. connected_at y permissions antiguos permanecen nulos cuando no se conocen; se completan con una nueva autorización, sin inventar una fecha ni permisos históricos.

Instagram utiliza tablas nuevas focus_instagram_connections y focus_instagram_states. La conexión guarda company (clave primaria), tokens cifrados, external_id, permissions, expires_at, connected_at, status, snapshot y updated_at. Cada empresa admite una cuenta directa de Instagram. Facebook conserva todas las Páginas autorizadas en el sobre cifrado y external_id identifica la seleccionada.

El esquema se amplía automáticamente en el servidor al acceder a cada integración. El rol PostgreSQL debe poder crear y alterar estas tablas. Haz un respaldo antes del despliegue y conserva las claves actuales. Estas modificaciones no se han aplicado a la base de producción desde el entorno de desarrollo.

Los estados OAuth duran diez minutos, son de un solo uso y se vinculan a sesión y empresa. Todas las operaciones verifican los permisos multiempresa actuales. Los bloqueos por empresa son independientes para Facebook e Instagram. Desconectar elimina solamente la fila, snapshot y estados de esa empresa y proveedor; no revoca autorizaciones globales que otras conexiones puedan utilizar.

Los estados públicos son disconnected, connected y expired según la presencia de conexión y vigencia guardada. Una revocación externa se detecta cuando se consulta al proveedor; el estado almacenado no es una monitorización continua de Meta.

## Interfaz y comprobación

Abre Integraciones en el menú (/?module=integrations) y selecciona la empresa. Facebook e Instagram tienen estados y botones Conectar, Reconectar y Desconectar independientes. Se conserva también el acceso desde Empresa y la integración de TikTok.

Las conexiones existentes de Facebook deben continuar sin reautorizar si su clave y token siguen vigentes. Instagram necesita una autorización directa nueva, incluso si anteriormente figuraba vinculada a una Página de Facebook.

Ejecuta npm run check, npm test y npm run build. Las pruebas utilizan Graph API simulada y PostgreSQL embebido: verifican preservación de conexiones antiguas, aislamiento de empresas, callbacks, renovación, cifrado y ausencia de tokens en respuestas. Después de configurar Meta y Dokploy, redespliega y prueba ambas autorizaciones reales por separado.

Referencias oficiales:

- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/
- https://developers.facebook.com/docs/instagram-platform/reference/access_token/
- https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/
- https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login
