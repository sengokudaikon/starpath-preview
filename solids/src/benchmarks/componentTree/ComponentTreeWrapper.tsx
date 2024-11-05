// src/benchmarks/componentTree/ComponentTreeWrapper.tsx
import type { Component } from "solid-js";
import { createEffect } from "solid-js";
import { ComponentTreeBench } from "./ComponentTreeBench";
import { measurePerformance } from "../utils";
import * as E from "@effect/io/Effect";
import type { TreeMetrics } from "./types";
import type { NodeData } from "./types";

interface TreeControls {
    getMetrics: () => TreeMetrics;
    triggerUpdate: (path: string[], value: number) => void;
    getTree: () => NodeData;
}

export const ComponentTreeWrapper: Component = () => {
    createEffect(() => {
        const runBenchmark = async () => {
            const waitForControls = (): Promise<TreeControls> => {
                return new Promise((resolve) => {
                    const check = () => {
                        const controls = (window as any).__componentTreeControls as TreeControls | undefined;
                        if (controls) {
                            resolve(controls);
                        } else {
                            setTimeout(check, 100);
                        }
                    };
                    check();
                });
            };

            try {
                const controls = await waitForControls();
                const tree = controls.getTree();

                const result = await E.runPromise(
                    measurePerformance(
                        () => {
                            // Simulate different update patterns
                            const patterns = [
                                // Update root node
                                () => controls.triggerUpdate([tree.id], Math.random() * 100),
                                // Update random leaf node
                                () => {
                                    const path = findRandomLeafPath(tree);
                                    controls.triggerUpdate(path, Math.random() * 100);
                                },
                                // Update multiple nodes in sequence
                                () => {
                                    const paths = findMultipleRandomPaths(tree, 3);
                                    paths.forEach(path => 
                                        controls.triggerUpdate(path, Math.random() * 100)
                                    );
                                }
                            ];

                            let currentPattern = 0;
                            const intervalId = setInterval(() => {
                                patterns[currentPattern]?.();
                                currentPattern = (currentPattern + 1) % patterns.length;
                            }, 200);

                            return () => clearInterval(intervalId);
                        },
                        10000
                    )
                );

                console.log("Component Tree Benchmark Results:", result);
                console.log("Final Tree Metrics:", controls.getMetrics());
            } catch (error) {
                console.error("Error during benchmark:", error);
            }
        };

        runBenchmark().catch(console.error);
    });

    return (
        <div style={{ "padding": "1rem" }}>
            <h2>Component Tree Reactivity Benchmark</h2>
            <ComponentTreeBench />
        </div>
    );
};

// Helper functions for finding paths in the tree
const findRandomLeafPath = (node: NodeData): string[] => {
    if (node.children.length === 0) {
        return node.path;
    }
    if (node.children.length === 0) {
        return node.path;
    }
    const randomChildIndex = Math.floor(Math.random() * node.children.length);
    const randomChild = node.children[randomChildIndex];
    if (!randomChild) {
        return node.path; // Fallback in case of undefined child
    }
    return findRandomLeafPath(randomChild);
};

const findMultipleRandomPaths = (node: NodeData, count: number): string[][] => {
    const paths: string[][] = [];
    const collectPaths = (currentNode: NodeData) => {
        if (paths.length >= count) return;
        if (Math.random() < 0.3) {
            paths.push(currentNode.path);
        }
        currentNode.children.forEach(collectPaths);
    };
    
    while (paths.length < count) {
        collectPaths(node);
    }
    return paths.slice(0, count);
};