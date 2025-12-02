"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

// same Person shape from MessagingPage so we can accept the object
type Person = {
  id: number; 
  firstName: string;
  lastName: string;
  titles: string[];
  totalPoints: number;
};

// shape of a row from the messaging table so we can send our messages
type MessageRow = {
  message_id: number;
  sender_id: number;
  recipient_id: number;
  message_text: string;
  created_at: string;
};

const supabase = createBrowserClient();

const MessagesPage = () => {
  const router = useRouter();

  // set up state variables to track partner and info about the messages and conversation
  const [partner, setPartner] = useState<Person | null>(null);
  const [appUserId, setAppUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Initialize all the data we need for the page
  useEffect(() => {
    const init = async () => {
      try {
        // make sure we're in the browser
        if (typeof window === "undefined") {
            return;
        }

        // get the stored info about who we're messaging from sessionStorage
        const stored = sessionStorage.getItem("stemlink:activeConversation");
        // if no conversation then we can't proceed
        if (!stored) {
          console.warn("No active conversation in sessionStorage");
          return;
        }

        // parse out the fields from stored data into a Person object and set state
        const parsed = JSON.parse(stored) as Person;
        setPartner(parsed);

        // get current auth user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // error if issue getting auth user or no user
        if (authError || !user) {
          console.error("Auth error or no user:", authError);
          return;
        }

        // map auth user to app user_id
        const { data: appUser, error: appUserError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_id", user.id)
          .maybeSingle();

        // error if issue getting app user or no app user
        if (appUserError || !appUser) {
          console.error("Error fetching app user:", appUserError);
          return;
        }

        // set app user id state
        const currentUserId = appUser.user_id as number;
        setAppUserId(currentUserId);

        // fetch all messages between current user and partner
        const { data: msgRows, error: msgsError } = await supabase
          .from("messaging")
          .select(
            "message_id, sender_id, recipient_id, message_text, created_at"
          )
          .or(
            `and(sender_id.eq.${currentUserId},recipient_id.eq.${parsed.id}),and(sender_id.eq.${parsed.id},recipient_id.eq.${currentUserId})`
          )
          .order("created_at", { ascending: true });

        // error if issue getting messages
        if (msgsError) {
          console.error("Error fetching messages:", msgsError);
          return;
        }

        // set messages state to the list of rows we got back
        setMessages((msgRows ?? []) as MessageRow[]);
      } 
      // catch any erros
      catch (err) {
        console.error("Unexpected error initializing messages page:", err);
      } 
      // stop loading
      finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // handle sending a new message
  const handleSend = async () => {
    // trim message
    const trimmed = newMessage.trim();
    // make sure we have a message and partner and app user id
    if (!trimmed || !partner || !appUserId) {
        return;
    }

    try {
      // insert new message row with sender and recipient ids and the message text
      const { data, error } = await supabase
        .from("messaging")
        .insert({
          sender_id: appUserId,
          recipient_id: partner.id,
          message_text: trimmed,
        })
        .select(
          "message_id, sender_id, recipient_id, message_text, created_at"
        )
        .single();

      // error if any errors inserting the message
      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      // update message list with the new message and the clear input
      setMessages((prev) => [...prev, data as MessageRow]);
      setNewMessage("");
    } 
    // catch any unexpected errors
    catch (err) {
      console.error("Unexpected error sending message:", err);
    }
  };

  // if we don't have a partner then show fallback
  if (!partner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="mb-3 text-slate-500">
            No conversation selected. Go back to the Messaging page and choose
            someone to message.
          </p>
        </div>
      </div>
    );
  }

  // set full name for display
  const fullName = `${partner.firstName} ${partner.lastName}`.trim();

  return (
    <div className="flex-1 flex flex-col bg-white px-6 py-6 lg:px-10 lg:py-8">
      <div className="mb-4 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Conversation with
          </p>
          <p className="text-xl font-semibold text-slate-900">{fullName}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="rounded-2xl border border-black bg-green-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-green-500/90"
        >
          More info
        </button>
      </div>

      <div className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          {loading ? (
            <p className="text-center text-slate-400">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-slate-400">
              No messages yet. Say hi.
            </p>
          ) : (
            messages.map((msg) => {
              // determine if the message is from the app user or the parter
              const isMine = msg.sender_id === appUserId;
              // adjust styling accordingly
              const bubbleClasses = isMine
                ? "bg-green-500 text-white"
                : "bg-slate-100 text-slate-900";

              const rowClasses = isMine
                ? "flex justify-end"
                : "flex justify-start";

              return (
                <div key={msg.message_id} className={rowClasses}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${bubbleClasses}`}
                  >
                    {msg.message_text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-slate-200 pt-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-2xl border border-black bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSend}
            className="rounded-2xl border border-black bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500/90"
          >
            Send
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-3xl border border-black bg-white px-6 py-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {fullName}
              </h3>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black bg-green-500 text-sm font-bold text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-800">
                <span className="font-semibold">Titles: </span>
                {partner.titles && partner.titles.length > 0
                  ? partner.titles.join(", ")
                  : "No titles"}
              </p>
              <p className="text-sm text-slate-800">
                <span className="font-semibold">Points: </span>
                {partner.totalPoints}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
