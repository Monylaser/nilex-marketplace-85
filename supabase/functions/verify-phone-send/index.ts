// Mock SMS OTP sender. Generates a 6-digit code, stores its SHA-256 hash,
// and (in dev) returns the code in the response so the UI can show it.
// Swap the "sendSms" stub for Twilio later without changing callers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EG_PHONE = /^\+20(10|11|12|15)\d{8}$/;

const sha256 = async (input: string) => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const sendSms = async (phone: string, code: string) => {
  // TODO: replace with Twilio gateway call. For now, log only.
  console.log(`[mock-sms] -> ${phone}: code=${code}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone } = await req.json();
    if (!phone || typeof phone !== "string" || !EG_PHONE.test(phone.trim())) {
      return new Response(
        JSON.stringify({
          error: "Invalid phone. Use Egyptian format +20XXXXXXXXXX",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(supabaseUrl, service);

    // Rate limit: max 3 sends per 10 minutes per user
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await admin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Try again in 10 minutes." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

    const { error } = await admin.from("phone_otps").insert({
      user_id: user.id,
      phone: phone.trim(),
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (error) throw error;

    await sendSms(phone, code);

    // Dev convenience: return the code so the user can complete the flow without SMS.
    return new Response(
      JSON.stringify({ ok: true, devCode: code, expiresAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
