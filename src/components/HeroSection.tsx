import { Search, ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { useT } from "@/lib/i18n";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useT();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/browse?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Cairo skyline" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/65 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.18),transparent_60%)]" />
      </div>

      <div className="container relative z-10 flex flex-col items-center py-24 text-center md:py-36">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-background/10 px-4 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          {t("brand.tagline")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl"
        >
          {t("hero.title.left")} <span className="text-gradient-gold">{t("hero.title.right")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-4 max-w-xl text-lg text-primary-foreground/80"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-background/95 shadow-premium"
        >
          <div className="flex items-center ps-4 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("hero.searchPlaceholder")}
            className="flex-1 bg-transparent px-3 py-4 text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            className="gradient-gold m-1.5 flex items-center gap-2 rounded-xl px-6 font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <span className="hidden sm:inline">{t("common.search")}</span>
            <Search className="h-5 w-5 sm:hidden" />
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-3 text-primary-foreground"
        >
          {[
            { icon: Sparkles, n: "40K+", l: t("hero.stats.ads") },
            { icon: ShieldCheck, n: "120K+", l: t("hero.stats.users") },
            { icon: MapPin, n: "27", l: t("hero.stats.cities") },
          ].map(({ icon: Icon, n, l }) => (
            <div key={l} className="rounded-xl border border-white/10 bg-background/10 p-3 backdrop-blur-md">
              <Icon className="mx-auto h-4 w-4 text-gold" />
              <div className="mt-1 font-display text-xl font-bold">{n}</div>
              <div className="text-[11px] uppercase tracking-wide text-primary-foreground/70">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
