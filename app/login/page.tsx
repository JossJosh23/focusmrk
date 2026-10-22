import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";
import "../tokens.css";
import "./login.css";

export const metadata = { title: "Iniciar sesión | Kromaiso" };

const days = [
  { day: "LUN", date: "19", pieces: [{ title: "Lanzamiento otoño · Reel", state: "Programado", kind: "scheduled", time: "09:00" }, { title: "Newsletter #12", state: "Idea", kind: "idea", time: "16:00" }] },
  { day: "MAR", date: "20", pieces: [{ title: "Carrusel: 5 tips · IG", state: "En producción", kind: "production", time: "11:30" }] },
  { day: "MIÉ", date: "21", pieces: [{ title: "Behind the scenes · TikTok", state: "Publicado", kind: "published", time: "10:00" }] },
  { day: "JUE", date: "22", pieces: [{ title: "Guía de contenido · IG", state: "Programado", kind: "scheduled", time: "12:00" }] },
  { day: "VIE", date: "23", pieces: [{ title: "Resumen semanal · Reel", state: "En producción", kind: "production", time: "17:00" }] },
];

function Brand({ mobile = false }: { mobile?: boolean }) {
  return <Link href="/" className={`login-brand${mobile ? " login-brand-mobile" : ""}`} aria-label="Kromaiso, inicio"><Image unoptimized src={mobile ? "/brand/kromaiso-logo.svg" : "/brand/kromaiso-logo-dark.svg"} alt="" width={178} height={32} priority /></Link>;
}

export default function LoginPage() {
  return <main className="login-page">
    <section className="login-story" aria-label="Kromaiso">
      <Brand />
      <div className="login-story-copy">
        <p className="login-kicker">Tu compromiso con el contenido.</p>
        <h1>El espacio donde<br />tus ideas toman forma.</h1>
        <p className="login-support">Organiza tus marcas, planifica tu contenido y encuentra tu próximo paso.</p>
      </div>
      <Image unoptimized className="login-watermark" src="/brand/kromaiso-icon.svg" alt="" width={577} height={600} aria-hidden="true" />
      <div className="login-product" aria-hidden="true">
        <div className="product-toolbar"><span>Calendario de contenido</span><span className="product-view">Semana</span></div>
        <div className="product-period"><span>Octubre 2026</span><span>19 — 23 oct</span></div>
        <div className="product-week">{days.map(day => <div className="product-day" key={day.day}><div className="product-day-heading"><span>{day.day}</span><span>{day.date}</span></div>{day.pieces.map(piece => <div className={`product-piece product-piece-${piece.kind}`} key={piece.title}><span className="product-piece-time">{piece.time}</span><p>{piece.title}</p><span className="product-piece-state"><i />{piece.state}</span></div>)}</div>)}</div>
      </div>
    </section>
    <section className="login-access" aria-labelledby="login-title">
      <div className="login-form-wrap">
        <Brand mobile />
        <h2 id="login-title">Bienvenido de nuevo</h2>
        <p className="login-intro">Inicia sesión para entrar a tu espacio de trabajo.</p>
        <LoginForm />
        <p className="login-help">¿Necesitas acceso?<br />Contacta al administrador de tu equipo.</p>
      </div>
      <footer><span>© 2026 Kromaiso</span><nav aria-label="Información legal"><Link href="/terminos">Términos</Link><span aria-hidden="true">·</span><Link href="/privacidad">Privacidad</Link></nav></footer>
    </section>
  </main>;
}
