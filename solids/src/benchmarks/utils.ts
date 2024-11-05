import type { Effect } from "@effect/io/Effect";
import * as E from "@effect/io/Effect";
import type { BenchmarkResult, BenchmarkMetrics } from "./types";

interface ExtendedPerformance extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

const calculateAverage = (arr: number[]): number =>
    arr.reduce((acc, val) => acc + val, 0) / arr.length;

export const measurePerformance = (
    testFn: () => void,
    duration: number = 5000
): Effect<never, Error, BenchmarkResult> => {
    return E.suspend(() => {
        const metrics: BenchmarkMetrics = {
            startTime: performance.now(),
            endTime: 0,
            frames: 0,
            measurements: {
                fps: [],
                memory: [],
                renderTimes: [],
            },
        };

        const getMemoryUsage = (): number => {
            const perf = performance as ExtendedPerformance;
            return perf.memory?.usedJSHeapSize ?? 0;
        };

        const measure = () => {
            if (performance.now() - metrics.startTime < duration) {
                metrics.frames++;
                metrics.measurements.memory.push(getMemoryUsage());
                requestAnimationFrame(measure);
            } else {
                metrics.endTime = performance.now();
            }
        };

        return E.tryPromise({
            try: () =>
                new Promise<BenchmarkMetrics>((resolve) => {
                    testFn();
                    requestAnimationFrame(measure);
                    setTimeout(() => resolve(metrics), duration);
                }),
            catch: (error): Error =>
                error instanceof Error ? error : new Error(String(error)),
        }).pipe(
            E.map(
                (finalMetrics): BenchmarkResult => ({
                    fps: finalMetrics.frames / (duration / 1000),
                    memoryUsage: calculateAverage(
                        finalMetrics.measurements.memory
                    ),
                    renderTime:
                        (finalMetrics.endTime - finalMetrics.startTime) /
                        finalMetrics.frames,
                    interactionLatency: 0,
                })
            )
        );
    });
};
