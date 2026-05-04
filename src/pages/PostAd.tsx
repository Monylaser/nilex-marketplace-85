import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AiAdAssistant, { type AiResult } from "@/components/AiAdAssistant";
import { useT } from "@/lib/i18n";

const PostAd = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    subcategory: "",
    governorate: "",
    city: "",
    condition: "used" as "new" | "used" | "refurbished",
    images: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("governorates").select("*").order("name"),
    ]).then(([c, g]) => {
      setCategories(c.data || []);
      setGovernorates(g.data || []);
    });
  }, []);

  useEffect(() => {
    const g = governorates.find((x) => x.name === form.governorate);
    setCities(Array.isArray(g?.cities_json) ? g.cities_json : []);
    setForm((f) => ({ ...f, city: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.governorate]);

  const selectedCategory = categories.find((c) => String(c.id) === form.category_id);
  const subcats: string[] = Array.isArray(selectedCategory?.subcategories_json)
    ? selectedCategory.subcategories_json
    : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const images = form.images.split(/\s+/).filter(Boolean);
    const { data, error } = await supabase
      .from("ads")
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category_id: form.category_id ? Number(form.category_id) : null,
        subcategory: form.subcategory || null,
        governorate: form.governorate,
        city: form.city || null,
        condition: form.condition,
        status: "active",
        images_json: images,
      })
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("post.posted"));
    navigate(`/ad/${data.id}`);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{t("post.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("post.subtitle")}</p>

          <div className="mt-6">
            <AiAdAssistant
              categoriesHint={categories.map((c) => c.name).join(", ")}
              onApply={(r: AiResult) => {
                const matched = categories.find(
                  (c) => r.category && c.name.toLowerCase() === r.category.toLowerCase(),
                );
                const suggestedPrice = Math.round((r.price_min + r.price_max) / 2);
                setForm((f) => ({
                  ...f,
                  title: r.title || f.title,
                  description: r.description || f.description,
                  condition: r.condition || f.condition,
                  price: f.price || String(suggestedPrice),
                  category_id: matched ? String(matched.id) : f.category_id,
                }));
              }}
            />
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label>{t("post.field.title")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("post.field.title.ph")}
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("post.field.category")}</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v, subcategory: "" })} required>
                  <SelectTrigger><SelectValue placeholder={t("post.field.category")} /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("post.field.subcategory")}</Label>
                <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })} disabled={subcats.length === 0}>
                  <SelectTrigger><SelectValue placeholder={t("post.field.subcategory")} /></SelectTrigger>
                  <SelectContent>
                    {subcats.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("post.field.governorate")}</Label>
                <Select value={form.governorate} onValueChange={(v) => setForm({ ...form, governorate: v })} required>
                  <SelectTrigger><SelectValue placeholder={t("post.field.governorate")} /></SelectTrigger>
                  <SelectContent>
                    {governorates.map((g) => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("post.field.city")}</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })} disabled={cities.length === 0}>
                  <SelectTrigger><SelectValue placeholder={t("post.field.city")} /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("post.field.price")}</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("post.field.condition")}</Label>
                <Select value={form.condition} onValueChange={(v: any) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t("post.condition.new")}</SelectItem>
                    <SelectItem value="used">{t("post.condition.used")}</SelectItem>
                    <SelectItem value="refurbished">{t("post.condition.refurbished")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("post.field.description")}</Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("post.field.description.ph")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("post.field.images")}</Label>
              <Textarea
                rows={3}
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://… &#10;https://…"
              />
              <p className="text-xs text-muted-foreground">{t("post.field.images.help")}</p>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("post.publish")}
            </Button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PostAd;
