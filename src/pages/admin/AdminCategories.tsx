import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminCategories = () => {
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", sort_order: "10" });

  const load = () => supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats(data || []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name || !form.slug) return toast.error("Name & slug required");
    const { error } = await supabase.from("categories").insert({
      name: form.name, slug: form.slug, icon: form.icon || null, sort_order: Number(form.sort_order) || 0,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "", icon: "", sort_order: "10" });
    load();
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Categories ({cats.length})</h1>

      <Card className="mt-6 p-5 grid gap-3 sm:grid-cols-5">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
        <div><Label>Icon</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="lucide name" /></div>
        <div><Label>Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="flex items-end"><Button variant="gold" className="w-full" onClick={add}>Add</Button></div>
      </Card>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Slug</TableHead>
              <TableHead>Icon</TableHead><TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cats.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell>{c.icon}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminCategories;
