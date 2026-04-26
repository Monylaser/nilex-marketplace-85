import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, subDays, eachDayOfInterval } from "date-fns";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp, Eye, MessageSquare, Heart, Loader2, Download,
  Users, BarChart3, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

type RangeKey = "7" | "30" | "90";
type SortKey = "views" | "inquiries" | "ctr";

type DailyRow = {
  date: string;
  views: number;
  inquiries: number;
  favorites: number;
};

type AdRow = {
  id: string;
  title: string;
  status: string;
  views: number;       // lifetime (from ads.views)
  rangeViews: number;
  inquiries: number;
  favorites: number;
  ctr: number;         // inquiries / views (in range)
};

const SellerAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [range, setRange] = useState<RangeKey>("30");
  const [sort, setSort] = useState<SortKey>("views");
  const [loading, setLoading] = useState(true);

  // Aggregates
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [prevDaily, setPrevDaily] = useState<DailyRow[]>([]);
  const [adRows, setAdRows] = useState<AdRow[]>([]);
  const [uniqueViewers, setUniqueViewers] = useState(0);

  const days = Number(range);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // 1) Seller's ads
    const { data: ads } = await supabase
      .from("ads")
      .select("id, title, status, views, price")
      .eq("user_id", user.id);

    const adIds = (ads || []).map((a) => a.id);
    if (adIds.length === 0) {
      setAdRows([]); setDaily(buildEmptySeries(days)); setPrevDaily([]); setUniqueViewers(0);
      setLoading(false);
      return;
    }

    // Date windows
    const now = new Date();
    const fromDate = subDays(now, days - 1);
    const prevFrom = subDays(fromDate, days);
    const prevTo = subDays(fromDate, 1);

    const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

    // 2) Stats for current + previous window in one go (per-day rollup)
    const { data: stats } = await supabase
      .from("ad_stats")
      .select("ad_id, date, views, unique_views, inquiries, favorites")
      .in("ad_id", adIds)
      .gte("date", isoDate(prevFrom))
      .lte("date", isoDate(now));

    // 3) Unique viewers in current window (count distinct viewer_id)
    const { data: viewers } = await supabase
      .from("ad_views")
      .select("viewer_id")
      .in("ad_id", adIds)
      .gte("created_at", fromDate.toISOString())
      .not("viewer_id", "is", null);

    const uniqueSet = new Set((viewers || []).map((v: any) => v.viewer_id));
    setUniqueViewers(uniqueSet.size);

    // Split stats by window
    const currStats = (stats || []).filter((s: any) => s.date >= isoDate(fromDate));
    const prevStats = (stats || []).filter(
      (s: any) => s.date >= isoDate(prevFrom) && s.date <= isoDate(prevTo)
    );

    setDaily(buildSeries(currStats, fromDate, now));
    setPrevDaily(buildSeries(prevStats, prevFrom, prevTo));

    // 4) Per-ad rollup in range
    const perAd = new Map<string, { views: number; inquiries: number; favorites: number }>();
    for (const s of currStats as any[]) {
      const cur = perAd.get(s.ad_id) || { views: 0, inquiries: 0, favorites: 0 };
      cur.views += s.views;
      cur.inquiries += s.inquiries;
      cur.favorites += s.favorites;
      perAd.set(s.ad_id, cur);
    }

    const rows: AdRow[] = (ads || []).map((a) => {
      const r = perAd.get(a.id) || { views: 0, inquiries: 0, favorites: 0 };
      return {
        id: a.id,
        title: a.title,
        status: a.status,
        views: a.views || 0,
        rangeViews: r.views,
        inquiries: r.inquiries,
        favorites: r.favorites,
        ctr: r.views > 0 ? r.inquiries / r.views : 0,
      };
    });
    setAdRows(rows);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, range]);

  const sortedAds = useMemo(() => {
    const copy = [...adRows];
    if (sort === "views") copy.sort((a, b) => b.rangeViews - a.rangeViews);
    if (sort === "inquiries") copy.sort((a, b) => b.inquiries - a.inquiries);
    if (sort === "ctr") copy.sort((a, b) => b.ctr - a.ctr);
    return copy;
  }, [adRows, sort]);

  // KPIs
  const totals = useMemo(() => sumSeries(daily), [daily]);
  const prevTotals = useMemo(() => sumSeries(prevDaily), [prevDaily]);
  const conversion = totals.views > 0 ? totals.inquiries / totals.views : 0;

  // Combined chart data (this period vs previous, aligned by day index)
  const compareSeries = useMemo(() => {
    return daily.map((d, i) => ({
      date: format(new Date(d.date), "MMM d"),
      views: d.views,
      prevViews: prevDaily[i]?.views ?? 0,
      inquiries: d.inquiries,
      favorites: d.favorites,
    }));
  }, [daily, prevDaily]);

  const exportCsv = () => {
    if (adRows.length === 0) { toast.error("Nothing to export"); return; }
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = ["ad_id", "title", "status", "lifetime_views", "range_views", "inquiries", "favorites", "ctr_pct"];
    const rows = sortedAds.map((a) => [
      a.id, a.title, a.status, a.views, a.rangeViews, a.inquiries, a.favorites, (a.ctr * 100).toFixed(2),
    ].map(esc).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nilex-seller-analytics-${range}d-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(`Exported ${sortedAds.length} ads`);
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Please sign in to view your analytics.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-gold" /> Seller analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Track how your listings perform — views, inquiries and favorites.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={range} onValueChange={(v: RangeKey) => setRange(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} className="gap-1">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi icon={<Eye className="h-4 w-4" />} label="Views" value={totals.views} prev={prevTotals.views} />
              <Kpi icon={<Users className="h-4 w-4" />} label="Unique viewers" value={uniqueViewers} />
              <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Inquiries" value={totals.inquiries} prev={prevTotals.inquiries} />
              <Kpi icon={<Heart className="h-4 w-4" />} label="Favorites" value={totals.favorites} prev={prevTotals.favorites} />
              <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Conversion rate"
                   value={`${(conversion * 100).toFixed(1)}%`}
                   sub="inquiries ÷ views" />
              <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Active listings"
                   value={adRows.filter((a) => a.status === "active").length} />
              <Kpi icon={<Eye className="h-4 w-4" />} label="Lifetime views"
                   value={adRows.reduce((s, a) => s + a.views, 0)} />
              <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Avg inquiries / ad"
                   value={adRows.length ? (totals.inquiries / adRows.length).toFixed(1) : "0"} />
            </div>

            {/* Trend: views vs previous period */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-semibold">Views — this period vs previous</h2>
                <Badge variant="secondary">Last {days} days</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                    <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", color: "hsl(var(--popover-foreground))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="views" name="This period" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="prevViews" name="Previous period" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Inquiries + Favorites trend */}
            <Card className="p-4">
              <h2 className="font-display text-lg font-semibold mb-3">Inquiries & favorites trend</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareSeries}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                    <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", color: "hsl(var(--popover-foreground))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="inquiries" name="Inquiries" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="favorites" name="Favorites" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Top ads */}
            <Card className="p-0 overflow-hidden">
              <div className="p-4 flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-display text-lg font-semibold">Top performing ads</h2>
                <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">Most views</SelectItem>
                    <SelectItem value="inquiries">Most inquiries</SelectItem>
                    <SelectItem value="ctr">Highest CTR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead className="text-right">Views ({days}d)</TableHead>
                    <TableHead className="text-right">Inquiries</TableHead>
                    <TableHead className="text-right">Favorites</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAds.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        You don't have any ads yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {sortedAds.slice(0, 20).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link to={`/ad/${a.id}`} className="font-medium hover:text-primary line-clamp-1">
                          {a.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{a.rangeViews.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.inquiries.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.favorites.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{(a.ctr * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={a.status === "active" ? "secondary" : "outline"}>{a.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

/** Build a date-aligned series, filling missing days with zeros. */
function buildSeries(stats: any[], from: Date, to: Date): DailyRow[] {
  const days = eachDayOfInterval({ start: from, end: to });
  const map = new Map<string, DailyRow>();
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd");
    map.set(key, { date: key, views: 0, inquiries: 0, favorites: 0 });
  }
  for (const s of stats) {
    const row = map.get(s.date);
    if (row) {
      row.views += s.views;
      row.inquiries += s.inquiries;
      row.favorites += s.favorites;
    }
  }
  return Array.from(map.values());
}

function buildEmptySeries(days: number): DailyRow[] {
  const now = new Date();
  return buildSeries([], subDays(now, days - 1), now);
}

function sumSeries(s: DailyRow[]) {
  return s.reduce(
    (acc, d) => ({
      views: acc.views + d.views,
      inquiries: acc.inquiries + d.inquiries,
      favorites: acc.favorites + d.favorites,
    }),
    { views: 0, inquiries: 0, favorites: 0 }
  );
}

const Kpi = ({
  icon, label, value, prev, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  prev?: number;
  sub?: string;
}) => {
  let delta: number | null = null;
  if (typeof value === "number" && typeof prev === "number") {
    if (prev === 0 && value === 0) delta = 0;
    else if (prev === 0) delta = 100;
    else delta = ((value - prev) / prev) * 100;
  }
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
        {delta !== null && (
          <span className={`text-xs flex items-center gap-0.5 ${up ? "text-primary" : "text-destructive"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
};

export default SellerAnalytics;
