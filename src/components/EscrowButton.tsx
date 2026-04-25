import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { commissionRateFor, computeCommission } from "@/lib/escrow";

interface Props {
  ad: { id: string; title: string; price: number; user_id: string };
  sellerVerificationLevel?: number | null;
}

const EscrowButton = ({ ad, sellerVerificationLevel }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(ad.price);
  const rate = commissionRateFor(sellerVerificationLevel);
  const commission = computeCommission(amount, rate);
  const sellerReceives = amount - commission;

  const isOwnAd = user?.id === ad.user_id;

  const initiate = async () => {
    if (!user) return navigate("/auth");
    setSubmitting(true);
    const { data, error } = await supabase
      .from("escrow_transactions")
      .insert({
        buyer_id: user.id,
        seller_id: ad.user_id,
        ad_id: ad.id,
        amount,
        commission,
        commission_rate: rate,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error || !data) return toast.error(error?.message || "Could not start escrow");
    setOpen(false);
    navigate(`/escrow/${data.id}`);
  };

  return (
    <>
      <Button
        variant="gold"
        className="w-full gap-2"
        onClick={() => (user ? setOpen(true) : navigate("/auth"))}
        disabled={isOwnAd}
      >
        <ShieldCheck className="h-4 w-4" />
        {isOwnAd ? "Your own ad" : "Buy with Escrow"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="h-3 w-3 text-gold" />
        Protected by Nilex Escrow. Your money is safe.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" /> Start Escrow Transaction
            </DialogTitle>
            <DialogDescription>
              Your payment is held safely by Nilex until you confirm receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="font-medium truncate">{ad.title}</p>
              <p className="text-muted-foreground">Item price</p>
              <p className="text-2xl font-bold text-gold">
                {amount.toLocaleString()} EGP
              </p>
            </div>
            <div className="rounded-md bg-secondary/50 p-3 space-y-1">
              <Row label="You pay (held in escrow)" value={`${amount.toLocaleString()} EGP`} bold />
              <Row label={`Nilex commission (${rate}%, max 2,000)`} value={`-${commission.toLocaleString()} EGP`} />
              <Row label="Seller receives on completion" value={`${sellerReceives.toLocaleString()} EGP`} />
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Funds are released to the seller only after you confirm receipt.</li>
              <li>You can open a dispute within 14 days of payment.</li>
              <li>Payment methods: cards, Fawry, Vodafone Cash (mock for now).</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={initiate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);

export default EscrowButton;
