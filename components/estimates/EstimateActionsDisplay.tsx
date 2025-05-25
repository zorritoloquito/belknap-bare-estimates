'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateEstimatePdf } from '@/lib/actions/pdfActions';
import { exportEstimateLineItemsAsCsv } from '@/lib/actions/csvActions';
import { Download, FileSpreadsheet } from 'lucide-react';

interface EstimateActionsDisplayProps {
  estimateId: number;
  estimateNumber: string;
  status: string;
}

export function EstimateActionsDisplay({ estimateId, estimateNumber, status }: EstimateActionsDisplayProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            disabled={isGeneratingPdf || isExportingCsv}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          
          <Button 
            onClick={handleExportCsv}
            disabled={isGeneratingPdf || isExportingCsv}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExportingCsv ? 'Exporting CSV...' : 'Export CSV'}
          </Button>
          
          {/* Future buttons for other actions */}
          <Button variant="outline" disabled>
            Email Estimate
          </Button>
          
          {status === 'Draft' && (
            <Button variant="outline" disabled>
              Approve Estimate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 