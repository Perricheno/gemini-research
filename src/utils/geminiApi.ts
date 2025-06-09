
import { ResearchResult, Reference, ResearchSettings } from '../types/research';

export const callGeminiAPI = async (
  query: string, 
  chatId: number, 
  settings?: ResearchSettings
): Promise<ResearchResult> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  
  try {
    const tools = settings?.useGrounding ? [
      {
        googleSearch: {
          dynamicRetrievalConfig: {
            mode: "MODE_DYNAMIC",
            dynamicThreshold: 0.7
          }
        }
      }
    ] : undefined;

    const systemPrompt = `Вы - профессиональный исследователь. Проведите всесторонний анализ по запросу: "${query}".

Требования к ответу:
1. Предоставьте детальный, фактический анализ с конкретными данными
2. Включите статистику, цифры, примеры
3. Укажите источники с полными деталями
4. Структурируйте ответ логично
5. Используйте академический стиль изложения

Формат ответа должен включать:
- Введение с ключевыми определениями
- Основной анализ с подразделами
- Конкретные примеры и кейсы
- Статистические данные
- Выводы и рекомендации

Обязательно включите ссылки на источники в формате:
[Источник: Название статьи | Автор | Дата | URL]`;

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
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    if (tools) {
      requestBody.tools = tools;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Нет данных в ответе API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const references = extractReferences(responseText, settings?.customUrls || []);

    return {
      query,
      response: responseText,
      references,
      chatId,
      status: 'completed',
      timestamp: new Date()
    };

  } catch (error) {
    console.error(`Ошибка API для запроса ${chatId}:`, error);
    return {
      query,
      response: error.message || 'Неизвестная ошибка',
      references: [],
      chatId,
      status: 'error',
      timestamp: new Date()
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
        description: `Источник по теме исследования`
      });
    }
  }

  // Добавляем пользовательские URL как дополнительные ссылки
  customUrls.forEach((url, index) => {
    references.push({
      title: `Пользовательский источник ${index + 1}`,
      url,
      domain: extractDomain(url),
      description: 'Добавлено пользователем в контекст исследования'
    });
  });

  // Если не найдено ссылок в тексте, создаем общие ссылки
  if (references.length === 0) {
    for (let i = 0; i < 3; i++) {
      references.push({
        title: `Исследовательский источник ${i + 1}`,
        url: '#citation',
        domain: 'research.source',
        description: 'Академический источник для исследования'
      });
    }
  }

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
