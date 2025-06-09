
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Brain } from 'lucide-react';
import { ChatMessage } from '../types/research';

interface ResearchChatProps {
  chatMessages: ChatMessage[];
}

const ResearchChat: React.FC<ResearchChatProps> = ({ chatMessages }) => {
  return (
    <Card className="border-2 border-muted animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-light">
          <MessageSquare className="h-5 w-5" />
          Рассмотрение исследовательских данных
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-light">Начните исследовательский процесс для просмотра текущего прогресса</p>
            </div>
          )}
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`animate-fade-in p-4 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-foreground text-background ml-8' 
                  : message.type === 'system'
                  ? 'bg-muted text-muted-foreground mr-8'
                  : 'bg-accent text-accent-foreground mr-8'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.type === 'user' && <span className="font-medium">Вы</span>}
                {message.type === 'system' && <span className="font-medium">Система</span>}
                {message.type === 'research' && <span className="font-medium">Исследование</span>}
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="font-light">{message.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchChat;
