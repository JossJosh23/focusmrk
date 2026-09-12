import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import "./login.css";

export const metadata = { title: "Iniciar sesión | FocusMRK" };

export default function LoginPage() {
  return <main className="login-page">
    <section className="login-story" aria-label="FocusMRK">
      <Link className="login-brand" href="/"><span>f.</span>focus<b>mrk</b></Link>
      <div className="login-story-copy"><span className="login-kicker">MENOS CAOS. MÁS FOCO.</span><h1>Tus ideas merecen<br />un buen <em>plan.</em></h1><p>Organiza tu contenido, da espacio a tu creatividad y construye lo que viene.</p>
      <div className="login-preview" aria-hidden="true"><div className="preview-heading"><span>Tu próxima gran semana</span><span>✦</span></div><div className="preview-days">{["L", "M", "M", "J", "V"].map((day, i) => <span key={i}>{day}</span>)}</div><div className="preview-grid">{Array.from({ length: 15 }, (_, i) => <span key={i} className={[1, 7, 9, 10].includes(i) ? "filled" : ""}>{i === 1 ? "Nueva idea" : i === 7 ? "Crear" : i === 9 ? "Publicar ✓" : i === 10 ? "Inspiración" : ""}</span>)}</div><div className="preview-note"><span>●</span> Un lugar para todas tus ideas.</div></div></div>
      <p className="login-story-footer">Tu contenido, con intención.</p>
    </section>
    <section className="login-access"><div className="login-form-wrap"><span className="login-kicker">TU ESPACIO CREATIVO</span><h2>Qué bueno verte.</h2><p className="login-intro">Entra y sigue dando forma a tus ideas.</p><LoginForm /><p className="login-help">Acceso privado · Usa tus credenciales de FocusMRK.</p></div><footer>FocusMRK · Planifica. Crea. Conecta.</footer></section>
  </main>;
}
