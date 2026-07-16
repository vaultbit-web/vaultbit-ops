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
  Megaphone,
  Mail,
  Sparkles,
  PenSquare,
  FileText,
  Settings,
  Rocket,
  BookOpen,
  Briefcase,
  Radar,
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

// Navegación organizada por NEGOCIO de Daniel Brosed (no por función), tal como
// los presenta danielbrosed.com. No crea rutas nuevas: reagrupa las existentes.
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
    label: "VaultAudit",
    items: [
      { label: "Prospección", href: "/prospectos", icon: Radar, badge: "★" },
    ],
  },
  {
    label: "Marca personal",
    items: [
      { label: "Contenido", href: "/contenido/personal", icon: Sparkles },
      { label: "Empleo", href: "/empleo", icon: Briefcase, badge: "★" },
      { label: "Marca empresa", href: "/contenido/empresa", icon: PenSquare, disabled: true, badge: "F4" },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      { label: "Ads Meta", href: "/crecimiento/ads", icon: Megaphone, disabled: true, badge: "F2" },
      { label: "Email automation", href: "/crecimiento/email", icon: Mail, disabled: true, badge: "F3" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Ajustes", href: "/ajustes", icon: Settings },
      { label: "Facturación Holded", href: "/facturacion", icon: FileText, disabled: true, badge: "Próximamente" },
    ],
  },
];
