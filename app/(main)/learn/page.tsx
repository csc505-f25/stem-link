"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TOPICS_LIST, DIFFICULTY_LEVELS } from "@/constants";
import { createBrowserClient } from "@/lib/supabase/client";

const LearnPage = () => {
  const router = useRouter();
  const supabase = createBrowserClient();

  // create a users and points row the first time they hit /learn
  useEffect(() => {

    const setupUserAndPoints = async () => {
      // get current auth user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // not signed in or some auth issue so nothing to set up
        console.error("Auth error or no user:", authError);
        return;
      }

      // find or create row in public.users, keyed by auth_id
      let appUserId: number | null = null;

      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_id", user.id) 
        .maybeSingle();

      // if error other than no rows found, log and exit
      if (existingUserError && existingUserError.code !== "PGRST116") {
        console.error("Error checking users table:", existingUserError);
        return;
      }

      // if user already exists then set user id
      if (existingUser) {
        appUserId = existingUser.user_id;
      } 
      else {
        // create new row in users table
        const { data: newUser, error: insertUserError } = await supabase
          .from("users")
          .insert({
            auth_id: user.id,
            first_name: null,
            last_name: null,
            titles: [],
            profile_status: "private",
          })
          .select("user_id")
          .single();

        // if error inserting, log and exit
        if (insertUserError || !newUser) {
          console.error("Error inserting user row:", insertUserError);
          return;
        }

        // got new user_id
        appUserId = newUser.user_id;
      }

      // exit if no appUserId for some reason
      if (!appUserId) {
        return;
      }

      // ensure points row exists for this user_id
      const { data: existingPoints, error: existingPointsError } = await supabase
        .from("points")
        .select("user_id")
        .eq("user_id", appUserId)
        .maybeSingle();

      // if error other than no rows found, log and exit
      if (existingPointsError && existingPointsError.code !== "PGRST116") {
        console.error("Error checking points table:", existingPointsError);
        return;
      }

      // add points row if it didn't already exist
      if (!existingPoints) {
        const { error: insertPointsError } = await supabase.from("points").insert({
          user_id: appUserId,
          total_points: 0,
          subject_points: {
            "Physics": 0,
            "Chemistry": 0,
            "Biology": 0,
            "Earth Science": 0,
            "Environmental Science": 0,
            "Astronomy": 0,
            "Computer Science": 0,
            "Data Science": 0,
            "Information Technology": 0,
            "Electronics & Robotics": 0,
            "Mechanical Engineering": 0,
            "Electrical Engineering": 0,
            "Civil Engineering": 0,
            "Chemical Engineering": 0,
            "Aerospace Engineering": 0,
            "Biomedical Engineering": 0,
            "Industrial & Systems Engineering": 0,
            "Algebra": 0,
            "Geometry": 0,
            "Calculus": 0,
            "Statistics & Probability": 0,
            "Discrete Mathematics": 0,
            "Linear Algebra": 0
          },
        });

        // if error inserting then log it
        if (insertPointsError) {
          console.error("Error inserting points row:", insertPointsError);
        }
      }
    };

    setupUserAndPoints();
  }, []);

  // keep track of topic and difficulty selected and loading state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // handle which topic and difficulty was selected and start loading
  const handleSelect = async (topic: string, difficulty: string) => {
    setSelectedTopic(topic);
    setSelectedDifficulty(difficulty);
    setIsLoading(true);

    // try to call api to generate question
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });

      // error if response not ok
      if (!res.ok) {
        console.error("Failed to generate question");
        return;
      }

      // set response data in session storage and navigate to question page
      const data = await res.json();

      if (typeof window !== "undefined") {
        sessionStorage.setItem("stemlink:lastQuestion", JSON.stringify(data));
      }

      router.push("/question");
    } 
    catch (err) {
      console.error("Error calling /api/generate-question:", err);
    } 
    finally {
      setIsLoading(false);
    }
  };

  // render the learn page
  return (
    <div className="flex-1 flex flex-col bg-white px-6 py-6 lg:px-10 lg:py-8">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {TOPICS_LIST.map((topic) => (
            <div
              key={topic}
              className="w-full rounded-3xl bg-green-500 px-8 py-6 lg:py-8 text-white shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <span className="text-xl font-semibold lg:text-2xl">
                  {topic}
                </span>

                <div className="flex flex-wrap gap-4">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <Button
                      key={level}
                      size="lg"
                      variant="default"
                      className="bg-white text-slate-500 hover:bg-slate-100 px-6 py-3 rounded-full text-base"
                      onClick={() => handleSelect(topic, level)}
                      disabled={isLoading}
                    >
                      {isLoading &&
                      selectedTopic === topic &&
                      selectedDifficulty === level
                        ? "LOADING..."
                        : level.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
