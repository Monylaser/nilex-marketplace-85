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

const PostAd = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    toast.success("Ad posted!");
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
          <h1 className="font-display text-3xl font-bold md:text-4xl">Post Your Ad</h1>
          <p className="mt-2 text-muted-foreground">Reach millions of buyers across Egypt</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. BMW X5 2023 — Low Mileage"
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v, subcategory: "" })} required>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })} disabled={subcats.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subcats.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Governorate</Label>
                <Select value={form.governorate} onValueChange={(v) => setForm({ ...form, governorate: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select governorate" /></SelectTrigger>
                  <SelectContent>
                    {governorates.map((g) => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })} disabled={cities.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (EGP)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v: any) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe condition, features, reason for selling…"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Image URLs (one per line)</Label>
              <Textarea
                rows={3}
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://… &#10;https://…"
              />
              <p className="text-xs text-muted-foreground">Paste URLs of your photos. File upload coming soon.</p>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Ad
            </Button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PostAd;
