import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import {
  isNotifySoundMuted,
  setNotifySoundMuted,
  playNotifySound,
  unlockNotifySound,
  requestNotifyPermission,
  showBrowserNotification,
} from "@/lib/notifySound";
import { toast } from "sonner";

type PermState = "default" | "granted" | "denied" | "unsupported";

const getPerm = (): PermState => {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
};

const NotificationSettings = () => {
  const [muted, setMuted] = useState<boolean>(false);
  const [perm, setPerm] = useState<PermState>("default");

  useEffect(() => {
    setMuted(isNotifySoundMuted());
    setPerm(getPerm());
  }, []);

  const toggleMute = async (next: boolean) => {
    setMuted(next);
    setNotifySoundMuted(next);
    if (!next) {
      // Unlock + preview when turning sound back on (we're inside a user gesture)
      await unlockNotifySound();
      await playNotifySound();
    }
  };

  const previewSound = async () => {
    if (muted) {
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
      showBrowserNotification("Notifications enabled", "You'll be notified of new messages.", {
        force: true,
      });
      toast.success("Browser notifications enabled");
    } else {
      toast.error("Permission denied. Enable notifications in your browser settings.");
    }
  };

  return (
    <Card className="p-5 space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" /> Notifications & sound
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control how you're alerted when new messages arrive.
        </p>
      </div>

      {/* Sound mute toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {muted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground mt-0.5" />
          ) : (
            <Volume2 className="h-5 w-5 text-foreground mt-0.5" />
          )}
          <div>
            <Label htmlFor="sound-toggle" className="font-medium cursor-pointer">
              Notification sound
            </Label>
            <p className="text-xs text-muted-foreground">
              Play a soft chime when a new message arrives.
            </p>
          </div>
        </div>
        <Switch id="sound-toggle" checked={!muted} onCheckedChange={(v) => toggleMute(!v)} />
      </div>

      <Button variant="outline" size="sm" onClick={previewSound} disabled={muted}>
        Preview sound
      </Button>

      <div className="border-t border-border pt-5">
        {/* Browser notifications */}
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
              {perm === "default" && "Get a desktop popup when a new message arrives."}
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
