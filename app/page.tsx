import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getUserEstimates } from '@/lib/actions/estimateActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Fetch user estimates
  const estimatesResult = await getUserEstimates();

  if (!estimatesResult.success) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading estimates: {estimatesResult.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const estimates = estimatesResult.estimates;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimates Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your well drilling estimates
          </p>
        </div>
        <Link href="/estimates/new">
          <Button>Create New Estimate</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Estimates</CardTitle>
          <CardDescription>
            {estimates.length === 0 
              ? "You haven't created any estimates yet." 
              : `You have ${estimates.length} estimate${estimates.length === 1 ? '' : 's'}.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No estimates found. Create your first estimate to get started.
              </p>
              <Link href="/estimates/new">
                <Button>Create Your First Estimate</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell className="font-medium">
                      {estimate.estimateNumber}
                    </TableCell>
                    <TableCell>{estimate.customerName}</TableCell>
                    <TableCell>
                      {new Date(estimate.estimateDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        estimate.status === 'Draft' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : estimate.status === 'Approved' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {estimate.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {estimate.totalAmount > 0 
                        ? `$${estimate.totalAmount.toLocaleString()}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                          View
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
