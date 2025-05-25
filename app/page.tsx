import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Force dynamic rendering for reliable cookies() access
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          return (await cookies()).get(name)?.value;
        },
      },
    }
  );

  // Check if we have a session
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  // Redirect based on session status
  if (session) {
    redirect('/estimates/new');
  } else {
    redirect('/login');
  }

  return null;
}
