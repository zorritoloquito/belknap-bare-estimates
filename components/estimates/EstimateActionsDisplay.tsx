'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateEstimatePdf } from '@/lib/actions/pdfActions';
import { exportEstimateLineItemsAsCsv } from '@/lib/actions/csvActions';
import { approveEstimate } from '@/lib/actions/estimateActions';
import { Download, FileSpreadsheet, CheckCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmailEstimateDialog } from './EmailEstimateDialog';

interface EstimateActionsDisplayProps {
  estimateId: number;
  estimateNumber: string;
  status: string;
  customerName?: string;
}

export function EstimateActionsDisplay({ estimateId, estimateNumber, status, customerName }: EstimateActionsDisplayProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const router = useRouter();

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setError(null);

      const result = await generateEstimatePdf(estimateId);
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Create blob and download
      const blob = new Blob([result.pdf], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Estimate-${estimateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      setError(null);

      const result = await exportEstimateLineItemsAsCsv(estimateId);
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Create blob and download
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Estimate-${estimateNumber}-LineItems.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleApproveEstimate = async () => {
    try {
      setIsApproving(true);
      setError(null);

      const result = await approveEstimate(estimateId);
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error('Error approving estimate:', error);
      setError('Failed to approve estimate. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Actions</CardTitle>
        <CardDescription>
          Download or manage your estimate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || isExportingCsv || isApproving}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          
          <Button 
            onClick={handleExportCsv}
            disabled={isGeneratingPdf || isExportingCsv || isApproving}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExportingCsv ? 'Exporting CSV...' : 'Export CSV'}
          </Button>
          
          {/* Email button - only visible for approved estimates */}
          {status === 'Approved' && (
            <Button
              onClick={() => setIsEmailDialogOpen(true)}
              disabled={isGeneratingPdf || isExportingCsv || isApproving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Estimate
            </Button>
          )}
          
          {status === 'Draft' && (
            <Button 
              onClick={handleApproveEstimate}
              disabled={isGeneratingPdf || isExportingCsv || isApproving}
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              {isApproving ? 'Approving...' : 'Approve Estimate'}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Email Dialog */}
      <EmailEstimateDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        estimateId={estimateId}
        estimateNumber={estimateNumber}
        customerName={customerName || 'Customer'}
      />
    </Card>
  );
} 