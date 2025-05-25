'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailEstimate } from '@/lib/actions/emailActions';
import { Mail, X } from 'lucide-react';
import { companyDetails } from '@/lib/config';

// Form schema
const emailFormSchema = z.object({
  recipients: z.string()
    .min(1, 'At least one recipient email is required')
    .refine((value) => {
      const emails = value.split(',').map(email => email.trim()).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emails.every(email => emailRegex.test(email));
    }, 'Please enter valid email addresses separated by commas'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Message body is required'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: number;
  estimateNumber: string;
  customerName: string;
}

export function EmailEstimateDialog({ 
  open, 
  onOpenChange, 
  estimateId, 
  estimateNumber,
  customerName 
}: EmailEstimateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipients: '',
      subject: `Estimate ${estimateNumber} - ${customerName}`,
      body: `Dear ${customerName},

Please find attached the estimate for your well drilling project.

Estimate #: ${estimateNumber}
Customer: ${customerName}

We appreciate the opportunity to provide you with this estimate. If you have any questions or would like to discuss the details, please don't hesitate to contact us.

Thank you for your business.

Best regards,
${companyDetails.name}
${companyDetails.phone}`,
    },
  });

  const onSubmit = async (data: EmailFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      // Parse recipients
      const recipients = data.recipients
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);

      const result = await emailEstimate({
        estimateId,
        recipients,
        subject: data.subject,
        body: data.body,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        form.reset();
      }, 2000);

    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setError(null);
      setSuccess(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Estimate
          </DialogTitle>
          <DialogDescription>
            Send estimate {estimateNumber} to the customer via email.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Email sent successfully! This dialog will close automatically.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com, another@example.com"
                      {...field}
                      disabled={isSubmitting || success}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter one or more email addresses separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email subject"
                      {...field}
                      disabled={isSubmitting || success}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Email message body"
                      className="min-h-[200px]"
                      {...field}
                      disabled={isSubmitting || success}
                    />
                  </FormControl>
                  <FormDescription>
                    The estimate PDF will be automatically attached
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || success}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 