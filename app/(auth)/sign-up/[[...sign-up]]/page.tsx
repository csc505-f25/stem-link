"use client";

import { Auth } from "@supabase/auth-ui-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// sign up page component
export default function SignUpPage() {
  const supabase = createBrowserClient();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-6">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="sign_up"
          redirectTo="${window.location.origin}/"
        />
      </div>
    </div>
  );
}
