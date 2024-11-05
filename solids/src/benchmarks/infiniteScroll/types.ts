// src/benchmarks/infiniteScroll/types.ts
export interface ListItem {
    id: string;
    title: string;
    description: string;
    timestamp: number;
    tags: string[];
    imageUrl?: string;
}

export interface InfiniteScrollMetrics {
    scrollTime: number;
    renderTime: number;
    memoryUsage: number;
    itemsInView: number;
    totalItems: number;
    scrollPosition: number;
}