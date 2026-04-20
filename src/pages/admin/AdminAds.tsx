import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminAds = () => {
  const [ads, setAds] = useState<any[]>([]);

  const load = () =>
    supabase.from("ads").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setAds(data || []));

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "active" | "rejected" | "pending" | "sold" | "expired" | "draft") => {
    const { error } = await supabase.from("ads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Ad ${status}`);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Ads ({ads.length})</h1>
      <Card className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Price</TableHead>
              <TableHead>Location</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                <TableCell>{Number(a.price).toLocaleString()} EGP</TableCell>
                <TableCell>{a.governorate}</TableCell>
                <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  {a.status !== "active" && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "active")}>Approve</Button>}
                  {a.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>}
                  <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminAds;
