import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Eye, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useAiSearchPref } from "@/hooks/useAiSearch";
import VerificationBadge from "@/components/VerificationBadge";

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
  similarity?: number;
  user_id?: string;
  seller_level?: number;
  categories?: { name: string; slug: string } | null;
}

const Browse = () => {
  const [params, setParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<"ai" | "keyword" | null>(null);
  const { enabled: aiEnabled, setEnabled: setAiEnabled } = useAiSearchPref();

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

  const catId = useMemo(() => {
    if (cat === "all") return null;
    return categories.find((x) => x.slug === cat)?.id ?? null;
  }, [cat, categories]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setSearchMode(null);

      // AI search path: only when user typed a query AND opted in
      if (aiEnabled && q.trim().length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke("ai-search", {
            body: undefined,
            method: "GET" as any,
            // supabase-js v2 doesn't fully support GET query params via invoke; use direct fetch instead
          } as any);
          // Fallback to raw fetch which supports query strings cleanly
          const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ai-search?q=${encodeURIComponent(q)}&limit=40`;
          const headers: Record<string, string> = {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          };
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
          const resp = await fetch(url, { headers });
          if (resp.ok) {
            const json = await resp.json();
            if (cancelled) return;
            let results: Ad[] = json.results || [];
            // Apply local category/governorate filters on top of AI results
            if (catId) results = results.filter((r: any) => r.category_id === catId);
            if (gov !== "all") results = results.filter((r) => r.governorate === gov);
            setAds(results);
            setSearchMode(json.mode === "keyword" ? "keyword" : "ai");
            setLoading(false);
            return;
          }
          // swallow and fall through to keyword
          void error; void data;
        } catch {
          // fall through
        }
      }

      // Keyword (existing) path — also pull seller verification level for ranking + badge
      let query = supabase
        .from("ads")
        .select("id,title,price,governorate,city,views,is_boosted,images_json,created_at,user_id,categories(name,slug),profiles!ads_user_id_fkey(verification_level)")
        .eq("status", "active")
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);

      if (q) query = query.ilike("title", `%${q}%`);
      if (catId) query = query.eq("category_id", catId);
      if (gov !== "all") query = query.eq("governorate", gov);

      const { data } = await query;
      if (cancelled) return;
      // Flatten + boost verified sellers (boosted ads still rank highest)
      const enriched: Ad[] = ((data as any[]) || []).map((row) => ({
        ...row,
        seller_level: row?.profiles?.verification_level ?? 0,
      }));
      enriched.sort((a, b) => {
        if (a.is_boosted !== b.is_boosted) return a.is_boosted ? -1 : 1;
        const lvl = (b.seller_level ?? 0) - (a.seller_level ?? 0);
        if (lvl !== 0) return lvl;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAds(enriched);
      setSearchMode("keyword");
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [q, catId, gov, aiEnabled]);

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">Browse Ads</h1>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Wand2 className="h-4 w-4 text-gold" />
            <Label htmlFor="ai-search" className="text-sm cursor-pointer">AI Search</Label>
            <Switch id="ai-search" checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input
            placeholder={aiEnabled ? "Try: عربية صغيرة موفرة بنزين" : "Search ads…"}
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

        {q && searchMode && !loading && (
          <p className="mt-3 text-xs text-muted-foreground">
            {searchMode === "ai"
              ? <>✨ AI semantic results for <span className="font-medium text-foreground">"{q}"</span></>
              : aiEnabled
                ? <>AI returned no matches — showing keyword results for <span className="font-medium text-foreground">"{q}"</span></>
                : <>Keyword results for <span className="font-medium text-foreground">"{q}"</span></>}
          </p>
        )}

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
                      {typeof ad.similarity === "number" && (
                        <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
                          {Math.round(ad.similarity * 100)}% match
                        </Badge>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium line-clamp-2 text-sm flex-1">{ad.title}</h3>
                        {ad.seller_level ? <VerificationBadge level={ad.seller_level} /> : null}
                      </div>
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
