
import { ResearchResult, Reference, ResearchSettings, ReportGenerationConfig, PartGenerationResult } from '../types/research';

// Multiple API keys for high-volume research
const API_KEYS = [
  'AIzaSyDVU5wpZ95BLryznNdrrVXZgROhbTw2_Ac',
  // Additional keys will be added by user when using large batch sizes
];

let currentKeyIndex = 0;

const getNextApiKey = (userApiKeys: string[] = []): string => {
  const allKeys = [...API_KEYS, ...userApiKeys];
  const key = allKeys[currentKeyIndex % allKeys.length];
  currentKeyIndex++;
  return key;
};

const COMPLETION_KEYWORD = "RESEARCH_MACHINE_COMPLETE_END_MARKER_2025";

const REPORT_CONFIG: ReportGenerationConfig = {
  maxRetries: 3,
  completionKeyword: COMPLETION_KEYWORD,
  timeoutMs: 300000, // 5 minutes per part
  verifyCompletion: true
};

export const callGeminiAPI = async (
  query: string, 
  chatId: number, 
  settings?: ResearchSettings,
  modelOverride?: string,
  maxTokens?: number
): Promise<ResearchResult> => {
  const apiKey = getNextApiKey(settings?.apiKeys || []);
  
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
      tools: tools,
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
      hasGrounding: true,
      apiKeyIndex: currentKeyIndex - 1
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

// Enhanced subtopic generation with better logical structuring
export const generateSubtopics = async (
  mainTopic: string,
  numberOfSubtopics: number,
  settings: ResearchSettings
): Promise<string[]> => {
  const apiKey = getNextApiKey(settings.apiKeys || []);
  
  const prompt = `Create ${numberOfSubtopics} UNIQUE, DETAILED subtopics for comprehensive deep web research on: "${mainTopic}"

ENHANCED LOGICAL STRUCTURE REQUIREMENTS:
1. Each subtopic must be COMPLETELY UNIQUE with NO overlap
2. Cover ALL aspects systematically: technical, economic, social, legal, ethical, historical, future
3. Create LOGICAL PROGRESSION from basic concepts to advanced applications
4. Include both THEORETICAL foundations and PRACTICAL implementations
5. Cover MULTI-DIMENSIONAL perspectives: local, national, international
6. Address TEMPORAL aspects: past development, current state, future trends
7. Include STAKEHOLDER perspectives: government, business, society, academia
8. Cover CHALLENGES and OPPORTUNITIES separately for each major aspect
9. Address COMPARATIVE analysis opportunities (regional, technological, methodological)
10. Ensure COMPREHENSIVE coverage that leaves no major aspect unexplored

SUBTOPIC CATEGORIES TO COVER:
- Foundational concepts and definitions
- Historical development and evolution
- Current technological state and innovations
- Economic impact and market dynamics
- Social consequences and cultural impact
- Legal frameworks and regulatory environment
- International comparisons and best practices
- Implementation challenges and barriers
- Success stories and case studies
- Future prospects and emerging trends
- Risk assessment and mitigation strategies
- Stakeholder analysis and perspectives

OUTPUT FORMAT:
- One subtopic per line
- NO numbering or bullet points
- SPECIFIC and SEARCHABLE terminology
- Each subtopic should be 5-15 words for optimal web search

CRITICAL: Generate EXACTLY ${numberOfSubtopics} unique subtopics that provide COMPLETE coverage of the topic from ALL possible angles.`;

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
          maxOutputTokens: 65536
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error generating enhanced subtopics');
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    const subtopics = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, numberOfSubtopics);

    console.log('Generated enhanced logical subtopics:', subtopics.length);
    return subtopics;

  } catch (error) {
    console.error('Error generating enhanced subtopics:', error);
    return Array.from({ length: numberOfSubtopics }, (_, i) => 
      `${mainTopic} - comprehensive analysis aspect ${i + 1}`
    );
  }
};

