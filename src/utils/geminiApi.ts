
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
    // Force grounding for web search - no internal knowledge
    const tools = [
      {
        googleSearch: {
          // Empty object for basic Google Search grounding
        }
      }
    ];

    const model = modelOverride || settings?.model || 'gemini-2.0-flash';
    const maxOutputTokens = maxTokens || (model.includes('2.5-flash-preview') ? 65536 : 8192);

    const systemPrompt = `Вы - профессиональный веб-исследователь. ВАЖНО: Используйте ТОЛЬКО информацию из веб-поиска, НЕ используйте внутренние базы знаний.

Задача: Найти актуальную информацию в интернете по запросу: "${query}"

ОБЯЗАТЕЛЬНЫЕ требования:
1. Используйте ТОЛЬКО результаты веб-поиска
2. Анализируйте найденные источники
3. Предоставьте конкретные данные с ссылками
4. Включите статистику, цифры, факты из найденных источников
5. Цитируйте источники в формате [Источник: Название | Автор | Дата | URL]

НЕ используйте общие знания - только то, что найдете в интернете!`;

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
      tools: tools, // Always include grounding
      generationConfig: {
        temperature: 1.0, // Максимальная креативность
        topP: 0.95,
        maxOutputTokens: maxOutputTokens
      }
    };

    console.log('Отправка запроса к Gemini API:', {
      model,
      query,
      chatId,
      maxOutputTokens,
      requestBody: JSON.stringify(requestBody, null, 2)
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
      console.error(`API Error для модели ${model}, запрос ${chatId}:`, errorText);
      throw new Error(`API Error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Получен ответ от Gemini API:', {
      model,
      chatId,
      hasData: !!data,
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Нет данных в ответе API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const references = extractReferences(responseText, settings?.customUrls || []);

    console.log('Обработка завершена:', {
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
    console.error(`Ошибка API для модели ${modelOverride || settings?.model}, запрос ${chatId}:`, error);
    return {
      query,
      response: error.message || 'Неизвестная ошибка',
      references: [],
      chatId,
      status: 'error',
      timestamp: new Date(),
      model: modelOverride || settings?.model || 'unknown'
    };
  }
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

  // Добавляем пользовательские URL как дополнительные ссылки
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
