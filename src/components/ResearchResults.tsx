
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, EyeOff, Link } from 'lucide-react';
import { ResearchResult } from '../types/research';

interface ResearchResultsProps {
  results: ResearchResult[];
  theme?: 'light' | 'dark';
}

const ResearchResults: React.FC<ResearchResultsProps> = ({ results, theme = 'light' }) => {
  const [showQueries, setShowQueries] = useState(false);

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
            <Search className="h-5 w-5" />
            Query Results ({results.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQueries(!showQueries)}
            className={`transition-all duration-200 ${buttonClasses}`}
          >
            {showQueries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showQueries ? ' Hide' : ' Show'} Details
          </Button>
        </CardTitle>
      </CardHeader>
      {showQueries && (
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 hover:shadow-lg transition-all duration-300 animate-scale-in ${theme === 'dark' ? 'border-white' : 'border-black'}`} style={{animationDelay: `${index * 50}ms`}}>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'} className="font-light">
                    Query {result.chatId}
                  </Badge>
                  <span className="text-sm font-medium flex-1">{result.query}</span>
                </div>
                {result.response && result.status === 'completed' && (
                  <p className={`text-sm mb-3 font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {result.response.substring(0, 200)}...
                  </p>
                )}
                {result.status === 'error' && (
                  <p className="text-sm text-destructive mb-3">
                    {result.response}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`font-light ${theme === 'dark' ? 'border-white' : 'border-black'}`}>
                    <Link className="h-3 w-3 mr-1" />
                    {result.references.length} links
                  </Badge>
                  <Badge variant="outline" className={`font-light ${result.status === 'completed' ? 'border-green-500 text-green-700' : result.status === 'error' ? 'border-red-500 text-red-700' : theme === 'dark' ? 'border-white' : 'border-black'}`}>
                    {result.status}
                  </Badge>
                  {result.references.length > 0 && (
                    <Badge variant="outline" className="border-blue-500 text-blue-700 font-light">
                      URLs: {result.references.filter(r => r.url !== '#citation').length}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ResearchResults;
