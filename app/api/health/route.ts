// Health check: reports which integrations are configured (booleans only, never values).
export const dynamic = "force-dynamic";

export function GET() {
  const has = (key: string) => Boolean(process.env[key]);
  return Response.json({
    ok: true,
    configured: {
      supabase: has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      anthropic: has("ANTHROPIC_API_KEY"),
      openai: has("OPENAI_API_KEY"),
      stripeTestMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false,
    },
  });
}
