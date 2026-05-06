import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Flag, Eye, Search } from "lucide-react";

type Ad = {
  id: string;
  title: string;
  description: string;
  price: number;
  governorate: string;
  city: string | null;
  status: string;
  images_json: any;
  created_at: string;
  user_id: string;
  rejection_reason: string | null;
};

const REJECT_REASONS = [
  "Ethical violation",
  "Security concern",
  "Suspected fraud",
  "Prohibited item",
  "Misleading information",
  "Duplicate listing",
  "Other",
];

const AdminModeration = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selected, setSelected] = useState<Ad | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonPreset, setReasonPreset] = useState(REJECT_REASONS[0]);
  const [reasonNote, setReasonNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("ads")
      .select("id,title,description,price,governorate,city,status,images_json,created_at,user_id,rejection_reason")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setAds((data || []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const filtered = ads.filter((a) =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.governorate?.toLowerCase().includes(search.toLowerCase()),
  );

  const moderate = async (
    id: string,
    status: "active" | "rejected" | "flagged",
    rejection_reason: string | null = null,
  ) => {
    setBusy(true);
    const { error } = await supabase
      .from("ads")
      .update({
        status,
        rejection_reason,
        moderated_by: user?.id ?? null,
        moderated_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(
      status === "active" ? "Ad approved" : status === "rejected" ? "Ad rejected" : "Ad flagged",
    );
    setSelected(null);
    setRejectOpen(false);
    setReasonNote("");
    load();
  };

  const openReject = (ad: Ad) => {
    setSelected(ad);
    setReasonPreset(REJECT_REASONS[0]);
    setReasonNote("");
    setRejectOpen(true);
  };

  const submitReject = () => {
    if (!selected) return;
    const reason = reasonNote.trim()
      ? `${reasonPreset}: ${reasonNote.trim()}`
      : reasonPreset;
    moderate(selected.id, "rejected", reason);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
      flagged: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    };
    return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
  };

  const counts = {
    pending: ads.filter((a) => a.status === "pending").length,
    flagged: ads.filter((a) => a.status === "flagged").length,
    total: ads.length,
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Moderation Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review pending ads — approve, reject with reason, or flag for security.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-amber-500/10">Pending: {counts.pending}</Badge>
          <Badge variant="outline" className="bg-purple-500/10">Flagged: {counts.flagged}</Badge>
        </div>
      </div>

      <Card className="mt-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or governorate"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nothing to moderate 🎉</TableCell></TableRow>
            )}
            {filtered.map((a) => {
              const img = Array.isArray(a.images_json) ? a.images_json[0] : null;
              return (
                <TableRow key={a.id}>
                  <TableCell className="max-w-sm">
                    <div className="flex items-center gap-3">
                      {img ? (
                        <img src={img} alt="" className="h-12 w-12 rounded object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{Number(a.price).toLocaleString()} EGP</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {a.governorate}{a.city ? ` · ${a.city}` : ""}
                  </TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
                      <Eye className="h-4 w-4 mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Review dialog */}
      <Dialog open={!!selected && !rejectOpen} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selected.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {statusBadge(selected.status)}
                  <span>{Number(selected.price).toLocaleString()} EGP</span>
                  <span>·</span>
                  <span>{selected.governorate}{selected.city ? ` · ${selected.city}` : ""}</span>
                </DialogDescription>
              </DialogHeader>

              {Array.isArray(selected.images_json) && selected.images_json.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selected.images_json.slice(0, 6).map((src: string, i: number) => (
                    <img key={i} src={src} alt="" className="h-24 w-full object-cover rounded border" />
                  ))}
                </div>
              )}

              <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto rounded border p-3 bg-muted/30">
                {selected.description}
              </div>

              {selected.rejection_reason && (
                <div className="text-sm rounded border border-destructive/30 bg-destructive/5 p-3">
                  <span className="font-medium">Previous rejection:</span> {selected.rejection_reason}
                </div>
              )}

              <DialogFooter className="flex-row flex-wrap gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  className="border-purple-500/40 text-purple-600 hover:bg-purple-500/10"
                  disabled={busy}
                  onClick={() => moderate(selected.id, "flagged")}
                >
                  <Flag className="h-4 w-4 mr-1" /> Flag
                </Button>
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={busy} onClick={() => openReject(selected)}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button variant="gold" disabled={busy} onClick={() => moderate(selected.id, "active")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject ad</DialogTitle>
            <DialogDescription>Provide a reason — it will be saved with the ad and shown to the user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason</Label>
              <Select value={reasonPreset} onValueChange={setReasonPreset}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional notes (optional)</Label>
              <Textarea
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Explain the issue to the user…"
                maxLength={500}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={submitReject}>Confirm rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeration;
