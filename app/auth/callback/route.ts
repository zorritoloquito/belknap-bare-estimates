import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const dynamic = 'force-dynamic'; // Ensures cookies() is readable

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // @ts-expect-error - Next.js cookies() works in Route Handlers with force-dynamic
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // @ts-expect-error - Next.js cookies() works in Route Handlers with force-dynamic
            cookies().set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // @ts-expect-error - Next.js cookies() works in Route Handlers with force-dynamic
            cookies().set({ name, value: '', ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Error exchanging code for session:', error.message);
  }

  // return the user to an error page with instructions
  console.error('No code found in auth callback or error exchanging code.');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`); // Or a more generic error page
} 