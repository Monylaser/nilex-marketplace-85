import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Loader2, Sparkles } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  price: number;
  governorate: string;
  city: string | null;
  views: number;
  is_boosted: boolean;
  images_json: any;
  created_at: string;
  categories?: { name: string; slug: string } | null;
}

const Browse = () => {
  const [params, setParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const cat = params.get("category") || "all";
  const gov = params.get("governorate") || "all";

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order"),
      supabase.from("governorates").select("id,name").order("name"),
    ]).then(([c, g]) => {
      setCategories(c.data || []);
      setGovernorates(g.data || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("ads")
      .select("id,title,price,governorate,city,views,is_boosted,images_json,created_at,categories(name,slug)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (q) query = query.ilike("title", `%${q}%`);
    if (cat !== "all") {
      const c = categories.find((x) => x.slug === cat);
      if (c) query = query.eq("category_id", c.id);
    }
    if (gov !== "all") query = query.eq("governorate", gov);

    query.then(({ data }) => {
      setAds((data as any) || []);
      setLoading(false);
    });
  }, [q, cat, gov, categories]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold">Browse Ads</h1>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input
            placeholder="Search ads…"
            defaultValue={q}
            onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
          />
          <Select value={cat} onValueChange={(v) => update("category", v)}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gov} onValueChange={(v) => update("governorate", v)}>
            <SelectTrigger><SelectValue placeholder="Governorate" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Egypt</SelectItem>
              {governorates.map((g) => (
                <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ads.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No ads found. Try different filters.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ads.map((ad) => {
              const img = Array.isArray(ad.images_json) && ad.images_json[0];
              return (
                <Link key={ad.id} to={`/ad/${ad.id}`}>
                  <Card className="overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5 h-full">
                    <div className="relative aspect-video bg-muted">
                      {img ? (
                        <img src={img} alt={ad.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                      {ad.is_boosted && (
                        <Badge className="absolute left-2 top-2 gap-1 bg-gold text-accent-foreground">
                          <Sparkles className="h-3 w-3" /> Boosted
                        </Badge>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h3 className="font-medium line-clamp-2 text-sm">{ad.title}</h3>
                      <p className="font-display text-lg font-bold text-gold">
                        {Number(ad.price).toLocaleString()} EGP
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ad.city || ad.governorate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {ad.views}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Browse;
