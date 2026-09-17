import { Bell, Building2, CalendarDays, CheckCircle2, Images, Presentation } from "lucide-react";

const modules = [
  { id: "day", label: "Mi día", icon: CheckCircle2 },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "library", label: "Biblioteca", icon: Images },
  { id: "schedule", label: "Cronogramas", icon: Presentation },
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "notifications", label: "Notificaciones", icon: Bell },
] as const;

export type WorkspaceModule = typeof modules[number]["id"];

export function ModuleNavigation({ active, onChange, mobile = false }: {
  active: WorkspaceModule;
  onChange: (module: WorkspaceModule) => void;
  mobile?: boolean;
}) {
  return <nav className={mobile ? "mobile-module-nav" : "module-nav"} aria-label={mobile ? "Módulos móviles" : "Módulos"}>
    {modules.map(({ id, label, icon: Icon }) => <button key={id} type="button"
      className={active === id ? "nav-active" : "nav-item"}
      aria-current={active === id ? "page" : undefined}
      aria-pressed={active === id}
      onClick={() => onChange(id)}>
      <Icon size="var(--icon-md)" aria-hidden="true" />{label}
    </button>)}
  </nav>;
}
