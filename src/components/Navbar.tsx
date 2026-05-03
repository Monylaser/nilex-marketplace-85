import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, X, User, LogOut, Shield, MessageCircle, Sun, Moon, Palette, Languages } from "lucide-react";
import { useAppearance } from "@/hooks/useAppearance";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useNotifyPrefs } from "@/hooks/useNotifyPrefs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { playNotifySound, requestNotifyPermission, showBrowserNotification } from "@/lib/notifySound";
import { useT } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadMessages();
  const prefs = useNotifyPrefs();
  const { resolvedTheme, toggleDark, settings, update } = useAppearance();
  const { t } = useT();

  useEffect(() => {
    if (!user) return;
    requestNotifyPermission();
    const ch = supabase
      .channel(`global-msg-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          if (!prefs.chatEnabled) return;
          const m: any = payload.new;
          if (window.location.pathname === `/chat/${m.sender_id}`) return;
          playNotifySound();
          const { data: p } = await supabase
            .from("profiles").select("name").eq("id", m.sender_id).maybeSingle();
          showBrowserNotification(`New message from ${p?.name || "User"}`, m.message.slice(0, 80));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, prefs.chatEnabled]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleLang = () =>
    update({ language: settings.language === "ar" ? "en" : "ar" });

  return (
    <nav className="sticky top-0 z-50 border-b border-border glass">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="font-display text-2xl font-bold text-gradient-gold shrink-0">
          {t("brand.name")}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">{t("nav.home")}</Link>
          <Link to="/browse" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">{t("nav.browse")}</Link>
          <Link to="/browse?category=cars" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">{t("nav.cars")}</Link>
          <Link to="/browse?category=real-estate" className="text-sm font-medium text-foreground/70 transition hover:text-foreground">{t("nav.realEstate")}</Link>

          <Link to="/post-ad">
            <Button variant="gold" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> {t("nav.postAd")}
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleLang}
            aria-label="Toggle language"
            title={settings.language === "ar" ? "English" : "العربية"}
          >
            <Languages className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleDark}
            aria-label={resolvedTheme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
            title={resolvedTheme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <>
              <Link to="/chat" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                {unread > 0 && (
                  <Badge className="absolute -end-1 -top-1 h-5 min-w-5 px-1 bg-gold text-accent-foreground text-[10px] flex items-center justify-center rounded-full">
                    {unread > 9 ? "9+" : unread}
                  </Badge>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="me-2 h-4 w-4" /> {t("nav.account")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/chat")}>
                    <MessageCircle className="me-2 h-4 w-4" /> {t("nav.messages")}
                    {unread > 0 && <Badge className="ms-auto bg-gold text-accent-foreground">{unread}</Badge>}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="me-2 h-4 w-4" /> {t("nav.admin")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings/appearance")}>
                    <Palette className="me-2 h-4 w-4" /> {t("nav.appearance")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="me-2 h-4 w-4" /> {t("common.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth"><Button variant="outline" size="sm">{t("common.signIn")}</Button></Link>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.home")}</Link>
              <Link to="/browse" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.browse")}</Link>
              <Link to="/browse?category=cars" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.cars")}</Link>
              <Link to="/browse?category=real-estate" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.realEstate")}</Link>
              <Link to="/post-ad" onClick={() => setMobileOpen(false)}>
                <Button variant="gold" size="sm" className="w-full gap-1.5">
                  <Plus className="h-4 w-4" /> {t("nav.postAd")}
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={toggleLang}>
                  <Languages className="h-4 w-4" /> {settings.language === "ar" ? "English" : "العربية"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={toggleDark}>
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {resolvedTheme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
                </Button>
              </div>
              {user ? (
                <>
                  <Link to="/chat" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2 flex items-center gap-2">
                    {t("nav.messages")}
                    {unread > 0 && <Badge className="bg-gold text-accent-foreground">{unread}</Badge>}
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.account")}</Link>
                  <Link to="/settings/appearance" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.appearance")}</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">{t("nav.admin")}</Link>}
                  <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>{t("common.signOut")}</Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">{t("common.signIn")}</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
