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
import { Heart, MapPin, Eye, Loader2, Send, User as UserIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/VerificationBadge";
import EscrowButton from "@/components/EscrowButton";
import { isEscrowEligible } from "@/lib/escrow";
import { trackAdView, trackInquiry, trackFavorite } from "@/lib/analytics";

const AdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("*, categories(name,slug)")
        .eq("id", id)
        .maybeSingle();
      setAd(data);
      if (data?.user_id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,name,avatar,phone,total_points,verification_level")
          .eq("id", data.user_id)
          .maybeSingle();
        setSeller(p);
      }
      // increment views (best-effort)
      if (data) {
        await supabase.from("ads").update({ views: (data.views || 0) + 1 }).eq("id", id);
        // Per-day analytics tracking (deduped, owner-skipped)
        trackAdView(data.id, data.user_id);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("ad_id", id).maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [user, id]);

  const toggleFav = async () => {
    if (!user) return toast.error("Sign in to save favorites");
    if (fav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("ad_id", id!);
      setFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, ad_id: id! });
      setFav(true);
      toast.success("Saved to favorites");
    }
  };

  const sendMessage = async () => {
    if (!user) return toast.error("Sign in to message the seller");
    if (!msg.trim() || !ad) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: ad.user_id,
      ad_id: ad.id,
      message: msg.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent!");
    setMsg("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }
  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-32 text-center">
          <h1 className="font-display text-2xl">Ad not found</h1>
          <Link to="/browse"><Button variant="gold" className="mt-4">Browse ads</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images: string[] = Array.isArray(ad.images_json) ? ad.images_json : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {images[0] ? (
                <img src={images[0]} alt={ad.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-20 w-28 flex-shrink-0 rounded object-cover" />
                ))}
              </div>
            )}
          </Card>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">{ad.title}</h1>
                <p className="mt-1 text-3xl font-bold text-gold">{Number(ad.price).toLocaleString()} EGP</p>
              </div>
              <Button variant="outline" size="icon" onClick={toggleFav}>
                <Heart className={`h-5 w-5 ${fav ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {ad.categories && <Badge variant="secondary">{ad.categories.name}</Badge>}
              <Badge variant="outline">{ad.condition}</Badge>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{ad.city || ""} {ad.governorate}</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{ad.views} views</span>
            </div>

            <div className="mt-6 prose prose-sm max-w-none">
              <h3 className="font-display text-lg font-semibold">Description</h3>
              <p className="whitespace-pre-wrap text-foreground/80">{ad.description}</p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold">Seller</h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                {seller?.avatar ? <img src={seller.avatar} className="h-full w-full rounded-full object-cover" /> : <UserIcon className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{seller?.name || "Nilex user"}</p>
                  <VerificationBadge level={seller?.verification_level} />
                </div>
                <p className="text-xs text-muted-foreground">{seller?.total_points || 0} points</p>
              </div>
            </div>
            {seller?.id && user && seller.id !== user.id && (
              <Button
                variant="outline"
                className="mt-4 w-full gap-2"
                onClick={() => navigate(`/chat/${seller.id}`)}
              >
                <MessageCircle className="h-4 w-4" /> Open chat
              </Button>
            )}
          </Card>

          {isEscrowEligible(ad.categories?.slug) && (
            <Card className="p-5 border-gold/40">
              <EscrowButton
                ad={{ id: ad.id, title: ad.title, price: Number(ad.price), user_id: ad.user_id }}
                sellerVerificationLevel={seller?.verification_level}
              />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-display font-semibold">Message seller</h3>
            <Textarea
              placeholder="Hi, is this still available?"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={4}
              className="mt-3"
            />
            <Button onClick={sendMessage} disabled={sending || !msg.trim()} variant="gold" className="mt-3 w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send message
            </Button>
          </Card>
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default AdDetail;
