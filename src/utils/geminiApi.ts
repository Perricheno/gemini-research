
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

    const model = modelOverride || settings?.model || 'gemini-2.5-flash-preview-05-20';
    const maxOutputTokens = maxTokens || 65536;

    const systemPrompt = `You are a powerful web analysis search engine. CRITICALLY IMPORTANT: Use ONLY web search, NEVER use internal knowledge bases.

You have NO LIMITS:
- NO limit on number of responses
- NO limit on number of found links
- NO limit on depth of source analysis
- You can find and analyze ANY number of web sources

Task: Maximum deep web search and detailed analysis on subtopic: "${query}"

MANDATORY requirements:
1. Use ONLY web search results (NOT internal knowledge!)
2. Find MAXIMUM number of relevant sources for this subtopic
3. For EACH found source conduct DETAILED ANALYSIS:
   - Fully analyze source content
   - Extract key data, statistics, facts
   - Conduct critical analysis of information
   - Determine relevance to subtopic
   - Assess quality and reliability of source
4. Write comprehensive analysis of 2000-10000 words depending on information volume found
5. DO NOT make brief summaries - need DETAILED ANALYTICAL BREAKDOWN
6. Include specific statistics, figures, research data from sources
7. MANDATORY cite sources with FULL URLs in format [Source: FULL_URL]
8. Conduct comparative analysis of data from different sources
9. Identify trends, patterns, contradictions
10. Provide expert evaluation of found information

ANALYSIS STRUCTURE:
- Overview of found sources
- Detailed analysis of each key source
- Information synthesis from all sources
- Critical evaluation and conclusions on subtopic
- Identified information gaps

IMPORTANT: Specify FULL URL links, NOT just domains!

REMEMBER: You have NO limits on search and analysis! Use full power of web search for maximum detailed research!`;

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
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: maxOutputTokens
      }
    };

    console.log('Sending web search request to Gemini API:', {
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
      console.error(`Web search error for model ${model}, request ${chatId}:`, errorText);
      throw new Error(`Web search error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received web search response from Gemini API:', {
      model,
      chatId,
      hasData: !!data,
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      throw new Error('No data in web search API response');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const references = extractReferences(responseText, settings?.customUrls || []);

    console.log('Web search completed:', {
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
    console.error(`Web search error for model ${modelOverride || settings?.model}, request ${chatId}:`, error);
    return {
      query,
      response: error.message || 'Unknown web search error',
      references: [],
      chatId,
      status: 'error',
      timestamp: new Date(),
      model: modelOverride || settings?.model || 'unknown'
    };
  }
};

// Function to split topic into subtopics
export const generateSubtopics = async (
  mainTopic: string,
  numberOfSubtopics: number,
  settings: ResearchSettings
): Promise<string[]> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  
  const prompt = `Split the topic "${mainTopic}" into ${numberOfSubtopics} unique, detailed subtopics for deep web research.

REQUIREMENTS:
1. Each subtopic must be UNIQUE and NOT overlap with others
2. Subtopics must COMPLETELY cover the main topic with maximum detail
3. Each subtopic must be SPECIFIC for web search and analysis
4. Subtopics should cover various aspects: technical, economic, social, legal, ethical
5. Include both current state and future perspectives
6. Answer ONLY with list of subtopics, one per line
7. DO NOT number, DO NOT add additional text

Example of quality splitting:
modern technological solutions and architecture
economic impact and market trends
social consequences and societal impact
legal regulation and political aspects
ethical issues and security challenges
international experience and comparative analysis
future prospects and development forecasts`;

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
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error generating subtopics');
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse subtopics from response
    const subtopics = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, numberOfSubtopics);

    console.log('Generated subtopics:', subtopics);
    return subtopics;

  } catch (error) {
    console.error('Error generating subtopics:', error);
    // Fallback to basic subtopics
    return Array.from({ length: numberOfSubtopics }, (_, i) => 
      `${mainTopic} - aspect ${i + 1}`
    );
  }
};

// Function for multi-part report generation
export const generateMultiPartReport = async (
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  allReferences: Reference[],
  onPartGenerated: (partNumber: number, content: string, totalParts: number) => void
): Promise<string> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  const wordsPerPart = 10000; // Word limit per part (English)
  const totalParts = Math.ceil(settings.wordCount / wordsPerPart);
  
  console.log(`Generating report in ${totalParts} parts with ${wordsPerPart} words each`);

  const toneInstructions = {
    phd: 'Write in academic, scientific style with advanced terminology, deep analysis and critical thinking.',
    bachelor: 'Write in clear academic style with balance between accessibility and scientific rigor.',
    school: 'Write in understandable style, explaining complex concepts in accessible language.'
  };

  const reportParts: string[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const previousContent = reportParts.join('\n\n---\n\n');
    
    const partPrompt = `Create part ${partNumber} of ${totalParts} of professional research report on topic "${topic}".

WEB DATA FOR ANALYSIS: ${combinedWebData}

${previousContent ? `PREVIOUS REPORT PARTS: ${previousContent}` : ''}

REQUIREMENTS:
- ${toneInstructions[settings.tone]}
- EXACTLY ${wordsPerPart} words for this part
- Use ONLY web data above - conduct deep analysis and synthesis
- Create original insights based on web source analysis
- Include specific statistics, data, facts from web research
- Conduct critical analysis and source comparison
- Structure with clear headings and subheadings
- MANDATORY cite web sources with FULL URLs in format [Source: FULL_URL]
- Ensure PERFECT logical connectivity with previous parts
- DO NOT repeat information from previous parts
- Identify patterns, trends, contradictions in data
- Make expert conclusions and forecasts
- IMPORTANT: Ensure smooth transitions between parts, no narrative breaks
${partNumber === 1 ? '- Start with Executive Summary and detailed introduction' : ''}
${partNumber === totalParts ? '- Conclude with comprehensive conclusions, recommendations and forecasts, but DO NOT add source list in this part' : ''}

Focus of part ${partNumber}: ${getSectionFocus(partNumber, totalParts)}

IMPORTANT: 
- Write ONLY content of this part, without part number indication
- Conduct deep analytical breakdown of web data
- Create coherent, logical and informative text
- Use professional terminology and structure
- Ensure compatibility between parts`;

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
        throw new Error(`Error generating part ${partNumber}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure for part ${partNumber}`);
      }
      
      const partContent = data.candidates[0].content.parts[0].text;
      
      reportParts.push(partContent);
      onPartGenerated(partNumber, partContent, totalParts);
      
      console.log(`Part ${partNumber}/${totalParts} generated: ${partContent.split(' ').length} words`);
      
      // Pause between parts for stability
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Error generating part ${partNumber}:`, error);
      const errorContent = `Error generating part ${partNumber}: ${error.message}`;
      reportParts.push(errorContent);
      onPartGenerated(partNumber, errorContent, totalParts);
    }
  }

  // Assemble final report with sources
  const finalReport = reportParts.join('\n\n');
  const uniqueUrls = [...new Set(allReferences.map(ref => ref.url))].filter(url => url && url !== '#citation' && url.startsWith('http'));
  const referencesSection = '\n\n## Sources\n\n' + uniqueUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
  
  return finalReport + referencesSection;
};

