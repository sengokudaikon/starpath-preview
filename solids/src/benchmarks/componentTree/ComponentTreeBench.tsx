// src/benchmarks/componentTree/ComponentTreeBench.tsx
import { createSignal, createEffect, onCleanup, type Component } from "solid-js";
import { TreeNode } from "./TreeNode";
import { generateTree } from "./data";
import type { NodeData, TreeMetrics } from "./types";

export const ComponentTreeBench: Component = () => {
    const [tree, setTree] = createSignal<NodeData>(generateTree());
    const [metrics, setMetrics] = createSignal<TreeMetrics>({
        updateTime: 0,
        propagationTime: 0,
        memoryUsage: 0,
        nodesUpdated: 0,
        totalNodes: 0,
        maxDepth: 0
    });

    // Count total nodes and max depth
    const analyzeTree = (node: NodeData): { nodes: number; maxDepth: number } => {
        const childStats = node.children.map(analyzeTree);
        const nodes = 1 + childStats.reduce((sum, stat) => sum + stat.nodes, 0);
        const maxDepth = 1 + Math.max(0, ...childStats.map(stat => stat.maxDepth));
        return { nodes, maxDepth };
    };

    // Handle node updates with timing
    const handleNodeUpdate = (path: string[], newValue: number) => {
        const startTime = performance.now();
        let nodesUpdated = 0;

        setTree(currentTree => {
            const updateNodeInTree = (node: NodeData): NodeData => {
                if (path[node.depth] === node.id) {
                    nodesUpdated++;
                    if (node.depth === path.length - 1) {
                        return { ...node, value: newValue };
                    }
                    return {
                        ...node,
                        children: node.children.map(updateNodeInTree)
                    };
                }
                return node;
            };

            return updateNodeInTree(currentTree);
        });

        const updateTime = performance.now() - startTime;

        // Measure propagation time (next frame)
        requestAnimationFrame(() => {
            const propagationTime = performance.now() - startTime;
            const treeStats = analyzeTree(tree());

            setMetrics(prev => ({
                ...prev,
                updateTime,
                propagationTime,
                nodesUpdated,
                totalNodes: treeStats.nodes,
                maxDepth: treeStats.maxDepth,
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
            }));
        });
    };

    // Periodic random updates for stress testing
    createEffect(() => {
        let intervalId: number;
        
        const runStressTest = () => {
            const currentTree = tree();
            const randomNode = (node: NodeData): NodeData => {
                if (Math.random() < 0.3 || node.children.length === 0) {
                    return node;
                }
                const childNode = node.children[Math.floor(Math.random() * node.children.length)];
                return childNode ? randomNode(childNode) : node;
            };

            const targetNode = randomNode(currentTree);
            handleNodeUpdate(targetNode.path, Math.random() * 100);
        };

        intervalId = setInterval(runStressTest, 1000) as unknown as number;

        onCleanup(() => clearInterval(intervalId));
    });

    // Export controls for benchmarking
    (window as any).__componentTreeControls = {
        getMetrics: () => metrics(),
        triggerUpdate: (path: string[], value: number) => handleNodeUpdate(path, value),
        getTree: () => tree()
    };

    return (
        <div class="component-tree-benchmark">
            <div class="metrics-panel">
                <div>Update Time: {metrics().updateTime.toFixed(2)}ms</div>
                <div>Propagation Time: {metrics().propagationTime.toFixed(2)}ms</div>
                <div>Nodes Updated: {metrics().nodesUpdated}</div>
                <div>Total Nodes: {metrics().totalNodes}</div>
                <div>Max Depth: {metrics().maxDepth}</div>
                <div>Memory Usage: {(metrics().memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
            </div>
            <div class="tree-container">
                <TreeNode 
                    data={tree()} 
                    onUpdate={handleNodeUpdate}
                />
            </div>
        </div>
    );
};