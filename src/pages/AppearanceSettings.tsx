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
import { Sun, Moon, Monitor, Type, LayoutGrid, Languages, Eye, Activity } from "lucide-react";
import { Helmet } from "react-helmet";

const AppearanceSettings = () => {
  const { settings, resolvedTheme, update } = useAppearance();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Appearance Settings | Nilex</title>
        <meta name="description" content="Customize Nilex appearance: dark mode, font size, layout, language, and accessibility." />
      </Helmet>
      <Navbar />
      <div className="container max-w-3xl py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold">Appearance</h1>
          <p className="text-muted-foreground">Customize how Nilex looks and feels.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {resolvedTheme === "dark" ? <Moon className="h-5 w-5 text-gold" /> : <Sun className="h-5 w-5 text-gold" />}
              Theme
            </CardTitle>
            <CardDescription>Choose light, dark, or follow your system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as DarkMode[]).map((m) => {
                const Icon = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
                const active = settings.dark_mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => update({ dark_mode: m })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                      active ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm capitalize">{m}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-gold" /> Font size</CardTitle>
            <CardDescription>Adjust text size across the entire app.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={settings.font_size} onValueChange={(v) => update({ font_size: v as FontSize })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium (default)</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-gold" /> Layout</CardTitle>
            <CardDescription>Default view and spacing for ad listings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Listing view</Label>
              <Select value={settings.layout_style} onValueChange={(v) => update({ layout_style: v as LayoutStyle })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Density</Label>
              <Select value={settings.density} onValueChange={(v) => update({ density: v as Density })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5 text-gold" /> Language</CardTitle>
            <CardDescription>Choose your preferred language.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={settings.language} onValueChange={(v) => update({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Full translations are coming soon. Your preference is saved.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-gold" /> Accessibility</CardTitle>
            <CardDescription>Make Nilex easier to use.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <Label className="text-sm font-medium">High contrast</Label>
                <p className="text-xs text-muted-foreground">Stronger borders and text contrast.</p>
              </div>
              <Switch
                checked={settings.high_contrast}
                onCheckedChange={(c) => update({ high_contrast: c })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Reduced motion
                </Label>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions.</p>
              </div>
              <Switch
                checked={settings.reduced_motion}
                onCheckedChange={(c) => update({ reduced_motion: c })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppearanceSettings;
