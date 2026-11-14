import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server writes (entries, ledger).
// Returns null when Supabase is not configured; callers fall back to local mode.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Resolves the calling guest from their Supabase access token.
export async function playerFromRequest(req: Request, admin: SupabaseClient): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user.id;
}
