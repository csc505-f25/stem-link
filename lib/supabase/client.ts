"use client";
import { createClient } from "@supabase/supabase-js";

// create a supabase client for browser usage
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
