
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
import { Switch } from '@/components/ui/switch';
import { Search, Brain, FileText, Download, Settings, Eye, EyeOff, MessageSquare, Zap, Clock, BarChart3, Globe, Link, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchResult {
  query: string;
  response: string;
  references: Reference[];
  chatId: number;
  status: 'pending' | 'completed' | 'error';
  timestamp: Date;
}

interface Reference {
  url: string;
  title: string;
  author?: string;
  publishDate?: string;
  description?: string;
  domain: string;
}

interface ResearchSettings {
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

interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'research';
  content: string;
  timestamp: Date;
  metadata?: any;
}

const DeepResearchApp = () => {
  const [topic, setTopic] = useState('');
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  const [settings, setSettings] = useState<ResearchSettings>({
    tone: 'phd',
    wordCount: 10000,
    parallelQueries: 50,
    model: 'gemini-2.0-flash',
    useGrounding: true,
    customUrls: [],
    searchDepth: 'deep',
    includeRecent: true,
    language: 'en',
    batchSize: 10
  });
  
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [totalReferences, setTotalReferences] = useState(0);
  const [showQueries, setShowQueries] = useState(false);
  const [completedQueries, setCompletedQueries] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'results' | 'report'>('chat');
  const [newUrl, setNewUrl] = useState('');

  const addChatMessage = (type: ChatMessage['type'], content: string, metadata?: any) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setChatMessages(prev => [...prev, message]);
  };

  const addCustomUrl = () => {
    if (newUrl.trim() && !settings.customUrls.includes(newUrl.trim())) {
      setSettings(prev => ({
        ...prev,
        customUrls: [...prev.customUrls, newUrl.trim()]
      }));
      setNewUrl('');
      toast.success('URL added to research context');
    }
  };

  const removeCustomUrl = (index: number) => {
    setSettings(prev => ({
      ...prev,
      customUrls: prev.customUrls.filter((_, i) => i !== index)
    }));
  };

  const generateResearchQueries = (topic: string, count: number): string[] => {
    const baseQueries = [
      `${topic} latest research 2024 2025`,
      `${topic} scientific studies peer reviewed`,
      `${topic} market analysis comprehensive report`,
      `${topic} case studies real world applications`,
      `${topic} best practices industry standards`,
      `${topic} future trends predictions`,
      `${topic} expert opinions thought leaders`,
      `${topic} statistical data analytics`,
      `${topic} comparative analysis benchmarks`,
      `${topic} methodology frameworks`,
      `${topic} implementation strategies`,
      `${topic} challenges solutions innovation`,
      `${topic} global perspective international`,
      `${topic} technological advancement breakthrough`,
      `${topic} economic impact financial analysis`,
      `${topic} social implications societal effects`,
      `${topic} environmental sustainability impact`,
      `${topic} regulatory framework policy`,
      `${topic} innovation disruption emerging`,
      `${topic} academic research university studies`,
      `${topic} industry reports white papers`,
      `${topic} success stories failure analysis`,
      `${topic} regional differences cultural`,
      `${topic} historical evolution timeline`,
      `${topic} cross-disciplinary applications`,
      `${topic} data-driven insights evidence`,
      `${topic} professional development career`,
      `${topic} competitive landscape analysis`,
      `${topic} risk assessment mitigation`,
      `${topic} performance metrics KPIs`
    ];

    const advancedQueries = [
      `advanced ${topic} methodologies`,
      `${topic} machine learning AI applications`,
      `${topic} blockchain cryptocurrency integration`,
      `${topic} Internet of Things IoT`,
      `${topic} sustainability green technology`,
      `${topic} cybersecurity privacy concerns`,
      `${topic} cloud computing scalability`,
      `${topic} automation efficiency optimization`,
      `${topic} big data analytics insights`,
      `${topic} mobile technology applications`,
      `${topic} artificial intelligence enhancement`,
      `${topic} virtual reality augmented reality`,
      `${topic} quantum computing potential`,
      `${topic} 5G technology implementation`,
      `${topic} digital transformation strategy`
    ];

    const extendedQueries = [...baseQueries, ...advancedQueries];
    const finalQueries = [];
    
    for (let i = 0; i < count; i++) {
      if (i < extendedQueries.length) {
        finalQueries.push(extendedQueries[i]);
      } else {
        const variations = [
          `comprehensive ${topic} analysis`,
          `emerging ${topic} technologies`,
          `${topic} market opportunities`,
          `${topic} strategic planning`,
          `${topic} performance optimization`,
          `${topic} cost benefit analysis`,
          `${topic} stakeholder perspectives`,
          `${topic} quality assurance standards`
        ];
        finalQueries.push(variations[i % variations.length] + ` variant ${Math.floor(i / variations.length) + 1}`);
      }
    }
    
    return finalQueries;
  };

  const callGeminiAPI = async (query: string, chatId: number): Promise<ResearchResult> => {
    console.log(`Starting query ${chatId}: ${query}`);
    
    try {
      const requestBody: any = {
        contents: [{
          parts: [{
            text: `Conduct comprehensive research and analysis on: "${query}". 

Please provide:
1. Detailed analysis with specific data, statistics, and numerical evidence
2. Recent developments and current trends (2024-2025)
3. Key findings, insights, and expert opinions
4. Credible sources with proper citations
5. Real-world case studies and examples
6. Future implications and recommendations

Focus on providing authoritative, well-sourced information with proper academic citations.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 8192,
        }
      };

      if (settings.useGrounding) {
        requestBody.tools = [{
          googleSearch: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.7
            }
          }
        }];

        if (settings.customUrls.length > 0) {
          requestBody.contents[0].parts[0].text += `\n\nPrioritize information from these specific sources: ${settings.customUrls.join(', ')}`;
        }
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`API call failed for query ${chatId}:`, errorData);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const references = extractReferences(content);
      
      console.log(`Completed query ${chatId}: Found ${references.length} references`);
      
      return {
        query,
        response: content,
        references,
        chatId,
        status: 'completed',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error in query ${chatId}:`, error);
      return {
        query,
        response: `Error: ${error.message}`,
        references: [],
        chatId,
        status: 'error',
        timestamp: new Date()
      };
    }
  };

  const extractReferences = (text: string): Reference[] => {
    const references: Reference[] = [];
    
    // Extract URLs with better pattern matching
    const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)/g;
    const urls = text.match(urlRegex) || [];
    
    urls.forEach(url => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Extract title from surrounding text
        const urlIndex = text.indexOf(url);
        const contextBefore = text.substring(Math.max(0, urlIndex - 200), urlIndex);
        const contextAfter = text.substring(urlIndex + url.length, Math.min(text.length, urlIndex + url.length + 200));
        
        // Simple title extraction logic
        let title = url;
        const titleMatch = contextBefore.match(/["']([^"']{10,100})["']/);
        if (titleMatch) {
          title = titleMatch[1];
        }
        
        references.push({
          url,
          title,
          domain,
          description: contextAfter.split('.')[0] || ''
        });
      } catch (e) {
        // Invalid URL, skip
      }
    });
    
    // Extract citation patterns
    const citationPatterns = [
      /\(([^)]+\d{4}[^)]*)\)/g,
      /\[(\d+)\]\s*([^\n]{20,100})/g,
      /Source:\s*([^\n]{10,150})/gi,
      /Reference:\s*([^\n]{10,150})/gi,
      /According to\s+([^\n]{10,100})/gi
    ];
    
    citationPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          references.push({
            url: '#citation',
            title: match[1].trim(),
            domain: 'citation',
            description: match[2] ? match[2].trim() : ''
          });
        }
      });
    });
    
    return references;
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
    setActiveTab('results');

    addChatMessage('user', `Starting deep research on: ${topic}`);
    addChatMessage('system', `Initializing ${settings.parallelQueries} parallel queries with ${settings.model} model...`);
    addChatMessage('system', `Research settings: ${settings.searchDepth} search, grounding ${settings.useGrounding ? 'enabled' : 'disabled'}, batch size: ${settings.batchSize}`);

    try {
      setCurrentStep('Generating comprehensive research queries...');
      const queries = generateResearchQueries(topic, settings.parallelQueries);
      
      const initialResults: ResearchResult[] = queries.map((query, index) => ({
        query,
        response: '',
        references: [],
        chatId: index + 1,
        status: 'pending',
        timestamp: new Date()
      }));
      setResults(initialResults);
      
      setCurrentStep(`Executing ${queries.length} parallel research queries...`);
      addChatMessage('system', `Generated ${queries.length} research queries. Starting parallel execution with batches of ${settings.batchSize}...`);
      
      const allResults: ResearchResult[] = [];
      
      for (let i = 0; i < queries.length; i += settings.batchSize) {
        const batch = queries.slice(i, i + settings.batchSize);
        const batchNumber = Math.floor(i / settings.batchSize) + 1;
        const totalBatches = Math.ceil(queries.length / settings.batchSize);
        
        console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} queries)`);
        addChatMessage('system', `Processing batch ${batchNumber}/${totalBatches}...`);
        
        const batchPromises = batch.map((query, index) => 
          callGeminiAPI(query, i + index + 1)
        );
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              allResults.push(result.value);
              setCompletedQueries(prev => prev + 1);
              
              setResults(prev => prev.map(r => 
                r.chatId === result.value.chatId ? result.value : r
              ));

              if (result.value.status === 'completed') {
                addChatMessage('research', `Query ${result.value.chatId} completed: ${result.value.references.length} references found`);
              }
            } else {
              console.error(`Query failed: ${batch[index]}`, result.reason);
              const errorResult: ResearchResult = {
                query: batch[index],
                response: `Error: ${result.reason}`,
                references: [],
                chatId: i + index + 1,
                status: 'error',
                timestamp: new Date()
              };
              allResults.push(errorResult);
              setCompletedQueries(prev => prev + 1);
              
              setResults(prev => prev.map(r => 
                r.chatId === errorResult.chatId ? errorResult : r
              ));

              addChatMessage('system', `Query ${errorResult.chatId} failed: ${result.reason}`);
            }
          });
          
          setProgress(((i + settings.batchSize) / queries.length) * 70);
          
          // Reduced delay for better performance with higher limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Batch error:', error);
          addChatMessage('system', `Batch processing error: ${error.message}`);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      
      addChatMessage('system', `Research completed! ${allResults.length} queries processed with ${totalRefs} references found.`);
      
      setCurrentStep('Analyzing and synthesizing research data...');
      setProgress(75);
      
      await generateFinalReport(allResults);
      
    } catch (error) {
      console.error('Research error:', error);
      addChatMessage('system', `Research failed: ${error.message}`);
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
    
    addChatMessage('system', 'Generating comprehensive research report...');
    setActiveTab('report');

    const toneInstructions = {
      phd: 'Write in an academic, scholarly tone suitable for PhD-level research. Use sophisticated vocabulary, complex sentence structures, rigorous analytical approach, and extensive citations.',
      bachelor: 'Write in a clear, academic tone suitable for undergraduate level. Balance accessibility with academic rigor, include proper citations and structured analysis.',
      school: 'Write in clear, accessible language suitable for high school students. Explain complex concepts simply while maintaining factual accuracy.'
    };

    const wordsPerChunk = Math.min(3000, Math.floor(settings.wordCount / 4));
    const chunks = Math.ceil(settings.wordCount / wordsPerChunk);
    
    let fullReport = '';
    
    for (let i = 0; i < chunks; i++) {
      setCurrentStep(`Generating report section ${i + 1}/${chunks}...`);
      addChatMessage('system', `Writing section ${i + 1} of ${chunks}...`);
      
      const sectionPrompt = `
        Based on the comprehensive research data provided, write section ${i + 1} of ${chunks} of a professional research report on "${topic}".
        
        Research data: ${combinedData.substring(i * 5000, (i + 1) * 5000)}
        
        Requirements:
        - ${toneInstructions[settings.tone]}
        - Target length: approximately ${wordsPerChunk} words for this section
        - Include specific data, statistics, quantitative evidence, and examples from the research
        - Maintain professional academic structure with clear headings and subheadings
        - Reference sources appropriately with proper citations
        - Use evidence-based analysis and draw meaningful conclusions
        ${i === 0 ? '- Start with executive summary, introduction, and methodology' : ''}
        ${i === chunks - 1 ? '- End with conclusions, recommendations, and future research directions' : ''}
        
        Structure this section professionally with clear logical flow and authoritative presentation.
      `;

      try {
        const sectionResponse = await callGeminiAPI(sectionPrompt, 1000 + i);
        fullReport += sectionResponse.response + '\n\n';
        
        setProgress(75 + (i + 1) / chunks * 20);
      } catch (error) {
        console.error(`Error generating section ${i + 1}:`, error);
        addChatMessage('system', `Error generating section ${i + 1}: ${error.message}`);
      }
    }
    
    // Process and deduplicate references
    const uniqueReferences = new Map<string, Reference>();
    allReferences.forEach(ref => {
      const key = ref.url + ref.title;
      if (!uniqueReferences.has(key)) {
        uniqueReferences.set(key, ref);
      }
    });
    
    fullReport += '\n\n## References and Sources\n\n';
    Array.from(uniqueReferences.values()).forEach((ref, index) => {
      fullReport += `${index + 1}. **${ref.title}**\n`;
      if (ref.url !== '#citation') {
        fullReport += `   URL: ${ref.url}\n`;
      }
      if (ref.author) {
        fullReport += `   Author: ${ref.author}\n`;
      }
      if (ref.publishDate) {
        fullReport += `   Published: ${ref.publishDate}\n`;
      }
      if (ref.description) {
        fullReport += `   Description: ${ref.description}\n`;
      }
      fullReport += `   Domain: ${ref.domain}\n\n`;
    });
    
    setFinalReport(fullReport);
    addChatMessage('system', `Professional research report completed! ${fullReport.length} characters, ${uniqueReferences.size} unique references.`);
    toast.success('Professional research report generated successfully!');
  };

  const downloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `professional-research-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Professional research report downloaded successfully!');
    toast.success('Report downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-light mb-4 tracking-wide">
            Professional Research AI
          </h1>
          <div className="w-32 h-0.5 bg-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg font-light">
            Advanced Research with Gemini 2.0 Flash + Grounding | Up to 2000 RPM
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-foreground hover:shadow-2xl transition-all duration-500 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-light">
                  <Settings className="h-5 w-5" />
                  Research Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium">Research Topic</Label>
                  <Textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your research topic..."
                    rows={3}
                    className="border-muted focus:border-foreground transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Academic Level</Label>
                  <Select value={settings.tone} onValueChange={(value: any) => setSettings({...settings, tone: value})}>
                    <SelectTrigger className="border-muted focus:border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phd">PhD Level</SelectItem>
                      <SelectItem value="bachelor">Bachelor Level</SelectItem>
                      <SelectItem value="school">School Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">AI Model</Label>
                  <Select value={settings.model} onValueChange={(value) => setSettings({...settings, model: value})}>
                    <SelectTrigger className="border-muted focus:border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Depth</Label>
                  <Select value={settings.searchDepth} onValueChange={(value: any) => setSettings({...settings, searchDepth: value})}>
                    <SelectTrigger className="border-muted focus:border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shallow">Shallow (Fast)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="deep">Deep (Comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable Grounding</Label>
                  <Switch
                    checked={settings.useGrounding}
                    onCheckedChange={(checked) => setSettings({...settings, useGrounding: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Word Count: {settings.wordCount.toLocaleString()}</Label>
                  <input
                    type="range"
                    min="2000"
                    max="50000"
                    step="1000"
                    value={settings.wordCount}
                    onChange={(e) => setSettings({...settings, wordCount: parseInt(e.target.value)})}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parallel Queries: {settings.parallelQueries}</Label>
                  <input
                    type="range"
                    min="2"
                    max="200"
                    step="2"
                    value={settings.parallelQueries}
                    onChange={(e) => setSettings({...settings, parallelQueries: parseInt(e.target.value)})}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Batch Size: {settings.batchSize}</Label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={settings.batchSize}
                    onChange={(e) => setSettings({...settings, batchSize: parseInt(e.target.value)})}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Custom URLs Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Custom URL Context
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button onClick={addCustomUrl} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {settings.customUrls.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {settings.customUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Link className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1 truncate">{url}</span>
                          <Button
                            onClick={() => removeCustomUrl(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={conductParallelResearch}
                  disabled={isResearching}
                  className="w-full bg-foreground hover:bg-muted-foreground text-background border-0 py-3 text-lg font-light transition-all duration-300 hover:scale-105"
                  size="lg"
                >
                  {isResearching ? (
                    <>
                      <Brain className="mr-2 h-5 w-5 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Start Research
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {isResearching && (
              <Card className="border-2 border-muted animate-slide-in-right">
                <CardHeader>
                  <CardTitle className="text-xl font-light flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={progress} className="w-full h-2" />
                    <p className="text-sm text-muted-foreground font-light">{currentStep}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="border-foreground text-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {completedQueries}/{settings.parallelQueries}
                      </Badge>
                      <Badge variant="outline" className="border-foreground text-foreground">
                        <Zap className="h-3 w-3 mr-1" />
                        {totalReferences} refs
                      </Badge>
                      <Badge variant="outline" className="border-foreground text-foreground">
                        Batch: {settings.batchSize}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'chat' 
                    ? 'bg-foreground text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Research Chat
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'results' 
                    ? 'bg-foreground text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Query Results ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'report' 
                    ? 'bg-foreground text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Final Report
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <Card className="border-2 border-muted animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-light">
                    <MessageSquare className="h-5 w-5" />
                    Research Progress Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto space-y-4 mb-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-light">Start a research session to see live progress</p>
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
            )}

            {/* Results Tab */}
            {activeTab === 'results' && results.length > 0 && (
              <Card className="border-2 border-muted animate-fade-in">
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
                      className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
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
                        <div key={index} className="border border-muted rounded-lg p-4 hover:shadow-lg transition-all duration-300 animate-scale-in" style={{animationDelay: `${index * 50}ms`}}>
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'} className="font-light">
                              Query {result.chatId}
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
                              {result.references.length} references
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
            )}

            {/* Report Tab */}
            {activeTab === 'report' && finalReport && (
              <Card className="border-2 border-foreground animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xl font-light">
                      <FileText className="h-5 w-5" />
                      Professional Research Report
                    </div>
                    <Button 
                      onClick={downloadReport} 
                      variant="outline" 
                      size="sm"
                      className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
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
            )}

            {activeTab === 'report' && !finalReport && (
              <Card className="border-2 border-muted animate-fade-in">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-light">No research report generated yet</p>
                  <p className="text-sm text-muted-foreground font-light mt-2">Start a research session to generate a comprehensive professional report</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearchApp;
