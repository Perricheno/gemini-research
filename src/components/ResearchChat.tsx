
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Brain } from 'lucide-react';
import { ChatMessage } from '../types/research';

interface ResearchChatProps {
  chatMessages: ChatMessage[];
  theme?: 'light' | 'dark';
}

const ResearchChat: React.FC<ResearchChatProps> = ({ chatMessages, theme = 'light' }) => {
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 border-white text-white' 
    : 'bg-white border-black text-black';

  return (
    <Card className={`border-2 animate-fade-in ${themeClasses}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-light">
          <MessageSquare className="h-5 w-5" />
          Research Data Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-y-auto space-y-4 mb-4">
          {chatMessages.length === 0 && (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-light">Start research process to view current progress</p>
            </div>
          )}
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`animate-fade-in p-4 rounded-lg ${
                message.type === 'user' 
                  ? `${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} ml-8` 
                  : message.type === 'system'
                  ? `${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} mr-8`
                  : `${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'} mr-8`
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.type === 'user' && <span className="font-medium">You</span>}
                {message.type === 'system' && <span className="font-medium">System</span>}
                {message.type === 'research' && <span className="font-medium">Research</span>}
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
