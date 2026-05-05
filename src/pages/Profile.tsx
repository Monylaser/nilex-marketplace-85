import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import NotificationSettings from "@/components/NotificationSettings";
import VerificationPanel from "@/components/VerificationPanel";
import { useT } from "@/lib/i18n";

const Profile = () => {
  const { user } = useAuth();
  const { t } = useT();
  const [profile, setProfile] = useState<any>(null);
  const [points, setPoints] = useState<any>(null);
  const [myAds, setMyAds] = useState<any[]>([]);
  const [favs, setFavs] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const [p, pt, a, f, m] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_points").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ads").select("id,title,price,status,views,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("favorites").select("ad_id, ads(id,title,price,governorate,images_json)").eq("user_id", user.id),
      supabase.from("messages").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(30),
    ]);
    setProfile(p.data);
    setPoints(pt.data);
    setMyAds(a.data || []);
    setFavs(f.data || []);
    setMsgs(m.data || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const saveProfile = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("profiles").update({
      name: profile.name,
      phone: profile.phone,
      governorate: profile.governorate,
      city: profile.city,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success(t("profile.updated"));
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("profile.adDeleted"));
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("nav.account")}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">Level {points?.level || 1}</Badge>
            <Badge className="bg-gold text-accent-foreground">{points?.points || 0} pts</Badge>
          </div>
        </div>

        <Tabs defaultValue="ads" className="mt-8">
          <TabsList>
            <TabsTrigger value="ads">{t("profile.myAds")} ({myAds.length})</TabsTrigger>
            <TabsTrigger value="favs">{t("profile.favorites")} ({favs.length})</TabsTrigger>
            <TabsTrigger value="msgs">{t("nav.messages")}</TabsTrigger>
            <TabsTrigger value="profile">{t("nav.profile")}</TabsTrigger>
            <TabsTrigger value="verify">{t("profile.verification")}</TabsTrigger>
            <TabsTrigger value="settings">{t("profile.notifications")}</TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="mt-6 space-y-3">
            <Link to="/seller/analytics">
              <Card className="p-4 flex items-center justify-between hover:border-primary transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium">Seller analytics</p>
                    <p className="text-sm text-muted-foreground">Views, inquiries, favorites & top ads</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Open</Button>
              </Card>
            </Link>
            {myAds.length === 0 && <p className="text-muted-foreground">You haven't posted any ads yet.</p>}
            {myAds.map((ad) => (
              <Card key={ad.id} className="flex items-center justify-between p-4">
                <Link to={`/ad/${ad.id}`} className="flex-1">
                  <p className="font-medium">{ad.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(ad.price).toLocaleString()} EGP · {ad.views} views · <Badge variant="outline">{ad.status}</Badge>
                  </p>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => deleteAd(ad.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="favs" className="mt-6 grid gap-3 sm:grid-cols-2">
            {favs.length === 0 && <p className="text-muted-foreground">No favorites yet.</p>}
            {favs.map((f) => f.ads && (
              <Link key={f.ad_id} to={`/ad/${f.ads.id}`}>
                <Card className="p-3 flex gap-3 hover:shadow-md transition">
                  <div className="h-16 w-20 flex-shrink-0 rounded bg-muted overflow-hidden">
                    {Array.isArray(f.ads.images_json) && f.ads.images_json[0] && (
                      <img src={f.ads.images_json[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium line-clamp-1">{f.ads.title}</p>
                    <p className="text-sm text-gold font-bold">{Number(f.ads.price).toLocaleString()} EGP</p>
                    <p className="text-xs text-muted-foreground">{f.ads.governorate}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="msgs" className="mt-6 space-y-2">
            {msgs.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
            {msgs.map((m) => (
              <Card key={m.id} className="p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {m.sender_id === user?.id ? "You sent" : "Received"} · {new Date(m.created_at).toLocaleString()}
                </p>
                <p>{m.message}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="mt-6 max-w-lg space-y-4">
            <div className="space-y-2"><Label>{t("common.name")}</Label>
              <Input value={profile?.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("common.phone")}</Label>
              <Input value={profile?.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("browse.governorate")}</Label>
              <Input value={profile?.governorate || ""} onChange={(e) => setProfile({ ...profile, governorate: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("post.field.city")}</Label>
              <Input value={profile?.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
            <Button variant="gold" onClick={saveProfile}>{t("common.save")}</Button>
          </TabsContent>

          <TabsContent value="verify" className="mt-6 max-w-lg">
            <VerificationPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 max-w-lg">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
