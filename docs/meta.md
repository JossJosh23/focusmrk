# Conexión de Instagram y Facebook

En Dokploy, en el servicio de Focus, configurar:

```env
META_APP_ID=<identificador de tu app de Meta>
META_APP_SECRET=<secreto de la app de Meta>
META_REDIRECT_URI=https://focusmrkt.tgxlabs.io/api/meta/callback
META_GRAPH_VERSION=<versión compatible mostrada en el panel de Meta, formato vXX.0>
```

No usar NEXT_PUBLIC. Se requieren DATABASE_URL y la autenticación del panel. Opcionalmente configurar META_TOKEN_KEY como clave independiente antes de conectar; cambiar la clave utilizada requiere reconectar las cuentas. Los tokens se cifran con AES-256-GCM y se vinculan a la empresa.

Esta implementación usa Facebook Login para consultar páginas y la cuenta profesional de Instagram vinculada. No usa Instagram Login directo. En Meta configurar Facebook Login y registrar la URL de retorno exacta indicada arriba. Autorizar los permisos pages_show_list, pages_read_engagement e instagram_basic. En desarrollo, probar con un usuario con rol en la app y acceso a la página. El acceso a cuentas externas requiere los requisitos de acceso y revisión que indique Meta para la app.

Después de desplegar, abrir Empresa, elegir el cliente y pulsar Conectar Instagram y Facebook. Autorizar solamente las páginas correspondientes. Al regresar, pulsar Consultar cuentas y seleccionar la página del cliente. La conexión guarda las páginas autorizadas para esa empresa y permite elegir cuál mostrar. Se consultan seguidores y me gusta de Facebook, y seguidores y cantidad de publicaciones de Instagram. No hay informes mensuales, insights por publicación, publicación de contenido ni actualización automática. Un campo que Meta no devuelva se muestra como Sin datos.

La autorización vence según la vigencia del token de usuario de Meta; entonces se requiere reconectar. Desconectar elimina la conexión y sus autorizaciones pendientes en Focus; no revoca permisos globales de Meta, ya que pueden servir a otras empresas conectadas. Para revocar globalmente usar las integraciones comerciales de Facebook.

OAuth usa estado de un solo uso, vinculado a la sesión, con caducidad de diez minutos. Cada consulta verifica el acceso a la empresa. No se devuelven tokens al navegador.

Documentación: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/

## Autenticación y rutas reales

Focus MRKT usa autenticación propia, no NextAuth/Auth.js, Supabase Auth, Clerk, Firebase ni Passport. El administrador entra con `PANEL_USER` y `PANEL_PASSWORD`; los gestores tienen contraseñas con hash scrypt y sesiones en PostgreSQL. La cookie `focusmrk_session` es HttpOnly, SameSite=Lax y Secure en producción. Facebook Login autoriza redes de una empresa después de entrar al panel; no crea usuarios ni inicia una sesión de Focus.

- `app/login/page.tsx` y `components/login-form.tsx`: pantalla de acceso por credenciales.
- `app/api/auth/route.ts`: inicio y cierre de sesión (`/api/auth`).
- `lib/panel-auth.ts`, `lib/account-access.ts` y `proxy.ts`: sesiones y permisos existentes.
- `components/calendar/company-module.tsx` y `components/calendar/meta-connection.tsx`: botón Conectar Instagram y Facebook; envía `action: "connect"` a `/api/meta?company=...` y navega a la URL devuelta por el servidor.
- `app/api/meta/route.ts`: inicia OAuth con `client_id`, `redirect_uri`, permisos y estado vinculado a la sesión y empresa.
- `app/api/meta/callback/route.ts`: recibe el código en `/api/meta/callback` y guarda la conexión cifrada.
- `lib/meta.ts`: valida variables, intercambia el código y consulta Graph API; reutiliza las comprobaciones de sesión y empresa de `lib/tiktok.ts`.

La URI exacta de producción para **URI de redireccionamiento de OAuth válidos** es:

```text
https://focusmrkt.tgxlabs.io/api/meta/callback
```

Debe coincidir con `META_REDIRECT_URI`, sin barra final, parámetros ni fragmento. La misma variable se usa tanto en el diálogo de autorización como en el intercambio del código. `/api/auth/callback/facebook` no existe en este proyecto. No configures variables `AUTH_FACEBOOK_*` o `FACEBOOK_CLIENT_*`: esta implementación no las lee.

## Configuración en Meta Developers

1. Abre la app de Meta que usarás y copia su App ID y App Secret a `META_APP_ID` y `META_APP_SECRET` en Dokploy. Ambos deben pertenecer a la misma app; no uses el ID de una página o de Instagram.
2. En la configuración básica, establece el dominio `focusmrkt.tgxlabs.io`. Si configuras la plataforma Sitio web, usa `https://focusmrkt.tgxlabs.io/`. Comprueba las páginas públicas `https://focusmrkt.tgxlabs.io/privacidad` y `https://focusmrkt.tgxlabs.io/terminos` antes de registrarlas. Completa también los requisitos de eliminación de datos que te solicite Meta; el código actual no incluye un callback de eliminación de datos.
3. En el producto o caso de uso de Facebook Login, abre la configuración OAuth. Activa Client OAuth Login y Web OAuth Login cuando estén disponibles y registra la URI exacta indicada arriba en **URI de redireccionamiento de OAuth válidos**. Los nombres y la ubicación de los controles pueden variar según la app.
4. Configura el acceso a `pages_show_list`, `pages_read_engagement` e `instagram_basic`, que son los permisos solicitados por el código. La cuenta profesional de Instagram debe estar vinculada a una página que el usuario pueda autorizar.
5. Selecciona una versión compatible de Graph API de tu app y guárdala en `META_GRAPH_VERSION` con formato `vXX.0`, sustituyendo XX por el número real. No se fija una versión de producción a partir de las versiones ficticias de las pruebas.
6. Guarda las variables del servicio web de Dokploy y vuelve a desplegar. Conserva `DATABASE_URL`, `PANEL_USER` y `PANEL_PASSWORD` actuales. `META_TOKEN_KEY` es opcional; no cambies la clave de cifrado de conexiones existentes sin preparar su reconexión.
7. Para probar en desarrollo, usa una cuenta con rol en la app y acceso a la página. Entra primero a Focus, abre Empresa y pulsa Conectar Instagram y Facebook. Acepta los permisos y al menos una página. Al volver, pulsa Consultar cuentas. Abrir el callback directamente sin estado OAuth y sesión válidos debe fallar.
8. Para permitir cuentas externas, completa los requisitos de revisión, acceso avanzado, verificación y publicación que el panel de Meta indique para esos permisos y tu app.

Registrar esta URI no convierte Facebook en un método de acceso al panel. Las pruebas locales validan el flujo con respuestas simuladas; la configuración real de Meta y Dokploy debe verificarse con una autorización de producción.
