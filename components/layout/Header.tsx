'use client';

import Image from 'next/image';
import Link from 'next/link';
import { companyDetails } from '@/lib/config';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="py-4 px-6 bg-gray-100 dark:bg-gray-800 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src={companyDetails.logoPath}
            alt={`${companyDetails.name} Logo`}
            width={150}
            height={50}
            priority
          />
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            {companyDetails.name}
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700" />
          ) : user ? (
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 