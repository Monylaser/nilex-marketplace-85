import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import * as Lucide from "lucide-react";
import { Pencil, Plus, Trash2, Upload, Image as ImageIcon, Eye, EyeOff } from "lucide-react";

// Project asset icons available to pick from
import assetCars from "@/assets/category-cars.jpg";
import assetRealEstate from "@/assets/category-realestate.jpg";
import assetLogo from "@/assets/nilex-logo.png";

const PROJECT_ICONS = [
  { name: "Cars", url: assetCars },
  { name: "Real Estate", url: assetRealEstate },
  { name: "Nilex Logo", url: assetLogo },
];

// Common Lucide icons to suggest
const LUCIDE_SUGGESTIONS = [
  "Car", "Home", "Building2", "Smartphone", "Laptop", "Sofa", "Shirt",
  "Bike", "Briefcase", "Wrench", "Package", "Gift", "BookOpen", "Music",
  "Camera", "Gamepad2", "Heart", "Star", "Tag", "ShoppingBag",
];

type Category = {
  id: number;
  name: string;
  name_ar: string | null;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
};

const isUrl = (s?: string | null) => !!s && /^(https?:|\/)/.test(s);

const IconPreview = ({ icon, size = 28 }: { icon?: string | null; size?: number }) => {
  if (!icon) return <div className="rounded bg-muted" style={{ width: size, height: size }} />;
  if (isUrl(icon)) {
    return <img src={icon} alt="" className="rounded object-cover border" style={{ width: size, height: size }} />;
  }
  const Comp = (Lucide as any)[icon];
  if (Comp) return <Comp size={size} className="text-gold" />;
  return <div className="text-xs text-muted-foreground">{icon}</div>;
};

const emptyForm: Partial<Category> = {
  name: "",
  name_ar: "",
  slug: "",
  icon: "",
  sort_order: 10,
  is_visible: true,
};

const AdminCategories = () => {
  const { user } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    supabase.from("categories").select("*").order("sort_order").then(({ data }) =>
      setCats((data as any) || []),
    );
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (c: Category) => setEditing({ ...c });
  const close = () => setEditing(null);

  const onUploadFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      return toast.error("Please choose an image file");
    }
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
    setBusy(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user?.id ?? "admin"}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("category-icons")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("category-icons").getPublicUrl(path);
    setEditing((p) => ({ ...(p || {}), icon: data.publicUrl }));
    setBusy(false);
    toast.success("Icon uploaded");
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) return toast.error("Name and slug are required");
    setBusy(true);
    const payload = {
      name: editing.name,
      name_ar: editing.name_ar || null,
      slug: editing.slug,
      icon: editing.icon || null,
      sort_order: Number(editing.sort_order) || 0,
      is_visible: editing.is_visible ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload as any).eq("id", editing.id)
      : await supabase.from("categories").insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Category updated" : "Category created");
    close();
    load();
  };

  const toggleVisible = async (c: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_visible: !c.is_visible } as any)
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories ({cats.length})</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage marketplace categories — edit, upload an icon, or toggle visibility.
          </p>
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New category</Button>
      </div>

      <Card className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cats.map((c) => (
              <TableRow key={c.id} className={!c.is_visible ? "opacity-60" : ""}>
                <TableCell><IconPreview icon={c.icon} /></TableCell>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  {c.name_ar && <div className="text-xs text-muted-foreground" dir="rtl">{c.name_ar}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell>
                  <Switch checked={c.is_visible} onCheckedChange={() => toggleVisible(c)} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(c)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {cats.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No categories yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit / Create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name (English)</Label>
                  <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={60} />
                </div>
                <div>
                  <Label>Name (Arabic)</Label>
                  <Input dir="rtl" value={editing.name_ar || ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} maxLength={60} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} maxLength={60} />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input type="number" value={editing.sort_order ?? 10} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  {editing.is_visible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">Show on front-end</span>
                </div>
                <Switch
                  checked={editing.is_visible ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_visible: v })}
                />
              </div>

              {/* Icon picker */}
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between mb-3">
                  <Label className="m-0">Icon</Label>
                  <div className="flex items-center gap-2">
                    <IconPreview icon={editing.icon} size={36} />
                    {editing.icon && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ ...editing, icon: "" })}>Clear</Button>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="upload">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1" /> Upload</TabsTrigger>
                    <TabsTrigger value="project"><ImageIcon className="h-4 w-4 mr-1" /> From project</TabsTrigger>
                    <TabsTrigger value="lucide">Lucide</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">PNG, JPG or SVG up to 2MB.</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadFile(f);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    />
                    <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                      <Upload className="h-4 w-4 mr-1" /> {busy ? "Uploading…" : "Choose file from computer"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="project" className="pt-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PROJECT_ICONS.map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() => setEditing({ ...editing, icon: p.url })}
                          className={`rounded-md border p-2 hover:border-gold transition ${editing.icon === p.url ? "ring-2 ring-gold" : ""}`}
                        >
                          <img src={p.url} alt={p.name} className="h-14 w-full object-cover rounded" />
                          <div className="text-xs mt-1 truncate">{p.name}</div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="lucide" className="pt-3 space-y-3">
                    <Input
                      placeholder="Type a Lucide icon name (e.g. Car, Home, Building2)"
                      value={editing.icon && !isUrl(editing.icon) ? editing.icon : ""}
                      onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      {LUCIDE_SUGGESTIONS.map((name) => {
                        const Icon = (Lucide as any)[name];
                        const active = editing.icon === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setEditing({ ...editing, icon: name })}
                            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs hover:border-gold transition ${active ? "ring-2 ring-gold" : ""}`}
                          >
                            {Icon && <Icon className="h-4 w-4" />} {name}
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button variant="gold" onClick={save} disabled={busy}>
              {editing?.id ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-4 text-xs text-muted-foreground">
        <Badge variant="outline" className="mr-1">Tip</Badge>
        Hidden categories stay in the database but won't show on the front-end.
      </p>
    </div>
  );
};

export default AdminCategories;
