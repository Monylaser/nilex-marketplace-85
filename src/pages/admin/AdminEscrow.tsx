import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Loader2, Eye, CheckCircle2, XCircle, AlertTriangle, CalendarIcon, X, Download, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/escrow";
import { useAuth } from "@/hooks/useAuth";

type Dispute = any;
type Tx = any;

const AdminEscrow = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [stats, setStats] = useState({ volume: 0, revenue: 0, count: 0, pendingDisputes: 0 });

  // Detail dialog state
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [resolution, setResolution] = useState("");
  const [acting, setActing] = useState(false);

  // Filters (disputes tab)
  const [fStatus, setFStatus] = useState<"all" | "pending" | "resolved">("all");
  const [fSearch, setFSearch] = useState(""); // ad / buyer / seller id (substring)
  const [fFrom, setFFrom] = useState<Date | undefined>();
  const [fTo, setFTo] = useState<Date | undefined>();

  // CSV column picker
  const ALL_COLUMNS: { key: string; label: string; get: (d: any, tx: any) => any }[] = [
    { key: "dispute_id", label: "Dispute ID", get: (d) => d.id },
    { key: "opened_at", label: "Opened at", get: (d) => d.created_at },
    { key: "status", label: "Status", get: (d) => (d.resolved_at ? "resolved" : "pending") },
    { key: "reason", label: "Reason", get: (d) => d.reason },
    { key: "resolution", label: "Resolution", get: (d) => d.resolution || "" },
    { key: "resolved_at", label: "Resolved at", get: (d) => d.resolved_at || "" },
    { key: "resolved_by", label: "Resolved by", get: (d) => d.resolved_by || "" },
    { key: "opened_by", label: "Opened by", get: (d) => d.opened_by || "" },
    { key: "transaction_id", label: "Transaction ID", get: (d) => d.transaction_id },
    { key: "ad_id", label: "Ad ID", get: (_d, tx) => tx?.ad_id || "" },
    { key: "buyer_id", label: "Buyer ID", get: (_d, tx) => tx?.buyer_id || "" },
    { key: "seller_id", label: "Seller ID", get: (_d, tx) => tx?.seller_id || "" },
    { key: "amount", label: "Amount", get: (_d, tx) => tx?.amount ?? "" },
    { key: "commission", label: "Commission", get: (_d, tx) => tx?.commission ?? "" },
    { key: "tx_status", label: "Tx status", get: (_d, tx) => tx?.status || "" },
  ];
  const [exportCols, setExportCols] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true]))
  );
  const toggleCol = (key: string) =>
    setExportCols((p) => ({ ...p, [key]: !p[key] }));
  const setAllCols = (val: boolean) =>
    setExportCols(Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, val])));
  const selectedColCount = Object.values(exportCols).filter(Boolean).length;

  const txById = useMemo(() => {
    const m = new Map<string, any>();
    transactions.forEach((t) => m.set(t.id, t));
    return m;
  }, [transactions]);

  const filteredDisputes = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return disputes.filter((d) => {
      if (fStatus === "pending" && d.resolved_at) return false;
      if (fStatus === "resolved" && !d.resolved_at) return false;

      const created = new Date(d.created_at);
      if (fFrom && created < fFrom) return false;
      if (fTo) {
        const end = new Date(fTo); end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }

      if (q) {
        const tx = txById.get(d.transaction_id);
        const hay = [
          d.transaction_id,
          tx?.ad_id,
          tx?.buyer_id,
          tx?.seller_id,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [disputes, txById, fStatus, fSearch, fFrom, fTo]);

  const clearFilters = () => {
    setFStatus("all"); setFSearch(""); setFFrom(undefined); setFTo(undefined);
  };

  const exportCsv = () => {
    if (filteredDisputes.length === 0) {
      toast.error("No disputes to export");
      return;
    }
    const cols = ALL_COLUMNS.filter((c) => exportCols[c.key]);
    if (cols.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    const esc = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = cols.map((c) => c.key);
    const rows = filteredDisputes.map((d) => {
      const tx = txById.get(d.transaction_id) || {};
      return cols.map((c) => esc(c.get(d, tx))).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `escrow-disputes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredDisputes.length} disputes (${cols.length} cols)`);
  };

  const load = async () => {
    setLoading(true);
    const [{ data: d }, { data: tx }] = await Promise.all([
      supabase.from("escrow_disputes").select("*").order("created_at", { ascending: false }),
      supabase.from("escrow_transactions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setDisputes(d || []);
    setTransactions(tx || []);

    const completed = (tx || []).filter((t: any) => t.status === "completed");
    const volume = completed.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const revenue = completed.reduce((s: number, t: any) => s + Number(t.commission || 0), 0);
    const pendingDisputes = (d || []).filter((x: any) => !x.resolved_at).length;
    setStats({ volume, revenue, count: completed.length, pendingDisputes });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (dispute: Dispute) => {
    setSelected(dispute);
    setResolution("");
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("escrow_transactions").select("*").eq("id", dispute.transaction_id).maybeSingle(),
      supabase.from("escrow_messages").select("*").eq("transaction_id", dispute.transaction_id).order("created_at"),
    ]);
    setSelectedTx(t);
    setMessages(m || []);
  };

  const resolve = async (action: "refund" | "release") => {
    if (!selected || !selectedTx || !user) return;
    if (!resolution.trim()) return toast.error("Please add a resolution note");
    setActing(true);

    const txPatch =
      action === "refund"
        ? { status: "refunded", refunded_at: new Date().toISOString() }
        : { status: "completed", completed_at: new Date().toISOString() };

    const { error: e1 } = await (supabase.from("escrow_transactions") as any)
      .update(txPatch).eq("id", selectedTx.id);
    if (e1) { setActing(false); return toast.error(e1.message); }

    const { error: e2 } = await (supabase.from("escrow_disputes") as any).update({
      resolution: `${action.toUpperCase()}: ${resolution.trim()}`,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", selected.id);

    setActing(false);
    if (e2) return toast.error(e2.message);

    toast.success(action === "refund" ? "Buyer refunded" : "Funds released to seller");
    setSelected(null);
    setSelectedTx(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-gold" /> Escrow Management
        </h1>
        <p className="text-sm text-muted-foreground">Review disputes, monitor transactions, resolve cases.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total volume" value={`${stats.volume.toLocaleString()} EGP`} />
        <StatCard label="Commission revenue" value={`${stats.revenue.toLocaleString()} EGP`} />
        <StatCard label="Completed transactions" value={String(stats.count)} />
        <StatCard label="Pending disputes" value={String(stats.pendingDisputes)} highlight={stats.pendingDisputes > 0} />
      </div>

      <Tabs defaultValue="disputes">
        <TabsList>
          <TabsTrigger value="disputes">
            Disputes {stats.pendingDisputes > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.pendingDisputes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions">All transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="mt-4 space-y-4">
          {/* Filter bar */}
          <Card className="p-3 flex flex-wrap gap-2 items-center">
            <Select value={fStatus} onValueChange={(v: any) => setFStatus(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={fSearch}
              onChange={(e) => setFSearch(e.target.value)}
              placeholder="Search by ad / buyer / seller ID…"
              className="flex-1 min-w-[220px]"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !fFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fFrom ? format(fFrom, "PP") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fFrom} onSelect={setFFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !fTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fTo ? format(fTo, "PP") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={fTo} onSelect={setFTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            {(fStatus !== "all" || fSearch || fFrom || fTo) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1 ml-auto">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <span className="text-xs text-muted-foreground">
              {filteredDisputes.length} of {disputes.length}
            </span>
          </Card>

          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opened</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {disputes.length === 0 ? "No disputes yet." : "No disputes match these filters."}
                  </TableCell></TableRow>
                )}
                {filteredDisputes.map((d) => {
                  const tx = txById.get(d.transaction_id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm">{new Date(d.created_at).toLocaleString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{d.reason}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {tx ? (
                          <div className="space-y-0.5">
                            <div>Ad: {String(tx.ad_id).slice(0, 8)}…</div>
                            <div>B: {String(tx.buyer_id).slice(0, 8)}… · S: {String(tx.seller_id).slice(0, 8)}…</div>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {d.resolved_at ? (
                          <Badge variant="secondary">Resolved</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openDetail(d)} className="gap-1">
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions yet.</TableCell></TableRow>
                )}
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{new Date(t.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{Number(t.amount).toLocaleString()} EGP</TableCell>
                    <TableCell>{Number(t.commission).toLocaleString()} EGP</TableCell>
                    <TableCell><Badge variant="secondary">{STATUS_LABELS[t.status] || t.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Link to={`/escrow/${t.id}`}>
                        <Button size="sm" variant="outline" className="gap-1"><Eye className="h-4 w-4" /> View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Dispute review
            </DialogTitle>
          </DialogHeader>

          {selected && selectedTx && (
            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Transaction</p>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs">{selectedTx.id}</span>
                  <span className="font-bold text-gold">{Number(selectedTx.amount).toLocaleString()} EGP</span>
                </div>
                <div className="mt-2 text-sm">
                  Status: <Badge variant="secondary">{STATUS_LABELS[selectedTx.status] || selectedTx.status}</Badge>
                </div>
              </Card>

              <div>
                <p className="text-sm font-medium mb-1">Reason from {selected.opened_by === selectedTx.buyer_id ? "buyer" : "seller"}</p>
                <Card className="p-3 text-sm whitespace-pre-wrap">{selected.reason}</Card>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Conversation ({messages.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-3">
                  {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages exchanged.</p>}
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <p className="text-xs text-muted-foreground">
                        {m.user_id === selectedTx.buyer_id ? "Buyer" : "Seller"} · {new Date(m.created_at).toLocaleString()}
                      </p>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.resolved_at ? (
                <Card className="p-3 bg-secondary/40 text-sm">
                  <p className="font-medium mb-1">Already resolved</p>
                  <p className="text-muted-foreground">{selected.resolution}</p>
                  <p className="text-xs text-muted-foreground mt-1">at {new Date(selected.resolved_at).toLocaleString()}</p>
                </Card>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Resolution note</p>
                    <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3}
                      placeholder="Explain your decision (visible to both parties)…" />
                  </div>

                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => resolve("refund")} disabled={acting} className="gap-2">
                      {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Refund buyer
                    </Button>
                    <Button variant="gold" onClick={() => resolve("release")} disabled={acting} className="gap-2">
                      {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Release to seller
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <Card className={`p-4 ${highlight ? "border-destructive" : ""}`}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${highlight ? "text-destructive" : ""}`}>{value}</p>
  </Card>
);

export default AdminEscrow;
