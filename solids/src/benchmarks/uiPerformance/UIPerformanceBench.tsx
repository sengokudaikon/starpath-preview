import {
    createSignal,
    createEffect,
    For,
    Show,
    onCleanup,
    type Component,
} from "solid-js";
import { Transition } from "solid-transition-group";
import type { UIPerformanceMetrics, ItemData, CategorySection } from "./types";
import { generateSampleData } from "./data.ts";
import "../../styles/App.css";
import { systemGlossary, type GlossaryEntry } from "./glossary.ts";

// Quick View Card Component
const QuickViewCard: Component<{
    item: ItemData | null;
    glossaryEntry: GlossaryEntry | null;
    position: { x: number; y: number };
    onClose: () => void;
    onPin?: () => void;
    isPinned?: boolean;
    onFindItem?: (name: string) => ItemData | undefined;
}> = (props) => {
    const [isReady, setIsReady] = createSignal(false);
    const [pinProgress, setPinProgress] = createSignal(0);
    const [isPinning, setIsPinning] = createSignal(false);

    let pinTimer: number | undefined;
    const PIN_DURATION = 5000; // 1 second to pin
    const startTime = performance.now();
    const startPinning = () => {
        if (props.isPinned) return;
        setIsPinning(true);
        const startTime = performance.now();

        const updateProgress = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min((elapsed / PIN_DURATION) * 100, 100);
            setPinProgress(progress);

            if (progress < 100) {
                pinTimer = requestAnimationFrame(updateProgress);
            } else {
                props.onPin?.();
                setIsPinning(false);
            }
        };

        pinTimer = requestAnimationFrame(updateProgress);
    };
    const stopPinning = () => {
        if (props.isPinned) return;
        setIsPinning(false);
        setPinProgress(0);
        if (pinTimer) {
            cancelAnimationFrame(pinTimer);
        }
    };

    createEffect(() => {
        requestAnimationFrame(() => setIsReady(true));
        (window as any).__uiControls?.reportMetric(
            "hintShowLatency",
            performance.now() - startTime
        );
    });

    return (
        <div
            class="quick-view-card"
            classList={{
                "is-ready": isReady(),
                "is-pinned": props.isPinned,
                "is-pinning": isPinning(),
                [`rarity-${props.item?.rarity}`]: !!props.item,
                [`type-${props.item?.type}`]: !!props.item,
            }}
            style={{
                position: "fixed",
                left: `${props.position.x}px`,
                top: `${props.position.y}px`,
            }}
            onMouseEnter={startPinning}
            onMouseLeave={stopPinning}
        >
            <div class="pin-progress" style={{ width: `${pinProgress()}%` }} />

            <Show
                when={props.item}
                fallback={
                    <Show when={props.glossaryEntry}>
                        {(entry) => (
                            <div class="glossary-content">
                                <h3>{entry().term}</h3>
                                <p>{entry().description}</p>
                                <Show when={entry().examples?.length}>
                                    <div class="examples">
                                        <h4>Examples:</h4>
                                        <ul>
                                            <For each={entry().examples}>
                                                {(example) => (
                                                    <li>{example}</li>
                                                )}
                                            </For>
                                        </ul>
                                    </div>
                                </Show>
                            </div>
                        )}
                    </Show>
                }
            >
                {(item) => (
                    <>
                        <div class="card-header">
                            <h3>{item().name}</h3>
                            <Show when={item().actions}>
                                <div class="action-cost">
                                    {typeof item().actions === "number"
                                        ? "●".repeat(Number(item().actions))
                                        : item().actions}
                                </div>
                            </Show>
                        </div>
                        <div class="card-content">
                            <div class="item-traits">
                                <For each={item().traits}>
                                    {(trait) => (
                                        <span class="trait">{trait}</span>
                                    )}
                                </For>
                            </div>
                            <div class="item-description">
                                <HighlightedText
                                    text={item().description}
                                    onFindItem={
                                        props.onFindItem ?? (() => undefined)
                                    }
                                />
                            </div>
                            <Show when={item().price}>
                                <div class="item-price">
                                    Price: {item().price}
                                </div>
                            </Show>
                        </div>
                    </>
                )}
            </Show>
            <button class="close-button" onClick={props.onClose}>
                ×
            </button>
        </div>
    );
};

