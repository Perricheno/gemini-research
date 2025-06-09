
import { ResearchSettings } from '../types/research';

export const generateResearchQueries = (topic: string, count: number): string[] => {
  const baseVariations = [
    `${topic} latest research`,
    `${topic} scientific studies`,
    `${topic} market analysis`,
    `${topic} case studies`,
    `${topic} best practices`,
    `${topic} future trends`,
    `${topic} expert opinions`,
    `${topic} statistical data`,
    `${topic} comparative analysis`,
    `${topic} methodology frameworks`,
    `${topic} implementation strategies`,
    `${topic} challenges solutions`,
    `${topic} global perspective`,
    `${topic} technological advancement`,
    `${topic} economic impact`,
    `${topic} social implications`,
    `${topic} environmental impact`,
    `${topic} regulatory framework`,
    `${topic} innovation disruption`,
    `${topic} academic research`
  ];

  const qualifiers = [
    '2024',
    '2025',
    'peer reviewed',
    'comprehensive report',
    'real world applications',
    'industry standards',
    'predictions',
    'thought leaders',
    'analytics',
    'benchmarks',
    'innovation',
    'international',
    'breakthrough',
    'financial analysis',
    'societal effects',
    'sustainability impact',
    'policy',
    'emerging',
    'university studies'
  ];

  const queries: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseQuery = baseVariations[i % baseVariations.length];
    const qualifier = qualifiers[Math.floor(i / baseVariations.length) % qualifiers.length];
    queries.push(`${baseQuery} ${qualifier}`);
  }

  return queries;
};
