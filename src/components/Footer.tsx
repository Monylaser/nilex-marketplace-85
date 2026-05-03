import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";

const Footer = () => {
  const { t } = useT();
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display text-xl font-bold text-gradient-gold">{t("brand.name")}</h3>
            <p className="mt-2 text-sm text-primary-foreground/60">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t("footer.categories")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
              <li><Link to="/browse?category=cars" className="hover:text-primary-foreground transition">{t("nav.cars")}</Link></li>
              <li><Link to="/browse?category=real-estate" className="hover:text-primary-foreground transition">{t("nav.realEstate")}</Link></li>
              <li><Link to="/browse?category=electronics" className="hover:text-primary-foreground transition">{t("cat.electronics")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t("footer.company")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
              <li><span className="hover:text-primary-foreground transition cursor-pointer">{t("footer.about")}</span></li>
              <li><span className="hover:text-primary-foreground transition cursor-pointer">{t("footer.contact")}</span></li>
              <li><span className="hover:text-primary-foreground transition cursor-pointer">{t("footer.terms")}</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t("footer.cities")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/60">
              <li>{t("hero.title.right") /* falls to localized */}</li>
              <li>Cairo / القاهرة</li>
              <li>Alexandria / الإسكندرية</li>
              <li>Giza / الجيزة</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/40">
          {t("footer.copy")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