const HighlightedText: Component<{
    text: string;
    onFindItem: (name: string) => ItemData | undefined;
}> = (props) => {
    const [activeHint, setActiveHint] = createSignal<{
        content: ItemData | GlossaryEntry;
        position: { x: number; y: number };
        isPinned: boolean;
    } | null>(null);

    const findReferences = (text: string) => {
        try {
            const regex = /\{([^}]+)\}|\[([^\]]+)\]/g;
            const parts: (string | { ref: string; type: "item" | "term" })[] = [];
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(text))) {
                if (match.index > lastIndex) {
                    parts.push(text.slice(lastIndex, match.index));
                }
                if (match[1]) {
                    parts.push({ ref: match[1], type: "item" });
                } else if (match[2]) {
                    parts.push({ ref: match[2].toLowerCase(), type: "term" });
                }
                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < text.length) {
                parts.push(text.slice(lastIndex));
            }

            return parts;
        } catch (error) {
            console.error("Error parsing references:", error);
            return [text];
        }
    };

    const calculateHintPosition = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const hintWidth = 300; // slightly smaller for better positioning
        const hintHeight = 150; // approximate height
        const padding = 5; // smaller padding for closer positioning
        
        // Calculate position directly above the text
        let x = rect.left;
        let y = rect.top - hintHeight - padding;
        
        // If not enough space above, position below
        if (y < 10) {
            y = rect.bottom + padding;
        }
        
        // Adjust horizontal position to keep within viewport
        if (x + hintWidth > window.innerWidth - 10) {
            x = window.innerWidth - hintWidth - 10;
        }
        if (x < 10) {
            x = 10;
        }
        
        return {
            x,
            y,
            position: y < rect.top ? 'above' as const : 'below' as const
        };
    };

    return (
        <>
            <span class="highlighted-text">
                {findReferences(props.text).map((part) =>
                    typeof part === "string" ? (
                        part
                    ) : (
                        <span
                            class={`reference ${part.type}`}
                            onMouseEnter={(e) => {
                                const content =
                                    part.type === "item"
                                        ? props.onFindItem(part.ref)
                                        : systemGlossary[part.ref];

                                if (content) {
                                    const pos = calculateHintPosition(e.currentTarget);
                                    setActiveHint({
                                        content,
                                        position: pos,
                                        isPinned: false,
                                    });
                                }
                            }}
                            onMouseLeave={() => {
                                if (!activeHint()?.isPinned) {
                                    setActiveHint(null);
                                }
                            }}
                        >
                            {part.type === "item" ? part.ref : systemGlossary[part.ref]?.term ?? part.ref}
                        </span>
                    )
                )}
            </span>
            <Show when={activeHint()}>
                {(hint) => (
                    <QuickViewCard
                        item={"type" in hint().content ? hint().content as ItemData : null}
                        glossaryEntry={"term" in hint().content ? hint().content as GlossaryEntry : null}
                        position={hint().position}
                        isPinned={hint().isPinned}
                        onPin={() => setActiveHint(prev => prev ? { ...prev, isPinned: true } : null)}
                        onClose={() => setActiveHint(null)}
                        onFindItem={props.onFindItem}
                    />
                )}
            </Show>
        </>
    );
};

