import { NavLink, Outlet } from "react-router-dom";
import { Shield, LayoutDashboard, Megaphone, Users, Tag, Image, Zap, Search, ShieldCheck, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useT } from "@/lib/i18n";

const AdminLayout = () => {
  const { t } = useT();
  const items = [
    { to: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/admin/moderation", label: t("admin.moderation") || "Moderation", icon: ShieldAlert },
    { to: "/admin/ads", label: t("admin.ads"), icon: Megaphone },
    { to: "/admin/users", label: t("admin.users"), icon: Users },
    { to: "/admin/categories", label: t("admin.categories"), icon: Tag },
    { to: "/admin/banners", label: t("admin.banners"), icon: Image },
    { to: "/admin/boost-packages", label: t("admin.boost"), icon: Zap },
    { to: "/admin/search", label: t("admin.search"), icon: Search },
    { to: "/admin/escrow", label: t("admin.escrow"), icon: ShieldCheck },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside>
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <Shield className="h-5 w-5 text-gold" />
            <span className="font-display font-bold">{t("admin.panel")}</span>
          </div>
          <nav className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
