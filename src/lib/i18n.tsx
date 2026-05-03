import { createContext, ReactNode, useContext, useMemo } from "react";
import { useAppearance } from "@/hooks/useAppearance";
import { en } from "./i18n/en";
import { ar } from "./i18n/ar";

export type Lang = "en" | "ar";
export type Dir = "ltr" | "rtl";

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en, ar };

interface I18nCtx {
  lang: Lang;
  dir: Dir;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "en",
  dir: "ltr",
  t: (k) => k,
});

function format(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useAppearance();
  const lang: Lang = settings.language === "ar" ? "ar" : "en";
  const dir: Dir = lang === "ar" ? "rtl" : "ltr";

  const value = useMemo<I18nCtx>(() => {
    const dict = dicts[lang] || en;
    return {
      lang,
      dir,
      t: (key, vars) => format(dict[key] ?? en[key] ?? key, vars),
    };
  }, [lang, dir]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useT = () => useContext(Ctx);
