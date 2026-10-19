/**
 * Middleware: protect /admin/* (except /admin/login).
 *
 * - No session cookie  -> redirect to /admin/login
 * - Session present    -> allow through; the admin layout re-verifies the
 *   caller's role server-side (never trust the session alone).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Without Supabase configured, send everyone to the login page,
  // which explains the missing configuration.
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const res = NextResponse.next();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        res.cookies.set({ name, value, ...(options as object) });
      },
      remove(name: string, options: Record<string, unknown>) {
        res.cookies.set({ name, value: "", ...(options as object) });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
