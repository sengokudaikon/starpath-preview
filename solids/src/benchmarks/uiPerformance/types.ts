
export interface UIPerformanceMetrics {
    // Animation & Transition Metrics
    listAnimationTime: number;
    modalTransitionTime: number;
    accordionTransitionTime: number;
    carouselTransitionTime: number;
    pageTransitionTime: number;
    
    // Rendering Metrics
    markdownParseTime: number;
    tooltipRenderTime: number;
    componentUpdateTime: number;
    
    // Interaction Metrics
    hoverLatency: number;
    scrollLatency: number;
    clickLatency: number;
    
    // Resource Metrics
    memoryUsage: number;
    frameDrops: number;
    totalAnimationsPlayed: number;
    
    // Component Tree Metrics
    nodesUpdated: number;
    updatePropagationTime: number;
    hintShowLatency: number;
}

export interface RuleReference {
    id: string;
    title: string;
    description: string;
    type: 'feat' | 'spell' | 'item' | 'rule' | 'condition';
    markdown: string;
    relatedRules?: string[];
}

export interface ListItem {
    id: string;
    content: RuleReference;
    isExpanded?: boolean;
    isAnimating?: boolean;
}


export interface ItemData {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'spell' | 'feat' | 'item';
    level: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'unique';
    traits: string[];
    description: string;
    markdown: string;
    price?: string;
    requirements?: string[];
    actions: 1 | 2 | 3 | 'reaction' | 'free';
    relatedItems?: string[];
}

export interface CategorySection {
    id: string;
    title: string;
    items: ItemData[];
    isExpanded: boolean;
}