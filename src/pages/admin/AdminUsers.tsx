import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"moderator" | "admin">("moderator");
  const [search, setSearch] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
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

  const demote = async (uid: string, role: "admin" | "moderator" | "user") => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) return toast.error(error.message);
    toast.success(`Removed ${role}`);
    load();
  };

  const inviteByEmail = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast.error("Enter an email");
    const { data: prof } = await supabase
      .from("profiles").select("id,email,name").ilike("email", email).maybeSingle();
    if (!prof) return toast.error("No registered user with that email. They must sign up first.");
    await promote(prof.id, inviteRole);
    setInviteEmail("");
  };

  const toggleBan = async (uid: string, banned: boolean) => {
    const { error } = await supabase.from("profiles")
      .update({ is_banned: !banned } as any).eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success(!banned ? "User banned" : "User unbanned");
    load();
  };

  const resetStrikes = async (uid: string) => {
    await supabase.from("profiles").update({ strike_count: 0, is_banned: false } as any).eq("id", uid);
    toast.success("Strikes reset");
    load();
  };

  const filtered = users.filter((u) =>
    !search || (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Users ({users.length})</h1>

      <Card className="mt-6 p-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <div>
          <Label>Invite by email</Label>
          <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@example.com" type="email" />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="gold" onClick={inviteByEmail} className="w-full">
            <UserPlus className="h-4 w-4 mr-1" /> Grant role
          </Button>
        </div>
        <p className="md:col-span-3 text-xs text-muted-foreground">
          The user must already have an account. Their role is granted instantly.
        </p>
      </Card>

      <Card className="mt-4 p-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" />
      </Card>

      <Card className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead>
              <TableHead>Roles</TableHead><TableHead>Strikes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {u.roles.map((r: string) => <Badge key={r} variant="secondary" className="mr-1">{r}</Badge>)}
                </TableCell>
                <TableCell>
                  <Badge variant={u.strike_count >= 2 ? "destructive" : "outline"}>{u.strike_count ?? 0}/3</Badge>
                </TableCell>
                <TableCell>
                  {u.is_banned
                    ? <Badge variant="destructive">Banned</Badge>
                    : <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Active</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {!u.roles.includes("admin")
                    ? <Button size="sm" variant="outline" onClick={() => promote(u.id, "admin")}>Make admin</Button>
                    : <Button size="sm" variant="outline" onClick={() => demote(u.id, "admin")}>Revoke admin</Button>}
                  {!u.roles.includes("moderator")
                    ? <Button size="sm" variant="outline" onClick={() => promote(u.id, "moderator")}>Make mod</Button>
                    : <Button size="sm" variant="outline" onClick={() => demote(u.id, "moderator")}>Revoke mod</Button>}
                  <Button size="sm" variant={u.is_banned ? "outline" : "destructive"}
                    onClick={() => toggleBan(u.id, u.is_banned)}>
                    {u.is_banned ? <><ShieldCheck className="h-3 w-3 mr-1" />Unban</> : <><Ban className="h-3 w-3 mr-1" />Ban</>}
                  </Button>
                  {(u.strike_count ?? 0) > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => resetStrikes(u.id)}>Reset strikes</Button>
                  )}
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
