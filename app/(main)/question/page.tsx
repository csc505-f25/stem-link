"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { POINTS_PER_QUESTION, DIFFICULTY_LEVELS, TITLES, TITLE_THRESHOLDS } from "@/constants";
import { createBrowserClient } from "@/lib/supabase/client";

// define shape of question data from api
type QuestionData = {
  Subject: string;
  Difficulty: string;
  Question: string;
  Answers: string[];
  Correct_Index: number;
};

const QuestionPage = () => {
  const router = useRouter();
  const supabase = createBrowserClient();

  // state to hold question data and user answer info
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(0);

  // load question from sessionStorage and set state variables and handle errors
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = sessionStorage.getItem("stemlink:lastQuestion");
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as QuestionData;
      setQuestionData(parsed);
    } 
    catch (e) {
      console.error("Failed to parse stored question:", e);
    }
  }, [router]);

  // if no question data, show message
  if (!questionData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-slate-500">
          No question loaded. Go back to the Learn page and select a topic.
        </p>
      </div>
    );
  }

  // split out question data
  const { Subject, Difficulty, Question, Answers, Correct_Index } = questionData;

  const handleAnswerClick = async (index: number) => {
    // if already answered, do nothing
    if (selectedIndex !== null) {
      return;
    } 

    // record selected answer and correctness
    setSelectedIndex(index);
    const correct = index === Correct_Index;
    setIsCorrect(correct);

    // figure out how many points this question is worth and default to easy
    let basePoints = POINTS_PER_QUESTION[0]; 

    if (Difficulty.toLowerCase() === DIFFICULTY_LEVELS[1].toLowerCase()) {
      basePoints = POINTS_PER_QUESTION[1];
    } 
    else if (Difficulty.toLowerCase() === DIFFICULTY_LEVELS[2].toLowerCase()) {
      basePoints = POINTS_PER_QUESTION[2];
    }

    setPointsAmount(basePoints);

    // delta is positive if correct, negative if incorrect
    const delta = correct ? basePoints : -basePoints;

    try {
      // get current auth user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // error if no user or problems getting use auth
      if (authError || !user) {
        console.error("Auth error or no user; skipping DB updates:", authError);
        return;
      }

      // look up app user by auth_id (users.auth_id = auth.users.id)
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("user_id, titles")
        .eq("auth_id", user.id)
        .maybeSingle();

      // error if trouble getting app user or if it doesn't exist
      if (appUserError || !appUser) {
        console.error("Error fetching app user:", appUserError);
        return;
      }

      // set overall app user id and any existing titles right now if any for future use
      const appUserId: number = appUser.user_id;
      const existingTitles: string[] = appUser.titles ?? [];

      // insert into question_history
      const { error: historyError } = await supabase.from("question_history").insert({
        user_id: appUserId,
        question_info: questionData, 
        correct: correct,
        used_messaging: null,         
        // question_id and answered_at are auto-generated
      });

      // log any associted errors but keep on updating
      if (historyError) {
        console.error("Error inserting question_history row:", historyError);
      }

      // get current points row
      const { data: pointsRow, error: pointsError } = await supabase
        .from("points")
        .select("total_points, subject_points")
        .eq("user_id", appUserId)
        .maybeSingle();

      // error is trouble getting points row or if it doesn't exist
      if (pointsError || !pointsRow) {
        console.error("Error fetching points row:", pointsError);
        return;
      }

      // grab current total and current subject scores but change the latter to an easier to work with data type
      const currentTotal = pointsRow.total_points ?? 0;
      const currentSubjects = (pointsRow.subject_points as Record<string, number>) ?? {};

      // grab the current points we're working with on this question
      const currentSubjectPoints = currentSubjects[Subject] ?? 0;

      // adjust total and subject scores based on delta
      const newTotal = currentTotal + delta;
      const updatedSubjectPointsForSubject = currentSubjectPoints + delta;

      // write out old subjects plus the changed one
      const newSubjectPoints: Record<string, number> = {
        ...currentSubjects,
        [Subject]: updatedSubjectPointsForSubject,
      };

      // update titles based on thresholds for any subject
      let newTitles = [...existingTitles];

      for (const [subjectName, subjectPoints] of Object.entries(newSubjectPoints)) {
        TITLE_THRESHOLDS.forEach((threshold, idx) => {
          if (subjectPoints >= threshold) {
            const title = `${TITLES[idx]}${subjectName}`;
            if (!newTitles.includes(title)) {
              newTitles.push(title);
            }
          }
        });
      }

      // update points table
      const { error: updatePointsError } = await supabase
        .from("points")
        .update({
          total_points: newTotal,
          subject_points: newSubjectPoints,
        })
        .eq("user_id", appUserId);

      // log any associated errors but keep on updating
      if (updatePointsError) {
        console.error("Error updating points row:", updatePointsError);
      }

      // update users.titles
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ titles: newTitles })
        .eq("user_id", appUserId);

      // log any associated errors
      if (updateUserError) {
        console.error("Error updating user titles:", updateUserError);
      }
    } 
    catch (err) {
      console.error("Unexpected error during DB updates:", err);
    }
  };

  // construct banner text based on answer correctness
  const bannerText =
    isCorrect === null
      ? ""
      : isCorrect
      ? `Correct! You have earned ${pointsAmount} points for a ${Difficulty} ${Subject} question! Please select a section from the sidebar to exit.`
      : `Incorrect. You have lost ${pointsAmount} points for a ${Difficulty} ${Subject} question. Please select a section from the sidebar to exit.`;

  // render question page
  return (
    <div className="flex-1 flex flex-col bg-white px-6 py-10 lg:px-16 lg:py-12 overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[1040px] flex flex-col gap-8">
          <div className="w-full rounded-3xl bg-white border border-slate-200 px-8 py-8 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-500">
              {Subject} - {Difficulty}
            </p>
            <p className="text-2xl font-semibold text-slate-700 leading-relaxed">
              {Question}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Answers.map((answer, idx) => {
              // determine button styles based on answer state
              const isAnswered = selectedIndex !== null;
              const isThisCorrect = idx === Correct_Index;

              let bg = "bg-green-500";
              let text = "text-white";
              let hover = "hover:bg-green-500/90";

              if (isAnswered) {
                if (isThisCorrect) {
                  bg = "bg-green-500";
                  text = "text-white";
                  hover = "hover:bg-green-500";
                } 
                else {
                  bg = "bg-slate-300";
                  text = "text-slate-600";
                  hover = "hover:bg-slate-300";
                }
              }

              // get answer label (A, B, C, D)
              const label = String.fromCharCode(65 + idx); 

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerClick(idx)}
                  disabled={isAnswered}
                  className={`w-full rounded-2xl px-7 py-5 text-left text-lg font-semibold ${bg} ${text} ${hover} disabled:cursor-default`}
                >
                  <span className="mr-3 font-bold">{label}.</span>
                  {answer}
                </button>
              );
            })}
          </div>

          {isCorrect !== null && (
            <div className="mt-6 w-full rounded-2xl bg-green-500 px-8 py-4 text-center text-white font-semibold text-sm sm:text-base">
              {bannerText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;