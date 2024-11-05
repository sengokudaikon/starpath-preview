// src/benchmarks/infiniteScroll/data.ts
import type { ListItem } from './types';

const generateMockItem = (index: number): ListItem => ({
    id: crypto.randomUUID(),
    title: `Item ${index}`,
    description: `This is a detailed description for item ${index}. It contains enough text to wrap and test text rendering performance.`,
    timestamp: Date.now() - Math.random() * 1000000,
    tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, 
          (_, i) => `Tag ${i + 1}`),
    imageUrl: index % 3 === 0 ? `https://picsum.photos/200/100?random=${index}` : ``
});

export const generateMockData = (count: number): ListItem[] =>
    Array.from({ length: count }, (_, i) => generateMockItem(i));
