# Conexión de Instagram y Facebook

En Dokploy, en el servicio de Focus, configurar:

```env
META_APP_ID=1125078953647694
META_APP_SECRET=<secreto de la app de Meta>
META_REDIRECT_URI=https://focusmrkt.tgxlabs.io/api/meta/callback
META_GRAPH_VERSION=<versión compatible mostrada en el panel de Meta, formato vXX.0>
```

No usar NEXT_PUBLIC. Se requieren DATABASE_URL y la autenticación del panel. Opcionalmente configurar META_TOKEN_KEY como clave independiente antes de conectar; cambiar la clave utilizada requiere reconectar las cuentas. Los tokens se cifran con AES-256-GCM y se vinculan a la empresa.

Esta implementación usa Facebook Login para consultar páginas y la cuenta profesional de Instagram vinculada. No usa Instagram Login directo. En Meta configurar Facebook Login y registrar la URL de retorno exacta indicada arriba. Autorizar los permisos pages_show_list, pages_read_engagement e instagram_basic. En desarrollo, probar con un usuario con rol en la app y acceso a la página. El acceso a cuentas externas requiere los requisitos de acceso y revisión que indique Meta para la app.

Después de desplegar, abrir Empresa, elegir el cliente y pulsar Conectar Instagram y Facebook. Autorizar solamente las páginas correspondientes. Al regresar, pulsar Actualizar métricas y seleccionar la página del cliente. La conexión guarda las páginas autorizadas para esa empresa y permite elegir cuál mostrar. Se consultan seguidores y me gusta de Facebook, y seguidores y cantidad de publicaciones de Instagram. No hay informes mensuales, insights por publicación, publicación de contenido ni actualización automática. Un campo que Meta no devuelva se muestra como Sin datos.

La autorización vence según la vigencia del token de usuario de Meta; entonces se requiere reconectar. Desconectar elimina la conexión y sus autorizaciones pendientes en Focus; no revoca permisos globales de Meta, ya que pueden servir a otras empresas conectadas. Para revocar globalmente usar las integraciones comerciales de Facebook.

OAuth usa estado de un solo uso, vinculado a la sesión, con caducidad de diez minutos. Cada consulta verifica el acceso a la empresa. No se devuelven tokens al navegador.

Documentación: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/
