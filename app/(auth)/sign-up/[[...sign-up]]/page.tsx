"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

export default function AuthPage() {
  const router = useRouter();

  // listen for auth changes to send back to home page after sign in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AUTH EVENT:", event, session);

      if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // render the auth component
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-6">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined
          }
        />
      </div>
    </div>
  );
}
