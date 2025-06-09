
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface ResearchReportProps {
  finalReport: string;
  onDownload: () => void;
  theme?: 'light' | 'dark';
}

const ResearchReport: React.FC<ResearchReportProps> = ({ finalReport, onDownload, theme = 'light' }) => {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 border-white text-white' 
    : 'bg-white border-black text-black';

  const buttonClasses = theme === 'dark'
    ? 'border-white hover:bg-white hover:text-black'
    : 'border-black hover:bg-black hover:text-white';

  return (
    <Card className={`border-2 animate-fade-in ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl font-light">
            <FileText className="h-5 w-5" />
            Professional Research Report
          </div>
          <Button 
            onClick={onDownload} 
            variant="outline" 
            size="sm"
            className={`transition-all duration-200 ${buttonClasses}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
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
