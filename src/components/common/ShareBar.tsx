import React from 'react';
import { Printer, Link, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

interface ShareBarProps {
  title?: string;
}

export default function ShareBar({ title = "Underwriting Summary" }: ShareBarProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadPDF = () => {
    // For now, just trigger print dialog
    // In a real implementation, this would generate a proper PDF
    toast.info("PDF generation coming soon - using print for now");
    window.print();
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="flex items-center space-x-2"
      >
        <Printer className="h-4 w-4" />
        <span>Print</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>Save PDF</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center space-x-2"
      >
        <Link className="h-4 w-4" />
        <span>Copy Link</span>
      </Button>
    </div>
  );
}