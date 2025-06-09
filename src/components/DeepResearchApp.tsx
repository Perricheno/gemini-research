import React, { useState } from 'react';
import { Search, Brain, FileText, Download, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchResult, Reference, ResearchSettings, ChatMessage } from '../types/research';
import { generateResearchQueries } from '../utils/researchUtils';
import { callGeminiAPI } from '../utils/geminiApi';
import ResearchSettingsComponent from './ResearchSettings';
import ResearchProgress from './ResearchProgress';
import ResearchChat from './ResearchChat';
import ResearchResults from './ResearchResults';
import ResearchReport from './ResearchReport';
import ModelResponseViewer from './ModelResponseViewer';
import { ModelReport } from '../types/research';

const DeepResearchApp = () => {
  const [topic, setTopic] = useState('');
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
  const [completedQueries, setCompletedQueries] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'results' | 'models' | 'report'>('chat');
  const [modelReports, setModelReports] = useState<ModelReport[]>([]);

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

  const conductParallelResearch = async () => {
    if (!topic.trim()) {
      toast.error('Пожалуйста, введите тему исследования');
      return;
    }

    setIsResearching(true);
    setProgress(0);
    setResults([]);
    setFinalReport('');
    setTotalReferences(0);
    setCompletedQueries(0);
    setModelReports([]);
    setActiveTab('results');

    addChatMessage('user', `Начинаем мощное веб-исследование по теме: ${topic}`);
    addChatMessage('system', `Инициализируем ${settings.parallelQueries} параллельных веб-запросов с принудительным grounding...`);
    addChatMessage('system', `Настройки: максимальные лимиты, температура 0.1, принудительный веб-поиск, НЕ используем внутренние базы знаний`);

    try {
      setCurrentStep('Генерация целевых веб-поисковых запросов...');
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
      
      setCurrentStep(`Выполнение ${queries.length} параллельных веб-запросов с grounding...`);
      addChatMessage('system', `Сгенерировано ${queries.length} веб-поисковых запросов. Начинаем параллельное выполнение...`);
      
      const allResults: ResearchResult[] = [];
      
      for (let i = 0; i < queries.length; i += settings.batchSize) {
        const batch = queries.slice(i, i + settings.batchSize);
        const batchNumber = Math.floor(i / settings.batchSize) + 1;
        const totalBatches = Math.ceil(queries.length / settings.batchSize);
        
        console.log(`Обработка веб-поискового батча ${batchNumber}/${totalBatches} (${batch.length} запросов)`);
        addChatMessage('system', `Веб-поиск батча ${batchNumber}/${totalBatches}...`);
        
        const batchPromises = batch.map((query, index) => 
          callGeminiAPI(query, i + index + 1, settings)
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
                addChatMessage('research', `Веб-запрос ${result.value.chatId} завершен: найдено ${result.value.references.length} источников`);
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

              addChatMessage('system', `Веб-запрос ${errorResult.chatId} не выполнен: ${result.reason}`);
            }
          });
          
          setProgress(((i + settings.batchSize) / queries.length) * 60);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Батчная ошибка веб-поиска:', error);
          addChatMessage('system', `Ошибка обработки веб-поискового батча: ${error.message}`);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      
      addChatMessage('system', `Веб-исследование завершено! Обработано ${allResults.length} запросов, найдено ${totalRefs} веб-источников.`);
      
      setCurrentStep('Генерация согласованного отчета 5 моделями Gemini 2.5 Flash Preview...');
      setProgress(65);
      
      await generateMultiModelReport(allResults);
      
    } catch (error) {
      console.error('Веб-исследование завершено с ошибкой:', error);
      addChatMessage('system', `Веб-исследование завершено с ошибкой: ${error.message}`);
      toast.error('Веб-исследование завершено с ошибкой. Пожалуйста, попробуйте снова.');
    } finally {
      setIsResearching(false);
      setProgress(100);
      setCurrentStep('Веб-исследование завершено!');
    }
  };

  const generateMultiModelReport = async (results: ResearchResult[]) => {
    const successfulResults = results.filter(r => r.status === 'completed');
    const combinedData = successfulResults.map(r => r.response).join('\n\n');
    
    addChatMessage('system', 'Запуск 5 моделей Gemini 2.5 Flash Preview для согласованной генерации отчета...');
    setActiveTab('report');

    const models = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-exp'
    ];

    const toneInstructions = {
      phd: 'Напишите в академическом, научном тоне высшего уровня с продвинутой терминологией и глубоким анализом.',
      bachelor: 'Напишите в ясном академическом тоне с балансом между доступностью и научной строгостью.',
      school: 'Напишите в понятном для студентов тоне, объясняя сложные концепции простым языком.'
    };

    const initialReports: ModelReport[] = models.map((model, index) => ({
      id: `model-${index + 1}`,
      model: model,
      content: '',
      status: 'pending',
      timestamp: new Date(),
      wordCount: 0
    }));
    
    setModelReports(initialReports);

    const reportPromises = models.map(async (model, index) => {
      const modelNumber = index + 1;
      addChatMessage('system', `Модель ${modelNumber}/5 (${model}) начинает генерацию части отчета...`);
      
      const sectionPrompt = `На основе веб-исследовательских данных, напишите часть ${modelNumber} из 5 согласованного профессионального отчета по теме "${topic}".

ДАННЫЕ ИЗ ВЕБ-ПОИСКА: ${combinedData.substring(index * 10000, (index + 1) * 10000)}

ТРЕБОВАНИЯ:
- ${toneInstructions[settings.tone]}
- Целевая длина: приблизительно ${Math.floor(settings.wordCount / 5)} слов для этой части
- Используйте ТОЛЬКО данные из веб-поиска выше
- Включите конкретную статистику, факты, цифры из найденных источников
- Структурируйте профессионально с заголовками
- Цитируйте веб-источники в формате [Источник: Название | Автор | Дата | URL]
${index === 0 ? '- Начните с executive summary и introduction' : ''}
${index === models.length - 1 ? '- Закончите с conclusions и recommendations' : ''}

Фокус части ${modelNumber}: ${index === 0 ? 'Введение и обзор' : index === 1 ? 'Текущее состояние' : index === 2 ? 'Анализ и тренды' : index === 3 ? 'Практические применения' : 'Выводы и будущее'}`;

      try {
        const response = await callGeminiAPI(sectionPrompt, 2000 + index, settings, model, 65536);
        const wordCount = response.response.split(' ').length;
        
        const completedReport: ModelReport = {
          id: `model-${index + 1}`,
          model: model,
          content: response.response,
          status: 'completed',
          timestamp: new Date(),
          wordCount: wordCount
        };

        setModelReports(prev => prev.map(r => 
          r.id === completedReport.id ? completedReport : r
        ));

        addChatMessage('model-response', `Модель ${modelNumber}/5 завершила генерацию: ${wordCount.toLocaleString()} слов`);
        setProgress(65 + (index + 1) / models.length * 30);
        
        return response.response;
      } catch (error) {
        console.error(`Ошибка модели ${modelNumber}:`, error);
        
        const errorReport: ModelReport = {
          id: `model-${index + 1}`,
          model: model,
          content: `Ошибка генерации: ${error.message}`,
          status: 'error',
          timestamp: new Date(),
          wordCount: 0
        };

        setModelReports(prev => prev.map(r => 
          r.id === errorReport.id ? errorReport : r
        ));

        addChatMessage('system', `Модель ${modelNumber}/5 завершена с ошибкой: ${error.message}`);
        return '';
      }
    });

    const modelResponses = await Promise.all(reportPromises);
    const finalReport = modelResponses.filter(response => response).join('\n\n---\n\n');
    
    setFinalReport(finalReport);
    addChatMessage('system', `Согласованный отчет от 5 моделей сгенерирован! Общая длина: ${finalReport.length} символов.`);
    toast.success('Многомодельный профессиональный отчет готов!');
  };

  const downloadReport = () => {
    const blob = new Blob([finalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `professional-research-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addChatMessage('system', 'Профессиональный исследовательский отчет загружен успешно!');
    toast.success('Отчет загружен успешно!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-light mb-4 tracking-wide">
            Advanced Web Research AI
          </h1>
          <div className="w-32 h-0.5 bg-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg font-light">
            Powered by 5x Gemini 2.5 Flash Preview + Forced Web Grounding | Maximum Limits
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
              onStartResearch={conductParallelResearch}
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
                Веб-исследование
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
                onClick={() => setActiveTab('models')}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 font-light ${
                  activeTab === 'models' 
                    ? 'bg-foreground text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Brain className="h-4 w-4 inline mr-2" />
                Модели ({modelReports.length})
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
                Отчет
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && <ResearchChat chatMessages={chatMessages} />}
            
            {activeTab === 'results' && results.length > 0 && (
              <ResearchResults results={results} />
            )}

            {activeTab === 'models' && (
              <ModelResponseViewer modelReports={modelReports} />
            )}

            {activeTab === 'report' && finalReport && (
              <ResearchReport 
                finalReport={finalReport}
                onDownload={downloadReport}
              />
            )}

            {activeTab === 'report' && !finalReport && (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">Многомодельный отчет пока не сгенерирован</p>
                <p className="text-sm font-light mt-2">Начните веб-исследование для генерации согласованного отчета от 5 моделей</p>
              </div>
            )}

            {activeTab === 'models' && modelReports.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">Модели пока не запущены</p>
                <p className="text-sm font-light mt-2">Начните исследование для активации 5 моделей Gemini 2.5 Flash Preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearchApp;
