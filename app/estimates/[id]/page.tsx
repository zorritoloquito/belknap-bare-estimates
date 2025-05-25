import { EstimateActionsDisplay } from '@/components/estimates/EstimateActionsDisplay';
import { db } from '@/db/db';
import { estimates, customers, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface EstimateDetailPageProps {
  params: {
    id: string;
  };
}

export default async function EstimateDetailPage({ params }: EstimateDetailPageProps) {
  const estimateId = parseInt(params.id);
  
  if (isNaN(estimateId)) {
    notFound();
  }

  // Fetch estimate with customer and job info
  const estimateData = await db
    .select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      estimateDate: estimates.estimateDate,
      status: estimates.status,
      customerName: customers.name,
      jobNameLocation: jobs.nameLocation,
    })
    .from(estimates)
    .innerJoin(customers, eq(estimates.customerId, customers.id))
    .innerJoin(jobs, eq(estimates.jobId, jobs.id))
    .where(eq(estimates.id, estimateId))
    .limit(1);

  if (!estimateData.length) {
    notFound();
  }

  const estimate = estimateData[0];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Estimate {estimate.estimateNumber}
      </h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Estimate Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-medium text-gray-500">Customer</dt>
              <dd>{estimate.customerName}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Job Location</dt>
              <dd>{estimate.jobNameLocation}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Date</dt>
              <dd>{estimate.estimateDate ? new Date(estimate.estimateDate).toLocaleDateString() : 'N/A'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  estimate.status === 'Approved' 
                    ? 'bg-green-100 text-green-800'
                    : estimate.status === 'Draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {estimate.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <EstimateActionsDisplay 
          estimateId={estimate.id} 
          estimateNumber={estimate.estimateNumber || `E${estimate.id}`}
          status={estimate.status || 'Draft'}
        />
      </div>
    </div>
  );
} 