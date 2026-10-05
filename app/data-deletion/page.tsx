import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Eliminación de datos | Focus MRKT",
  description: "Cómo solicitar la eliminación de datos y desconectar las páginas de Facebook y cuentas de Instagram asociadas a Focus MRKT.",
  alternates: { canonical: "https://focusmrkt.tgxlabs.io/data-deletion" },
  robots: { index: true, follow: true },
};

export default function DataDeletionPage() {
  return <LegalPage title="Eliminación de datos" intro="Puedes solicitar la eliminación de los datos de Facebook e Instagram asociados a Focus MRKT sin iniciar sesión en la plataforma.">
    <section><h2>1. Envía tu solicitud</h2><LegalContact /><p>Usa el asunto «Solicitud de eliminación de datos — Focus MRKT». Incluye tu usuario o correo de contacto, la empresa relacionada y el nombre o identificador de la página de Facebook o cuenta de Instagram afectada. Indica si deseas eliminar solo la conexión con Meta, datos personales concretos o también contenido y reportes guardados en Focus MRKT.</p><p>No envíes contraseñas, App Secrets, códigos OAuth ni tokens. No necesitas conservar acceso a Facebook o a Focus MRKT para enviar la solicitud.</p></section>
    <section><h2>2. Verificación y seguimiento</h2><p>El responsable del servicio verificará tu identidad y tu autorización sobre los datos solicitados, especialmente si pertenecen a una empresa compartida. Si falta información, se solicitará únicamente la necesaria para identificar los registros. La respuesta y confirmación de la eliminación se enviarán por el mismo canal de contacto.</p><p>Si parte de la información debe conservarse por una obligación aplicable, se explicarán el alcance y el motivo. No se establece aquí un plazo de eliminación que el servicio no haya confirmado.</p></section>
    <section><h2>3. Datos asociados a Meta</h2><p>La solicitud puede incluir los tokens de acceso cifrados, los identificadores y nombres de páginas de Facebook y cuentas profesionales de Instagram, sus métricas guardadas y las autorizaciones pendientes asociadas a la empresa. Especifica también los reportes o contenidos almacenados por separado que deseas eliminar: desconectar una red no elimina automáticamente esos documentos.</p></section>
    <section><h2>4. Desconexión desde la plataforma</h2><p>Si tienes acceso a Focus MRKT, entra en Integraciones o Empresa, selecciona la empresa correspondiente y pulsa Desconectar Facebook o Desconectar Instagram según la conexión que quieras eliminar. Cada acción elimina únicamente la conexión local de esa red, sus tokens, los datos guardados con ella y las autorizaciones pendientes de esa empresa; no afecta a la otra red.</p><p>La desconexión local no revoca los permisos generales concedidos a Meta, ya que pueden servir a otras empresas conectadas. Para retirar también esa autorización, busca Focus MRKT en las aplicaciones o integraciones autorizadas de tu cuenta de Facebook o Instagram y elimina su acceso. Retirar permisos en Facebook no equivale a solicitar la eliminación de todos los datos ya guardados en Focus MRKT.</p></section>
    <section><h2>5. Alcance de la eliminación</h2><p>Eliminar datos en Focus MRKT no borra tu cuenta de Facebook o Instagram, publicaciones alojadas en esas redes ni archivos descargados o compartidos fuera de la plataforma. Las copias de respaldo pueden requerir su ciclo de renovación antes de desaparecer; los datos eliminados no deben reincorporarse a uso activo al restaurar una copia.</p><p>Consulta la <Link href="/privacy">Política de privacidad</Link> para conocer qué información utiliza el servicio y cómo se almacena.</p></section>
  </LegalPage>;
}
