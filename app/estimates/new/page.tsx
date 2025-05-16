'use client'; // Or remove if no client-side interactivity needed initially

import Link from 'next/link';

export default function NewEstimatePage() {
  // TODO: Add logic here to ensure user is authenticated,
  // although middleware and app/page.tsx should handle primary redirection.
  // This page will later host the main estimate creation form.

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Create New Estimate</h1>
      <p className="mb-4">
        You must be logged in to create a new estimate. If you are seeing this page,
        it means you are authenticated.
      </p>
      <p className="mb-4">
        This page will soon contain the form to create new submersible pump estimates.
      </p>
      <p>
        <Link href="/" className="text-blue-500 hover:underline">
          Go back to Dashboard/Home
        </Link>
      </p>
      {/* Placeholder for EstimateForm component that will be built in Phase 4 */}
    </div>
  );
} 