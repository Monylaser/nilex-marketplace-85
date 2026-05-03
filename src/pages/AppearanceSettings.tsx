import Navbar from "@/components/Navbar";
import { useAppearance, type DarkMode, type FontSize, type LayoutStyle, type Density } from "@/hooks/useAppearance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";

const AppearanceSettings = () => {
  const { settings, resolvedTheme, update } = useAppearance();
  const { t } = useT();

  useEffect(() => {
    document.title = `${t("appear.title")} | ${t("brand.name")}`;
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold">{t("appear.title")}</h1>
          <p className="text-muted-foreground">{t("appear.subtitle")}</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {resolvedTheme === "dark" ? <Moon className="h-5 w-5 text-gold" /> : <Sun className="h-5 w-5 text-gold" />}
              {t("appear.theme")}
            </CardTitle>
            <CardDescription>{t("appear.theme.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as DarkMode[]).map((m) => {
                const Icon = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
                const active = settings.dark_mode === m;
                const label = m === "light" ? t("appear.theme.light") : m === "dark" ? t("appear.theme.dark") : t("appear.theme.system");
                return (
                  <button
                    key={m}
                    onClick={() => update({ dark_mode: m })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                      active ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-gold" /> {t("appear.fontSize")}</CardTitle>
            <CardDescription>{t("appear.fontSize.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={settings.font_size} onValueChange={(v) => update({ font_size: v as FontSize })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">{t("appear.size.sm")}</SelectItem>
                <SelectItem value="md">{t("appear.size.md")}</SelectItem>
                <SelectItem value="lg">{t("appear.size.lg")}</SelectItem>
                <SelectItem value="xl">{t("appear.size.xl")}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-gold" /> {t("appear.layout")}</CardTitle>
            <CardDescription>{t("appear.layout.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("appear.listingView")}</Label>
              <Select value={settings.layout_style} onValueChange={(v) => update({ layout_style: v as LayoutStyle })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">{t("appear.grid")}</SelectItem>
                  <SelectItem value="list">{t("appear.list")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("appear.density")}</Label>
              <Select value={settings.density} onValueChange={(v) => update({ density: v as Density })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">{t("appear.comfortable")}</SelectItem>
                  <SelectItem value="compact">{t("appear.compact")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5 text-gold" /> {t("appear.language")}</CardTitle>
            <CardDescription>{t("appear.language.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={settings.language} onValueChange={(v) => update({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">{t("appear.language.note")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-gold" /> {t("appear.accessibility")}</CardTitle>
            <CardDescription>{t("appear.accessibility.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <Label className="text-sm font-medium">{t("appear.highContrast")}</Label>
                <p className="text-xs text-muted-foreground">{t("appear.highContrast.desc")}</p>
              </div>
              <Switch checked={settings.high_contrast} onCheckedChange={(c) => update({ high_contrast: c })} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> {t("appear.reducedMotion")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("appear.reducedMotion.desc")}</p>
              </div>
              <Switch checked={settings.reduced_motion} onCheckedChange={(c) => update({ reduced_motion: c })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppearanceSettings;
