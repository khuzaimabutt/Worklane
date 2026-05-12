import { createClient as createSbClient } from "@supabase/supabase-js";

/** Service-role client — server-only, bypasses RLS. Never expose to the browser. */
export const createAdminClient = () =>
  createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