// Function for LaTeX report generation
export const generateLatexReport = async (
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  allReferences: Reference[],
  latexTemplate: string,
  onPartGenerated: (partNumber: number, content: string, totalParts: number) => void
): Promise<string> => {
  const apiKey = 'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac';
  const wordsPerPart = 10000;
  const totalParts = Math.ceil(settings.wordCount / wordsPerPart);
  
  console.log(`Generating LaTeX report in ${totalParts} parts`);

  const toneInstructions = {
    phd: 'Write in academic, scientific style with advanced terminology, deep analysis and critical thinking.',
    bachelor: 'Write in clear academic style with balance between accessibility and scientific rigor.',
    school: 'Write in understandable style, explaining complex concepts in accessible language.'
  };

  const reportParts: string[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const previousContent = reportParts.join('\n\n');
    
    const partPrompt = `Create part ${partNumber} of ${totalParts} of professional research report in LaTeX format on topic "${topic}".

LATEX TEMPLATE: ${latexTemplate}

WEB DATA FOR ANALYSIS: ${combinedWebData}

${previousContent ? `PREVIOUS REPORT PARTS: ${previousContent}` : ''}

REQUIREMENTS:
- ${toneInstructions[settings.tone]}
- EXACTLY ${wordsPerPart} words for this part
- Strictly follow provided LaTeX template
- Use ONLY web data above - conduct deep analysis and synthesis
- Create original insights based on web source analysis
- Include specific statistics, data, facts from web research
- Conduct critical analysis and source comparison
- Use proper LaTeX syntax for structure
- MANDATORY cite web sources with FULL URLs in LaTeX format
- Ensure PERFECT logical connectivity with previous parts
- DO NOT repeat information from previous parts
- Identify patterns, trends, contradictions in data
- Make expert conclusions and forecasts
- IMPORTANT: Ensure smooth transitions between parts, no narrative breaks
${partNumber === 1 ? '- Start with LaTeX preamble and introduction' : ''}
${partNumber === totalParts ? '- Conclude with conclusions and bibliography in LaTeX format' : ''}

Focus of part ${partNumber}: ${getSectionFocus(partNumber, totalParts)}

IMPORTANT: 
- Write ONLY content of this part in LaTeX format
- Conduct deep analytical breakdown of web data
- Create coherent, logical and informative LaTeX code
- Use professional terminology and LaTeX structure
- Ensure compatibility between LaTeX code parts`;

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
        throw new Error(`Error generating LaTeX part ${partNumber}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure for LaTeX part ${partNumber}`);
      }
      
      const partContent = data.candidates[0].content.parts[0].text;
      
      reportParts.push(partContent);
      onPartGenerated(partNumber, partContent, totalParts);
      
      console.log(`LaTeX part ${partNumber}/${totalParts} generated: ${partContent.split(' ').length} words`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Error generating LaTeX part ${partNumber}:`, error);
      const errorContent = `% Error generating LaTeX part ${partNumber}: ${error.message}`;
      reportParts.push(errorContent);
      onPartGenerated(partNumber, errorContent, totalParts);
    }
  }

  return reportParts.join('\n\n');
};

const getSectionFocus = (partNumber: number, totalParts: number): string => {
  const focusAreas = [
    'Introduction and executive summary',
    'Current state and data analysis',
    'Technological aspects and innovations',
    'Economic impact and market analysis',
    'Social consequences and societal impact',
    'Legal and regulatory aspects',
    'International experience and comparative analysis',
    'Challenges, risks and limitations',
    'Future prospects and trends',
    'Conclusions, recommendations and forecasts'
  ];

  if (partNumber === 1) return focusAreas[0];
  if (partNumber === totalParts) return focusAreas[focusAreas.length - 1];
  
  const middleIndex = Math.min(partNumber - 1, focusAreas.length - 1);
  return focusAreas[middleIndex] || `Detailed analysis of aspect ${partNumber}`;
};

const extractReferences = (text: string, customUrls: string[]): Reference[] => {
  const references: Reference[] = [];
  
  // Extract links from text in format [Source: URL]
  const sourcePattern = /\[Source:\s*([^\]]+)\]/g;
  let match;
  
  while ((match = sourcePattern.exec(text)) !== null) {
    const url = match[1].trim();
    
    if (url && url.startsWith('http')) {
      references.push({
        title: `Web source`,
        url: url,
        domain: extractDomain(url),
        description: 'Found through detailed web search and analysis'
      });
    }
  }

  // Extended URL search in text - look for full links
  const urlPattern = /https?:\/\/[^\s\]\),;]+/g;
  const urls = text.match(urlPattern) || [];
  
  urls.forEach(url => {
    // Clean URL from trailing symbols
    const cleanUrl = url.replace(/[.,;)\]]+$/, '');
    if (!references.some(ref => ref.url === cleanUrl)) {
      references.push({
        title: `Web source`,
        url: cleanUrl,
        domain: extractDomain(cleanUrl),
        description: 'Found through web search'
      });
    }
  });

  // Add custom URLs
  customUrls.forEach((url, index) => {
    references.push({
      title: `Custom source ${index + 1}`,
      url,
      domain: extractDomain(url),
      description: 'Added by user to search context'
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
