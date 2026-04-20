import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminBanners = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", image: "", link: "", position: "home_top" });

  const load = () => supabase.from("banners").select("*").order("sort_order").then(({ data }) => setItems(data || []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title || !form.image) return toast.error("Title & image required");
    const { error } = await supabase.from("banners").insert(form);
    if (error) return toast.error(error.message);
    setForm({ title: "", image: "", link: "", position: "home_top" });
    load();
  };

  const toggle = async (id: number, active: boolean) => {
    await supabase.from("banners").update({ is_active: !active }).eq("id", id);
    load();
  };

  const remove = async (id: number) => {
    await supabase.from("banners").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Banners ({items.length})</h1>

      <Card className="mt-6 p-5 grid gap-3 sm:grid-cols-5">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
        <div><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
        <div><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
        <div className="flex items-end"><Button variant="gold" className="w-full" onClick={add}>Add</Button></div>
      </Card>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Position</TableHead>
              <TableHead>Active</TableHead><TableHead>Stats</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>{b.position}</TableCell>
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
