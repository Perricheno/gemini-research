import React, { useState } from 'react';
import { Search, Brain, FileText, Download, MessageSquare, Upload, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchResult, Reference, ResearchSettings, ChatMessage, LatexTemplate } from '../types/research';
import { generateSubtopics, callGeminiAPI, generateMultiPartReport, generateLatexReport } from '../utils/geminiApi';
import ResearchSettingsComponent from './ResearchSettings';
import ResearchProgress from './ResearchProgress';
import ResearchChat from './ResearchChat';
import ResearchResults from './ResearchResults';
import ResearchReport from './ResearchReport';

const DeepResearchApp = () => {
  const [topic, setTopic] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settings, setSettings] = useState<ResearchSettings>({
    tone: 'phd',
    wordCount: 50000,
    parallelQueries: 500,
    model: 'gemini-2.5-flash-preview-05-20',
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
  const [latexReport, setLatexReport] = useState('');
  const [totalReferences, setTotalReferences] = useState(0);
  const [completedQueries, setCompletedQueries] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'results' | 'report' | 'latex'>('chat');
  const [allReferences, setAllReferences] = useState<Reference[]>([]);
  const [webDataForDownload, setWebDataForDownload] = useState('');
  const [reportGenerationProgress, setReportGenerationProgress] = useState<{
    currentPart: number;
    totalParts: number;
    content: string;
  } | null>(null);
  const [latexTemplate, setLatexTemplate] = useState<LatexTemplate | null>(null);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLatexTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.tex')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const template: LatexTemplate = {
          id: Date.now().toString(),
          name: file.name,
          content,
          uploadDate: new Date()
        };
        setLatexTemplate(template);
        toast.success(`LaTeX template "${file.name}" uploaded successfully`);
        addChatMessage('system', `LaTeX template uploaded: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a file with .tex extension');
    }
  };

  const conductResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter research topic');
      return;
    }

    setIsResearching(true);
    setProgress(0);
    setResults([]);
    setFinalReport('');
    setLatexReport('');
    setTotalReferences(0);
    setCompletedQueries(0);
    setWebDataForDownload('');
    setReportGenerationProgress(null);
    setActiveTab('results');

    addChatMessage('user', `Starting research machine on topic: ${topic}`);
    addChatMessage('system', 'Initialization: forced web search with full URLs, NO limits on search and analysis!');

    try {
      // Step 1: Automatic topic splitting into subtopics
      setCurrentStep('Automatic topic splitting into subtopics...');
      setProgress(5);
      addChatMessage('system', `Gemini 2.5 Flash Preview splitting topic into ${settings.parallelQueries} unique subtopics...`);
      
      const subtopics = await generateSubtopics(topic, settings.parallelQueries, settings);
      addChatMessage('system', `Generated ${subtopics.length} unique subtopics for detailed web research`);
      
      // Step 2: Parallel web requests on subtopics with detailed analysis
      setCurrentStep(`Executing ${subtopics.length} parallel web requests with detailed source analysis...`);
      setProgress(10);
      
      const initialResults: ResearchResult[] = subtopics.map((subtopic, index) => ({
        query: subtopic,
        response: '',
        references: [],
        chatId: index + 1,
        status: 'pending',
        timestamp: new Date()
      }));
      setResults(initialResults);
      
      addChatMessage('system', `Starting ${subtopics.length} parallel web search requests with deep source analysis and full URL extraction...`);
      
      const allResults: ResearchResult[] = [];
      const collectedReferences: Reference[] = [];
      
      for (let i = 0; i < subtopics.length; i += settings.batchSize) {
        const batch = subtopics.slice(i, i + settings.batchSize);
        const batchNumber = Math.floor(i / settings.batchSize) + 1;
        const totalBatches = Math.ceil(subtopics.length / settings.batchSize);
        
        console.log(`Web search batch ${batchNumber}/${totalBatches} (${batch.length} requests)`);
        addChatMessage('system', `Web search batch ${batchNumber}/${totalBatches}: detailed source analysis with full URLs for each subtopic...`);
        
        const batchPromises = batch.map((subtopic, index) => 
          callGeminiAPI(subtopic, i + index + 1, settings)
        );
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              allResults.push(result.value);
              collectedReferences.push(...result.value.references);
              setCompletedQueries(prev => prev + 1);
              
              setResults(prev => prev.map(r => 
                r.chatId === result.value.chatId ? result.value : r
              ));

              if (result.value.status === 'completed') {
                const wordCount = result.value.response.split(' ').length;
                addChatMessage('research', `Web analysis ${result.value.chatId} completed: ${wordCount} words of analysis, found ${result.value.references.length} full URL sources`);
              }
            } else {
              console.error(`Web request failed: ${batch[index]}`, result.reason);
              const errorResult: ResearchResult = {
                query: batch[index],
                response: `Web search error: ${result.reason}`,
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

              addChatMessage('system', `Web request ${errorResult.chatId} completed with error: ${result.reason}`);
            }
          });
          
          setProgress(10 + ((i + settings.batchSize) / subtopics.length) * 50);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Batch web search error:', error);
          addChatMessage('system', `Web search batch error: ${error.message}`);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      setAllReferences(collectedReferences);
      
      // Step 3: Assembling all web data
      setCurrentStep('Assembling web data for analysis...');
      setProgress(65);
      
      const successfulResults = allResults.filter(r => r.status === 'completed');
      const combinedWebData = successfulResults.map(r => 
        `=== SUBTOPIC: ${r.query} ===\nDETAILED ANALYSIS:\n${r.response}`
      ).join('\n\n');
      
      setWebDataForDownload(combinedWebData);
      const totalAnalysisWords = combinedWebData.split(' ').length;
      addChatMessage('system', `Web research completed! Processed ${allResults.length} requests, found ${totalRefs} full URL web sources.`);
      addChatMessage('system', `Collected detailed analyses: ${totalAnalysisWords.toLocaleString()} words for synthesis into report`);
      
      // Step 4: Multi-part final report generation
      setCurrentStep('Generating multi-part report via Gemini 2.5 Flash Preview...');
      setProgress(70);
      setActiveTab('report');
      
      const totalParts = Math.ceil(settings.wordCount / 10000);
      addChatMessage('system', `Starting multi-part report generation: ${totalParts} parts of 10000 words each with full URL sources`);
      
      const onPartGenerated = (partNumber: number, content: string, totalParts: number) => {
        const wordCount = content.split(' ').length;
        addChatMessage('model-response', `Part ${partNumber}/${totalParts} of report generated: ${wordCount.toLocaleString()} words`);
        setProgress(70 + (partNumber / totalParts) * 25);
        
        setReportGenerationProgress({
          currentPart: partNumber,
          totalParts,
          content
        });
      };

      const finalReportContent = await generateMultiPartReport(
        combinedWebData,
        topic,
        settings,
        collectedReferences,
        onPartGenerated
      );
      
      setFinalReport(finalReportContent);
      setReportGenerationProgress(null);
      const finalWordCount = finalReportContent.split(' ').length;
      addChatMessage('system', `Multi-part report completed! Total length: ${finalWordCount.toLocaleString()} words with full URLs of all sources`);
      
      // Step 5: LaTeX report generation (if template uploaded)
      if (latexTemplate) {
        setCurrentStep('Generating LaTeX report...');
        setActiveTab('latex');
        addChatMessage('system', `Starting LaTeX report generation using template "${latexTemplate.name}"`);
        
        const latexContent = await generateLatexReport(
          combinedWebData,
          topic,
          settings,
          collectedReferences,
          latexTemplate.content,
          onPartGenerated
        );
        
        setLatexReport(latexContent);
        addChatMessage('system', `LaTeX report generated using template "${latexTemplate.name}"`);
      }
      
      toast.success('Research machine completed work! Report is ready.');
      
    } catch (error) {
      console.error('Research machine error:', error);
      addChatMessage('system', `Research machine error: ${error.message}`);
      toast.error('Web research error. Please try again.');
    } finally {
      setIsResearching(false);
      setProgress(100);
      setCurrentStep('Research machine completed work!');
    }
  };

  const downloadWebData = () => {
    if (!webDataForDownload) {
      toast.error('Web data not yet available');
      return;
    }
    
    const blob = new Blob([webDataForDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-research-data-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Web research data downloaded successfully!');
    toast.success('Web data downloaded!');
  };

  const downloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Final report downloaded successfully!');
    toast.success('Report downloaded successfully!');
  };

  const downloadLatexReport = () => {
    if (!latexReport) {
      toast.error('LaTeX report not yet available');
      return;
    }
    
    const blob = new Blob([latexReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latex-report-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.tex`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'LaTeX report downloaded successfully!');
    toast.success('LaTeX report downloaded!');
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-black text-white' 
    : 'bg-white text-black';

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-6xl font-light tracking-wide">
              Research Machine
            </h1>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <div className={`w-32 h-0.5 mx-auto mb-4 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}></div>
          <p className={`text-lg font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Powered by Gemini 2.5 Flash Preview + Automatic Topic Splitting + Detailed Source Analysis with Full URLs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <ResearchSettingsComponent
              topic={topic}
              setTopic={setTopic}
              settings={settings}
              setSettings={setSettings}
              onStartResearch={conductResearch}
              isResearching={isResearching}
              theme={theme}
            />

            <ResearchProgress
              isResearching={isResearching}
              currentStep={currentStep}
              progress={progress}
              completedQueries={completedQueries}
              totalQueries={settings.parallelQueries}
              totalReferences={totalReferences}
              batchSize={settings.batchSize}
              theme={theme}
            />

            {/* LaTeX Template Upload */}
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                LaTeX Template
              </h3>
              <input
                type="file"
                accept=".tex"
                onChange={handleLatexTemplateUpload}
                className="hidden"
                id="latex-upload"
              />
              <label
                htmlFor="latex-upload"
                className={`w-full px-4 py-2 rounded transition-colors cursor-pointer flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {latexTemplate ? 'Change Template' : 'Upload .tex'}
              </label>
              {latexTemplate && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Uploaded: {latexTemplate.name}
                </p>
              )}
            </div>

            {/* Download Web Data Button */}
            {webDataForDownload && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <h3 className="font-medium mb-2">Web Data Ready</h3>
                <button
                  onClick={downloadWebData}
                  className={`w-full px-4 py-2 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download Web Data
                </button>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(webDataForDownload.length / 1000)}k characters of detailed analysis
                </p>
              </div>
            )}

            {/* Report Generation Progress */}
            {reportGenerationProgress && (
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <h3 className="font-medium mb-2">Report Generation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Part {reportGenerationProgress.currentPart} of {reportGenerationProgress.totalParts}</span>
                    <span>{Math.round((reportGenerationProgress.currentPart / reportGenerationProgress.totalParts) * 100)}%</span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
                      style={{ width: `${(reportGenerationProgress.currentPart / reportGenerationProgress.totalParts) * 100}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {reportGenerationProgress.content.split(' ').length.toLocaleString()} words generated
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab Navigation */}
            <div className={`flex space-x-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'chat' 
                    ? `${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg` 
                    : `${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Research Machine
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'results' 
                    ? `${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg` 
                    : `${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Web Requests ({results.length})
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'report' 
                    ? `${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg` 
                    : `${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Multi-part Report
              </button>
              {latexTemplate && (
                <button
                  onClick={() => setActiveTab('latex')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                    activeTab === 'latex' 
                      ? `${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'} shadow-lg` 
                      : `${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  LaTeX Report
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && <ResearchChat chatMessages={chatMessages} theme={theme} />}
            
            {activeTab === 'results' && results.length > 0 && (
              <ResearchResults results={results} theme={theme} />
            )}

            {activeTab === 'report' && finalReport && (
              <ResearchReport 
                finalReport={finalReport}
                onDownload={downloadReport}
                theme={theme}
              />
            )}

            {activeTab === 'latex' && latexReport && (
              <ResearchReport 
                finalReport={latexReport}
                onDownload={downloadLatexReport}
                theme={theme}
              />
            )}

            {activeTab === 'report' && !finalReport && !reportGenerationProgress && (
              <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">Multi-part report not yet generated</p>
                <p className="text-sm font-light mt-2">Start research machine to generate report</p>
              </div>
            )}

            {activeTab === 'latex' && !latexReport && !reportGenerationProgress && (
              <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">LaTeX report not yet generated</p>
                <p className="text-sm font-light mt-2">Upload .tex template and start research</p>
              </div>
            )}

            {(activeTab === 'report' || activeTab === 'latex') && reportGenerationProgress && !finalReport && !latexReport && (
              <div className="space-y-4">
                <div className={`text-center py-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                  <p className="font-light">Report generation in progress...</p>
                  <p className="text-sm font-light mt-2">
                    Part {reportGenerationProgress.currentPart} of {reportGenerationProgress.totalParts}
                  </p>
                </div>
                {reportGenerationProgress.content && (
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <h3 className="font-medium mb-2">Preview of part {reportGenerationProgress.currentPart}</h3>
                    <div className="max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-light leading-relaxed">
                        {reportGenerationProgress.content.substring(0, 1000)}...
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearchApp;
