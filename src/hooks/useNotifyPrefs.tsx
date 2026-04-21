import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NotifyPrefs {
  soundMuted: boolean;
  chatEnabled: boolean;
  listingsEnabled: boolean;
}

const DEFAULTS: NotifyPrefs = {
  soundMuted: false,
  chatEnabled: true,
  listingsEnabled: true,
};

const CACHE_KEY = "nilex.notifyPrefs";

const readCache = (): NotifyPrefs => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
};

const writeCache = (p: NotifyPrefs) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

/** Read-only hook — current user's notification preferences with realtime sync. */
export const useNotifyPrefs = (): NotifyPrefs => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifyPrefs>(readCache());

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULTS);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notify_sound_muted,notify_chat_enabled,notify_listings_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      const next: NotifyPrefs = {
        soundMuted: !!data.notify_sound_muted,
        chatEnabled: data.notify_chat_enabled ?? true,
        listingsEnabled: data.notify_listings_enabled ?? true,
      };
      setPrefs(next);
      writeCache(next);
    })();

    const ch = supabase
      .channel(`prefs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const r: any = payload.new;
          const next: NotifyPrefs = {
            soundMuted: !!r.notify_sound_muted,
            chatEnabled: r.notify_chat_enabled ?? true,
            listingsEnabled: r.notify_listings_enabled ?? true,
          };
          setPrefs(next);
          writeCache(next);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);

  return prefs;
};

export const cachedNotifyPrefs = readCache;
