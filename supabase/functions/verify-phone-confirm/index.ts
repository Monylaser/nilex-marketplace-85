// Confirms a phone OTP and grants Level 1 verification when both phone & email pass.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sha256 = async (input: string) => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

    const { code } = await req.json();
    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, service);
    const { data: otp } = await admin
      .from("phone_otps")
      .select("id, code_hash, attempts, expires_at, consumed_at, phone")
      .eq("user_id", user.id)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return new Response(JSON.stringify({ error: "No active code. Request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code expired. Request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submittedHash = await sha256(code);
    if (submittedHash !== otp.code_hash) {
      await admin.from("phone_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP consumed + persist phone on profile
    await admin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
    await admin
      .from("profiles")
      .update({ phone: otp.phone, phone_verified_at: new Date().toISOString() })
      .eq("id", user.id);

    // Grant Level 1 only if email is also confirmed
    const emailConfirmed = !!user.email_confirmed_at;
    let levelGranted = false;

    if (emailConfirmed) {
      const { error } = await admin
        .from("verifications")
        .upsert(
          {
            user_id: user.id,
            level: 1,
            status: "approved",
            verified_at: new Date().toISOString(),
            documents_json: { phone: otp.phone, email: user.email },
          },
          { onConflict: "user_id,level" },
        );
      if (!error) levelGranted = true;
    }

    return new Response(
      JSON.stringify({ ok: true, phoneVerified: true, emailConfirmed, levelGranted }),
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