// Carousel Component
const FeaturedCarousel: Component<{
    items: ItemData[];
    onItemSelect: (item: ItemData) => void;
}> = (props) => {
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const [isTransitioning, setIsTransitioning] = createSignal(false);

    const transition = (direction: 1 | -1) => {
        const startTime = performance.now();
        setIsTransitioning(true);

        setCurrentIndex((prev) => {
            const next =
                (prev + direction + props.items.length) % props.items.length;
            return next;
        });

        requestAnimationFrame(() => {
            (window as any).__uiControls?.reportMetric(
                "carouselTransitionTime",
                performance.now() - startTime
            );
            setIsTransitioning(false);
        });
    };

    return (
        <div class="featured-carousel">
            <button
                class="carousel-nav prev"
                onClick={() => transition(-1)}
                disabled={isTransitioning()}
            >
                ←
            </button>

            <Transition name="carousel">
                <div class="carousel-content">
                    <Show when={props.items[currentIndex()]} keyed>
                        {(item) => (
                            <div
                                class="carousel-item"
                                onClick={() => props.onItemSelect(item)}
                            >
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                            </div>
                        )}
                    </Show>
                </div>
            </Transition>

            <button
                class="carousel-nav next"
                onClick={() => transition(1)}
                disabled={isTransitioning()}
            >
                →
            </button>
        </div>
    );
};

