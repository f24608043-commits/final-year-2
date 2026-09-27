"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage, markRead, leaveGroup } from "../../messaging/actions";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";

interface Message {
  message: {
    id: string;
    body: string;
    createdAt: Date;
  };
  sender: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct");
  const [jitsiRoomId, setJitsiRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<{ displayName: string | null; avatarUrl: string | null; id: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const resolvedParams = await params;
        setConversationId(resolvedParams.id);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          redirect("/sign-in");
          return;
        }

        setCurrentUser(user);

        // Load messages
        const initialMessages = await getMessages(resolvedParams.id);
        if (mounted) {
          setMessages(initialMessages);
          setIsLoading(false);
        }

        // Fetch conversation participants to show who we're messaging
        const { data: members } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", resolvedParams.id);

        console.log("Conversation members:", members);
        console.log("Current user ID:", user.id);

        if (members && mounted) {
          const otherUserId = members.find((m: any) => m.user_id !== user.id)?.user_id;
          console.log("Other user ID:", otherUserId);
          
          if (otherUserId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", otherUserId)
              .single();
            console.log("Other user profile:", profile);
            
            if (profile && mounted) {
              setOtherParticipant({
                displayName: profile.display_name || "Unknown User",
                avatarUrl: profile.avatar_url,
                id: profile.id,
              });
            } else if (mounted) {
              // Fallback if profile not found
              setOtherParticipant({
                displayName: "Unknown User",
                avatarUrl: null,
                id: otherUserId,
              });
            }
          } else if (mounted) {
            // No other participant found (shouldn't happen in direct message)
            console.warn("No other participant found in conversation");
          }
        }

        // Mark as read
        await markRead(resolvedParams.id);

        // Setup Realtime subscription
        const channel = supabase
          .channel(`messages:${resolvedParams.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${resolvedParams.id}`,
            },
            async (payload) => {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser?.id === payload.new.sender_id) {
                // Skip if it's our own message (optimistic update)
                return;
              }

              // Fetch sender info
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', payload.new.sender_id)
                .single();

              const newMessage: Message = {
                message: {
                  id: payload.new.id,
                  body: payload.new.body,
                  createdAt: new Date(payload.new.created_at),
                },
                sender: {
                  id: profile?.id || payload.new.sender_id,
                  displayName: profile?.display_name,
                  avatarUrl: profile?.avatar_url,
                },
              };

              setMessages((prev) => [...prev, newMessage]);

              await markRead(resolvedParams.id);
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (error) {
        console.error("Error loading messages:", error);
        if (mounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [params]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !conversationId) return;

    setIsSending(true);
    const tempMessage = newMessage;
    setNewMessage("");

    const optimisticMessage: Message = {
      message: {
        id: "temp",
        body: tempMessage,
        createdAt: new Date(),
      },
      sender: {
        id: currentUser.id,
        displayName: currentUser.user_metadata.display_name || currentUser.email,
        avatarUrl: currentUser.user_metadata.avatar_url,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const result = await sendMessage(conversationId, tempMessage);
      console.log("Message sent successfully:", result);
      // Remove optimistic message and let Realtime handle the real one
      setMessages((prev) => prev.filter((m) => m.message.id !== "temp"));
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.message.id !== "temp"));
      setNewMessage(tempMessage); // Restore the message so user can try again
      alert(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this conversation?")) return;
    if (!conversationId) return;

    try {
      await leaveGroup(conversationId);
      redirect("/messages");
    } catch (error: any) {
      console.error("Error leaving group:", error);
      alert(error.message || "Failed to leave group");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-background via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-gray-500 hover:text-gray-700">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          {otherParticipant ? (
            <div className="flex items-center gap-3">
              {otherParticipant.avatarUrl ? (
                <img
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.displayName || "User"}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                  {otherParticipant.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div>
                <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                  {otherParticipant.displayName || "Unknown User"}
                </h1>
                <p className="font-label-sm text-text-muted">
                  {conversationType === "group" ? "Group Chat" : "Direct Message"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">
                {conversationType === "group" ? "Group Chat" : "Direct Message"}
              </h1>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {conversationType === "group" && jitsiRoomId && (
            <a
              href={`https://meet.jit.si/${jitsiRoomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 font-label-sm font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              Join Class
            </a>
          )}
          {conversationType === "group" && (
            <button
              onClick={handleLeaveGroup}
              className="text-red-500 hover:text-red-700 font-label-sm font-semibold"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="font-body-md">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.message.id}
                className={`flex ${msg.sender.id === currentUser?.id ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.sender.id === currentUser?.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    : "bg-white border-2 border-gray-200 shadow-sm"
                }`}>
                  {msg.sender.id !== currentUser?.id && (
                    <p className="font-label-sm font-semibold mb-1">
                      {msg.sender.displayName || "Unknown"}
                    </p>
                  )}
                  <p className="font-body-sm">{msg.message.body}</p>
                  <p className="font-body-xs mt-1 opacity-70">
                    {new Date(msg.message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            disabled={isSending}
            maxLength={2000}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
