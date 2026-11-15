import {
  BarChart3,
  FileSpreadsheet,
  History,
  Home,
  Inbox,
  ListChecks,
  MapPin,
  Megaphone,
  Scale,
  Settings,
  Trash2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Sidebar navigation. `permission` is the key that will gate each item once roles exist;
 * the backend enforces the same keys, hiding a link is never the only check.
 */
export type NavItem = {
  title: string;
  to:
    | "/"
    | "/regions"
    | "/advertisers"
    | "/lists"
    | "/campaigns"
    | "/list-requests"
    | "/compare"
    | "/reports"
    | "/import"
    | "/users"
    | "/activity"
    | "/trash"
    | "/settings";
  icon: LucideIcon;
  permission: string;
};

export const mainNav: NavItem[] = [
  { title: "الرئيسية", to: "/", icon: Home, permission: "dashboard.view" },
  { title: "مناطق المملكة", to: "/regions", icon: MapPin, permission: "advertisers.view" },
  { title: "جميع المعلنين", to: "/advertisers", icon: Users, permission: "advertisers.view" },
  { title: "قوائمي", to: "/lists", icon: ListChecks, permission: "lists.own" },
  { title: "الحملات", to: "/campaigns", icon: Megaphone, permission: "campaigns.view" },
  { title: "طلبات القوائم", to: "/list-requests", icon: Inbox, permission: "lists.review" },
  { title: "المقارنة بين المعلنين", to: "/compare", icon: Scale, permission: "advertisers.view" },
  { title: "التقارير والإحصائيات", to: "/reports", icon: BarChart3, permission: "reports.view" },
];

export const adminNav: NavItem[] = [
  { title: "استيراد Excel", to: "/import", icon: FileSpreadsheet, permission: "advertisers.import" },
  { title: "المستخدمون", to: "/users", icon: UserCog, permission: "users.manage" },
  { title: "سجل النشاطات", to: "/activity", icon: History, permission: "audit.view" },
  { title: "سلة المحذوفات", to: "/trash", icon: Trash2, permission: "trash.manage" },
  { title: "الإعدادات", to: "/settings", icon: Settings, permission: "settings.manage" },
];

export const allNav = [...mainNav, ...adminNav];
