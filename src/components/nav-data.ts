import {
  LayoutDashboard,
  BarChart3,
  Users,
  Download,
  Coins,
  Handshake,
  Activity,
  Calculator,
  ScrollText,
  Sparkles,
  Settings,
  Rocket,
  BookOpen,
  Briefcase,
  Radar,
  Linkedin,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Navegación por NEGOCIO REAL de Daniel Brosed. Las auditorías de seguridad, los
// smart contracts y la prospección se hacen desde la MARCA PERSONAL (danielbrosed.com),
// no como un negocio "VaultAudit" aparte. Solo se listan funcionalidades en uso.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analítica", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Vaultbit Advisory",
    items: [
      { label: "Pipeline ventas", href: "/crm/ventas", icon: Users },
      { label: "Partners", href: "/crm/partners", icon: Handshake },
      { label: "Lead magnet", href: "/crm/lead-magnet", icon: Download },
      { label: "Inversores", href: "/crm/inversores", icon: Coins },
      { label: "Sesiones embudo", href: "/crm/sesiones", icon: Activity },
      { label: "Calculadora", href: "/comercial/calculadora", icon: Calculator },
      { label: "Tarifas", href: "/comercial/tarifas", icon: Coins },
      { label: "Legal", href: "/comercial/legal", icon: ScrollText },
      { label: "Manual del Heredero", href: "/comercial/legal/manual-heredero", icon: BookOpen, badge: "Ejemplo" },
      { label: "Captación 90 d", href: "/captacion-90d", icon: Rocket },
    ],
  },
  {
    // Marca personal de Daniel: dev + auditor de seguridad (auditorías, smart
    // contracts, prospección de clientes de auditoría).
    label: "danielbrosed.com",
    items: [
      { label: "Prospección", href: "/prospectos", icon: Radar, badge: "★" },
      { label: "Contactos LinkedIn", href: "/crm/linkedin-contactos", icon: Linkedin, badge: "★" },
      { label: "Contenido", href: "/contenido/personal", icon: Sparkles },
      { label: "Empleo", href: "/empleo", icon: Briefcase, badge: "★" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Ajustes", href: "/ajustes", icon: Settings },
    ],
  },
];
