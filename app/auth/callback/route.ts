import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/sign-in?error=unconfigured", origin));
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchange:", error.message);
      return NextResponse.redirect(
        new URL("/sign-in?error=invalid_link", origin)
      );
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type ?? "magiclink",
    });

    if (error) {
      console.error("[auth/callback] verifyOtp:", error.message);
      return NextResponse.redirect(
        new URL("/sign-in?error=invalid_link", origin)
      );
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/sign-in?error=missing_code", origin));
}
