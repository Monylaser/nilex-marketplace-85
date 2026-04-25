import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Loader2, CreditCard, Truck, CheckCircle2, XCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/escrow";

const EscrowTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tx, setTx] = useState<any>(null);
  const [ad, setAd] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: t } = await supabase
      .from("escrow_transactions").select("*").eq("id", id).maybeSingle();
    setTx(t);
    if (t) {
      const { data: a } = await supabase
        .from("ads").select("id,title,price,images_json").eq("id", t.ad_id).maybeSingle();
      setAd(a);
      const { data: m } = await supabase
        .from("escrow_messages").select("*").eq("transaction_id", id).order("created_at");
      setMessages(m || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      <Footer />
    </div>
  );

  if (!tx) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="container py-32 text-center">
        <h1 className="font-display text-2xl">Transaction not found</h1>
        <Link to="/profile"><Button variant="gold" className="mt-4">Back to profile</Button></Link>
      </div><Footer />
    </div>
  );

  const isBuyer = user?.id === tx.buyer_id;
  const isSeller = user?.id === tx.seller_id;
  if (!isBuyer && !isSeller) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-32 text-center">
          <h1 className="font-display text-2xl">Not authorized</h1>
        </div><Footer />
      </div>
    );
  }

  const updateStatus = async (patch: Record<string, any>, successMsg: string) => {
    setActing(true);
    const { error } = await supabase.from("escrow_transactions").update(patch).eq("id", tx.id);
    setActing(false);
    if (error) return toast.error(error.message);
    toast.success(successMsg);
    load();
  };

  // Mock pay = mark as paid immediately
  const payNow = () => updateStatus(
    { status: "paid", paid_at: new Date().toISOString(), payment_method: "mock", payment_intent_id: `mock_${Date.now()}` },
    "Payment confirmed (mock)"
  );
  const markShipped = () => updateStatus(
    { status: "shipped", shipped_at: new Date().toISOString() },
    "Marked as shipped"
  );
  const confirmReceipt = () => updateStatus(
    { status: "completed", completed_at: new Date().toISOString() },
    "Receipt confirmed. Funds released to seller."
  );
  const cancel = () => updateStatus(
    { status: "cancelled", cancelled_at: new Date().toISOString() },
    "Transaction cancelled"
  );

  const sendMessage = async () => {
    if (!msg.trim() || !user) return;
    const { error } = await supabase.from("escrow_messages").insert({
      transaction_id: tx.id, user_id: user.id, message: msg.trim(),
    });
    if (error) return toast.error(error.message);
    setMsg("");
    load();
  };

  const sellerReceives = Number(tx.amount) - Number(tx.commission);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-gold" /> Escrow Transaction
            </h1>
            <p className="text-sm text-muted-foreground">ID: {tx.id.slice(0, 8)}…</p>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className="mt-1 text-sm">
                  {STATUS_LABELS[tx.status] || tx.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount in escrow</p>
                <p className="text-2xl font-bold text-gold">{Number(tx.amount).toLocaleString()} EGP</p>
              </div>
            </div>

            {ad && (
              <Link to={`/ad/${ad.id}`} className="mt-4 flex items-center gap-3 rounded-md border p-3 hover:bg-secondary/40 transition">
                {Array.isArray(ad.images_json) && ad.images_json[0] ? (
                  <img src={ad.images_json[0] as string} alt="" className="h-14 w-20 rounded object-cover" />
                ) : <div className="h-14 w-20 rounded bg-muted" />}
                <div className="min-w-0">
                  <p className="font-medium truncate">{ad.title}</p>
                  <p className="text-sm text-muted-foreground">{Number(ad.price).toLocaleString()} EGP</p>
                </div>
              </Link>
            )}

            <div className="mt-4 grid gap-2 text-sm">
              <Row label="Commission" value={`${tx.commission_rate}% (${Number(tx.commission).toLocaleString()} EGP)`} />
              <Row label="Seller receives on completion" value={`${sellerReceives.toLocaleString()} EGP`} />
            </div>

            {/* Buyer banner */}
            {isBuyer && tx.status === "pending" && (
              <div className="mt-4 rounded-md bg-secondary/50 p-3 text-sm">
                Protected by Nilex Escrow. Pay now to lock the deal — funds are released only when you confirm receipt.
              </div>
            )}
            {isSeller && tx.status === "paid" && (
              <div className="mt-4 rounded-md bg-gold/10 p-3 text-sm font-medium">
                💰 Payment confirmed. Ship the product and mark as shipped.
              </div>
            )}
          </Card>

          {/* Action buttons */}
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {isBuyer && tx.status === "pending" && (
                <>
                  <Button variant="gold" onClick={payNow} disabled={acting} className="gap-2">
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Pay {Number(tx.amount).toLocaleString()} EGP (mock)
                  </Button>
                  <Button variant="outline" onClick={cancel} disabled={acting} className="gap-2">
                    <XCircle className="h-4 w-4" /> Cancel
                  </Button>
                </>
              )}
              {isSeller && tx.status === "paid" && (
                <Button variant="gold" onClick={markShipped} disabled={acting} className="gap-2">
                  <Truck className="h-4 w-4" /> Mark as shipped
                </Button>
              )}
              {isBuyer && tx.status === "shipped" && (
                <Button variant="gold" onClick={confirmReceipt} disabled={acting} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Confirm receipt & release funds
                </Button>
              )}
              {(tx.status === "completed" || tx.status === "cancelled" || tx.status === "refunded") && (
                <p className="text-sm text-muted-foreground">No further actions available.</p>
              )}
            </div>
          </Card>

          {/* Messages */}
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-3">Messages</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`rounded-md p-2 text-sm ${m.user_id === user?.id ? "bg-gold/10 ml-8" : "bg-secondary/50 mr-8"}`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {m.user_id === tx.buyer_id ? "Buyer" : "Seller"} · {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} placeholder="Send a message…" />
              <Button variant="gold" onClick={sendMessage} disabled={!msg.trim()} className="self-end gap-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-2">How escrow works</h3>
            <ol className="text-sm space-y-2 list-decimal pl-4 text-muted-foreground">
              <li>Buyer pays into Nilex escrow.</li>
              <li>Seller is notified and ships.</li>
              <li>Buyer confirms receipt.</li>
              <li>Nilex releases funds (minus commission).</li>
              <li>Disputes can be opened within 14 days.</li>
            </ol>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/profile")}>
              Back to profile
            </Button>
          </Card>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default EscrowTransaction;
