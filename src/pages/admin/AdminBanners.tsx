import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, FolderOpen, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

import heroBg from "@/assets/hero-bg.jpg";
import categoryCars from "@/assets/category-cars.jpg";
import categoryRealEstate from "@/assets/category-realestate.jpg";
import nilexLogo from "@/assets/nilex-logo.png";

const PROJECT_ASSETS = [
  { name: "Hero background", url: heroBg },
  { name: "Cars category", url: categoryCars },
  { name: "Real estate category", url: categoryRealEstate },
  { name: "Nilex logo", url: nilexLogo },
];

const POSITIONS = ["home_top", "home_middle", "home_left", "home_right", "browse_top", "sidebar"];

const POSITION_DEFAULTS: Record<string, { w: number; h: number }> = {
  home_top: { w: 1200, h: 200 },
  home_middle: { w: 1200, h: 150 },
  home_left: { w: 180, h: 600 },
  home_right: { w: 180, h: 600 },
  browse_top: { w: 1200, h: 180 },
  sidebar: { w: 300, h: 250 },
};

const AdminBanners = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    image: "",
    link: "",
    position: "home_top",
    width_px: POSITION_DEFAULTS.home_top.w,
    height_px: POSITION_DEFAULTS.home_top.h,
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setPosition = (v: string) => {
    const d = POSITION_DEFAULTS[v] ?? { w: 0, h: 0 };
    setForm((f) => ({ ...f, position: v, width_px: d.w, height_px: d.h }));
  };

  const load = () =>
    supabase.from("banners").select("*").order("sort_order").then(({ data }) => setItems(data || []));

  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("banner-images").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("banner-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image: data.publicUrl }));
    setUploading(false);
    setPickerOpen(false);
    toast.success("Image uploaded");
  };

  const add = async () => {
    if (!form.title || !form.image) return toast.error("Title & image required");
    const { error } = await supabase.from("banners").insert(form);
    if (error) return toast.error(error.message);
    const d = POSITION_DEFAULTS.home_top;
    setForm({ title: "", image: "", link: "", position: "home_top", width_px: d.w, height_px: d.h });
    toast.success("Banner added");
    load();
  };

  const toggle = async (id: number, active: boolean) => {
    await supabase.from("banners").update({ is_active: !active }).eq("id", id);
    load();
  };

  const updateSize = async (id: number, width_px: number | null, height_px: number | null) => {
    const { error } = await supabase.from("banners").update({ width_px, height_px }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Size updated");
    load();
  };

  const remove = async (id: number) => {
    await supabase.from("banners").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Banners ({items.length})</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Upload from your computer, pick a project asset, or paste a URL.
      </p>

      <Card className="mt-6 p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
          <div>
            <Label>Position</Label>
            <Select value={form.position} onValueChange={setPosition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: {form.width_px}×{form.height_px}px
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Width (px)</Label>
              <Input type="number" min={0} value={form.width_px}
                onChange={(e) => setForm({ ...form, width_px: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input type="number" min={0} value={form.height_px}
                onChange={(e) => setForm({ ...form, height_px: Number(e.target.value) || 0 })} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Image</Label>
          {form.image ? (
            <div className="relative">
              <img src={form.image} alt="" className="w-full h-40 object-cover rounded-md border" />
              <Button size="sm" variant="outline" className="absolute top-2 right-2"
                onClick={() => setForm({ ...form, image: "" })}>Change</Button>
            </div>
          ) : (
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-40 border-dashed">
                  <ImageIcon className="h-5 w-5 mr-2" /> Choose image
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Pick a banner image</DialogTitle></DialogHeader>
                <Tabs defaultValue="upload">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload</TabsTrigger>
                    <TabsTrigger value="project"><FolderOpen className="h-4 w-4 mr-1" /> Project</TabsTrigger>
                    <TabsTrigger value="url"><LinkIcon className="h-4 w-4 mr-1" /> URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="pt-4">
                    <Input type="file" accept="image/*" disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
                    {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading…</p>}
                  </TabsContent>
                  <TabsContent value="project" className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PROJECT_ASSETS.map((a) => (
                        <button key={a.url} type="button"
                          onClick={() => { setForm({ ...form, image: a.url }); setPickerOpen(false); }}
                          className="group rounded-md border overflow-hidden hover:border-primary transition">
                          <img src={a.url} alt={a.name} className="h-24 w-full object-cover" />
                          <p className="text-xs p-2 truncate">{a.name}</p>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="pt-4 space-y-2">
                    <Input placeholder="https://example.com/image.jpg"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })} />
                    <Button size="sm" onClick={() => setPickerOpen(false)} disabled={!form.image}>Use URL</Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="gold" className="w-full" onClick={add} disabled={!form.title || !form.image}>
            Add banner
          </Button>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Live preview</Label>
            <span className="text-xs text-muted-foreground">
              {form.width_px}×{form.height_px}px @ actual size (scaled to fit)
            </span>
          </div>
          <div className="rounded-md border bg-muted/40 p-4 flex items-center justify-center min-h-[200px] overflow-auto">
            {form.image && form.width_px > 0 && form.height_px > 0 ? (
              <div
                className="bg-background shadow-sm"
                style={{
                  width: `${form.width_px}px`,
                  height: `${form.height_px}px`,
                  maxWidth: "100%",
                }}
              >
                <img
                  src={form.image}
                  alt={form.title || "preview"}
                  className="w-full h-full object-cover rounded-md border"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose an image and set width/height to preview.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Position</TableHead>
              <TableHead>Size (px)</TableHead>
              <TableHead>Active</TableHead><TableHead>Stats</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id}>
                <TableCell><img src={b.image} alt="" className="h-10 w-16 object-cover rounded border" /></TableCell>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>{b.position}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input type="number" defaultValue={b.width_px ?? ""} className="h-8 w-20"
                      onBlur={(e) => {
                        const w = Number(e.target.value) || null;
                        if (w !== b.width_px) updateSize(b.id, w, b.height_px);
                      }} />
                    <span className="text-muted-foreground">×</span>
                    <Input type="number" defaultValue={b.height_px ?? ""} className="h-8 w-20"
                      onBlur={(e) => {
                        const h = Number(e.target.value) || null;
                        if (h !== b.height_px) updateSize(b.id, b.width_px, h);
                      }} />
                  </div>
                </TableCell>
                <TableCell>{b.is_active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.views} views · {b.clicks} clicks</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(b.id, b.is_active)}>{b.is_active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminBanners;
