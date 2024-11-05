// src/benchmarks/infiniteScroll/InfiniteScrollBench.tsx
import { createSignal, createEffect, For } from "solid-js";
import type { ListItem, InfiniteScrollMetrics } from "./types";
import { generateMockData } from "./data";

export const InfiniteScrollBench = () => {
    const [items, setItems] = createSignal<ListItem[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [metrics, setMetrics] = createSignal<InfiniteScrollMetrics>({
        scrollTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        itemsInView: 0,
        totalItems: 0,
        scrollPosition: 0
    });

    const loadMoreItems = async () => {
        setLoading(true);
        const startTime = performance.now();
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newItems = generateMockData(20);
        setItems(prev => [...prev, ...newItems]);
        
        setMetrics(prev => ({
            ...prev,
            renderTime: performance.now() - startTime,
            totalItems: items().length
        }));
        setLoading(false);
    };

    const handleScroll = (e: Event) => {
        const target = e.target as HTMLDivElement;
        const scrollTime = performance.now();
        
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
            loadMoreItems();
        }

        // Update metrics
        setMetrics(prev => ({
            ...prev,
            scrollTime: performance.now() - scrollTime,
            scrollPosition: target.scrollTop,
            itemsInView: Math.ceil(target.clientHeight / 100) // Approximate items in view
        }));
    };

    // Initial load
    createEffect(() => {
        loadMoreItems();
    });

    return (
        <div class="infinite-scroll-benchmark">
            <div class="metrics-panel">
                <div>Render Time: {metrics().renderTime.toFixed(2)}ms</div>
                <div>Scroll Time: {metrics().scrollTime.toFixed(2)}ms</div>
                <div>Items in View: {metrics().itemsInView}</div>
                <div>Total Items: {metrics().totalItems}</div>
            </div>
            
            <div 
                class="items-container" 
                onScroll={handleScroll}
                style={{
                    "height": "600px",
                    "overflow-y": "auto",
                    "padding": "1rem"
                }}
            >
                <For each={items()}>
                    {(item) => (
                        <div class="list-item">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                            <div class="tags">
                                <For each={item.tags}>
                                    {tag => <span class="tag">{tag}</span>}
                                </For>
                            </div>
                            {item.imageUrl && (
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title}
                                    loading="lazy"
                                />
                            )}
                            <time>
                                {new Date(item.timestamp).toLocaleDateString()}
                            </time>
                        </div>
                    )}
                </For>
                {loading() && <div class="loading">Loading more items...</div>}
            </div>
        </div>
    );
};