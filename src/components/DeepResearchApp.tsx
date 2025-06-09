
import React, { useState } from 'react';
import { Search, Brain, FileText, Download, MessageSquare, Upload } from 'lucide-react';
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
        toast.success(`LaTeX шаблон "${file.name}" загружен успешно`);
        addChatMessage('system', `LaTeX шаблон загружен: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      toast.error('Пожалуйста, загрузите файл с расширением .tex');
    }
  };

  const conductResearch = async () => {
    if (!topic.trim()) {
      toast.error('Пожалуйста, введите тему исследования');
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

    addChatMessage('user', `Запуск исследовательской машины по теме: ${topic}`);
    addChatMessage('system', 'Инициализация: принудительный веб-поиск с полными URL, НЕТ лимитов на поиск и анализ!');

    try {
      // Шаг 1: Автоматическое разделение темы на подтемы
      setCurrentStep('Автоматическое разделение темы на подтемы...');
      setProgress(5);
      addChatMessage('system', `Gemini 2.5 Flash Preview разделяет тему на ${settings.parallelQueries} уникальных подтем...`);
      
      const subtopics = await generateSubtopics(topic, settings.parallelQueries, settings);
      addChatMessage('system', `Сгенерировано ${subtopics.length} уникальных подтем для детального веб-исследования`);
      
      // Шаг 2: Параллельные веб-запросы по подтемам с детальным анализом
      setCurrentStep(`Выполнение ${subtopics.length} параллельных веб-запросов с детальным анализом источников...`);
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
      
      addChatMessage('system', `Запуск ${subtopics.length} параллельных веб-поисковых запросов с глубоким анализом источников и извлечением полных URL...`);
      
      const allResults: ResearchResult[] = [];
      const collectedReferences: Reference[] = [];
      
      for (let i = 0; i < subtopics.length; i += settings.batchSize) {
        const batch = subtopics.slice(i, i + settings.batchSize);
        const batchNumber = Math.floor(i / settings.batchSize) + 1;
        const totalBatches = Math.ceil(subtopics.length / settings.batchSize);
        
        console.log(`Веб-поиск батча ${batchNumber}/${totalBatches} (${batch.length} запросов)`);
        addChatMessage('system', `Веб-поиск батча ${batchNumber}/${totalBatches}: детальный анализ источников с полными URL по каждой подтеме...`);
        
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
                addChatMessage('research', `Веб-анализ ${result.value.chatId} завершен: ${wordCount} слов анализа, найдено ${result.value.references.length} полных URL источников`);
              }
            } else {
              console.error(`Веб-запрос не выполнен: ${batch[index]}`, result.reason);
              const errorResult: ResearchResult = {
                query: batch[index],
                response: `Ошибка веб-поиска: ${result.reason}`,
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

              addChatMessage('system', `Веб-запрос ${errorResult.chatId} завершен с ошибкой: ${result.reason}`);
            }
          });
          
          setProgress(10 + ((i + settings.batchSize) / subtopics.length) * 50);
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Батчная ошибка веб-поиска:', error);
          addChatMessage('system', `Ошибка веб-поискового батча: ${error.message}`);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      setAllReferences(collectedReferences);
      
      // Шаг 3: Сборка всех веб-данных
      setCurrentStep('Сборка веб-данных для анализа...');
      setProgress(65);
      
      const successfulResults = allResults.filter(r => r.status === 'completed');
      const combinedWebData = successfulResults.map(r => 
        `=== ПОДТЕМА: ${r.query} ===\nДЕТАЛЬНЫЙ АНАЛИЗ:\n${r.response}`
      ).join('\n\n');
      
      setWebDataForDownload(combinedWebData);
      const totalAnalysisWords = combinedWebData.split(' ').length;
      addChatMessage('system', `Веб-исследование завершено! Обработано ${allResults.length} запросов, найдено ${totalRefs} полных URL веб-источников.`);
      addChatMessage('system', `Собраны детальные анализы: ${totalAnalysisWords.toLocaleString()} слов для синтеза в отчет`);
      
      // Шаг 4: Многочастная генерация финального отчета
      setCurrentStep('Генерация многочастного отчета через Gemini 2.5 Flash Preview...');
      setProgress(70);
      setActiveTab('report');
      
      const totalParts = Math.ceil(settings.wordCount / 10000);
      addChatMessage('system', `Запуск многочастной генерации отчета: ${totalParts} частей по 10000 слов каждая с полными URL источников`);
      
      const onPartGenerated = (partNumber: number, content: string, totalParts: number) => {
        const wordCount = content.split(' ').length;
        addChatMessage('model-response', `Часть ${partNumber}/${totalParts} отчета сгенерирована: ${wordCount.toLocaleString()} слов`);
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
      addChatMessage('system', `Многочастный отчет завершен! Общая длина: ${finalWordCount.toLocaleString()} слов с полными URL всех источников`);
      
      // Шаг 5: Генерация LaTeX отчета (если шаблон загружен)
      if (latexTemplate) {
        setCurrentStep('Генерация LaTeX отчета...');
        setActiveTab('latex');
        addChatMessage('system', `Запуск генерации LaTeX отчета по шаблону "${latexTemplate.name}"`);
        
        const latexContent = await generateLatexReport(
          combinedWebData,
          topic,
          settings,
          collectedReferences,
          latexTemplate.content,
          onPartGenerated
        );
        
        setLatexReport(latexContent);
        addChatMessage('system', `LaTeX отчет сгенерирован по шаблону "${latexTemplate.name}"`);
      }
      
      toast.success('Исследовательская машина завершила работу! Отчет готов.');
      
    } catch (error) {
      console.error('Ошибка исследовательской машины:', error);
      addChatMessage('system', `Ошибка исследовательской машины: ${error.message}`);
      toast.error('Ошибка веб-исследования. Попробуйте снова.');
    } finally {
      setIsResearching(false);
      setProgress(100);
      setCurrentStep('Исследовательская машина завершила работу!');
    }
  };

  const downloadWebData = () => {
    if (!webDataForDownload) {
      toast.error('Веб-данные пока недоступны');
      return;
    }
    
    const blob = new Blob([webDataForDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-research-data-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Веб-данные исследования загружены успешно!');
    toast.success('Веб-данные загружены!');
  };

  const downloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Финальный отчет загружен успешно!');
    toast.success('Отчет загружен успешно!');
  };

  const downloadLatexReport = () => {
    if (!latexReport) {
      toast.error('LaTeX отчет пока недоступен');
      return;
    }
    
    const blob = new Blob([latexReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latex-report-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.tex`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'LaTeX отчет загружен успешно!');
    toast.success('LaTeX отчет загружен!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-light mb-4 tracking-wide">
            Исследовательская машина
          </h1>
          <div className="w-32 h-0.5 bg-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg font-light">
            Powered by Gemini 2.5 Flash Preview + Автоматическое разделение тем + Детальный анализ источников с полными URL
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
            />

            <ResearchProgress
              isResearching={isResearching}
              currentStep={currentStep}
              progress={progress}
              completedQueries={completedQueries}
              totalQueries={settings.parallelQueries}
              totalReferences={totalReferences}
              batchSize={settings.batchSize}
            />

            {/* LaTeX Template Upload */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                LaTeX шаблон
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
                className="w-full bg-foreground text-background px-4 py-2 rounded hover:bg-muted-foreground transition-colors cursor-pointer flex items-center justify-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {latexTemplate ? 'Изменить шаблон' : 'Загрузить .tex'}
              </label>
              {latexTemplate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Загружен: {latexTemplate.name}
                </p>
              )}
            </div>

            {/* Download Web Data Button */}
            {webDataForDownload && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Веб-данные готовы</h3>
                <button
                  onClick={downloadWebData}
                  className="w-full bg-foreground text-background px-4 py-2 rounded hover:bg-muted-foreground transition-colors"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Скачать веб-данные
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(webDataForDownload.length / 1000)}k символов детального анализа
                </p>
              </div>
            )}

            {/* Report Generation Progress */}
            {reportGenerationProgress && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Генерация отчета</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Часть {reportGenerationProgress.currentPart} из {reportGenerationProgress.totalParts}</span>
                    <span>{Math.round((reportGenerationProgress.currentPart / reportGenerationProgress.totalParts) * 100)}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-foreground h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(reportGenerationProgress.currentPart / reportGenerationProgress.totalParts) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportGenerationProgress.content.split(' ').length.toLocaleString()} слов сгенерировано
                  </p>
                </div>
              </div>
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
                Исследовательская машина
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
                Веб-запросы ({results.length})
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
                Многочастный отчет
              </button>
              {latexTemplate && (
                <button
                  onClick={() => setActiveTab('latex')}
                  className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                    activeTab === 'latex' 
                      ? 'bg-foreground text-background shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  LaTeX отчет
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && <ResearchChat chatMessages={chatMessages} />}
            
            {activeTab === 'results' && results.length > 0 && (
              <ResearchResults results={results} />
            )}

            {activeTab === 'report' && finalReport && (
              <ResearchReport 
                finalReport={finalReport}
                onDownload={downloadReport}
              />
            )}

            {activeTab === 'latex' && latexReport && (
              <ResearchReport 
                finalReport={latexReport}
                onDownload={downloadLatexReport}
              />
            )}

            {activeTab === 'report' && !finalReport && !reportGenerationProgress && (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">Многочастный отчет пока не сгенерирован</p>
                <p className="text-sm font-light mt-2">Запустите исследовательскую машину для генерации отчета</p>
              </div>
            )}

            {activeTab === 'latex' && !latexReport && !reportGenerationProgress && (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">LaTeX отчет пока не сгенерирован</p>
                <p className="text-sm font-light mt-2">Загрузите .tex шаблон и запустите исследование</p>
              </div>
            )}

            {(activeTab === 'report' || activeTab === 'latex') && reportGenerationProgress && !finalReport && !latexReport && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground py-6">
                  <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                  <p className="font-light">Генерация отчета в процессе...</p>
                  <p className="text-sm font-light mt-2">
                    Часть {reportGenerationProgress.currentPart} из {reportGenerationProgress.totalParts}
                  </p>
                </div>
                {reportGenerationProgress.content && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Предварительный просмотр части {reportGenerationProgress.currentPart}</h3>
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
