import Link from "next/link";
import type { ReactNode } from "react";
import "@/app/legal.css";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <main className="legal-page">
    <header className="legal-header"><Link href="/login" className="legal-brand">FocusMRK <span>por TGX Labs</span></Link><Link href="/login">Iniciar sesión →</Link></header>
    <article className="legal-document"><p className="legal-eyebrow">TRANSPARENCIA Y CONFIANZA</p><h1>{title}</h1><p className="legal-intro">{intro}</p><p className="legal-date">Última actualización: 28 de septiembre de 2026</p>{children}</article>
    <footer className="legal-footer"><span>FocusMRK · TGX Labs</span><nav aria-label="Información legal"><Link href="/terminos">Términos de uso</Link><Link href="/privacidad">Política de privacidad</Link></nav></footer>
  </main>;
}

export function LegalContact() {
  const email = process.env.LEGAL_CONTACT_EMAIL || "jorge3231999@hotmail.com";
  return <p>Para consultas sobre el servicio, privacidad o eliminación de datos, {email ? <>escribe a TGX Labs en <a href={`mailto:${email}`}>{email}</a>.</> : <>contacta a TGX Labs a través del canal por el que recibiste tu acceso a FocusMRK. Si tu cuenta pertenece a una empresa, también puedes presentar la solicitud a su administrador para que la traslade a TGX Labs.</>} Indica la empresa y la cuenta relacionadas con tu solicitud; no envíes contraseñas ni tokens de acceso.</p>;
}
