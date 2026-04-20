import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("*"),
    ]);
    const byUser: Record<string, string[]> = {};
    (roles || []).forEach((r: any) => {
      byUser[r.user_id] = byUser[r.user_id] || [];
      byUser[r.user_id].push(r.role);
    });
    setUsers((profiles || []).map((p: any) => ({ ...p, roles: byUser[p.id] || [] })));
  };

  useEffect(() => { load(); }, []);

  const promote = async (uid: string, role: "admin" | "moderator") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    load();
  };

  const demote = async (uid: string, role: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) return toast.error(error.message);
    toast.success(`Removed ${role}`);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Users ({users.length})</h1>
      <Card className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead>
              <TableHead>Roles</TableHead><TableHead>Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {u.roles.map((r: string) => <Badge key={r} variant="secondary" className="mr-1">{r}</Badge>)}
                </TableCell>
                <TableCell>{u.total_points}</TableCell>
                <TableCell className="text-right space-x-2">
                  {!u.roles.includes("admin")
                    ? <Button size="sm" variant="outline" onClick={() => promote(u.id, "admin")}>Make admin</Button>
                    : <Button size="sm" variant="outline" onClick={() => demote(u.id, "admin")}>Revoke admin</Button>}
                  {!u.roles.includes("moderator")
                    ? <Button size="sm" variant="outline" onClick={() => promote(u.id, "moderator")}>Make mod</Button>
                    : <Button size="sm" variant="outline" onClick={() => demote(u.id, "moderator")}>Revoke mod</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminUsers;
