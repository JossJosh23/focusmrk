import { LoginForm } from "@/components/login-form";
import { LoginParallax } from "@/components/login-parallax";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Bell, CalendarDays, ChartColumn, ChevronLeft, ChevronRight, FileText, Flag, Library, Lightbulb, Plus, Search, Users } from "lucide-react";
import "../tokens.css";
import "./login.css";

export const metadata = { title: "Iniciar sesión | Kromaiso" };

// Staggers entrance animations: each element waits --i steps of --login-stagger.
const step = (i: number) => ({ "--i": i }) as CSSProperties;

const features = [
  { icon: CalendarDays, title: "Calendario", text: "Todo tu contenido en un solo lugar." },
  { icon: Users, title: "Equipo", text: "Colabora y avanza más rápido." },
  { icon: ChartColumn, title: "Analytics", text: "Mide lo que realmente importa." },
];

const nav = [
  { icon: CalendarDays, label: "Calendario" },
  { icon: FileText, label: "Contenido" },
  { icon: ChartColumn, label: "Analytics" },
  { icon: Users, label: "Equipo" },
  { icon: Library, label: "Biblioteca" },
];

const days = [
  { day: "LUN", date: "19", time: "09:00", title: "Lanzamiento ebook", channel: "Reel", state: "Programado", kind: "scheduled" },
  { day: "MAR", date: "20", time: "11:30", title: "Carrusel: 5 tips de Instagram", channel: "", state: "En producción", kind: "production" },
  { day: "MIÉ", date: "21", time: "10:00", title: "Behind the scenes", channel: "TikTok", state: "Publicado", kind: "published" },
  { day: "JUE", date: "22", time: "12:00", title: "Guía de contenido", channel: "Instagram", state: "Programado", kind: "scheduled" },
  { day: "VIE", date: "23", time: "17:00", title: "Resumen semanal", channel: "Reel", state: "En producción", kind: "production" },
];

const bars = [30, 45, 38, 60, 52, 78, 100];

function Brand({ mobile = false }: { mobile?: boolean }) {
  return <Link href="/" className={`login-brand${mobile ? " login-brand-mobile" : ""}`} aria-label="Kromaiso, inicio"><Image unoptimized src={mobile ? "/brand/kromaiso-logo.svg" : "/brand/kromaiso-logo-dark.svg"} alt="" width={178} height={32} priority /></Link>;
}

export default function LoginPage() {
  return <main className="login-page">
    <LoginParallax className="login-story">
      <div className="login-sky" aria-hidden="true">
        <span className="login-stars login-stars-a" />
        <span className="login-stars login-stars-b" />
        <span className="login-planet" />
        <span className="login-orbit"><i /></span>
        <span className="login-orbit login-orbit-inner"><i /></span>
        <span className="login-meteor" />
        <span className="login-meteor login-meteor-late" />
      </div>
      <div className="login-rise" style={step(0)}><Brand /></div>
      <div className="login-story-copy">
        <p className="login-kicker login-rise" style={step(1)}>Tu compromiso con el contenido.</p>
        <h1 className="login-rise" style={step(2)}>Organiza tu contenido<br /><span>con claridad.</span></h1>
        <p className="login-support login-rise" style={step(3)}>Planifica, publica y colabora desde un solo espacio.</p>
      </div>
      <ul className="login-features">
        {features.map(({ icon: Icon, title, text }, i) => <li key={title} className="login-rise" style={step(4 + i)}>
          <span className="login-feature-icon"><Icon size="var(--icon-md)" aria-hidden="true" /></span>
          <span><b>{title}</b>{text}</span>
        </li>)}
      </ul>
      <div className="login-product-stage" aria-hidden="true">
        <div className="login-product">
          <aside className="product-sidebar">
            <Image unoptimized src="/brand/kromaiso-logo-dark.svg" alt="" width={110} height={20} />
            {nav.map(({ icon: Icon, label }, i) => <span key={label} className={i === 0 ? "is-active" : undefined}><Icon aria-hidden="true" />{label}</span>)}
          </aside>
          <div className="product-main">
            <div className="product-topbar"><Search aria-hidden="true" /><Bell aria-hidden="true" /><span className="product-avatar">Y</span></div>
            <div className="product-toolbar"><span>Calendario de contenido</span><span className="product-create"><Plus aria-hidden="true" />Crear contenido</span></div>
            <div className="product-period"><ChevronLeft aria-hidden="true" /><span>Octubre 2026</span><ChevronRight aria-hidden="true" /></div>
            <div className="product-week">{days.map((day, i) => <div className="product-day" key={day.day} style={step(10 + i)}>
              <div className="product-day-heading"><span>{day.day}</span><b>{day.date}</b></div>
              <div className={`product-piece product-piece-${day.kind}`}>
                <span className="product-piece-time">{day.time}</span>
                <p>{day.title}{day.channel && <small> · {day.channel}</small>}</p>
                <span className={`product-thumb product-thumb-${i + 1}`} />
                <span className="product-piece-state"><i />{day.state}</span>
              </div>
            </div>)}</div>
            <div className="product-stats">
              <div className="product-stat"><span>Rendimiento esta semana</span><div className="product-stat-row"><span className="product-bars">{bars.map((h, i) => <i key={i} style={{ ...step(i), height: `${h}%` }} />)}</span><b className="product-growth">+48%</b></div><small>vs. semana anterior</small></div>
              <div className="product-stat"><span><Flag aria-hidden="true" />Próximo hito</span><b>Lanzamiento de campaña</b><small>24 oct 2026</small></div>
              <div className="product-stat"><span><Lightbulb aria-hidden="true" />Ideas en revisión</span><b className="product-count">12</b><small>Listas para programar</small></div>
            </div>
          </div>
        </div>
      </div>
    </LoginParallax>
    <section className="login-access" aria-labelledby="login-title">
      <span className="login-blob login-blob-a" aria-hidden="true" />
      <span className="login-blob login-blob-b" aria-hidden="true" />
      <div className="login-panel login-rise" style={step(2)}>
        <Brand mobile />
        <h2 id="login-title">Bienvenido de nuevo</h2>
        <p className="login-intro">Inicia sesión para entrar a tu espacio de trabajo.</p>
        <LoginForm />
        <p className="login-help">¿Necesitas acceso? Contacta al administrador de tu equipo.</p>
      </div>
      <footer className="login-rise" style={step(8)}><span>© 2026 Kromaiso</span><nav aria-label="Información legal"><Link href="/terminos">Términos</Link><span aria-hidden="true">·</span><Link href="/privacidad">Privacidad</Link></nav></footer>
    </section>
  </main>;
}
