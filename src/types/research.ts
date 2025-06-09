
export interface ResearchResult {
  query: string;
  response: string;
  references: Reference[];
  chatId: number;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
}

export interface Reference {
  url: string;
  title: string;
  author?: string;
  publishDate?: string;
  description?: string;
  domain: string;
}

export interface ResearchSettings {
  tone: 'phd' | 'bachelor' | 'school';
  wordCount: number;
  parallelQueries: number;
  model: string;
  useGrounding: boolean;
  customUrls: string[];
  searchDepth: 'shallow' | 'medium' | 'deep';
  includeRecent: boolean;
  language: string;
  batchSize: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'research';
  content: string;
  timestamp: Date;
  metadata?: any;
}
