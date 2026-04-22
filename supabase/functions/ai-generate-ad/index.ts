import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Rate limit: count generations in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("ai_generation_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Daily AI limit reached (10/day). Try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const keywords: string = (body?.keywords ?? "").toString().slice(0, 500);
    const images: string[] = Array.isArray(body?.images) ? body.images.slice(0, 5) : [];
    const categoriesHint: string = (body?.categoriesHint ?? "").toString().slice(0, 500);

    const systemPrompt = `أنت مساعد خبير في كتابة إعلانات السوق المصري على منصة Nilex.
حلّل الصور والكلمات المفتاحية ثم أعِد JSON منظم باللغة العربية الفصحى الواضحة.
يجب أن يكون الوصف احترافياً، جذاباً، ومناسباً للسوق المصري. اذكر الحالة، المميزات، وأسباب الشراء.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `الكلمات المفتاحية من البائع: "${keywords}"
${categoriesHint ? `الفئات المتاحة: ${categoriesHint}` : ""}

حلّل الصور (إن وجدت) واستنتج: الفئة، الحالة، نطاق السعر بالجنيه المصري، عنوان محسّن، ووصف احترافي.`,
      },
      ...images.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "create_ad_listing",
          description: "Generate a structured Arabic ad listing.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Improved Arabic title (max 80 chars)" },
              description: { type: "string", description: "Professional Arabic description (150-400 words)" },
              category: { type: "string", description: "Detected category name" },
              condition: { type: "string", enum: ["new", "used", "refurbished"] },
              price_min: { type: "number", description: "Suggested min price in EGP" },
              price_max: { type: "number", description: "Suggested max price in EGP" },
              key_features: { type: "array", items: { type: "string" } },
            },
            required: ["title", "description", "condition", "price_min", "price_max"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "create_ad_listing" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "AI rate limit, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no structured output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);

    // Log usage
    await admin.from("ai_generation_log").insert({ user_id: user.id, kind: "ad_description" });

    const remaining = Math.max(0, DAILY_LIMIT - ((count ?? 0) + 1));

    return new Response(JSON.stringify({ ...result, remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-ad error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
