import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DarkMode = "light" | "dark" | "system";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type LayoutStyle = "grid" | "list";
export type Density = "comfortable" | "compact";

export interface AppearanceSettings {
  dark_mode: DarkMode;
  font_size: FontSize;
  layout_style: LayoutStyle;
  density: Density;
  language: string;
  high_contrast: boolean;
  reduced_motion: boolean;
}

const DEFAULTS: AppearanceSettings = {
  dark_mode: "system",
  font_size: "md",
  layout_style: "grid",
  density: "comfortable",
  language: "en",
  high_contrast: false,
  reduced_motion: false,
};

const STORAGE_KEY = "nilex.appearance";

interface Ctx {
  settings: AppearanceSettings;
  resolvedTheme: "light" | "dark";
  update: (patch: Partial<AppearanceSettings>) => Promise<void>;
  toggleDark: () => Promise<void>;
}

const AppearanceCtx = createContext<Ctx>({
  settings: DEFAULTS,
  resolvedTheme: "light",
  update: async () => {},
  toggleDark: async () => {},
});

function loadLocal(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function applyToDom(s: AppearanceSettings, resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("high-contrast", s.high_contrast);
  root.classList.toggle("reduced-motion", s.reduced_motion);
  root.setAttribute("data-font-size", s.font_size);
  root.setAttribute("data-density", s.density);
  root.setAttribute("lang", s.language);
  root.setAttribute("dir", s.language === "ar" ? "rtl" : "ltr");
}

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings>(() => loadLocal());
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );

  const resolvedTheme: "light" | "dark" =
    settings.dark_mode === "system" ? (systemDark ? "dark" : "light") : settings.dark_mode;

  // Watch system pref
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Apply to DOM whenever settings or resolved theme change
  useEffect(() => {
    applyToDom(settings, resolvedTheme);
  }, [settings, resolvedTheme]);

  // Sync from DB on login
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_appearance_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const merged: AppearanceSettings = {
          dark_mode: (data.dark_mode as DarkMode) ?? DEFAULTS.dark_mode,
          font_size: (data.font_size as FontSize) ?? DEFAULTS.font_size,
          layout_style: (data.layout_style as LayoutStyle) ?? DEFAULTS.layout_style,
          density: (data.density as Density) ?? DEFAULTS.density,
          language: data.language ?? DEFAULTS.language,
          high_contrast: !!data.high_contrast,
          reduced_motion: !!data.reduced_motion,
        };
        setSettings(merged);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
      } else {
        // First sign-in: persist current local prefs to DB
        await supabase
          .from("user_appearance_settings")
          .insert({ user_id: user.id, ...settings });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const update = useCallback(
    async (patch: Partial<AppearanceSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      if (user) {
        await supabase
          .from("user_appearance_settings")
          .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
      }
    },
    [settings, user],
  );

  const toggleDark = useCallback(async () => {
    const next: DarkMode = resolvedTheme === "dark" ? "light" : "dark";
    await update({ dark_mode: next });
  }, [resolvedTheme, update]);

  const value = useMemo(
    () => ({ settings, resolvedTheme, update, toggleDark }),
    [settings, resolvedTheme, update, toggleDark],
  );

  return <AppearanceCtx.Provider value={value}>{children}</AppearanceCtx.Provider>;
};

export const useAppearance = () => useContext(AppearanceCtx);
