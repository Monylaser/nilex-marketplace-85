import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Image as ImageIcon, Loader2, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { playNotifySound, requestNotifyPermission } from "@/lib/notifySound";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

const TYPING_CHANNEL = (a: string, b: string) => {
  const [x, y] = [a, b].sort();
  return `typing-${x}-${y}`;
};

const ChatThread = () => {
  const { userId: otherId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{ name: string; avatar: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const loadMessages = async () => {
    if (!user || !otherId) return;
    const { data } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,message,created_at,is_read,read_at")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    scrollToBottom();

    // mark received as read
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("sender_id", otherId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);
  };

  const loadOther = async () => {
    if (!otherId) return;
    const { data } = await supabase
      .from("profiles")
      .select("name,avatar")
      .eq("id", otherId)
      .maybeSingle();
    setOther({ name: data?.name || "User", avatar: data?.avatar || null });
  };

  useEffect(() => {
    if (!user || !otherId) return;
    setLoading(true);
    Promise.all([loadMessages(), loadOther()]).finally(() => setLoading(false));
    requestNotifyPermission();

    // realtime messages
    const msgChannel = supabase
      .channel(`thread-${user.id}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          const inThread =
            (m.sender_id === user.id && m.receiver_id === otherId) ||
            (m.sender_id === otherId && m.receiver_id === user.id);
          if (!inThread) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          scrollToBottom();
          if (m.sender_id === otherId) {
            playNotifySound();
            // mark as read since user is viewing
            supabase
              .from("messages")
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq("id", m.id)
              .then(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
        },
      )
      .subscribe();

    // typing presence
    const typingCh = supabase.channel(TYPING_CHANNEL(user.id, otherId), {
      config: { broadcast: { self: false } },
    });
    typingCh
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === otherId) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 2500);
        }
      })
      .subscribe();
    typingChannelRef.current = typingCh;

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingCh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, otherId]);

  const broadcastTyping = () => {
    if (!user || !typingChannelRef.current) return;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
  };

  const handleInputChange = (v: string) => {
    setInput(v);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 1500);
  };

  const send = async (text: string) => {
    if (!user || !otherId || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: otherId,
      message: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setInput("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !otherId) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("chat-images").upload(path, file);
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
    await send(`![image](${data.publicUrl})`);
    setUploading(false);
  };

  const renderMessage = (text: string) => {
    const m = text.match(/^!\[image\]\((.+)\)$/);
    if (m) return <img src={m[1]} alt="attachment" className="max-w-xs rounded-lg" />;
    return <p className="whitespace-pre-wrap break-words">{text}</p>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container max-w-3xl flex-1 flex flex-col py-4">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Link to="/chat">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <Avatar className="h-10 w-10">
            {other?.avatar && <AvatarImage src={other.avatar} />}
            <AvatarFallback className="bg-secondary">{other?.name.charAt(0).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{other?.name || "User"}</p>
            <p className="text-xs text-muted-foreground">
              {otherTyping ? <span className="text-gold">typing…</span> : "Private chat"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2 min-h-[50vh]">
          {loading && (
            <div className="flex justify-center pt-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No messages yet. Say hi 👋
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {renderMessage(m.message)}
                  <div className={cn("flex items-center gap-1 mt-1 text-[10px] opacity-70", mine ? "justify-end" : "justify-start")}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && (m.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border pt-3 flex items-center gap-2"
        >
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
          </Button>
          <Input
            placeholder="Type a message…"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" variant="gold" size="icon" disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatThread;
