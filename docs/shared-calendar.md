# Activar cuentas y colaboración

El calendario local funciona sin servicios externos. Las cuentas y los espacios compartidos necesitan un proyecto real de Supabase; esta integración no crea ni configura ese proyecto automáticamente.

1. Crea un proyecto Supabase y ejecuta una sola vez `supabase/migrations/20260910_shared_calendar.sql` en su editor SQL.
2. Activa autenticación por correo y contraseña y mantén la confirmación de correo. En Authentication → URL Configuration configura la URL pública de FocusMRK como Site URL y como URL de redirección permitida. Configura el envío de correo del servicio para producción.
3. Copia `.env.example` a `.env.local` para desarrollo. En Hostinger añade las mismas variables al entorno de **compilación y ejecución**:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública anon o publishable. Nunca uses service_role ni una clave secreta.
4. Vuelve a compilar y desplegar: Next.js incorpora estas variables públicas durante el build.
5. Abre «Cuenta y colaboración», crea tu cuenta, confirma el correo e inicia sesión. Crea un espacio por marca.
6. Para copiar el trabajo existente, abre un espacio vacío y pulsa «Importar calendario local». Conserva la copia original en el navegador; no se mezclan automáticamente calendarios.
7. Cada colaborador debe crear y confirmar su cuenta. El propietario puede darle acceso por correo como editor o cliente de solo lectura. No se envían invitaciones automáticas. El colaborador debe pulsar «Actualizar» y seleccionar el espacio compartido.

## Comportamiento y límites

- El selector distingue explícitamente el calendario local del compartido. Iniciar sesión no publica los datos locales ni los importa automáticamente.
- Publicaciones y plantillas se guardan juntas en un documento JSON por espacio. La base de datos comprueba la versión al guardar para evitar pérdida de cambios simultáneos. Esta primera versión limita cada espacio a aproximadamente 5 MB de contenido textual.
- Mientras el editor está cerrado se consultan novedades cada 15 segundos. Con el editor abierto se conserva el borrador; si otro editor cambió algo, el guardado se rechaza. Copia el texto pendiente, cierra el editor, pulsa «Actualizar», abre el post y vuelve a aplicar tus cambios.
- No hay guardado offline en espacios compartidos. Los fallos de conexión no se convierten en un guardado local silencioso.
- Los clientes pueden consultar contenido e imágenes. Aprobar, reprogramar o editar requiere permiso de editor. El propietario puede retirar permisos desde «Gestionar colaboradores».
- La seguridad se aplica en PostgreSQL: RLS limita lecturas a miembros y las funciones RPC controlan escritura, roles y versiones. El navegador no usa credenciales administrativas.
- Las imágenes se cargan desde URLs públicas directas, sin almacenar archivos en la base de datos. Los documentos de Canva/Drive se conservan como enlaces de referencia. Enlaces privados o páginas HTML pueden no mostrarse como imagen.
- El arrastre entre días está disponible en la vista mensual de escritorio; en móvil o con teclado se reprograma cambiando la fecha del editor.

## Verificar antes de usar con clientes

Prueba con dos cuentas confirmadas: un editor y un cliente. Comprueba lectura compartida, rechazo de escritura del cliente, conflicto entre dos editores y retirada de acceso. Verifica también que una cuenta ajena no vea el espacio. La activación en producción requiere las credenciales públicas y la migración anteriores; no se considera conectada solo por instalar el cliente JavaScript.

Referencias: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) y [funciones de base de datos](https://supabase.com/docs/guides/database/functions).
