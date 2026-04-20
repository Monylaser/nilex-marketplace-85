import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Megaphone, Users, Tag, Zap } from "lucide-react";

const AdminDashboard = () => {
  const [s, setS] = useState({ ads: 0, pending: 0, users: 0, categories: 0, boosts: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("ads").select("*", { count: "exact", head: true }),
      supabase.from("ads").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("boost_packages").select("*", { count: "exact", head: true }),
    ]).then(([a, p, u, c, b]) => {
      setS({ ads: a.count || 0, pending: p.count || 0, users: u.count || 0, categories: c.count || 0, boosts: b.count || 0 });
    });
  }, []);

  const stats = [
    { label: "Total Ads", value: s.ads, icon: Megaphone },
    { label: "Pending Ads", value: s.pending, icon: Megaphone },
    { label: "Users", value: s.users, icon: Users },
    { label: "Categories", value: s.categories, icon: Tag },
    { label: "Boost Packages", value: s.boosts, icon: Zap },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
