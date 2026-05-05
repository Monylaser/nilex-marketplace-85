import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success(t("auth.created"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || t("auth.failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <Link to="/" className="block text-center font-display text-3xl font-bold text-gradient-gold">
          {t("brand.name")}
        </Link>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("brand.tagline")}
        </p>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t("common.signIn")}</TabsTrigger>
            <TabsTrigger value="signup">{t("common.signUp")}</TabsTrigger>
          </TabsList>

          <form onSubmit={handleEmail} className="mt-6 space-y-4">
            <TabsContent value="signup" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required={mode === "signup"} />
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? t("common.signUp") : t("common.signIn")}
            </Button>
          </form>
        </Tabs>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          {t("auth.continueWithGoogle")}
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to Nilex's terms of service.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
