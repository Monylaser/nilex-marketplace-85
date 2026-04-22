import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, AlertCircle, Database } from "lucide-react";
import { toast } from "sonner";

interface QueryRow { query: string; count: number; avg_results: number; }

const AdminSearch = () => {
  const [popular, setPopular] = useState<QueryRow[]>([]);
  const [zero, setZero] = useState<QueryRow[]>([]);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, done: 0, total_ads: 0, indexed: 0 });
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from("search_analytics")
      .select("query, results_count")
      .gte("created_at", since)
      .limit(2000);

    const agg = new Map<string, { count: number; total: number; zero: number }>();
    (rows || []).forEach((r: any) => {
      const k = String(r.query).trim().toLowerCase();
      if (!k) return;
      const cur = agg.get(k) || { count: 0, total: 0, zero: 0 };
      cur.count++;
      cur.total += r.results_count || 0;
      if ((r.results_count || 0) === 0) cur.zero++;
      agg.set(k, cur);
    });

    const all = Array.from(agg.entries()).map(([query, v]) => ({
      query, count: v.count, avg_results: v.count ? Math.round(v.total / v.count) : 0, zero: v.zero,
    }));
    setPopular(all.sort((a, b) => b.count - a.count).slice(0, 20));
    setZero(all.filter((r) => r.avg_results === 0).sort((a, b) => b.count - a.count).slice(0, 20));

    // Queue + index stats
    const [pending, failed, done, total, indexed] = await Promise.all([
      supabase.from("search_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("search_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("search_queue").select("*", { count: "exact", head: true }).eq("status", "done"),
      supabase.from("ads").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("ads").select("*", { count: "exact", head: true }).eq("status", "active").not("embedding", "is", null),
    ]);
    setQueueStats({
      pending: pending.count || 0,
      failed: failed.count || 0,
      done: done.count || 0,
      total_ads: total.count || 0,
      indexed: indexed.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reindex = async () => {
    setReindexing(true);
    try {
      const { error } = await supabase.functions.invoke("generate-embeddings", {
        body: { reindex_all: true, batch_size: 50 },
      });
      if (error) throw error;
      toast.success("Reindex queued. Embeddings will refresh in the background.");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Reindex failed");
    } finally {
      setReindexing(false);
    }
  };

  const retryFailed = async () => {
    const { error } = await supabase.from("search_queue").update({ status: "pending", attempts: 0 }).eq("status", "failed");
    if (error) toast.error(error.message);
    else { toast.success("Failed items requeued"); load(); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Search Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>Refresh</Button>
          <Button onClick={reindex} disabled={reindexing} variant="gold">
            {reindexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Reindex All
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Indexed Ads</p>
            <Database className="h-5 w-5 text-gold" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{queueStats.indexed}<span className="text-lg text-muted-foreground"> / {queueStats.total_ads}</span></p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pending</p>
            <Loader2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{queueStats.pending}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Failed</p>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{queueStats.failed}</p>
          {queueStats.failed > 0 && (
            <Button size="sm" variant="outline" className="mt-2" onClick={retryFailed}>Retry failed</Button>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Completed</p>
            <TrendingUp className="h-5 w-5 text-gold" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold">{queueStats.done}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" /> Popular searches (30d)
          </h2>
          {popular.length === 0 ? (
            <p className="text-sm text-muted-foreground">No searches yet.</p>
          ) : (
            <ul className="space-y-2">
              {popular.map((r) => (
                <li key={r.query} className="flex items-center justify-between text-sm">
                  <span className="truncate">{r.query}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{r.count}×</Badge>
                    <span className="text-xs text-muted-foreground">avg {r.avg_results}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" /> Zero-result searches
          </h2>
          {zero.length === 0 ? (
            <p className="text-sm text-muted-foreground">All searches are returning results 🎉</p>
          ) : (
            <ul className="space-y-2">
              {zero.map((r) => (
                <li key={r.query} className="flex items-center justify-between text-sm">
                  <span className="truncate">{r.query}</span>
                  <Badge variant="destructive">{r.count}×</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminSearch;
