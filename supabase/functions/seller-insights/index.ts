import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { days = 30 } = await req.json().catch(() => ({}));
    const range = Math.min(Math.max(Number(days) || 30, 7), 90);

    // Fetch seller's ads
    const { data: ads } = await supabase
      .from("ads").select("id, title, status, price").eq("user_id", user.id);
    const adIds = (ads || []).map((a) => a.id);

    if (adIds.length === 0) {
      return new Response(JSON.stringify({ insights: [], summary: "You don't have any ads yet. Post one to start seeing insights." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const isoDate = (d: Date) => d.toISOString().slice(0, 10);
    const fromDate = new Date(today); fromDate.setDate(today.getDate() - (range - 1));
    const prevFrom = new Date(fromDate); prevFrom.setDate(fromDate.getDate() - range);
    const prevTo = new Date(fromDate); prevTo.setDate(fromDate.getDate() - 1);

    const { data: stats } = await supabase
      .from("ad_stats")
      .select("ad_id, date, views, inquiries, favorites")
      .in("ad_id", adIds)
      .gte("date", isoDate(prevFrom))
      .lte("date", isoDate(today));

    const curr = (stats || []).filter((s: any) => s.date >= isoDate(fromDate));
    const prev = (stats || []).filter((s: any) => s.date >= isoDate(prevFrom) && s.date <= isoDate(prevTo));

    const sumBy = (rows: any[]) => rows.reduce(
      (a, r) => ({ views: a.views + r.views, inquiries: a.inquiries + r.inquiries, favorites: a.favorites + r.favorites }),
      { views: 0, inquiries: 0, favorites: 0 }
    );
    const currT = sumBy(curr); const prevT = sumBy(prev);

    const perAd = new Map<string, { views: number; inquiries: number; favorites: number }>();
    const perAdPrev = new Map<string, { views: number; inquiries: number; favorites: number }>();
    for (const s of curr as any[]) {
      const c = perAd.get(s.ad_id) || { views: 0, inquiries: 0, favorites: 0 };
      c.views += s.views; c.inquiries += s.inquiries; c.favorites += s.favorites;
      perAd.set(s.ad_id, c);
    }
    for (const s of prev as any[]) {
      const c = perAdPrev.get(s.ad_id) || { views: 0, inquiries: 0, favorites: 0 };
      c.views += s.views; c.inquiries += s.inquiries; c.favorites += s.favorites;
      perAdPrev.set(s.ad_id, c);
    }

    const adRows = (ads || []).map((a) => {
      const c = perAd.get(a.id) || { views: 0, inquiries: 0, favorites: 0 };
      const p = perAdPrev.get(a.id) || { views: 0, inquiries: 0, favorites: 0 };
      return {
        id: a.id, title: a.title, status: a.status, price: Number(a.price || 0),
        views: c.views, inquiries: c.inquiries, favorites: c.favorites,
        prev_views: p.views, prev_inquiries: p.inquiries, prev_favorites: p.favorites,
        ctr: c.views > 0 ? c.inquiries / c.views : 0,
      };
    });

    // Compute averages for outlier detection
    const adsWithViews = adRows.filter((a) => a.views >= 5);
    const avgCtr = adsWithViews.length
      ? adsWithViews.reduce((s, a) => s + a.ctr, 0) / adsWithViews.length : 0;

    const standouts = adRows
      .map((a) => {
        const favGrowth = a.prev_favorites > 0
          ? (a.favorites - a.prev_favorites) / a.prev_favorites
          : (a.favorites > 0 ? 1 : 0);
        return { ...a, fav_growth_pct: favGrowth * 100, ctr_vs_avg: avgCtr > 0 ? a.ctr / avgCtr : 0 };
      })
      .filter((a) =>
        (a.views >= 5 && avgCtr > 0 && a.ctr_vs_avg >= 1.5) ||
        (a.favorites >= 3 && a.fav_growth_pct >= 50)
      )
      .sort((a, b) => b.ctr_vs_avg - a.ctr_vs_avg)
      .slice(0, 5);

    // Build compact prompt
    const summaryData = {
      range_days: range,
      totals: { current: currT, previous: prevT },
      avg_ctr_pct: Number((avgCtr * 100).toFixed(2)),
      top_ads: adRows.sort((a, b) => b.views - a.views).slice(0, 8).map((a) => ({
        title: a.title.slice(0, 60), price: a.price,
        views: a.views, inquiries: a.inquiries, favorites: a.favorites,
        prev_views: a.prev_views, prev_inquiries: a.prev_inquiries,
        ctr_pct: Number((a.ctr * 100).toFixed(2)),
      })),
      standouts: standouts.map((a) => ({
        title: a.title.slice(0, 60),
        ctr_pct: Number((a.ctr * 100).toFixed(2)),
        fav_growth_pct: Number(a.fav_growth_pct.toFixed(0)),
        ctr_vs_avg: Number(a.ctr_vs_avg.toFixed(2)),
      })),
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a marketplace analytics expert for Nilex (Egyptian classifieds). Analyze seller performance data and return concise, actionable insights. Be direct, specific, and reference actual numbers. Use Egyptian Pounds (EGP) for prices. Never invent data not present in the input.",
          },
          {
            role: "user",
            content: `Analyze the last ${range} days vs the previous ${range} days for this seller. Identify: (1) what drove view changes, (2) what drove inquiry changes, (3) standout ads with unusually high CTR or fast-growing favorites. Data:\n${JSON.stringify(summaryData)}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_insights",
            description: "Return a short summary plus 3-6 specific insight bullets.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "1-2 sentence headline of the period." },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      detail: { type: "string" },
                      severity: { type: "string", enum: ["positive", "neutral", "warning"] },
                      category: { type: "string", enum: ["views", "inquiries", "favorites", "ctr", "pricing", "general"] },
                    },
                    required: ["title", "detail", "severity", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_insights" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { summary: "", insights: [] };

    return new Response(JSON.stringify({
      ...args,
      standouts: standouts.map((a) => ({
        id: a.id, title: a.title, ctr: a.ctr,
        fav_growth_pct: a.fav_growth_pct, ctr_vs_avg: a.ctr_vs_avg,
        views: a.views, inquiries: a.inquiries, favorites: a.favorites,
      })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seller-insights error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
