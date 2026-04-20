import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminBoostPackages = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", days: "7", price: "0", sort_order: "10" });

  const load = () => supabase.from("boost_packages").select("*").order("sort_order").then(({ data }) => setItems(data || []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name || !form.slug) return toast.error("Name & slug required");
    const { error } = await supabase.from("boost_packages").insert({
      name: form.name, slug: form.slug, days: Number(form.days), price: Number(form.price), sort_order: Number(form.sort_order),
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "", days: "7", price: "0", sort_order: "10" });
    load();
  };

  const toggle = async (id: number, active: boolean) => {
    await supabase.from("boost_packages").update({ is_active: !active }).eq("id", id);
    load();
  };

  const remove = async (id: number) => {
    await supabase.from("boost_packages").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Boost Packages ({items.length})</h1>

      <Card className="mt-6 p-5 grid gap-3 sm:grid-cols-6">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
        <div><Label>Days</Label><Input type="number" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></div>
        <div><Label>Price (EGP)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        <div className="flex items-end"><Button variant="gold" className="w-full" onClick={add}>Add</Button></div>
      </Card>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Days</TableHead>
              <TableHead>Price</TableHead><TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.days}</TableCell>
                <TableCell>{Number(p.price).toLocaleString()} EGP</TableCell>
                <TableCell>{p.is_active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminBoostPackages;
