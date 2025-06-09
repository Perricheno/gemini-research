
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Brain, FileText, Download, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchResult {
  query: string;
  response: string;
  references: string[];
  chatId: number;
  status: 'pending' | 'completed' | 'error';
}

interface ResearchSettings {
  tone: 'phd' | 'bachelor' | 'school';
  wordCount: number;
  parallelQueries: number;
}

const DeepResearchApp = () => {
  const [topic, setTopic] = useState('');
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac'; // Embedded API key
  const [settings, setSettings] = useState<ResearchSettings>({
    tone: 'phd',
    wordCount: 5000,
    parallelQueries: 20
  });
  
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [totalReferences, setTotalReferences] = useState(0);
  const [showQueries, setShowQueries] = useState(false);
  const [completedQueries, setCompletedQueries] = useState(0);

  const generateResearchQueries = (topic: string, count: number): string[] => {
    const baseQueries = [
      `${topic} latest research 2024`,
      `${topic} scientific studies`,
      `${topic} market analysis`,
      `${topic} case studies`,
      `${topic} best practices`,
      `${topic} industry trends`,
      `${topic} expert opinions`,
      `${topic} statistical data`,
      `${topic} future predictions`,
      `${topic} comparative analysis`,
      `${topic} methodology`,
      `${topic} implementation strategies`,
      `${topic} challenges and solutions`,
      `${topic} global perspective`,
      `${topic} technological aspects`,
      `${topic} economic impact`,
      `${topic} social implications`,
      `${topic} environmental factors`,
      `${topic} regulatory framework`,
      `${topic} innovation in ${topic}`
    ];

    const extendedQueries = [];
    for (let i = 0; i < count; i++) {
      if (i < baseQueries.length) {
        extendedQueries.push(baseQueries[i]);
      } else {
        const variations = [
          `advanced ${topic} research`,
          `${topic} in different industries`,
          `${topic} success stories`,
          `${topic} failure analysis`,
          `${topic} regional differences`,
          `${topic} historical evolution`,
          `${topic} cross-cultural perspectives`,
          `${topic} interdisciplinary approaches`
        ];
        extendedQueries.push(variations[i % variations.length] + ` ${Math.floor(i / variations.length) + 1}`);
      }
    }
    
    return extendedQueries;
  };

  const callGeminiAPI = async (query: string, chatId: number): Promise<ResearchResult> => {
    console.log(`Starting query ${chatId}: ${query}`);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Conduct detailed research on: "${query}". Provide comprehensive information with specific data, statistics, and examples. Include references and sources where possible. Focus on recent and credible information.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 2048,
          },
          tools: [{
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: "MODE_DYNAMIC",
                dynamicThreshold: 0.7
              }
            }
          }]
        }),
      });

      if (!response.ok) {
        console.error(`API call failed for query ${chatId}: ${response.status}`);
        throw new Error(`API call failed for query: ${query}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract references from the response
      const references = extractReferences(content);
      
      console.log(`Completed query ${chatId}: Found ${references.length} references`);
      
      return {
        query,
        response: content,
        references,
        chatId,
        status: 'completed'
      };
    } catch (error) {
      console.error(`Error in query ${chatId}:`, error);
      return {
        query,
        response: `Error: ${error.message}`,
        references: [],
        chatId,
        status: 'error'
      };
    }
  };

  const extractReferences = (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    
    // Also look for citation patterns
    const citationPatterns = [
      /\[(\d+)\]/g,
      /\(([^)]+\d{4}[^)]*)\)/g,
      /Source: ([^\n]+)/gi,
      /Reference: ([^\n]+)/gi
    ];
    
    const citations: string[] = [];
    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        citations.push(...matches);
      }
    });
    
    return [...urls, ...citations];
  };

  const conductParallelResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a research topic');
      return;
    }

    setIsResearching(true);
    setProgress(0);
    setResults([]);
    setFinalReport('');
    setTotalReferences(0);
    setCompletedQueries(0);

    try {
      setCurrentStep('Generating research queries...');
      const queries = generateResearchQueries(topic, settings.parallelQueries);
      
      // Initialize results with pending status
      const initialResults: ResearchResult[] = queries.map((query, index) => ({
        query,
        response: '',
        references: [],
        chatId: index + 1,
        status: 'pending'
      }));
      setResults(initialResults);
      
      setCurrentStep(`Executing ${queries.length} parallel research queries...`);
      toast.success(`Started ${queries.length} parallel research queries`);
      
      const batchSize = 5; // Process in batches to avoid rate limits
      const allResults: ResearchResult[] = [];
      
      for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(queries.length / batchSize)}`);
        
        const batchPromises = batch.map((query, index) => 
          callGeminiAPI(query, i + index + 1)
        );
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              allResults.push(result.value);
              setCompletedQueries(prev => prev + 1);
              
              // Update specific result in the array
              setResults(prev => prev.map(r => 
                r.chatId === result.value.chatId ? result.value : r
              ));
            } else {
              console.error(`Query failed: ${batch[index]}`, result.reason);
              const errorResult: ResearchResult = {
                query: batch[index],
                response: `Error: ${result.reason}`,
                references: [],
                chatId: i + index + 1,
                status: 'error'
              };
              allResults.push(errorResult);
              setCompletedQueries(prev => prev + 1);
              
              setResults(prev => prev.map(r => 
                r.chatId === errorResult.chatId ? errorResult : r
              ));
            }
          });
          
          setProgress(((i + batchSize) / queries.length) * 70);
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Batch error:', error);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      
      toast.success(`Completed ${allResults.length} queries with ${totalRefs} references found`);
      
      setCurrentStep('Analyzing and synthesizing research data...');
      setProgress(75);
      
      await generateFinalReport(allResults);
      
    } catch (error) {
      console.error('Research error:', error);
      toast.error('Research failed. Please try again.');
    } finally {
      setIsResearching(false);
      setProgress(100);
      setCurrentStep('Research completed!');
    }
  };

  const generateFinalReport = async (results: ResearchResult[]) => {
    const successfulResults = results.filter(r => r.status === 'completed');
    const combinedData = successfulResults.map(r => r.response).join('\n\n');
    const allReferences = successfulResults.flatMap(r => r.references);
    
    const toneInstructions = {
      phd: 'Write in an academic, scholarly tone suitable for PhD-level research. Use sophisticated vocabulary, complex sentence structures, and rigorous analytical approach.',
      bachelor: 'Write in a clear, academic tone suitable for undergraduate level. Balance accessibility with academic rigor.',
      school: 'Write in a clear, simple language suitable for high school students. Avoid jargon and explain complex concepts simply.'
    };

    const wordsPerChunk = Math.min(2000, Math.floor(settings.wordCount / 3));
    const chunks = Math.ceil(settings.wordCount / wordsPerChunk);
    
    let fullReport = '';
    
    for (let i = 0; i < chunks; i++) {
      setCurrentStep(`Generating report section ${i + 1}/${chunks}...`);
      
      const sectionPrompt = `
        Based on the research data provided, write section ${i + 1} of ${chunks} of a comprehensive research report on "${topic}".
        
        Research data: ${combinedData.substring(i * 3000, (i + 1) * 3000)}
        
        Requirements:
        - ${toneInstructions[settings.tone]}
        - Target length: approximately ${wordsPerChunk} words for this section
        - Include specific data, statistics, and examples from the research
        - Maintain academic structure with clear headings and subheadings
        - Reference the sources appropriately
        ${i === 0 ? '- Start with an executive summary and introduction' : ''}
        ${i === chunks - 1 ? '- End with conclusions and recommendations' : ''}
      `;

      try {
        const sectionResponse = await callGeminiAPI(sectionPrompt, 1000 + i);
        fullReport += sectionResponse.response + '\n\n';
        
        setProgress(75 + (i + 1) / chunks * 20);
      } catch (error) {
        console.error(`Error generating section ${i + 1}:`, error);
      }
    }
    
    // Add references section
    const uniqueReferences = [...new Set(allReferences)];
    fullReport += '\n\n## References\n\n';
    uniqueReferences.forEach((ref, index) => {
      fullReport += `${index + 1}. ${ref}\n`;
    });
    
    setFinalReport(fullReport);
    toast.success('Research report generated successfully!');
  };

  const downloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Deep Research AI
        </h1>
        <p className="text-muted-foreground text-lg">
          Powered by Gemini 2.0 Flash + Grounding with parallel processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Research Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Research Topic</Label>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your research topic or question..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Academic Tone</Label>
                <Select value={settings.tone} onValueChange={(value: any) => setSettings({...settings, tone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phd">PhD Level</SelectItem>
                    <SelectItem value="bachelor">Bachelor Level</SelectItem>
                    <SelectItem value="school">School Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Word Count: {settings.wordCount.toLocaleString()}</Label>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="1000"
                  value={settings.wordCount}
                  onChange={(e) => setSettings({...settings, wordCount: parseInt(e.target.value)})}
                  className="w-full mt-2"
                />
              </div>

              <div>
                <Label>Parallel Queries: {settings.parallelQueries}</Label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={settings.parallelQueries}
                  onChange={(e) => setSettings({...settings, parallelQueries: parseInt(e.target.value)})}
                  className="w-full mt-2"
                />
              </div>

              <Button 
                onClick={conductParallelResearch}
                disabled={isResearching}
                className="w-full"
                size="lg"
              >
                {isResearching ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Deep Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isResearching && (
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{currentStep}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{completedQueries}/{settings.parallelQueries} queries completed</Badge>
                    <Badge variant="outline">{totalReferences} references found</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Parallel Queries ({results.length})
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQueries(!showQueries)}
                  >
                    {showQueries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showQueries && (
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {results.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                            Query {result.chatId}
                          </Badge>
                          <span className="text-sm font-medium">{result.query}</span>
                        </div>
                        {result.response && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.response.substring(0, 150)}...
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{result.references.length} references</Badge>
                          <Badge variant="outline">{result.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {finalReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Final Research Report
                  </div>
                  <Button onClick={downloadReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{finalReport}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeepResearchApp;
