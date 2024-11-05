// src/benchmarks/componentTree/data.ts
import type { NodeData } from "./types";

const generateNode = (depth: number, maxDepth: number, path: string[] = []): NodeData => {
    const id = crypto.randomUUID();
    const currentPath = [...path, id];
    
    return {
        id,
        value: Math.random() * 100,
        depth,
        path: currentPath,
        children: depth < maxDepth 
            ? Array.from(
                { length: Math.max(1, 4 - depth) }, 
                () => generateNode(depth + 1, maxDepth, currentPath)
            )
            : []
    };
};

export const generateTree = (maxDepth: number = 5): NodeData => 
    generateNode(0, maxDepth);