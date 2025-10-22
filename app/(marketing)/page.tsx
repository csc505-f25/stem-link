"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

// marketing page component
export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Check once if the user is signed in
    supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(!!data.user);
      //console.log("user data:", data);
    });

    setLoading(false);
  }, []);

  // render the marketing page
  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col items-center justify-center gap-2 p-4 lg:flex-row bg-white">
      {/* Hero image */}
      <div className="relative mb-8 h-[240px] w-[240px] lg:mb-0 lg:h-[424px] lg:w-[424px]">
        <Image src="/hero.svg" alt="Hero" fill />
      </div>

      {/* Text + Buttons */}
      <div className="flex flex-col items-center gap-y-8">
        <h1 className="max-w-[480px] text-center text-xl font-bold text-neutral-600 lg:text-3xl">
          Learn, practice, and master STEM topics with STEM-Link.
        </h1>

        <div className="flex w-full max-w-[330px] flex-col items-center gap-y-3">
          {loading ? (
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isSignedIn ? (
            <Button size="lg" variant="secondary" className="w-full" asChild>
              <Link href="/learn">Continue Learning</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>

              {/*
              <Button size="lg" variant="primaryOutline" className="w-full" asChild>
                <Link href="/sign-in">I already have an account</Link>
              </Button>
              */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
