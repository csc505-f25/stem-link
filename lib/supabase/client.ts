"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// create a supabase client for browser usage
let browserClient: SupabaseClient | null = null;

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return browserClient;
}