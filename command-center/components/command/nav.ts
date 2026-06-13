import {
  Bot,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Radar,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/mentors", label: "Mentors", icon: Users },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/autonomous", label: "Autonomous", icon: Sparkles },
  { href: "/opportunities", label: "Opportunities", icon: Radar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/academy", label: "Academy", icon: GraduationCap },
] as const;

export const SECONDARY = [{ href: "/settings", label: "Settings", icon: Compass }] as const;
