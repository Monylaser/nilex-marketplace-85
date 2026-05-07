import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BellOff, CheckCircle2, Loader2, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  data_json: any;
};

const FIX_STEPS: Record<string, string[]> = {
  "Inappropriate/Ethical Violation": [
    "راجع نص الإعلان والصور وأزل أي محتوى غير لائق أو مخالف.",
    "تأكد من أن الصور حقيقية وتخص المنتج المعروض فقط.",
    "أعد نشر الإعلان بعد التعديل ليتم مراجعته من جديد.",
  ],
  "Potential Fraud/Scam": [
    "أضف معلومات تواصل حقيقية ومُتحقَّق منها.",
    "وضح حالة المنتج وسعره بشكل واقعي وتجنّب العروض المبالغ فيها.",
    "ارفع صور أصلية للمنتج وليست من الإنترنت.",
  ],
  "Incomplete/Unclear Information": [
    "أضف وصفًا تفصيليًا (الموديل، الحالة، السنة، المميزات).",
    "حدد السعر والمحافظة والمدينة بدقة.",
    "ارفع صورًا واضحة من زوايا متعددة.",
  ],
  "Wrong Category": [
    "اختر القسم والقسم الفرعي المناسبين لطبيعة المنتج.",
  ],
  "Duplicate Listing": [
    "احذف الإعلانات المكررة وأبقِ على إعلان واحد فقط لنفس المنتج.",
  ],
  "Prohibited Items (Legal)": [
    "هذا النوع من المنتجات غير مسموح بنشره. يرجى مراجعة شروط الاستخدام.",
  ],
};

const reasonLabel = (r?: string) => {
  switch (r) {
    case "Inappropriate/Ethical Violation": return "مخالف للآداب";
    case "Potential Fraud/Scam": return "اشتباه احتيال";
    case "Incomplete/Unclear Information": return "معلومات ناقصة";
    case "Wrong Category": return "قسم خاطئ";
    case "Duplicate Listing": return "إعلان مكرر";
    case "Prohibited Items (Legal)": return "منتج محظور";
    default: return r || "—";
  }
};

const UserNotifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("id,type,title,body,is_read,created_at,data_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setItems((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true })
      .eq("user_id", user.id).eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("تم تعليم كل الإشعارات كمقروءة");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BellOff className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">لا توجد إشعارات حتى الآن.</p>
      </Card>
    );
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} إشعار غير مقروء` : "كل الإشعارات مقروءة"}
        </p>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <MailOpen className="me-2 h-4 w-4" /> تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {items.map((n) => {
        const isRejection = n.type === "ad_rejected";
        const reason = n.data_json?.reason as string | undefined;
        const adId = n.data_json?.ad_id as string | undefined;
        const steps = reason ? FIX_STEPS[reason] : undefined;

        return (
          <Card
            key={n.id}
            className={`p-4 ${!n.is_read ? "border-gold/60 bg-gold/5" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
                isRejection ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}>
                {isRejection ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium">
                    {isRejection ? "تم رفض إعلانك" : n.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {!n.is_read && <Badge className="bg-gold text-accent-foreground">جديد</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                </div>

                {isRejection ? (
                  <div className="mt-3 space-y-3">
                    <Alert variant="destructive">
                      <AlertTitle className="text-sm">سبب الرفض: {reasonLabel(reason)}</AlertTitle>
                      {n.body && (
                        <AlertDescription className="text-xs mt-1 opacity-90">
                          {n.body}
                        </AlertDescription>
                      )}
                    </Alert>

                    {steps && steps.length > 0 && (
                      <div className="rounded-md border border-border bg-muted/30 p-3">
                        <p className="text-sm font-medium mb-2">خطوات الإصلاح:</p>
                        <ol className="list-decimal pe-5 space-y-1 text-sm text-foreground/80">
                          {steps.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {adId && (
                        <Link to={`/ad/${adId}`}>
                          <Button size="sm" variant="outline">عرض الإعلان</Button>
                        </Link>
                      )}
                      <Link to="/post-ad">
                        <Button size="sm" variant="gold">إنشاء إعلان جديد</Button>
                      </Link>
                      {!n.is_read && (
                        <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                          <Mail className="me-2 h-4 w-4" /> تعليم كمقروء
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {n.body && <p className="text-sm text-foreground/80">{n.body}</p>}
                    {!n.is_read && (
                      <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                        <Mail className="me-2 h-4 w-4" /> تعليم كمقروء
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default UserNotifications;
