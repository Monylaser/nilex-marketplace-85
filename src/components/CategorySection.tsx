import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Building2, Smartphone, Sofa } from "lucide-react";
import categoryCars from "@/assets/category-cars.jpg";
import categoryRealestate from "@/assets/category-realestate.jpg";
import { useT } from "@/lib/i18n";

const CategorySection = () => {
  const { t } = useT();
  const categories = [
    {
      name: t("cat.cars"),
      description: t("cat.cars.desc"),
      icon: Car,
      image: categoryCars,
      link: "/browse?category=cars",
      count: "12,400",
    },
    {
      name: t("cat.realEstate"),
      description: t("cat.realEstate.desc"),
      icon: Building2,
      image: categoryRealestate,
      link: "/browse?category=real-estate",
      count: "8,200",
    },
    {
      name: t("cat.electronics"),
      description: t("cat.electronics.desc"),
      icon: Smartphone,
      link: "/browse?category=electronics",
      count: "15,800",
    },
    {
      name: t("cat.furniture"),
      description: t("cat.furniture.desc"),
      icon: Sofa,
      link: "/browse?category=furniture",
      count: "4,600",
    },
  ];

  return (
    <section className="container py-16">
      <div className="flex flex-col items-start gap-2">
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
          {t("cat.title")}
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          {t("cat.title")}
        </h2>
        <p className="text-muted-foreground">{t("cat.subtitle")}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={cat.link}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover-lift hover:shadow-premium hover:border-gold/40"
            >
              {cat.image ? (
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center bg-secondary">
                  <cat.icon className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-gold shadow-soft">
                  <cat.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {cat.description} · {t("cat.adsCount", { count: cat.count })}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
