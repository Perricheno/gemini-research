export interface ResearchResult {
  query: string;
  response: string;
  references: Reference[];
  chatId: number;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
  model?: string;
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
  apiKeys: string[]; // Support for multiple API keys
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'research' | 'model-response';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ModelReport {
  id: string;
  model: string;
  content: string;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
  wordCount: number;
}

export interface LatexTemplate {
  id: string;
  name: string;
  content: string;
  uploadDate: Date;
}

export interface ReportGenerationConfig {
  maxRetries: number;
  completionKeyword: string;
  timeoutMs: number;
  verifyCompletion: boolean;
}

export interface PartGenerationResult {
  content: string;
  isComplete: boolean;
  hasCompletionKey: boolean;
  retryCount: number;
}
