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

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analítica", href: "/analytics", icon: BarChart3 },
      { label: "Empleo", href: "/empleo", icon: Briefcase, badge: "★" },
      { label: "Captación 90 d", href: "/captacion-90d", icon: Rocket },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Pipeline ventas", href: "/crm/ventas", icon: Users },
      { label: "Lead magnet", href: "/crm/lead-magnet", icon: Download },
      { label: "Inversores", href: "/crm/inversores", icon: Coins },
      { label: "Partners", href: "/crm/partners", icon: Handshake },
      { label: "Sesiones embudo", href: "/crm/sesiones", icon: Activity },
    ],
  },
  {
    label: "Comercial",
    items: [
      { label: "Calculadora", href: "/comercial/calculadora", icon: Calculator },
      { label: "Tarifas", href: "/comercial/tarifas", icon: Coins },
      { label: "Legal", href: "/comercial/legal", icon: ScrollText },
      { label: "Manual del Heredero", href: "/comercial/legal/manual-heredero", icon: BookOpen, badge: "Ejemplo" },
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
    label: "Contenido",
    items: [
      { label: "Marca personal", href: "/contenido/personal", icon: Sparkles },
      { label: "Marca empresa", href: "/contenido/empresa", icon: PenSquare, disabled: true, badge: "F4" },
    ],
  },
  {
    label: "Diferido",
    items: [
      { label: "Facturación Holded", href: "/facturacion", icon: FileText, disabled: true, badge: "Próximamente" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Ajustes", href: "/ajustes", icon: Settings },
    ],
  },
];
