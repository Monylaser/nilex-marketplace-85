// Semantic search endpoint. Embeds the user query, finds similar ads via pgvector, falls back to ILIKE on failure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

// In-memory cache (per isolate) for 1 hour
const cache = new Map<string, { ts: number; data: any }>();
const TTL = 60 * 60 * 1000;

async function embedQuery(q: string): Promise<number[] | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/text-embedding-004", input: q }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

    if (!q) {
      return new Response(JSON.stringify({ results: [], mode: "empty" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${q.toLowerCase()}|${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      return new Response(JSON.stringify({ ...cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mode: "ai" | "keyword" = "ai";
    let results: any[] = [];

    const vec = await embedQuery(q);
    if (vec) {
      const { data, error } = await admin.rpc("search_ads", {
        query_embedding: `[${vec.join(",")}]` as any,
        match_count: limit,
        min_similarity: 0.25,
      });
      if (!error && data) results = data;
    }

    // Fallback to keyword search
    if (results.length === 0) {
      mode = "keyword";
      const { data } = await admin
        .from("ads")
        .select("id,title,price,governorate,city,views,is_boosted,images_json,created_at,category_id")
        .eq("status", "active")
        .is("deleted_at", null)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      results = data || [];
    }

    // Log analytics (fire and forget)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await admin.auth.getUser(token);
        userId = user?.id ?? null;
      } catch { /* ignore */ }
    }
    admin.from("search_analytics").insert({
      user_id: userId,
      query: q,
      results_count: results.length,
      mode,
    }).then(() => {}, () => {});

    const payload = { results, mode, count: results.length };
    cache.set(cacheKey, { ts: Date.now(), data: payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message), results: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
