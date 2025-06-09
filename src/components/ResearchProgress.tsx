
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Zap } from 'lucide-react';

interface ResearchProgressProps {
  isResearching: boolean;
  currentStep: string;
  progress: number;
  completedQueries: number;
  totalQueries: number;
  totalReferences: number;
  batchSize: number;
  theme?: 'light' | 'dark';
}

const ResearchProgress: React.FC<ResearchProgressProps> = ({
  isResearching,
  currentStep,
  progress,
  completedQueries,
  totalQueries,
  totalReferences,
  batchSize,
  theme = 'light'
}) => {
  if (!isResearching) return null;

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 border-white text-white' 
    : 'bg-white border-black text-black';

  return (
    <Card className={`border-2 animate-slide-in-right ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="text-xl font-light flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="w-full h-2" />
          <p className={`text-sm font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{currentStep}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={`font-light ${theme === 'dark' ? 'border-white text-white' : 'border-black text-black'}`}>
              <Clock className="h-3 w-3 mr-1" />
              {completedQueries}/{totalQueries}
            </Badge>
            <Badge variant="outline" className={`font-light ${theme === 'dark' ? 'border-white text-white' : 'border-black text-black'}`}>
              <Zap className="h-3 w-3 mr-1" />
              {totalReferences} refs
            </Badge>
            <Badge variant="outline" className={`font-light ${theme === 'dark' ? 'border-white text-white' : 'border-black text-black'}`}>
              Batch: {batchSize}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchProgress;