// Enhanced multi-part report generation with completion verification
const generateReportPartWithVerification = async (
  partNumber: number,
  totalParts: number,
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  previousContent: string,
  allReferences: Reference[]
): Promise<PartGenerationResult> => {
  const apiKey = getNextApiKey(settings.apiKeys || []);
  const wordsPerPart = 10000;

  const toneInstructions = {
    phd: 'Write in academic, scientific style with advanced terminology, deep analysis and critical thinking.',
    bachelor: 'Write in clear academic style with balance between accessibility and scientific rigor.',
    school: 'Write in understandable style, explaining complex concepts in accessible language.'
  };

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
${partNumber === totalParts ? `- Conclude with comprehensive conclusions, recommendations and forecasts
- END your response with the completion marker: ${COMPLETION_KEYWORD}` : `- Continue the logical flow for next part
- END your response with the completion marker: ${COMPLETION_KEYWORD}`}

Focus of part ${partNumber}: ${getSectionFocus(partNumber, totalParts)}

CRITICAL COMPLETION REQUIREMENT:
- You MUST end your response with: ${COMPLETION_KEYWORD}
- This marker indicates you have completed this part successfully
- Without this marker, the system will assume the generation was incomplete

IMPORTANT: 
- Write ONLY content of this part, without part number indication
- Conduct deep analytical breakdown of web data
- Create coherent, logical and informative text
- Use professional terminology and structure
- Ensure compatibility between parts
- ALWAYS end with the completion marker: ${COMPLETION_KEYWORD}`;

  let retryCount = 0;
  while (retryCount < REPORT_CONFIG.maxRetries) {
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
        throw new Error(`Error generating part ${partNumber}, attempt ${retryCount + 1}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure for part ${partNumber}, attempt ${retryCount + 1}`);
      }
      
      const partContent = data.candidates[0].content.parts[0].text;
      const hasCompletionKey = partContent.includes(COMPLETION_KEYWORD);
      
      if (hasCompletionKey) {
        // Remove the completion keyword from the final content
        const cleanContent = partContent.replace(COMPLETION_KEYWORD, '').trim();
        return {
          content: cleanContent,
          isComplete: true,
          hasCompletionKey: true,
          retryCount
        };
      } else {
        console.warn(`Part ${partNumber} missing completion key, retry ${retryCount + 1}`);
        retryCount++;
        if (retryCount >= REPORT_CONFIG.maxRetries) {
          return {
            content: partContent,
            isComplete: false,
            hasCompletionKey: false,
            retryCount
          };
        }
      }
    } catch (error) {
      console.error(`Error generating part ${partNumber}, attempt ${retryCount + 1}:`, error);
      retryCount++;
      if (retryCount >= REPORT_CONFIG.maxRetries) {
        return {
          content: `Error generating part ${partNumber} after ${retryCount} attempts: ${error.message}`,
          isComplete: false,
          hasCompletionKey: false,
          retryCount
        };
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    content: `Error: Could not generate part ${partNumber} after maximum retries`,
    isComplete: false,
    hasCompletionKey: false,
    retryCount: REPORT_CONFIG.maxRetries
  };
};

export const generateMultiPartReport = async (
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  allReferences: Reference[],
  onPartGenerated: (partNumber: number, content: string, totalParts: number, isComplete: boolean) => void
): Promise<string> => {
  const wordsPerPart = 10000;
  const totalParts = Math.ceil(settings.wordCount / wordsPerPart);
  
  console.log(`Generating enhanced report in ${totalParts} parts with completion verification`);

  const reportParts: string[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const previousContent = reportParts.join('\n\n---\n\n');
    
    const result = await generateReportPartWithVerification(
      partNumber,
      totalParts,
      combinedWebData,
      topic,
      settings,
      previousContent,
      allReferences
    );
    
    reportParts.push(result.content);
    onPartGenerated(partNumber, result.content, totalParts, result.isComplete);
    
    console.log(`Part ${partNumber}/${totalParts} generated: ${result.content.split(' ').length} words, complete: ${result.isComplete}, retries: ${result.retryCount}`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const finalReport = reportParts.join('\n\n');
  const uniqueUrls = [...new Set(allReferences.map(ref => ref.url))].filter(url => url && url !== '#citation' && url.startsWith('http'));
  const referencesSection = '\n\n## Sources\n\n' + uniqueUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
  
  return finalReport + referencesSection;
};

// Enhanced LaTeX report generation with completion verification
export const generateLatexReport = async (
  combinedWebData: string,
  topic: string,
  settings: ResearchSettings,
  allReferences: Reference[],
  latexTemplate: string,
  onPartGenerated: (partNumber: number, content: string, totalParts: number, isComplete: boolean) => void
): Promise<string> => {
  const wordsPerPart = 10000;
  const totalParts = Math.ceil(settings.wordCount / wordsPerPart);
  
  console.log(`Generating enhanced LaTeX report in ${totalParts} parts with completion verification`);

  const toneInstructions = {
    phd: 'Write in academic, scientific style with advanced terminology, deep analysis and critical thinking.',
    bachelor: 'Write in clear academic style with balance between accessibility and scientific rigor.',
    school: 'Write in understandable style, explaining complex concepts in accessible language.'
  };

  const reportParts: string[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const previousContent = reportParts.join('\n\n');
    const apiKey = getNextApiKey(settings.apiKeys || []);
    
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
${partNumber === totalParts ? `- Conclude with conclusions and bibliography in LaTeX format
- END your response with the completion marker: ${COMPLETION_KEYWORD}` : `- Continue LaTeX structure for next part
- END your response with the completion marker: ${COMPLETION_KEYWORD}`}

Focus of part ${partNumber}: ${getSectionFocus(partNumber, totalParts)}

CRITICAL COMPLETION REQUIREMENT:
- You MUST end your response with: ${COMPLETION_KEYWORD}
- This marker indicates you have completed this LaTeX part successfully
- Without this marker, the system will assume the generation was incomplete

IMPORTANT: 
- Write ONLY content of this part in LaTeX format
- Conduct deep analytical breakdown of web data
- Create coherent, logical and informative LaTeX code
- Use professional terminology and LaTeX structure
- Ensure compatibility between LaTeX code parts
- ALWAYS end with the completion marker: ${COMPLETION_KEYWORD}`;

    let retryCount = 0;
    let partGenerated = false;

    while (retryCount < REPORT_CONFIG.maxRetries && !partGenerated) {
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
          throw new Error(`Error generating LaTeX part ${partNumber}, attempt ${retryCount + 1}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
          throw new Error(`Invalid response structure for LaTeX part ${partNumber}, attempt ${retryCount + 1}`);
        }
        
        const partContent = data.candidates[0].content.parts[0].text;
        const hasCompletionKey = partContent.includes(COMPLETION_KEYWORD);
        
        if (hasCompletionKey) {
          const cleanContent = partContent.replace(COMPLETION_KEYWORD, '').trim();
          reportParts.push(cleanContent);
          onPartGenerated(partNumber, cleanContent, totalParts, true);
          partGenerated = true;
          
          console.log(`LaTeX part ${partNumber}/${totalParts} generated: ${cleanContent.split(' ').length} words, complete: true`);
        } else {
          console.warn(`LaTeX part ${partNumber} missing completion key, retry ${retryCount + 1}`);
          retryCount++;
          if (retryCount >= REPORT_CONFIG.maxRetries) {
            reportParts.push(partContent);
            onPartGenerated(partNumber, partContent, totalParts, false);
            partGenerated = true;
          }
        }
      } catch (error) {
        console.error(`Error generating LaTeX part ${partNumber}, attempt ${retryCount + 1}:`, error);
        retryCount++;
        if (retryCount >= REPORT_CONFIG.maxRetries) {
          const errorContent = `% Error generating LaTeX part ${partNumber}: ${error.message}`;
          reportParts.push(errorContent);
          onPartGenerated(partNumber, errorContent, totalParts, false);
          partGenerated = true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
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
