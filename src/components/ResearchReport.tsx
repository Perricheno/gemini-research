
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface ResearchReportProps {
  finalReport: string;
  onDownload: () => void;
}

const ResearchReport: React.FC<ResearchReportProps> = ({ finalReport, onDownload }) => {
  return (
    <Card className="border-2 border-foreground animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl font-light">
            <FileText className="h-5 w-5" />
            Профессиональный исследовательский отчет
          </div>
          <Button 
            onClick={onDownload} 
            variant="outline" 
            size="sm"
            className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Скачать отчет
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm font-light leading-relaxed">{finalReport}</pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchReport;
