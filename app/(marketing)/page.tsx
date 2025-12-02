"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

// create the supabase client once at module scope
const supabase = createBrowserClient();

// marketing page component
export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // see if we need to change the state variables based on whether user signed in before
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setIsSignedIn(false);
      } 
      else {
        setIsSignedIn(!!data.session);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // render the marketing page
  return (
    <div className="mx-auto flex w-full max-w-[988px] flex-1 flex-col items-center justify-center gap-2 p-4 lg:flex-row bg-white">
      <div className="relative mb-8 h-[240px] w-[240px] lg:mb-0 lg:h-[300px] lg:w-[300px]">
        <Image src="/mascot.svg" alt="Hero" fill />
      </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
