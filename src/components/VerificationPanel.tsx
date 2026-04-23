import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  Timer,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import VerificationBadge from "@/components/VerificationBadge";

const EG_PHONE = /^\+20(10|11|12|15)\d{8}$/;
const RESEND_COOLDOWN_SECONDS = 60;

const VerificationPanel = () => {
  const { user } = useAuth();
  const [level, setLevel] = useState(0);
  const [phone, setPhone] = useState("+20");
  const [phoneSaved, setPhoneSaved] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const emailConfirmed = !!user?.email_confirmed_at;

  // Countdown timer effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("verification_level, phone, phone_verified_at")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setLevel(data.verification_level ?? 0);
        setPhoneSaved(data.phone_verified_at ? data.phone : null);
        if (data.phone) setPhone(data.phone);
      }
    })();
  }, [user]);

  const sendCode = async () => {
    if (!EG_PHONE.test(phone.trim())) {
      toast.error("Use Egyptian format, e.g. +201012345678");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("verify-phone-send", {
      body: { phone: phone.trim() },
    });
    setSending(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Couldn't send code");
      return;
    }
    setStep("sent");
    setResendTimer(RESEND_COOLDOWN_SECONDS);
    setDevCode(data?.devCode ?? null);
    toast.success("Code sent");
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setConfirming(true);
    const { data, error } = await supabase.functions.invoke(
      "verify-phone-confirm",
      { body: { code } },
    );
    setConfirming(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Couldn't verify");
      return;
    }
    setPhoneSaved(phone.trim());
    setStep("idle");
    setCode("");
    setDevCode(null);
    if (data?.levelGranted) {
      setLevel(1);
      toast.success("You're now verified! 🎉");
    } else {
      toast.success("Phone verified. Confirm your email to finish Level 1.");
    }
  };

  const resendEmail = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent");
  };

  return (
    <Card className="p-5 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" /> Seller verification
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Verified sellers get a trust badge and rank higher in search.
          </p>
        </div>
        <VerificationBadge level={level} size="md" />
      </div>

      {/* Email step */}
      <div className="border-t border-border pt-5 space-y-3">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium flex items-center gap-2">
              Email
              {emailConfirmed && (
                <Check className="h-4 w-4 text-primary" aria-label="confirmed" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          {!emailConfirmed && (
            <Button variant="outline" size="sm" onClick={resendEmail}>
              Resend email
            </Button>
          )}
        </div>
      </div>

      {/* Phone step */}
      <div className="border-t border-border pt-5 space-y-3">
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium flex items-center gap-2">
              Phone
              {phoneSaved && (
                <Check className="h-4 w-4 text-primary" aria-label="verified" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {phoneSaved
                ? `Verified: ${phoneSaved}`
                : "Egyptian numbers only (+20)"}
            </p>
          </div>
        </div>

        {!phoneSaved && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+201012345678"
                disabled={step === "sent" || sending}
                dir="ltr"
              />
              <Button
                onClick={sendCode}
                disabled={sending || step === "sent" || resendTimer > 0}
                variant="gold"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Send code"}
              </Button>
            </div>

            {step === "sent" && (
              <>
                {devCode && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Dev mode (no SMS provider yet). Your code:{" "}
                      <span className="font-mono font-bold">{devCode}</span>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <Label htmlFor="otp">Enter 6-digit code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="otp"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                      inputMode="numeric"
                      maxLength={6}
                      dir="ltr"
                    />
                    <Button onClick={confirm} disabled={confirming}>
                      {confirming && (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      )}
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep("idle");
                        setCode("");
                        setDevCode(null);
                        setResendTimer(0);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                {/* Resend option during cooldown */}
                {resendTimer > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    You can request a new code in {resendTimer} seconds
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Status footer */}
      {level >= 1 ? (
        <div className="border-t border-border pt-5 text-sm text-muted-foreground">
          You've reached <strong>Level 1 (Basic)</strong>. Higher tiers (ID,
          video, business) are coming soon.
        </div>
      ) : (
        <div className="border-t border-border pt-5 text-xs text-muted-foreground">
          Complete both phone and email to unlock the verified badge.
        </div>
      )}
    </Card>
  );
};

export default VerificationPanel;
