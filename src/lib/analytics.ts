import { supabase } from "@/integrations/supabase/client";

/** Detect device class from user agent (rough but adequate for analytics). */
const getDevice = (): "mobile" | "tablet" | "desktop" => {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/.test(ua)) return "mobile";
  return "desktop";
};

/**
 * Dedupe key so a refresh within an hour doesn't double-count.
 * Owner views are skipped entirely.
 */
const seenKey = (adId: string) => `nilex:viewed:${adId}`;
const ONE_HOUR = 60 * 60 * 1000;

/** Record a view event + bump the daily rollup. Best-effort, never throws. */
export async function trackAdView(adId: string, ownerId?: string | null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && ownerId && user.id === ownerId) return; // skip self-views

    const stored = localStorage.getItem(seenKey(adId));
    const isUnique = !stored || Date.now() - Number(stored) > ONE_HOUR;
    if (!isUnique) return; // already counted recently
    localStorage.setItem(seenKey(adId), String(Date.now()));

    let governorate: string | null = null;
    if (user) {
      const { data: prof } = await supabase
        .from("profiles").select("governorate").eq("id", user.id).maybeSingle();
      governorate = prof?.governorate ?? null;
    }

    await supabase.from("ad_views").insert({
      ad_id: adId,
      viewer_id: user?.id ?? null,
      device: getDevice(),
      governorate,
      user_agent: navigator.userAgent.slice(0, 255),
    });

    await (supabase.rpc as any)("increment_ad_stats", {
      _ad_id: adId,
      _views: 1,
      _unique_views: 1,
      _inquiries: 0,
      _favorites: 0,
    });
  } catch (e) {
    // Analytics must never break the page
    console.warn("trackAdView failed", e);
  }
}

export async function trackInquiry(adId: string) {
  try {
    await (supabase.rpc as any)("increment_ad_stats", {
      _ad_id: adId, _views: 0, _unique_views: 0, _inquiries: 1, _favorites: 0,
    });
  } catch (e) { console.warn("trackInquiry failed", e); }
}

export async function trackFavorite(adId: string, delta: 1 | -1) {
  try {
    await (supabase.rpc as any)("increment_ad_stats", {
      _ad_id: adId, _views: 0, _unique_views: 0, _inquiries: 0, _favorites: delta,
    });
  } catch (e) { console.warn("trackFavorite failed", e); }
}
