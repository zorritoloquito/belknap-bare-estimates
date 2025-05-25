'use server';

import { Resend } from 'resend';
import { generateEstimatePdf } from './pdfActions';
import { db } from '@/db/db';
import { estimates, customers, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { companyDetails } from '@/lib/config';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailEstimateResult = 
  | { success: true }
  | { success: false; error: string };

export interface EmailEstimateParams {
  estimateId: number;
  recipients: string[];
  subject: string;
  body: string;
}

export async function emailEstimate({
  estimateId,
  recipients,
  subject,
  body
}: EmailEstimateParams): Promise<EmailEstimateResult> {
  // Create Supabase client with Next.js 15 compatible cookies handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value, ...options });
        },
        async remove(name: string, options: Record<string, unknown>) {
          (await cookies()).set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // Verify that the estimate exists and belongs to the user
    const estimateData = await db
      .select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        status: estimates.status,
        userId: estimates.userId,
        customerName: customers.name,
      })
      .from(estimates)
      .innerJoin(customers, eq(estimates.customerId, customers.id))
      .where(eq(estimates.id, estimateId))
      .limit(1);

    if (!estimateData.length) {
      return { success: false, error: 'Estimate not found.' };
    }

    const estimate = estimateData[0];

    // Check if the estimate belongs to the current user
    if (estimate.userId !== user.id) {
      return { success: false, error: 'You do not have permission to email this estimate.' };
    }

    // Check if the estimate is approved (optional business rule)
    if (estimate.status !== 'Approved') {
      return { success: false, error: 'Only approved estimates can be emailed.' };
    }

    // Generate the PDF
    const pdfResult = await generateEstimatePdf(estimateId);
    if (!pdfResult.success) {
      return { success: false, error: `Failed to generate PDF: ${pdfResult.error}` };
    }

    // Validate recipients
    if (!recipients || recipients.length === 0) {
      return { success: false, error: 'At least one recipient email is required.' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email.trim()));
    if (invalidEmails.length > 0) {
      return { success: false, error: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }

    // Prepare email attachment
    const attachment = {
      filename: `Estimate-${estimate.estimateNumber}.pdf`,
      content: Buffer.from(pdfResult.pdf),
    };

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_SENDER || `estimates@${companyDetails.name.toLowerCase().replace(/\s+/g, '')}.com`,
      to: recipients,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${companyDetails.name}</h2>
          <div style="margin: 20px 0; white-space: pre-line;">${body}</div>
          
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;" />
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Estimate Details</h3>
            <p style="margin: 5px 0;"><strong>Estimate #:</strong> ${estimate.estimateNumber}</p>
            <p style="margin: 5px 0;"><strong>Customer:</strong> ${estimate.customerName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${estimate.status}</p>
          </div>
          
          <hr style="margin: 30px 0; border: 1px solid #e5e7eb;" />
          
          <div style="font-size: 14px; color: #6b7280;">
            <p><strong>${companyDetails.name}</strong></p>
            <p>${companyDetails.addressLine1}</p>
            <p>Phone: ${companyDetails.phone}</p>
            <p>Website: ${companyDetails.website}</p>
            <p>License #${companyDetails.contractorsLicenseNo}</p>
          </div>
        </div>
      `,
      attachments: [attachment],
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return { success: false, error: `Failed to send email: ${emailResult.error.message}` };
    }

    return { success: true };

  } catch (error: unknown) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: `Failed to send email: ${errorMessage}` };
  }
} 