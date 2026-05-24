"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Paperclip, Loader2, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { initials, fromNow } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CustomOfferCard } from "@/components/messages/custom-offer-card";

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  other_user: { id: string; full_name: string; avatar_url: string | null; username: string };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string;
  content: string | null;
  custom_offer_id: string | null;
  created_at: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/messages");
        return;
      }
      setUserId(user.id);
      const { data: convs } = await sb
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convs && convs.length > 0) {
        const otherIds = convs.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id));
        const { data: others } = await sb.from("users").select("id, full_name, avatar_url, username").in("id", otherIds);
        const convosFull: Conversation[] = convs.map((c) => ({
          ...c,
          other_user: others?.find((u) => u.id === (c.buyer_id === user.id ? c.seller_id : c.buyer_id)) || {
            id: "",
            full_name: "Unknown",
            avatar_url: null,
            username: "",
          },
        }));
        setConversations(convosFull);
        setActive(convosFull[0]);
      }
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (!active || !userId) return;
    const sb = createClient();
    (async () => {
      const { data } = await sb.from("messages").select("*").eq("conversation_id", active.id).order("created_at");
      setMessages(data ?? []);
      // mark this conversation read for the current user
      const isBuyer = active.buyer_id === userId;
      const field = isBuyer ? "buyer_unread_count" : "seller_unread_count";
      if ((isBuyer ? active.buyer_unread_count : active.seller_unread_count) > 0) {
        await sb.from("conversations").update({ [field]: 0 }).eq("id", active.id);
        setConversations((prev) =>
          prev.map((c) => (c.id === active.id ? { ...c, [field]: 0 } : c))
        );
      }
    })();
    const channel = sb
      .channel(`messages:${active.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }, 50);
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [active]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !active || !userId) return;
    const sb = createClient();
    await sb.from("messages").insert({
      conversation_id: active.id,
      sender_id: userId,
      content: input.trim(),
      message_type: "text",
    });
    await sb.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: input.trim().slice(0, 80),
    }).eq("id", active.id);
    setInput("");
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-ink-faint" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white border border-line rounded-2xl flex h-[calc(100vh-9rem)] overflow-hidden shadow-card">
          <aside className="w-80 border-r border-line flex flex-col">
            <div className="px-5 h-16 flex items-center border-b border-line">
              <h2 className="font-heading text-lg text-ink">Messages</h2>
              {conversations.length > 0 && (
                <span className="ml-auto text-2xs uppercase tracking-wider font-semibold text-ink-subtle">
                  {conversations.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-ink font-medium mb-1">No conversations</p>
                  <p className="text-xs text-ink-subtle">Your messages will appear here.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isBuyer = c.buyer_id === userId;
                  const unread = isBuyer ? c.buyer_unread_count : c.seller_unread_count;
                  const isUnread = unread > 0 && active?.id !== c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActive(c)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-line-subtle flex gap-3 transition-colors relative",
                        active?.id === c.id ? "bg-brand-primary-50" : "hover:bg-canvas-subtle"
                      )}
                    >
                      {isUnread && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      )}
                      <Avatar className="w-10 h-10 shrink-0 border border-line">
                        {c.other_user.avatar_url && <AvatarImage src={c.other_user.avatar_url} />}
                        <AvatarFallback className="text-xs bg-white text-ink-muted">
                          {initials(c.other_user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p
                            className={cn(
                              "text-sm truncate",
                              active?.id === c.id
                                ? "font-semibold text-brand-primary-dark"
                                : isUnread
                                  ? "font-semibold text-ink"
                                  : "font-medium text-ink"
                            )}
                          >
                            {c.other_user.full_name}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.last_message_at && (
                              <span className={cn("text-2xs", isUnread ? "text-brand-primary-dark font-semibold" : "text-ink-subtle")}>
                                {fromNow(c.last_message_at)}
                              </span>
                            )}
                            {isUnread && (
                              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-2xs font-semibold leading-none">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={cn(
                            "text-xs truncate",
                            isUnread ? "text-ink font-medium" : "text-ink-subtle"
                          )}
                        >
                          {c.last_message_preview ?? "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex-1 flex flex-col min-w-0">
            {active ? (
              <>
                <header className="border-b border-line px-5 h-16 flex items-center gap-3">
                  <Avatar className="w-9 h-9 shrink-0 border border-line">
                    {active.other_user.avatar_url && <AvatarImage src={active.other_user.avatar_url} />}
                    <AvatarFallback className="text-xs bg-canvas-subtle text-ink-muted">
                      {initials(active.other_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">{active.other_user.full_name}</p>
                    <p className="text-xs text-ink-subtle truncate">@{active.other_user.username}</p>
                  </div>
                </header>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-canvas-subtle">
                  {messages.map((m) => {
                    const mine = m.sender_id === userId;
                    if (m.message_type === "custom_offer" && m.custom_offer_id) {
                      return <CustomOfferCard key={m.id} offerId={m.custom_offer_id} mine={mine} />;
                    }
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            mine
                              ? "bg-brand-primary text-white rounded-br-md"
                              : "bg-white text-ink border border-line rounded-bl-md"
                          )}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-ink-subtle py-8">No messages yet. Say hi!</p>
                  )}
                </div>
                <div className="border-t border-line p-3 flex items-center gap-2 bg-white">
                  <button
                    className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-canvas-subtle hover:text-ink transition-colors"
                    aria-label="Attach"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <Input
                    className="min-w-0 flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-md bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-subtle text-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <p className="font-medium text-ink">Select a conversation</p>
                <p className="text-xs mt-1">Pick someone from the list to start chatting.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
