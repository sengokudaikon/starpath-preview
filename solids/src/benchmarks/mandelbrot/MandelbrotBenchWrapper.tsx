// src/benchmarks/mandelbrot/MandelbrotBenchWrapper.tsx
import type { Component } from "solid-js";
import { createEffect } from "solid-js";
import { MandelbrotBench } from "./MandelbrotBench";
import { measurePerformance } from "../utils";
import * as E from "@effect/io/Effect";

interface Position {
    x: number;
    y: number;
}

interface MandelbrotControls {
    setZoom: (fn: (z: number) => number) => void;
    setPosition: (fn: (p: Position) => Position) => void;
    getRenderTime: () => number;
}

export const MandelbrotBenchWrapper: Component = () => {
    console.log("MandelbrotBenchWrapper mounting"); // Debug log

    createEffect(() => {
        console.log("MandelbrotBenchWrapper effect running"); // Debug log
        const runBenchmark = async () => {
            const waitForControls = (): Promise<MandelbrotControls> => {
                return new Promise((resolve) => {
                    const check = () => {
                        const controls = (window as any)
                            .__mandelbrotControls as
                            | MandelbrotControls
                            | undefined;
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

                const result = await E.runPromise(
                    measurePerformance(
                        () => {
                            // Simulate user interactions for comprehensive testing
                            const interactions: Array<() => void> = [
                                () => controls.setZoom((z) => z * 1.1),
                                () => controls.setZoom((z) => z * 0.9),
                                () =>
                                    controls.setPosition((p) => ({
                                        x: p.x + 0.1,
                                        y: p.y,
                                    })),
                                () =>
                                    controls.setPosition((p) => ({
                                        x: p.x,
                                        y: p.y + 0.1,
                                    })),
                            ];

                            let currentInteraction = 0;
                            const intervalId = setInterval(() => {
                                const interaction =
                                    interactions[currentInteraction];
                                if (interaction) {
                                    interaction();
                                }
                                currentInteraction =
                                    (currentInteraction + 1) %
                                    interactions.length;
                            }, 100);

                            return () => clearInterval(intervalId);
                        },
                        10000 // Longer duration for more accurate results
                    )
                );

                console.log("Benchmark Results:", result);
            } catch (error) {
                console.error("Error during benchmark:", error);
            }
        };

        runBenchmark().catch(console.error);
    });

    return (
        <div style={{ "padding": "1rem" }}>
            <h2>Mandelbrot Set Visualization</h2>
            <MandelbrotBench />
        </div>
    );
};
