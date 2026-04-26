import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Loader2, TrendingUp, Heart, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

type Insight = {
  title: string;
  detail: string;
  severity: "positive" | "neutral" | "warning";
  category: "views" | "inquiries" | "favorites" | "ctr" | "pricing" | "general";
};

type Standout = {
  id: string;
  title: string;
  ctr: number;
  fav_growth_pct: number;
  ctr_vs_avg: number;
  views: number;
  inquiries: number;
  favorites: number;
};

type Response = {
  summary: string;
  insights: Insight[];
  standouts: Standout[];
};

const severityIcon = (s: Insight["severity"]) => {
  if (s === "positive") return <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
  if (s === "warning") return <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
};

const SellerInsightsPanel = ({ days }: { days: number }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Response | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("seller-insights", {
        body: { days },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as Response);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); /* eslint-disable-next-line */ }, [days]);

  return (
    <Card className="p-4 border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-transparent">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" /> AI insights
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} className="gap-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your performance…
        </div>
      )}

      {data && (
        <>
          {data.summary && (
            <p className="text-sm leading-relaxed mb-4">{data.summary}</p>
          )}

          {data.insights?.length > 0 && (
            <ul className="space-y-2.5 mb-4">
              {data.insights.map((i, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  {severityIcon(i.severity)}
                  <div className="flex-1">
                    <span className="font-medium">{i.title}</span>
                    <span className="text-muted-foreground"> — {i.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.standouts?.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Standout ads
              </p>
              <div className="space-y-2">
                {data.standouts.map((s) => (
                  <Link key={s.id} to={`/ad/${s.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition">
                    <span className="text-sm font-medium line-clamp-1 flex-1">{s.title}</span>
                    <div className="flex gap-1.5 shrink-0">
                      {s.ctr_vs_avg >= 1.5 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <TrendingUp className="h-3 w-3" />
                          {(s.ctr * 100).toFixed(1)}% CTR
                        </Badge>
                      )}
                      {s.fav_growth_pct >= 50 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Heart className="h-3 w-3" />
                          +{s.fav_growth_pct.toFixed(0)}% favs
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {data.insights?.length === 0 && data.standouts?.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              Not enough activity yet to surface insights. Check back after a few more views.
            </p>
          )}
        </>
      )}
    </Card>
  );
};

export default SellerInsightsPanel;
