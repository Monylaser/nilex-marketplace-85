import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useT();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="font-display text-7xl font-bold text-gradient-gold">404</h1>
        <p className="mt-3 font-display text-2xl font-semibold">{t("nf.title")}</p>
        <p className="mt-2 max-w-md text-muted-foreground">{t("nf.subtitle")}</p>
        <a href="/" className="mt-6 inline-block">
          <Button variant="gold">{t("nf.cta")}</Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
