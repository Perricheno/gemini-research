
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
  const [activeTab, setActiveTab] = useState<'chat' | 'results' | 'report'>('chat');

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
    setActiveTab('results');

    addChatMessage('user', `Начинаем глубокое исследование по теме: ${topic}`);
    addChatMessage('system', `Инициализируем ${settings.parallelQueries} параллельных запросов с моделью ${settings.model}...`);
    addChatMessage('system', `Настройки исследования: ${settings.searchDepth} глубина поиска, grounding ${settings.useGrounding ? 'включено' : 'выключено'}, размер батча: ${settings.batchSize}`);

    try {
      setCurrentStep('Генерация всесторонних исследовательских запросов...');
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
      
      setCurrentStep(`Выполнение ${queries.length} параллельных исследовательских запросов...`);
      addChatMessage('system', `Сгенерировано ${queries.length} исследовательских запросов. Начинаем параллельное выполнение с батчей размером ${settings.batchSize}...`);
      
      const allResults: ResearchResult[] = [];
      
      for (let i = 0; i < queries.length; i += settings.batchSize) {
        const batch = queries.slice(i, i + settings.batchSize);
        const batchNumber = Math.floor(i / settings.batchSize) + 1;
        const totalBatches = Math.ceil(queries.length / settings.batchSize);
        
        console.log(`Обработка батча ${batchNumber}/${totalBatches} (${batch.length} запросов)`);
        addChatMessage('system', `Обработка батча ${batchNumber}/${totalBatches}...`);
        
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
                addChatMessage('research', `Запрос ${result.value.chatId} завершен: найдено ${result.value.references.length} ссылок`);
              }
            } else {
              console.error(`Запрос не выполнен: ${batch[index]}`, result.reason);
              const errorResult: ResearchResult = {
                query: batch[index],
                response: `Ошибка: ${result.reason}`,
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

              addChatMessage('system', `Запрос ${errorResult.chatId} не выполнен: ${result.reason}`);
            }
          });
          
          setProgress(((i + settings.batchSize) / queries.length) * 70);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Батчная ошибка:', error);
          addChatMessage('system', `Ошибка обработки батча: ${error.message}`);
        }
      }

      const totalRefs = allResults.reduce((sum, result) => sum + result.references.length, 0);
      setTotalReferences(totalRefs);
      
      addChatMessage('system', `Исследование завершено! Процессинг ${allResults.length} запросов с найденными ${totalRefs} ссылками.`);
      
      setCurrentStep('Анализ и синтез исследовательских данных...');
      setProgress(75);
      
      await generateFinalReport(allResults);
      
    } catch (error) {
      console.error('Исследование завершено с ошибкой:', error);
      addChatMessage('system', `Исследование завершено с ошибкой: ${error.message}`);
      toast.error('Исследование завершено с ошибкой. Пожалуйста, попробуйте снова.');
    } finally {
      setIsResearching(false);
      setProgress(100);
      setCurrentStep('Исследование завершено!');
    }
  };

  const generateFinalReport = async (results: ResearchResult[]) => {
    const successfulResults = results.filter(r => r.status === 'completed');
    const combinedData = successfulResults.map(r => r.response).join('\n\n');
    const allReferences = successfulResults.flatMap(r => r.references);
    
    addChatMessage('system', 'Генерация всестороннего исследовательского отчета...');
    setActiveTab('report');

    const toneInstructions = {
      phd: 'Напишите в академическом, научном тоне, подходящем для исследования PhD-уровня. Используйте сложные слова, сложные предложные конструкции, резервированный аналитический подход и расширенные цитаты.',
      bachelor: 'Напишите в ясном, академическом тоне, подходящем для бакалавра. Балансируйте доступность с академической rigor, включите правильные цитаты и строительную аналитику.',
      school: 'Напишите в ясном, доступном для школьников тоне. Объясняйте сложные концепции просто, сохраняя фактическую точность.'
    };

    const wordsPerChunk = Math.min(3000, Math.floor(settings.wordCount / 4));
    const chunks = Math.ceil(settings.wordCount / wordsPerChunk);
    
    let fullReport = '';
    
    for (let i = 0; i < chunks; i++) {
      setCurrentStep(`Генерация отчетной части ${i + 1}/${chunks}...`);
      addChatMessage('system', `Пишем часть ${i + 1} из ${chunks}...`);
      
      const sectionPrompt = `
        На основе всестороннего исследовательского данных, напишите часть ${i + 1} из ${chunks} отчета по теме "${topic}".
        
        Исследовательские данные: ${combinedData.substring(i * 5000, (i + 1) * 5000)}
        
        Требования:
        - ${toneInstructions[settings.tone]}
        - Целевая длина: приблизительно ${wordsPerChunk} слов для этой части
        - Включите конкретные данные, статистику, численные доказательства и примеры из исследования
        - Сохраните профессиональную академическую структуру с четкими заголовками и подзаголовками
        - Ссылки на источники правильно цитируются с правильными академическими цитатами
        - Используйте доказательную аналитику и делайте значимые выводы
        ${i === 0 ? '- Начните с executive summary, introduction и methodology' : ''}
        ${i === chunks - 1 ? '- Закончите с conclusions, recommendations и future research directions' : ''}
        
        Структуру этой части профессионально с четким логическим потоком и авторитетной презентацией.
      `;

      try {
        const sectionResponse = await callGeminiAPI(sectionPrompt, 1000 + i, settings);
        fullReport += sectionResponse.response + '\n\n';
        
        setProgress(75 + (i + 1) / chunks * 20);
      } catch (error) {
        console.error(`Ошибка генерации части ${i + 1}:`, error);
        addChatMessage('system', `Ошибка генерации части ${i + 1}: ${error.message}`);
      }
    }
    
    // Обработка и удаление дубликатов ссылок
    const uniqueReferences = new Map<string, Reference>();
    allReferences.forEach(ref => {
      const key = ref.url + ref.title;
      if (!uniqueReferences.has(key)) {
        uniqueReferences.set(key, ref);
      }
    });
    
    fullReport += '\n\n## Список источников и ссылок\n\n';
    Array.from(uniqueReferences.values()).forEach((ref, index) => {
      fullReport += `${index + 1}. **${ref.title}**\n`;
      if (ref.url !== '#citation') {
        fullReport += `   URL: ${ref.url}\n`;
      }
      if (ref.author) {
        fullReport += `   Автор: ${ref.author}\n`;
      }
      if (ref.publishDate) {
        fullReport += `   Опубликовано: ${ref.publishDate}\n`;
      }
      if (ref.description) {
        fullReport += `   Описание: ${ref.description}\n`;
      }
      fullReport += `   Домен: ${ref.domain}\n\n`;
    });
    
    setFinalReport(fullReport);
    addChatMessage('system', `Профессиональный исследовательский отчет сгенерирован! Длина: ${fullReport.length} символов, ${uniqueReferences.size} уникальных ссылок.`);
    toast.success('Профессиональный исследовательский отчет сгенерирован успешно!');
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
                Рассмотрение исследовательских данных
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
                Результаты запросов ({results.length})
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

            {activeTab === 'report' && finalReport && (
              <ResearchReport 
                finalReport={finalReport}
                onDownload={downloadReport}
              />
            )}

            {activeTab === 'report' && !finalReport && (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-light">Пока что отчет не сгенерирован</p>
                <p className="text-sm font-light mt-2">Начните исследовательский процесс для генерации профессионального отчета</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepResearchApp;
