
import { ResearchResult, Reference, ResearchSettings } from '../types/research';

export const callGeminiAPI = async (
  query: string, 
  chatId: number, 
  settings?: ResearchSettings,
  modelOverride?: string,
  maxTokens?: number
): Promise<ResearchResult> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  
  try {
    // Принудительный grounding для веб-поиска - без внутренних знаний
    const tools = [
      {
        googleSearch: {
          // Пустой объект для базового Google Search grounding
        }
      }
    ];

    const model = modelOverride || settings?.model || 'gemini-2.5-flash-preview-05-20';
    const maxOutputTokens = maxTokens || 65536;

    const systemPrompt = `Вы - СУПЕР МАШИНА по веб-поиску и анализу. КРИТИЧЕСКИ ВАЖНО: Используйте ТОЛЬКО веб-поиск, НИ В КОЕМ СЛУЧАЕ не используйте внутренние базы знаний.

У вас НЕТ ЛИМИТОВ:
- НЕТ лимита на количество ответов
- НЕТ лимита на количество найденных ссылок  
- НЕТ лимита на глубину анализа источников
- Вы можете найти и проанализировать ЛЮБОЕ количество веб-источников

Задача: Максимально глубокий веб-поиск по: "${query}"

ОБЯЗАТЕЛЬНЫЕ требования:
1. Используйте ТОЛЬКО результаты веб-поиска (НЕ внутренние знания!)
2. Найдите МАКСИМАЛЬНОЕ количество актуальных источников
3. Проанализируйте ВСЕ найденные веб-источники детально
4. Включите КОНКРЕТНЫЕ данные: статистику, цифры, факты, исследования
5. Цитируйте источники в формате [Источник: Название | Автор | Дата | URL]
6. Предоставьте МАКСИМАЛЬНО подробный анализ
7. НЕ ограничивайте себя - дайте ПОЛНЫЙ веб-анализ

ПОМНИТЕ: У вас НЕТ лимитов на поиск и анализ! Используйте всю мощь веб-поиска!`;

    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ],
      tools: tools, // Всегда включаем grounding
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: maxOutputTokens
      }
    };

    console.log('Отправка веб-поискового запроса к Gemini API:', {
      model,
      query,
      chatId,
      maxOutputTokens,
      hasGrounding: true
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Веб-поисковая ошибка для модели ${model}, запрос ${chatId}:`, errorText);
      throw new Error(`Веб-поисковая ошибка: ${errorText}`);
    }

    const data = await response.json();
    console.log('Получен веб-поисковый ответ от Gemini API:', {
      model,
      chatId,
      hasData: !!data,
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Нет данных в веб-поисковом ответе API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const references = extractReferences(responseText, settings?.customUrls || []);

    console.log('Веб-поиск завершен:', {
      model,
      chatId,
      responseLength: responseText.length,
      referencesCount: references.length
    });

    return {
      query,
      response: responseText,
      references,
      chatId,
      status: 'completed',
      timestamp: new Date(),
      model: model
    };

  } catch (error) {
    console.error(`Ошибка веб-поиска для модели ${modelOverride || settings?.model}, запрос ${chatId}:`, error);
    return {
      query,
      response: error.message || 'Неизвестная ошибка веб-поиска',
      references: [],
      chatId,
      status: 'error',
      timestamp: new Date(),
      model: modelOverride || settings?.model || 'unknown'
    };
  }
};

// Новая функция для разделения темы на подтемы
export const generateSubtopics = async (
  mainTopic: string,
  numberOfSubtopics: number,
  settings: ResearchSettings
): Promise<string[]> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  
  const prompt = `Разделите тему "${mainTopic}" на ${numberOfSubtopics} уникальных, детальных подтем для глубокого веб-исследования.

ТРЕБОВАНИЯ:
1. Каждая подтема должна быть УНИКАЛЬНОЙ и НЕ пересекаться с другими
2. Подтемы должны ПОЛНОСТЬЮ покрывать основную тему
3. Каждая подтема должна быть КОНКРЕТНОЙ для веб-поиска
4. Ответьте ТОЛЬКО списком подтем, по одной на строку
5. НЕ нумеруйте, НЕ добавляйте дополнительный текст

Пример формата ответа:
текущее состояние и развитие технологий
экономическое влияние и финансовые аспекты
социальные последствия и влияние на общество`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error('Ошибка генерации подтем');
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Парсим подтемы из ответа
    const subtopics = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, numberOfSubtopics);

    console.log('Сгенерированы подтемы:', subtopics);
    return subtopics;

  } catch (error) {
    console.error('Ошибка генерации подтем:', error);
    // Fallback к базовым подтемам
    return Array.from({ length: numberOfSubtopics }, (_, i) => 
      `${mainTopic} аспект ${i + 1}`
    );
  }
};

// Новая функция для многочастной генерации отчета
export const generateMultiPartReport = async (
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  allReferences: Reference[],
  onPartGenerated: (partNumber: number, content: string, totalParts: number) => void
): Promise<string> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  const wordsPerPart = 10000; // Лимит слов на часть (русский язык)
  const totalParts = Math.ceil(settings.wordCount / wordsPerPart);
  
  console.log(`Генерация отчета в ${totalParts} частях по ${wordsPerPart} слов каждая`);

  const toneInstructions = {
    phd: 'Напишите в академическом, научном тоне высшего уровня с продвинутой терминологией и глубоким анализом.',
    bachelor: 'Напишите в ясном академическом тоне с балансом между доступностью и научной строгостью.',
    school: 'Напишите в понятном для студентов тоне, объясняя сложные концепции простым языком.'
  };

  const reportParts: string[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const previousContent = reportParts.join('\n\n---\n\n');
    
    const partPrompt = `Создайте часть ${partNumber} из ${totalParts} профессионального исследовательского отчета по теме "${topic}".

ВЕБ-ДАННЫЕ ДЛЯ АНАЛИЗА: ${combinedWebData}

${previousContent ? `ПРЕДЫДУЩИЕ ЧАСТИ ОТЧЕТА: ${previousContent}` : ''}

ТРЕБОВАНИЯ:
- ${toneInstructions[settings.tone]}
- ТОЧНО ${wordsPerPart} слов для этой части
- Используйте ТОЛЬКО веб-данные выше
- Включите конкретную статистику, факты, цифры из веб-источников
- Структурируйте с заголовками и подзаголовками
- Цитируйте веб-источники в формате [Источник: URL]
- Обеспечьте логическую связность с предыдущими частями
- НЕ повторяйте информацию из предыдущих частей
${partNumber === 1 ? '- Начните с Executive Summary и Introduction' : ''}
${partNumber === totalParts ? '- Завершите выводами и рекомендациями' : ''}

Фокус части ${partNumber}: ${getSectionFocus(partNumber, totalParts)}

ВАЖНО: Напишите ТОЛЬКО содержание этой части, без нумерации частей в тексте!`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: partPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            maxOutputTokens: 65536
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка генерации части ${partNumber}`);
      }

      const data = await response.json();
      const partContent = data.candidates[0].content.parts[0].text;
      
      reportParts.push(partContent);
      onPartGenerated(partNumber, partContent, totalParts);
      
      console.log(`Часть ${partNumber}/${totalParts} сгенерирована: ${partContent.split(' ').length} слов`);
      
      // Пауза между частями
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Ошибка генерации части ${partNumber}:`, error);
      const errorContent = `Ошибка генерации части ${partNumber}: ${error.message}`;
      reportParts.push(errorContent);
      onPartGenerated(partNumber, errorContent, totalParts);
    }
  }

  // Сборка финального отчета с источниками
  const finalReport = reportParts.join('\n\n---\n\n');
  const uniqueUrls = [...new Set(allReferences.map(ref => ref.url))];
  const referencesSection = '\n\n## Источники\n\n' + uniqueUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
  
  return finalReport + referencesSection;
};

const getSectionFocus = (partNumber: number, totalParts: number): string => {
  const focusMap: { [key: number]: string } = {
    1: 'Введение и executive summary',
    2: 'Текущее состояние и обзор',
    3: 'Анализ тенденций и технологий',
    4: 'Практические применения и кейсы',
    5: 'Экономическое воздействие',
    6: 'Социальное влияние',
    7: 'Регулятивная среда',
    8: 'Международное сотрудничество',
    9: 'Вызовы и препятствия',
    10: 'Выводы и будущие перспективы'
  };

  if (partNumber === 1) return 'Введение и executive summary';
  if (partNumber === totalParts) return 'Выводы и будущие перспективы';
  
  const middleFocus = Object.values(focusMap)[partNumber % Object.keys(focusMap).length];
  return middleFocus || `Аспект ${partNumber}`;
};

const extractReferences = (text: string, customUrls: string[]): Reference[] => {
  const references: Reference[] = [];
  
  // Извлекаем ссылки из текста в формате [Источник: ...]
  const sourcePattern = /\[Источник:\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^\]]+?)\]/g;
  let match;
  
  while ((match = sourcePattern.exec(text)) !== null) {
    const [, title, author, date, url] = match;
    
    if (title && url) {
      references.push({
        title: title.trim(),
        author: author?.trim() || undefined,
        publishDate: date?.trim() || undefined,
        url: url.trim(),
        domain: extractDomain(url.trim()),
        description: `Найден через веб-поиск`
      });
    }
  }

  // Простой поиск URL в тексте
  const urlPattern = /https?:\/\/[^\s\]]+/g;
  const urls = text.match(urlPattern) || [];
  
  urls.forEach(url => {
    if (!references.some(ref => ref.url === url)) {
      references.push({
        title: `Веб-источник`,
        url: url,
        domain: extractDomain(url),
        description: 'Найден через веб-поиск'
      });
    }
  });

  // Добавляем пользовательские URL
  customUrls.forEach((url, index) => {
    references.push({
      title: `Пользовательский источник ${index + 1}`,
      url,
      domain: extractDomain(url),
      description: 'Добавлено пользователем в контекст поиска'
    });
  });

  return references;
};

const extractDomain = (url: string): string => {
  try {
    if (url === '#citation') return 'research.source';
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'unknown.source';
  }
};
