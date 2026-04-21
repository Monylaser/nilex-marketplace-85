import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Volume2, VolumeX, Loader2, MessageCircle, Tag } from "lucide-react";
import {
  setNotifySoundMuted,
  playNotifySound,
  unlockNotifySound,
  requestNotifyPermission,
  showBrowserNotification,
} from "@/lib/notifySound";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PermState = "default" | "granted" | "denied" | "unsupported";

const getPerm = (): PermState => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
};

interface Prefs {
  soundMuted: boolean;
  chatEnabled: boolean;
  listingsEnabled: boolean;
}

const DEFAULTS: Prefs = { soundMuted: false, chatEnabled: true, listingsEnabled: true };

const COL_MAP: Record<keyof Prefs, string> = {
  soundMuted: "notify_sound_muted",
  chatEnabled: "notify_chat_enabled",
  listingsEnabled: "notify_listings_enabled",
};

const NotificationSettings = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [perm, setPerm] = useState<PermState>("default");
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPerm(getPerm());
    let cancelled = false;

    (async () => {
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("notify_sound_muted,notify_chat_enabled,notify_listings_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        const next: Prefs = {
          soundMuted: !!data.notify_sound_muted,
          chatEnabled: data.notify_chat_enabled ?? true,
          listingsEnabled: data.notify_listings_enabled ?? true,
        };
        setPrefs(next);
        setNotifySoundMuted(next.soundMuted);
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updatePref = async <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const prev = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    if (key === "soundMuted") setNotifySoundMuted(value as boolean);

    if (user) {
      setSavingKey(key);
      const patch = { [COL_MAP[key]]: value as boolean } as unknown as Record<string, never>;
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      setSavingKey(null);
      if (error) {
        toast.error("Couldn't save preference");
        setPrefs((p) => ({ ...p, [key]: prev }));
        if (key === "soundMuted") setNotifySoundMuted(prev as boolean);
        return;
      }
    }

    // Friendly preview when turning sound back on (we're inside a user gesture)
    if (key === "soundMuted" && value === false) {
      await unlockNotifySound();
      await playNotifySound();
    }
  };

  const previewSound = async () => {
    if (prefs.soundMuted) {
      toast.error("Sound is muted. Turn it on first.");
      return;
    }
    await unlockNotifySound();
    await playNotifySound();
  };

  const enableBrowserNotifications = async () => {
    const ok = await requestNotifyPermission();
    setPerm(getPerm());
    if (ok) {
      showBrowserNotification("Notifications enabled", "You'll be notified of new activity.", {
        force: true,
      });
      toast.success("Browser notifications enabled");
    } else {
      toast.error("Permission denied. Enable notifications in your browser settings.");
    }
  };

  const Row = ({
    icon,
    title,
    desc,
    prefKey,
    invert = false,
  }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    prefKey: keyof Prefs;
    /** If true, the switch shows ON when pref is FALSE (used for soundMuted). */
    invert?: boolean;
  }) => {
    const raw = prefs[prefKey];
    const checked = invert ? !raw : raw;
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <Label htmlFor={prefKey} className="font-medium cursor-pointer">
              {title}
            </Label>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savingKey === prefKey && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Switch
            id={prefKey}
            checked={checked}
            disabled={!loaded || savingKey !== null}
            onCheckedChange={(v) => updatePref(prefKey, (invert ? !v : v) as never)}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="p-5 space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" /> Notifications & sound
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose what you're alerted about and how.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        <Row
          icon={<MessageCircle className="h-5 w-5 text-foreground mt-0.5" />}
          title="Chat messages"
          desc="New messages from buyers and sellers."
          prefKey="chatEnabled"
        />
        <Row
          icon={<Tag className="h-5 w-5 text-foreground mt-0.5" />}
          title="Listing alerts"
          desc="Ad approvals, expirations, and saved-search matches."
          prefKey="listingsEnabled"
        />
      </div>

      {/* Sound */}
      <div className="border-t border-border pt-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sound
        </p>
        <Row
          icon={
            prefs.soundMuted ? (
              <VolumeX className="h-5 w-5 text-muted-foreground mt-0.5" />
            ) : (
              <Volume2 className="h-5 w-5 text-foreground mt-0.5" />
            )
          }
          title="Notification sound"
          desc="Play a soft chime when an alert arrives."
          prefKey="soundMuted"
          invert
        />
        <Button variant="outline" size="sm" onClick={previewSound} disabled={prefs.soundMuted}>
          Preview sound
        </Button>
      </div>

      {/* Browser permission */}
      <div className="border-t border-border pt-5">
        <div className="flex items-start gap-3">
          {perm === "granted" ? (
            <Bell className="h-5 w-5 text-foreground mt-0.5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">Browser notifications</p>
            <p className="text-xs text-muted-foreground">
              {perm === "granted" && "Enabled — you'll see a popup when the tab isn't focused."}
              {perm === "default" && "Get a desktop popup for the categories you've enabled above."}
              {perm === "denied" && "Blocked. Enable notifications in your browser site settings."}
              {perm === "unsupported" && "Your browser does not support notifications."}
            </p>
          </div>
        </div>
        {perm === "default" && (
          <Button variant="gold" size="sm" className="mt-3" onClick={enableBrowserNotifications}>
            Enable notifications
          </Button>
        )}
      </div>
    </Card>
  );
};

export default NotificationSettings;
