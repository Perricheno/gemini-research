
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, EyeOff, Link } from 'lucide-react';
import { ResearchResult } from '../types/research';

interface ResearchResultsProps {
  results: ResearchResult[];
}

const ResearchResults: React.FC<ResearchResultsProps> = ({ results }) => {
  const [showQueries, setShowQueries] = useState(false);

  return (
    <Card className="border-2 border-muted animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl font-light">
            <Search className="h-5 w-5" />
            Результаты запросов ({results.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQueries(!showQueries)}
            className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
          >
            {showQueries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showQueries ? ' Скрыть' : ' Показать'} Детали
          </Button>
        </CardTitle>
      </CardHeader>
      {showQueries && (
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border border-muted rounded-lg p-4 hover:shadow-lg transition-all duration-300 animate-scale-in" style={{animationDelay: `${index * 50}ms`}}>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'} className="font-light">
                    Запрос {result.chatId}
                  </Badge>
                  <span className="text-sm font-medium flex-1">{result.query}</span>
                </div>
                {result.response && result.status === 'completed' && (
                  <p className="text-sm text-muted-foreground mb-3 font-light">
                    {result.response.substring(0, 200)}...
                  </p>
                )}
                {result.status === 'error' && (
                  <p className="text-sm text-destructive mb-3">
                    {result.response}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="border border-muted font-light">
                    <Link className="h-3 w-3 mr-1" />
                    {result.references.length} ссылок
                  </Badge>
                  <Badge variant="outline" className={`font-light ${result.status === 'completed' ? 'border-green-500 text-green-700' : result.status === 'error' ? 'border-red-500 text-red-700' : 'border-muted'}`}>
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
