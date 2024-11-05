// src/benchmarks/componentTree/types.ts
export interface NodeData {
    id: string;
    value: number;
    children: NodeData[];
    depth: number;
    path: string[];
}

export interface TreeMetrics {
    updateTime: number;
    propagationTime: number;
    memoryUsage: number;
    nodesUpdated: number;
    totalNodes: number;
    maxDepth: number;
}