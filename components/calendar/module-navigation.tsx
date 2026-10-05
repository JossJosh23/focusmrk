import { Bell, Building2, CalendarDays, CheckCircle2, Images, Presentation, Settings, ChartColumn, ChevronDown, Plug } from "lucide-react";

const modules = [
  { id: "day", label: "Mi día", icon: CheckCircle2 },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "library", label: "Biblioteca", icon: Images },
  { id: "schedule", label: "Cronogramas", icon: Presentation },
  { id: "content", label: "Informe de contenido", icon: ChartColumn },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "integrations", label: "Integraciones", icon: Plug },
  { id: "settings", label: "Respaldos", icon: Settings },
  { id: "notifications", label: "Notificaciones", icon: Bell },
] as const;

export type WorkspaceModule = typeof modules[number]["id"];

export function ModuleNavigation({ active, onChange, mobile = false }: {
  active: WorkspaceModule;
  onChange: (module: WorkspaceModule) => void;
  mobile?: boolean;
}) {
  const primary = modules.filter(({ id }) => ["day", "calendar", "library", "schedule", "content"].includes(id));
  const secondary = modules.filter(item => !primary.includes(item));
  const secondaryActive = secondary.find(item => item.id === active);
  function renderButton({ id, label, icon: Icon }: typeof modules[number]) {
    return <button key={id} type="button"
      className={active === id ? "nav-active" : "nav-item"}
      aria-current={active === id ? "page" : undefined}
      aria-pressed={active === id}
      onClick={event => { onChange(id); if (mobile) event.currentTarget.closest("details")?.removeAttribute("open"); }}>
      <Icon size="var(--icon-md)" aria-hidden="true" />{label}
    </button>;
  }
  return <nav className={mobile ? "mobile-module-nav" : "module-nav"} aria-label={mobile ? "Módulos móviles" : "Módulos"}>
    {primary.map(renderButton)}
    {mobile ? <details className="module-more"><summary className={secondaryActive ? "nav-active" : "nav-item"}>{secondaryActive?.label || "Más"}<ChevronDown size="var(--icon-sm)" /></summary><div className="module-more-menu">{secondary.map(renderButton)}</div></details> : <>
      <span className="module-section-label">Administración</span>{secondary.map(renderButton)}
    </>}
  </nav>;
}
