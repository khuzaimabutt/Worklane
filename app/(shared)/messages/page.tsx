"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    if (!active) return;
    const sb = createClient();
    (async () => {
      const { data } = await sb.from("messages").select("*").eq("conversation_id", active.id).order("created_at");
      setMessages(data ?? []);
    })();
    const channel = sb
      .channel(`messages:${active.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
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
        <main className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white border border-neutral-200 rounded-xl flex h-[calc(100vh-9rem)] overflow-hidden">
          <aside className="w-72 border-r border-neutral-200 flex flex-col">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-heading text-xl">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <EmptyState title="No conversations" description="Your messages will appear here" />
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={cn(
                      "w-full text-left p-3 border-b border-neutral-100 hover:bg-neutral-50 flex gap-3",
                      active?.id === c.id && "bg-neutral-50"
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      {c.other_user.avatar_url && <AvatarImage src={c.other_user.avatar_url} />}
                      <AvatarFallback>{initials(c.other_user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.other_user.full_name}</p>
                        {c.last_message_at && (
                          <span className="text-xs text-neutral-500 shrink-0">{fromNow(c.last_message_at)}</span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{c.last_message_preview ?? "No messages yet"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="flex-1 flex flex-col">
            {active ? (
              <>
                <header className="border-b border-neutral-200 p-3 flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    {active.other_user.avatar_url && <AvatarImage src={active.other_user.avatar_url} />}
                    <AvatarFallback>{initials(active.other_user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{active.other_user.full_name}</p>
                    <p className="text-xs text-neutral-500">@{active.other_user.username}</p>
                  </div>
                </header>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => {
                    const mine = m.sender_id === userId;
                    if (m.message_type === "custom_offer" && m.custom_offer_id) {
                      return <CustomOfferCard key={m.id} offerId={m.custom_offer_id} mine={mine} />;
                    }
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                            mine ? "bg-brand-primary text-white" : "bg-neutral-100 text-neutral-900"
                          )}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-neutral-500 py-8">No messages yet. Say hi!</p>
                  )}
                </div>
                <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
                  <button className="p-2 text-neutral-500 hover:text-brand-primary" aria-label="Attach">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                  />
                  <Button onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">Select a conversation</div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
