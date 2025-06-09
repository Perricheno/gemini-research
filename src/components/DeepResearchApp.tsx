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
import { Search, Brain, FileText, Download, Settings, Eye, EyeOff, MessageSquare, Zap, Clock, BarChart3, Globe, Link, Plus, Trash2, Upload } from 'lucide-react';
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
  const [bulkUrls, setBulkUrls] = useState('');

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
      toast.success('URL добавлен в исследовательский контекст');
    }
  };

  const addBulkUrls = () => {
    if (bulkUrls.trim()) {
      const urls = bulkUrls
        .split(/[\n,;]/)
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'))
        .filter(url => !settings.customUrls.includes(url));
      
      if (urls.length > 0) {
        setSettings(prev => ({
          ...prev,
          customUrls: [...prev.customUrls, ...urls]
        }));
        setBulkUrls('');
        toast.success(`Добавлено ${urls.length} URL в исследовательский контекст`);
      } else {
        toast.error('Не найдены валидные URL в тексте');
      }
    }
  };

  const removeCustomUrl = (index: number) => {
    setSettings(prev => ({
      ...prev,
      customUrls: prev.customUrls.filter((_, i) => i !== index)
    }));
  };

  const clearAllUrls = () => {
    setSettings(prev => ({
      ...prev,
      customUrls: []
    }));
    toast.success('Все URL удалены');
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
          
          // Уменьшенная задержка для улучшения производительности с более высокими ограничениями
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
        const sectionResponse = await callGeminiAPI(sectionPrompt, 1000 + i);
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
            <Card className="border-2 border-foreground hover:shadow-2xl transition-all duration-500 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-light">
                  <Settings className="h-5 w-5" />
                  Настройки исследования
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium">Тема исследования</Label>
                  <Textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Введите вашу тему исследования..."
                    rows={3}
                    className="border-muted focus:border-foreground transition-colors duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Академический уровень</Label>
                  <Select value={settings.tone} onValueChange={(value: any) => setSettings({...settings, tone: value})}>
                    <SelectTrigger className="border-muted focus:border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phd">Уровень PhD</SelectItem>
                      <SelectItem value="bachelor">Уровень бакалавра</SelectItem>
                      <SelectItem value="school">Школьный уровень</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">AI модель</Label>
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
                  <Label className="text-sm font-medium">Глубина поиска</Label>
                  <Select value={settings.searchDepth} onValueChange={(value: any) => setSettings({...settings, searchDepth: value})}>
                    <SelectTrigger className="border-muted focus:border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shallow">Поверхностный (Быстро)</SelectItem>
                      <SelectItem value="medium">Средний (Сбалансированно)</SelectItem>
                      <SelectItem value="deep">Глубокий (Всесторонне)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Включить Grounding</Label>
                  <Switch
                    checked={settings.useGrounding}
                    onCheckedChange={(checked) => setSettings({...settings, useGrounding: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Количество слов: {settings.wordCount.toLocaleString()}</Label>
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
                  <Label className="text-sm font-medium">Параллельные запросы: {settings.parallelQueries}</Label>
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
                  <Label className="text-sm font-medium">Размер батча: {settings.batchSize}</Label>
                  <input
                    type="range"
                    min="1"
                    max="50"
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
                    Пользовательский URL контекст ({settings.customUrls.length})
                  </Label>
                  
                  {/* Single URL input */}
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

                  {/* Bulk URL input */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Массовое добавление URL (Ctrl+V)</Label>
                    <Textarea
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder="Вставьте несколько URL (по одному на строке или через запятую)"
                      rows={3}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button onClick={addBulkUrls} size="sm" variant="outline" className="flex-1">
                        <Upload className="h-3 w-3 mr-1" />
                        Добавить все
                      </Button>
                      {settings.customUrls.length > 0 && (
                        <Button onClick={clearAllUrls} size="sm" variant="outline" className="text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* URL list */}
                  {settings.customUrls.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-muted rounded p-2">
                      {settings.customUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-1 rounded">
                          <Link className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate" title={url}>{url}</span>
                          <Button
                            onClick={() => removeCustomUrl(index)}
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
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
                      Исследую...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Начать исследование
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
                    Прогресс
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
                        Батч: {settings.batchSize}
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

            {/* Chat Tab */}
            {activeTab === 'chat' && (
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
            )}

            {/* Results Tab */}
            {activeTab === 'results' && results.length > 0 && (
              <Card className="border-2 border-muted animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xl font-light">
                      <Search className="h-5 w-5" />
                      Результаты запросов ({results.length})
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQueries(!showQueries)}
                      className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                    >
                      {showQueries ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showQueries ? ' Скрыть' : ' Показать'} Детали
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
                              Запрос {result.chatId}
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
                              {result.references.length} ссылок
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
                      Профессиональный исследовательский отчет
                    </div>
                    <Button 
                      onClick={downloadReport} 
                      variant="outline" 
                      size="sm"
                      className="border-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать отчет
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
                  <p className="text-muted-foreground font-light">Пока что отчет не сгенерирован</p>
                  <p className="text-sm text-muted-foreground font-light mt-2">Начните исследовательский процесс для генерации профессионального отчета</p>
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