export const UIPerformanceBench: Component = () => {
    const [isMetricsPanelCollapsed, setMetricsPanelCollapsed] =
        createSignal(false);
    const findItemByName = (name: string): ItemData | undefined => {
        const allItems = sections().flatMap((section) => section.items);
        return allItems.find((item) => item.name === name);
    };
    const [sections, setSections] = createSignal<CategorySection[]>(
        generateSampleData()
    );
    const [activeHint, setActiveHint] = createSignal<{
        item: ItemData;
        position: { x: number; y: number };
    } | null>(null);
    const [selectedItem, setSelectedItem] = createSignal<ItemData | null>(null);
    const [metrics, setMetrics] = createSignal<UIPerformanceMetrics>({
        listAnimationTime: 0,
        modalTransitionTime: 0,
        accordionTransitionTime: 0,
        carouselTransitionTime: 0,
        pageTransitionTime: 0,
        markdownParseTime: 0,
        tooltipRenderTime: 0,
        componentUpdateTime: 0,
        hoverLatency: 0,
        scrollLatency: 0,
        clickLatency: 0,
        memoryUsage: 0,
        frameDrops: 0,
        totalAnimationsPlayed: 0,
        nodesUpdated: 0,
        updatePropagationTime: 0,
        hintShowLatency: 0,
    });

    const reportMetric = (key: keyof UIPerformanceMetrics, value: number) => {
        setMetrics((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSection = (sectionId: string) => {
        const startTime = performance.now();
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? { ...section, isExpanded: !section.isExpanded }
                    : section
            )
        );
        requestAnimationFrame(() => {
            reportMetric(
                "accordionTransitionTime",
                performance.now() - startTime
            );
        });
    };

    const handleItemClick = (item: ItemData) => {
        const startTime = performance.now();
        setSelectedItem(item);
        requestAnimationFrame(() => {
            reportMetric("modalTransitionTime", performance.now() - startTime);
        });
    };

    // Export controls for benchmarking
    (window as any).__uiControls = {
        getMetrics: () => metrics(),
        reportMetric,
        getSections: () => sections(),
        toggleSection,
        selectItem: handleItemClick
    };
    const [featuredItems, setFeaturedItems] = createSignal<ItemData[]>([]);

    // Initialize featured items
    createEffect(() => {
        const allItems = sections().flatMap((section) => section.items);
        setFeaturedItems(allItems.slice(0, 5)); // Take first 5 items as featured
    });

    const handleFeaturedItemSelect = (item: ItemData) => {
        const startTime = performance.now();
        setSelectedItem(item);
        requestAnimationFrame(() => {
            reportMetric("modalTransitionTime", performance.now() - startTime);
        });
    };

    createEffect(() => {
        onCleanup(() => {
            delete (window as any).__uiControls;
        });
    });

    return (
        <div class="ui-performance-benchmark">
            <div
                class="metrics-panel"
                classList={{ collapsed: isMetricsPanelCollapsed() }}
            >
                <div class="metrics-header">
                    <h3>Performance Metrics</h3>
                    <button
                        class="collapse-button"
                        onClick={() =>
                            setMetricsPanelCollapsed((prev) => !prev)
                        }
                        aria-label={
                            isMetricsPanelCollapsed()
                                ? "Expand metrics"
                                : "Collapse metrics"
                        }
                    >
                        {isMetricsPanelCollapsed() ? "▼" : "▲"}
                    </button>
                </div>
                <div class="metrics-content">
                    <For each={Object.entries(metrics())}>
                        {([key, value]) => (
                            <div class="metric">
                                {key}:{" "}
                                {typeof value === "number"
                                    ? value.toFixed(2)
                                    : value}
                                {key.includes("Time") ? "ms" : ""}
                            </div>
                        )}
                    </For>
                </div>
            </div>

            <Show when={featuredItems().length > 0}>
                <FeaturedCarousel
                    items={featuredItems()}
                    onItemSelect={handleFeaturedItemSelect}
                />
            </Show>

            <div class="content-area">
                <For each={sections()}>
                    {(section) => (
                        <div class="category-section">
                            <button
                                class="section-header"
                                onClick={() => toggleSection(section.id)}
                            >
                                <h2>{section.title}</h2>
                                <span class="expand-icon">
                                    {section.isExpanded ? "▼" : "▶"}
                                </span>
                            </button>

                            <Transition name="accordion">
                                <Show when={section.isExpanded}>
                                    <div class="section-content">
                                        <For each={section.items}>
                                            {(item) => (
                                                <div
                                                    class="item-card"
                                                    onClick={() =>
                                                        handleItemClick(item)
                                                    }
                                                >
                                                    <h3>{item.name}</h3>
                                                    <div class="item-description">
                                                        <HighlightedText
                                                            text={
                                                                item.description
                                                            }
                                                            onFindItem={
                                                                findItemByName
                                                            }
                                                        />
                                                    </div>
                                                    <div class="item-traits">
                                                        <For each={item.traits}>
                                                            {(trait) => (
                                                                <span class="trait">
                                                                    {trait}
                                                                </span>
                                                            )}
                                                        </For>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </Transition>
                        </div>
                    )}
                </For>
            </div>

            <Show when={activeHint()}>
                {(hint) => {
                    const hintData = hint();
                    return (
                        <QuickViewCard
                            item={hintData.item}
                            glossaryEntry={null}
                            position={hintData.position}
                            onClose={() => setActiveHint(null)}
                            onFindItem={findItemByName} // Pass the function here
                        />
                    );
                }}
            </Show>

            <Show when={selectedItem()}>
                {(item) => (
                    <div
                        class="modal-overlay"
                        onClick={() => setSelectedItem(null)}
                    >
                        <div
                            class="modal-content"
                            classList={{ collapsed: isMetricsPanelCollapsed() }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div class="modal-header">
                                <h2>{item().name}</h2>
                                <div class="modal-actions">
                                    <button
                                        class="collapse-button"
                                        onClick={() => setMetricsPanelCollapsed(prev => !prev)}
                                        aria-label={isMetricsPanelCollapsed() ? "Expand details" : "Collapse details"}
                                    >
                                        {isMetricsPanelCollapsed() ? "▼" : "▲"}
                                    </button>
                                    <button
                                        class="close-button"
                                        onClick={() => setSelectedItem(null)}
                                        aria-label="Close"
                                    >×</button>
                                </div>
                            </div>

                            <div class="modal-body">
                                <div class="item-traits">
                                    <For each={item().traits}>
                                        {trait => <span class="trait">{trait}</span>}
                                    </For>
                                </div>
                                <div class="item-details">
                                    <HighlightedText
                                        text={item().description}
                                        onFindItem={findItemByName}
                                    />
                                    <Show when={item().requirements?.length}>
                                        <div class="requirements">
                                            <h3>Requirements</h3>
                                            <ul>
                                                <For each={item().requirements}>
                                                    {req => <li>{req}</li>}
                                                </For>
                                            </ul>
                                        </div>
                                    </Show>
                                    <Show when={item().price}>
                                        <div class="price">Price: {item().price}</div>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
};
