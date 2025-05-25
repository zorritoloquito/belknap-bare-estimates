'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportEstimatesAsCsv } from '@/lib/actions/csvActions';
import { FileSpreadsheet } from 'lucide-react';

export function ExportEstimatesButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const result = await exportEstimatesAsCsv();
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Create blob and download
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `All-Estimates-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting estimates:', error);
      setError('Failed to export estimates. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {isExporting ? 'Exporting...' : 'Export All Estimates'}
      </Button>
    </div>
  );
} 