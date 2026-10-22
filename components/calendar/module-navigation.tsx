import { Bell, Building2, CalendarDays, CheckCircle2, Images, ChartGantt, DatabaseBackup, ChartColumn, ChevronDown, Plug } from "lucide-react";

const modules = [
  { id: "day", label: "Mi día", icon: CheckCircle2 },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "library", label: "Biblioteca", icon: Images },
  { id: "schedule", label: "Cronogramas", icon: ChartGantt },
  { id: "content", label: "Informe de contenido", icon: ChartColumn },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "integrations", label: "Integraciones", icon: Plug },
  { id: "settings", label: "Respaldos", icon: DatabaseBackup },
  { id: "notifications", label: "Notificaciones", icon: Bell },
] as const;

export type WorkspaceModule = typeof modules[number]["id"];

export function moduleLabel(id: WorkspaceModule) {
  return modules.find(item => item.id === id)?.label || "";
}

export function ModuleNavigation({ active, onChange, mobile = false, pending = 0, collapsed = false }: {
  active: WorkspaceModule;
  onChange: (module: WorkspaceModule) => void;
  mobile?: boolean;
  pending?: number;
  collapsed?: boolean;
}) {
  const primary = modules.filter(({ id }) => ["day", "calendar", "library", "schedule", "content"].includes(id));
  const secondary = modules.filter(item => !primary.includes(item));
  const secondaryActive = secondary.find(item => item.id === active);
  function renderButton({ id, label, icon: Icon }: typeof modules[number]) {
    const count = id === "day" ? pending : 0;
    return <button key={id} type="button"
      className={active === id ? "nav-active" : "nav-item"}
      aria-label={`${label}${count ? `: ${count} pendientes` : ""}`}
      title={collapsed ? `${label}${count ? ` · ${count} pendientes` : ""}` : undefined}
      aria-current={active === id ? "page" : undefined}
      aria-pressed={active === id}
      onClick={event => { onChange(id); if (mobile) event.currentTarget.closest("details")?.removeAttribute("open"); }}>
      <Icon size="var(--shell-nav-icon)" aria-hidden="true" /><span className="nav-label">{label}</span>
      {count > 0 && <span className="nav-count" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
    </button>;
  }
  return <nav className={mobile ? "mobile-module-nav" : "module-nav"} aria-label={mobile ? "Módulos móviles" : "Módulos"}>
    {mobile ? primary.map(renderButton) : <>
      <div className="nav-group">{primary.filter(item => item.id !== "content").map(renderButton)}</div>
      <div className="nav-group"><span className="module-section-label">ANÁLISIS</span>{primary.filter(item => item.id === "content").map(renderButton)}</div>
    </>}
    {mobile ? <details className="module-more"><summary className={secondaryActive ? "nav-active" : "nav-item"}>{secondaryActive?.label || "Más"}<ChevronDown size="var(--icon-sm)" /></summary><div className="module-more-menu">{secondary.map(renderButton)}</div></details> : <div className="nav-group">
      <span className="module-section-label">ADMINISTRACIÓN</span>{secondary.map(renderButton)}
    </div>}
  </nav>;
}
