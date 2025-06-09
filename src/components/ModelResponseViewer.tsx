
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Bot, Clock, FileText } from 'lucide-react';
import { ModelReport } from '../types/research';

interface ModelResponseViewerProps {
  modelReports: ModelReport[];
}

const ModelResponseViewer: React.FC<ModelResponseViewerProps> = ({ modelReports }) => {
  return (
    <Card className="border-2 border-muted animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-light">
          <Bot className="h-5 w-5" />
          Ответы моделей ({modelReports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {modelReports.map((report) => (
            <div key={report.id} className="border border-muted rounded-lg p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {report.model}
                  </Badge>
                  <Badge variant={report.status === 'completed' ? 'default' : report.status === 'error' ? 'destructive' : 'secondary'}>
                    {report.status}
                  </Badge>
                  {report.status === 'completed' && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {report.wordCount.toLocaleString()} слов
                    </Badge>
                  )}
                </div>
                
                {report.status === 'completed' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          Ответ модели {report.model}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {report.timestamp.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {report.wordCount.toLocaleString()} слов
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                            {report.content}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {report.status === 'completed' && (
                <p className="text-sm text-muted-foreground">
                  {report.content.substring(0, 200)}...
                </p>
              )}
              
              {report.status === 'error' && (
                <p className="text-sm text-destructive">
                  Ошибка генерации отчета
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelResponseViewer;
