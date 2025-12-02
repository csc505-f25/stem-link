"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

// set up a type to display people that'll match results from db
type Person = {
  id: number; 
  firstName: string;
  lastName: string;
  titles: string[];
  totalPoints: number;
};

const MessagingPage = () => {
  // set up state variables to keep track of inputs and results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [contacts, setContacts] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [appUserId, setAppUserId] = useState<number | null>(null);

  // set up supabase client and router
  const supabase = createBrowserClient();
  const router = useRouter();

  // load current app user and their contacts based on messaging history
  useEffect(() => {
    const loadUserAndContacts = async () => {
      try {
        // get the current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // error if auth error or no user
        if (authError || !user) {
          console.error("Auth error or no user:", authError);
          return;
        }

        // get user_id from users table matching auth_id
        const { data: appUser, error: appUserError } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_id", user.id)
          .maybeSingle();

        // error if issues fetching app user data or no app user
        if (appUserError || !appUser) {
          console.error("Error fetching app user for messaging:", appUserError);
          return;
        }

        // store current user_id in state
        const currentUserId = appUser.user_id as number;
        setAppUserId(currentUserId);

        // load messaging history to build contacts matching either a sender or recipient as current user id
        const { data: messages, error: messagesError } = await supabase
          .from("messaging")
          .select("sender_id, recipient_id")
          .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

        // error if issues fetching messaging history
        if (messagesError) {
          console.error("Error fetching messaging history:", messagesError);
          return;
        }

        // if there are no messages then contacts is empty
        if (!messages || messages.length === 0) {
          setContacts([]);
          return;
        }

        // collect unique other user id (sender or recipient that is no current user) from messaging
        const otherIdsSet = new Set<number>();
        for (const msg of messages) {
          const senderId = msg.sender_id as number | null;
          const recipientId = msg.recipient_id as number | null;

          // get the id in the message that is not the current user
          const otherId =
            senderId === currentUserId ? recipientId : senderId === null ? null : senderId;

          // add to set to keep contacts unique if valid and not current user
          if (otherId && otherId !== currentUserId) {
            otherIdsSet.add(otherId);
          }
        }

        // if no other id in set then contacts is empty
        const otherIds = Array.from(otherIdsSet);
        if (otherIds.length === 0) {
          setContacts([]);
          return;
        }

        // fetch contact user info based on collected other ids
        const { data: contactUsers, error: contactUsersError } = await supabase
          .from("users")
          .select("user_id, first_name, last_name, titles")
          .in("user_id", otherIds);

        // error is issues fetching contact users or no contact users
        if (contactUsersError || !contactUsers) {
          console.error("Error fetching contact users:", contactUsersError);
          return;
        }

        // fetch points for those contact users
        const { data: contactPoints, error: contactPointsError } = await supabase
          .from("points")
          .select("user_id, total_points")
          .in("user_id", otherIds);

        // error if issues fetching contact points
        if (contactPointsError) {
          console.error("Error fetching contact points:", contactPointsError);
        }

        // map points by user_id for easy lookup
        const pointsMap = new Map<number, number>();
        (contactPoints ?? []).forEach((row: any) => {
          pointsMap.set(row.user_id as number, row.total_points ?? 0);
        });

        // build contact array of people with their info and points
        const contactPeople: Person[] = contactUsers.map((u: any) => ({
          id: u.user_id,
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          titles: (u.titles as string[]) ?? [],
          totalPoints: pointsMap.get(u.user_id) ?? 0,
        }));

        // set the state of contacts
        setContacts(contactPeople);
      } 
      catch (err) {
        // error if could not load user or contacts
        console.error("Unexpected error loading messaging contacts:", err);
      }
    };

    loadUserAndContacts();
  }, []);

  // run search whenever query changes
  useEffect(() => {
    const runSearch = async () => {
      // trim the query
      const trimmed = searchQuery.trim();

      console.log("Running search for query:", trimmed);

      // if empty query then no results
      if (!trimmed) {
        setSearchResults([]);
        return;
      }

      // app user id is required
      // if (!appUserId) {
      //   return;
      // }

      try {
        // get all searchable users:
        // first_name NOT NULL
        // last_name NOT NULL
        // profile_status = 'public'
        // not the current user
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("user_id, first_name, last_name, titles, profile_status")
          .not("first_name", "is", null)
          .not("last_name", "is", null)
          .eq("profile_status", "public")
          .neq("user_id", appUserId);

        console.log("Searchable users data:", usersData);

        // error if issues fetching user data or no user data
        if (usersError || !usersData) {
          console.error("Error searching users:", usersError);
          return;
        }

        // make search case insensitive
        const lowerQuery = trimmed.toLowerCase();

        // filter on "first_name last_name"
        const filtered = usersData.filter((u: any) => {
          const fullName = `${u.first_name ?? ""} ${u.last_name ?? ""}`
            .trim()
            .toLowerCase();
          // return true if full name includes the search query
          return fullName.includes(lowerQuery);
        });

        // if no filtered results then set empty and return
        if (filtered.length === 0) {
          setSearchResults([]);
          return;
        }
        
        // collect ids of filtered results
        const ids = filtered.map((u: any) => u.user_id as number);

        // fetch points for search results based on collected ids
        const { data: pointsData, error: pointsError } = await supabase
          .from("points")
          .select("user_id, total_points")
          .in("user_id", ids);

        // error if issues fetching points
        if (pointsError) {
          console.error("Error fetching points for search results:", pointsError);
        }

        // map points by user_id for easy lookup
        const pointsMap = new Map<number, number>();
        (pointsData ?? []).forEach((row: any) => {
          pointsMap.set(row.user_id as number, row.total_points ?? 0);
        });

        // build results array of people with their info and points
        const results: Person[] = filtered.map((u: any) => ({
          id: u.user_id,
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          titles: (u.titles as string[]) ?? [],
          totalPoints: pointsMap.get(u.user_id) ?? 0,
        }));

        // set the search results state
        setSearchResults(results);
      } 
      catch (err) {
        // error if issues running search
        console.error("Unexpected error running search:", err);
      }
    };

    runSearch();
  }, [searchQuery]);

  // route to message page when clicking message button
  const handleMessageClick = (person: Person) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "stemlink:activeConversation",
        JSON.stringify(person)
      );
    }

    router.push("/messages");
  };

  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col bg-white px-4 py-8">
      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex-[65] rounded-3xl bg-white border border-slate-200 px-6 py-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-slate-900">Search</h2>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                console.log("Input changed to:", e.target.value); 
                setSearchQuery(e.target.value);
              }}
              placeholder="Enter your search by first and last name here"
              className="w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Search Results
            </label>
            <div className="flex-1 rounded-2xl border border-black bg-white px-4 py-4 flex flex-col gap-3 min-h-[140px]">
              {searchResults.length === 0 ? (
                <p className="text-base text-slate-400">
                  Search results will appear here when you enter a search above
                </p>
              ) : (
                searchResults.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {person.firstName} {person.lastName}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMessageClick(person)}
                        className="rounded-2xl border border-black bg-green-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-green-500/90"
                      >
                        Message them
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPerson(person)}
                        className="rounded-2xl border border-black bg-green-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-green-500/90"
                      >
                        More info
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-[35] rounded-3xl bg-white border border-slate-200 px-6 py-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-slate-900">Contacts</h2>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Contacts
            </label>
            <div className="flex-1 rounded-2xl border border-black bg-white px-4 py-4 flex flex-col gap-3 min-h-[140px]">
              {contacts.length === 0 ? (
                <p className="text-base text-slate-400">
                  Contacts will appear here when you start messaging people
                </p>
              ) : (
                contacts.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleMessageClick(person)}
                    className="text-left rounded-2xl border border-slate-200 bg-green-500 px-4 py-3 hover:bg-green-500/90 cursor-pointer"
                  >
                    <p className="text-sm font-semibold text-white">
                      {person.firstName} {person.lastName}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-3xl border border-black bg-white px-6 py-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {selectedPerson.firstName} {selectedPerson.lastName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black bg-green-500 text-sm font-bold text-white"
              >
                x
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-800">
                <span className="font-semibold">Titles: </span>
                {selectedPerson.titles && selectedPerson.titles.length > 0
                  ? selectedPerson.titles.join(", ")
                  : "No titles"}
              </p>
              <p className="text-sm text-slate-800">
                <span className="font-semibold">Points: </span>
                {selectedPerson.totalPoints}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
