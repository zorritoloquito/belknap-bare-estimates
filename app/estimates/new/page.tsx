'use client'; // Or remove if no client-side interactivity needed initially

import EstimateForm from '@/components/estimates/EstimateForm';
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSupabase } from '@/lib/supabase/hooks/useSupabase'; // Assuming a custom hook for Supabase client

export default function NewEstimatePage() {
  // const router = useRouter();
  // const { session } = useSupabase(); // Example: Check session on client if needed beyond middleware

  // useEffect(() => {
  //   if (!session) {
  //     router.replace('/login');
  //   }
  // }, [session, router]);

  // if (!session) {
  //   return <p>Loading or redirecting...</p>; // Or a loading spinner
  // }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header/Title for the page can be here if not part of EstimateForm itself */}
      {/* <h1 className="text-3xl font-bold mb-6">Create New Submersible Pump Estimate</h1> */}
      <EstimateForm />
    </div>
  );
} 