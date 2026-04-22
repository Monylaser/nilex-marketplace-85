// Background worker: process pending rows in search_queue, generate embeddings via Lovable AI Gateway (Gemini text-embedding-004), and store them on ads.embedding
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function embed(text: string): Promise<number[]> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004",
      input: text.slice(0, 8000),
    }),
  });
  if (!resp.ok) {
    throw new Error(`Embed API ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  const vec = data?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error("Bad embedding response");
  return vec;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchSize = Math.min(Number(body.batch_size) || 20, 50);
    const reindexAll = !!body.reindex_all;

    // If admin asked for full reindex, enqueue every active ad first
    if (reindexAll) {
      const { error: enqErr } = await admin.rpc as any; // noop
      const { data: ads } = await admin
        .from("ads")
        .select("id")
        .eq("status", "active")
        .is("deleted_at", null);
      if (ads?.length) {
        const rows = ads.map((a) => ({ ad_id: a.id }));
        // ignore conflicts
        await admin.from("search_queue").upsert(rows, { onConflict: "ad_id" } as any);
      }
    }

    // Claim pending rows
    const { data: queueRows, error: claimErr } = await admin
      .from("search_queue")
      .select("id, ad_id, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (claimErr) throw claimErr;
    if (!queueRows || queueRows.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = queueRows.map((r) => r.id);
    await admin
      .from("search_queue")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .in("id", ids);

    // Fetch ad data
    const adIds = queueRows.map((r) => r.ad_id);
    const { data: ads } = await admin
      .from("ads")
      .select("id, title, description, subcategory, governorate, city, categories(name)")
      .in("id", adIds);

    const adMap = new Map((ads || []).map((a: any) => [a.id, a]));

    let success = 0;
    let failed = 0;

    for (const row of queueRows) {
      const ad: any = adMap.get(row.ad_id);
      if (!ad) {
        await admin.from("search_queue").update({ status: "failed", error: "ad not found", updated_at: new Date().toISOString() }).eq("id", row.id);
        failed++;
        continue;
      }
      const text = [
        ad.title,
        ad.description,
        ad.categories?.name,
        ad.subcategory,
        ad.governorate,
        ad.city,
      ].filter(Boolean).join(" \n ");

      try {
        const vec = await embed(text);
        const vecLiteral = `[${vec.join(",")}]`;
        const { error: upErr } = await admin
          .from("ads")
          .update({ embedding: vecLiteral as any, embedding_updated_at: new Date().toISOString() })
          .eq("id", ad.id);
        if (upErr) throw upErr;
        await admin.from("search_queue").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", row.id);
        success++;
      } catch (e) {
        const attempts = (row.attempts || 0) + 1;
        const status = attempts >= 3 ? "failed" : "pending";
        await admin.from("search_queue").update({
          status,
          attempts,
          error: String((e as Error).message).slice(0, 500),
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed: queueRows.length, success, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
