"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const ProfilePage: React.FC = () => {
  // set up state to track edits to the profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  // set up state to track displayed info
  const [titles, setTitles] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [subjectPoints, setSubjectPoints] = useState<Record<string, number>>(
    {}
  );
  const [appUserId, setAppUserId] = useState<number | null>(null);

  // set up an initial state
  const [initialProfile, setInitialProfile] = useState({
    firstName: "",
    lastName: "",
    isPublic: false,
  });

  // connect to supabase
  const supabase = createBrowserClient();

  useEffect(() => {
    // try to load the profile on mount and error if couldn't
    const loadProfile = async () => {
      try {
        // grab the current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        // error accordingly if auth error or no user
        if (authError || !user) {
          console.error("Auth error or no user:", authError);
          return;
        }

        // grab all of the info we'll need from user table
        const { data: appUser, error: appUserError } = await supabase
          .from("users")
          .select("user_id, first_name, last_name, titles, profile_status")
          .eq("auth_id", user.id)
          .maybeSingle();

        // error accordingly if there was an error getting the info or no info
        if (appUserError || !appUser) {
          console.error("Error fetching app user:", appUserError);
          return;
        }

        // set up what we are going to load first on page load
        const loadedFirstName = appUser.first_name ?? "";
        const loadedLastName = appUser.last_name ?? "";
        const loadedIsPublic = appUser.profile_status === "public";
        const loadedTitles: string[] = appUser.titles ?? [];

        // set it equal to state
        setFirstName(loadedFirstName);
        setLastName(loadedLastName);
        setIsPublic(loadedIsPublic);
        setTitles(loadedTitles);
        setAppUserId(appUser.user_id);

        // set up initial state
        setInitialProfile({
          firstName: loadedFirstName,
          lastName: loadedLastName,
          isPublic: loadedIsPublic,
        });

        // grab all of the info we'll need from points table
        const { data: pointsRow, error: pointsError } = await supabase
          .from("points")
          .select("total_points, subject_points")
          .eq("user_id", appUser.user_id)
          .maybeSingle();

        // error accordingly if there was an error getting the info or no info
        if (pointsError || !pointsRow) {
          console.error("Error fetching points row:", pointsError);
          return;
        }

        // set the state of what info we got
        setTotalPoints(pointsRow.total_points ?? 0);
        setSubjectPoints(
          (pointsRow.subject_points as Record<string, number>) ?? {}
        );
      } 
      catch (err) {
        console.error("Unexpected error loading profile:", err);
      }
    };

    loadProfile();
  }, []);

  // check if the user has changed any of their info
  const hasChanges =
    firstName !== initialProfile.firstName ||
    lastName !== initialProfile.lastName ||
    isPublic !== initialProfile.isPublic;

  // save what the user changed
  const handleSave = async () => {
    // error if the user id couldn't be found 
    if (!appUserId) {
      console.error("No app user id; cannot save profile");
      return;
    }

    // set the profile status accordingly
    const profile_status = isPublic ? "public" : "private";

    // update users table on save to updated first name, last name, or profile status
    const { error } = await supabase
      .from("users")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        profile_status,
      })
      .eq("user_id", appUserId);

    // error accordingly if couldn't update table
    if (error) {
      console.error("Error updating profile:", error);
      return;
    }

    // save initial profile so we can adjust for changes
    setInitialProfile({ firstName, lastName, isPublic });
  };

  // render the profile page
  return (
    <div className="flex-1 flex flex-col bg-white px-6 py-10 lg:px-16 lg:py-12 overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-start mt-6">
        <div className="w-full max-w-[1040px] flex flex-1 flex-col gap-8">
          <div className="w-full flex-1 rounded-3xl bg-white border border-slate-200 px-8 py-8 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="mt-1 w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="mt-1 w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </label>
                <div className="mt-1 inline-flex w-full rounded-2xl border border-black overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 py-3 text-sm font-semibold ${
                      isPublic
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-black"
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 py-3 text-sm font-semibold ${
                      !isPublic
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-black"
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Titles
              </label>
              <div className="mt-1 w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-slate-900">
                {titles.length ? (
                  <p>{titles.join(", ")}</p>
                ) : (
                  <p className=" text-base text-slate-400">Titles will appear here once they have been unlocked</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex-1 flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Points
                </label>
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-black">
                    <p className="text-3xl font-bold text-black">
                      {totalPoints}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Breakdown
                </label>
                <div className="mt-1 rounded-2xl border border-black bg-white px-5 py-4">
                  {Object.entries(subjectPoints).map(([subject, value]) => (
                    <p
                      key={subject}
                      className="text-base text-slate-800 leading-relaxed"
                    >
                      {subject}: {value}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                className="mt-4 w-full rounded-2xl bg-green-500 px-8 py-3 text-center text-white font-semibold text-sm sm:text-base shadow-sm hover:bg-green-500/90"
              >
                Click here to save changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
