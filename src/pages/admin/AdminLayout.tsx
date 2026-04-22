import { NavLink, Outlet } from "react-router-dom";
import { Shield, LayoutDashboard, Megaphone, Users, Tag, Image, Zap, Search } from "lucide-react";
import Navbar from "@/components/Navbar";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/ads", label: "Ads", icon: Megaphone },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/boost-packages", label: "Boost Packages", icon: Zap },
  { to: "/admin/search", label: "Search", icon: Search },
];

const AdminLayout = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container py-8 grid gap-6 md:grid-cols-[220px_1fr]">
      <aside>
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <Shield className="h-5 w-5 text-gold" />
          <span className="font-display font-bold">Admin Panel</span>
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

export default AdminLayout;
