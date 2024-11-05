export interface BenchmarkResult {
    fps: number;
    memoryUsage: number;
    renderTime: number;
    interactionLatency: number;
}

export interface BenchmarkMetrics {
    startTime: number;
    endTime: number;
    frames: number;
    measurements: {
        fps: number[];
        memory: number[];
        renderTimes: number[];
    };
}
