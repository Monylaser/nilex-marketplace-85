import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  otherId: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  adId: string | null;
}

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,message,created_at,is_read,ad_id")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const map = new Map<string, Conversation>();
    const otherIds = new Set<string>();
    (msgs || []).forEach((m: any) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      otherIds.add(otherId);
      if (!map.has(otherId)) {
        map.set(otherId, {
          otherId,
          otherName: "User",
          otherAvatar: null,
          lastMessage: m.message,
          lastAt: m.created_at,
          unread: 0,
          adId: m.ad_id,
        });
      }
      if (m.receiver_id === user.id && !m.is_read) {
        map.get(otherId)!.unread += 1;
      }
    });

    if (otherIds.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,name,avatar")
        .in("id", Array.from(otherIds));
      (profs || []).forEach((p: any) => {
        const c = map.get(p.id);
        if (c) {
          c.otherName = p.name || "User";
          c.otherAvatar = p.avatar;
        }
      });
    }

    setConvs(Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    load();
    if (!user) return;
    const ch = supabase
      .channel(`chat-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-gold" /> Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your private conversations. Phone numbers and emails are never shared.
        </p>

        <div className="mt-6 space-y-2">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && convs.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              No conversations yet. Start chatting from any ad page.
            </Card>
          )}
          {convs.map((c) => (
            <Link key={c.otherId} to={`/chat/${c.otherId}`}>
              <Card className="p-4 flex items-center gap-3 hover:shadow-md transition cursor-pointer">
                <Avatar className="h-12 w-12">
                  {c.otherAvatar && <AvatarImage src={c.otherAvatar} />}
                  <AvatarFallback className="bg-secondary">
                    {c.otherName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{c.otherName}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(c.lastAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <Badge className="bg-gold text-accent-foreground">{c.unread}</Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Chat;
