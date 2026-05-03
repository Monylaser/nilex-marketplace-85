import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Heart, Eye, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

interface Ad {
  id: string;
  title: string;
  price: number;
  governorate: string;
  city: string | null;
  views: number;
  is_boosted: boolean;
  images_json: any;
  categories?: { name: string } | null;
}

const FeaturedListings = () => {
  const { t } = useT();
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    supabase
      .from("ads")
      .select("id,title,price,governorate,city,views,is_boosted,images_json,categories(name)")
      .eq("status", "active")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setAds((data as any) || []));
  }, []);

  return (
    <section className="container py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            {t("featured.title")}
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("featured.title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("featured.subtitle")}</p>
        </div>
        <Link to="/browse" className="hidden sm:inline-flex">
          <Button variant="outline" className="gap-2">
            {t("featured.viewAll")} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad, i) => {
          const img = Array.isArray(ad.images_json) ? ad.images_json[0] : null;
          return (
            <motion.article
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/ad/${ad.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card hover-lift hover:shadow-premium hover:border-gold/40"
              >
                <div className="relative h-52 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={ad.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                      {t("ad.noImage")}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-muted-foreground backdrop-blur-sm transition hover:text-terracotta"
                    aria-label="Save"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <div className="absolute start-3 top-3 flex gap-1.5">
                    {ad.is_boosted && (
                      <Badge className="gap-1 bg-gold text-accent-foreground border-0">
                        <Sparkles className="h-3 w-3" /> {t("browse.boosted")}
                      </Badge>
                    )}
                    {ad.categories?.name && (
                      <Badge className="bg-primary/85 text-primary-foreground border-0 backdrop-blur-sm">
                        {ad.categories.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-1">{ad.title}</h3>
                  <p className="mt-1 font-display text-xl font-bold text-gradient-gold">
                    {Number(ad.price).toLocaleString()} {t("common.egp")}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {ad.city || ad.governorate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> {ad.views} {t("common.views")}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          );
        })}
        {ads.length === 0 &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
      </div>
    </section>
  );
};

export default FeaturedListings;
